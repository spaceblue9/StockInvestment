import streamlit as st
import pandas as pd
import plotly.express as px
import os
import numpy as np

# Set Page Config
st.set_page_config(page_title="Investment Dashboard", layout="wide", page_icon="📈")

# 1. Load All Market Data (From recommended_stocks.csv)
@st.cache_data
def load_market_data():
    if os.path.exists("recommended_stocks.csv"):
        df = pd.read_csv("recommended_stocks.csv")
        cols = ['Price', 'PE', 'Yield', 'ROE', 'Total_Score', 'DE', 'RSI', 'Price_Position']
        for col in cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        return df
    return pd.DataFrame()

market_df = load_market_data()

# --- SIDEBAR: NAVIGATION & CHEAT SHEET ---
st.sidebar.title("📌 Menu & Knowledge")
view_mode = st.sidebar.radio("เลือกโหมดการแสดงผล:", ["พอร์ตของฉัน", "คัดกรองหุ้น", "วิเคราะห์กลุ่มอุตสาหกรรม (Sector)"])

st.sidebar.markdown("---")
st.sidebar.subheader("💡 เกณฑ์การดูค่าต่างๆ")
with st.sidebar.expander("คลิกดูเกณฑ์ตัดสินใจ"):
    st.write("**Total Score (คะแนนรวม)**")
    st.write("- ✅ > 70: น่าสนใจมาก (ถูก+ดี)")
    st.write("- ⏳ 50-70: รอดูจังหวะ")
    st.write("- ⚠️ < 50: แพงหรือเสี่ยงสูง")
    
    st.write("**D/E (หนี้สิน)**")
    st.write("- 🛡️ < 1.0: หนี้ต่ำ ปลอดภัย")
    st.write("- ⚠️ > 2.0: หนี้สูง เสี่ยงล้มละลาย")
    
    st.write("**RSI (จังหวะเข้า)**")
    st.write("- 💎 < 35: ขายมากเกิน (น่าซื้อ)")
    st.write("- 🔥 > 70: ซื้อมากเกิน (ควรระวัง)")
    
    st.write("**ROE (ความเก่ง)**")
    st.write("- 🚀 > 15%: บริหารเงินเก่งมาก")
    st.write("- 🐢 < 8%: กำไรน้อยเกินไป")

# --- MODE 1: PORTFOLIO ---
if view_mode == "พอร์ตของฉัน":
    st.title("📈 My Portfolio Performance")
    
    with st.expander("🔍 วิธีวิเคราะห์พอร์ตของคุณ"):
        st.write("1. **สัดส่วนพอร์ต:** ไม่ควรให้หุ้นตัวใดตัวหนึ่งเกิน 20-30% ของพอร์ตเพื่อกระจายความเสี่ยง")
        st.write("2. **D/E vs Return:** หุ้นที่กำไรดีแต่หนี้สูง (D/E > 2) ควรระวังเป็นพิเศษหากเศรษฐกิจไม่ดี")
        st.write("3. **RSI:** หากหุ้นในพอร์ต RSI ต่ำ (<30) อาจเป็นจังหวะซื้อเพิ่มถัวเฉลี่ยต้นทุน")

    reports = [f for f in os.listdir('.') if f.endswith('_analysis_report.xlsx')]
    if not reports:
        st.error("❌ ไม่พบไฟล์รายงาน กรุณารัน main.py ก่อน")
    else:
        selected_file = st.sidebar.selectbox("เลือกพอร์ต:", reports)
        df = pd.read_excel(selected_file, sheet_name='Portfolio Analysis')
        
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("มูลค่าปัจจุบัน", f"{df['Market_Value'].sum():,.2f} THB")
        m2.metric("กำไร/ขาดทุนรวม", f"{df['Gain_Loss_Value'].sum():,.2f} THB")
        m3.metric("หนี้สินเฉลี่ย (D/E)", f"{df['DE'].mean():.2f}")
        m4.metric("หุ้นในพอร์ต", f"{len(df)} ตัว")
        
        st.markdown("---")
        c1, c2 = st.columns(2)
        with c1:
            st.subheader("💰 การกระจายพอร์ต")
            st.plotly_chart(px.pie(df, values='Market_Value', names='Sector', hole=0.4), use_container_width=True)
        with c2:
            st.subheader("📈 ผลตอบแทนรายตัว (%)")
            st.plotly_chart(px.bar(df.sort_values('Gain_Loss_Pct'), x='Gain_Loss_Pct', y='Symbol', orientation='h', color='Gain_Loss_Pct', color_continuous_scale='RdYlGn'), use_container_width=True)
        
        st.subheader("📋 รายละเอียดหุ้นในพอร์ต")
        st.dataframe(df[['Symbol', 'Sector', 'Quantity', 'Price', 'Gain_Loss_Pct', 'Total_Score', 'DE', 'RSI', 'Advice']])

# --- MODE 2: SCREENER ---
elif view_mode == "คัดกรองหุ้น":
    st.title("🔍 Multi-Factor Stock Screener")
    
    with st.expander("💡 วิธีหา 'หุ้นเพชรในตม'"):
        st.write("1. ปรับ **คะแนนขั้นต่ำ** ไปที่ 70+")
        st.write("2. กรอง **หนี้สิน (D/E)** ไม่เกิน 1.2 เพื่อความปลอดภัย")
        st.write("3. กรอง **ROE** ให้มากกว่า 12-15% เพื่อหาหุ้นที่ทำกำไรเก่ง")
        st.write("4. สังเกตหุ้นที่ **RSI < 40** เพื่อหาจังหวะต้นน้ำ")

    st.sidebar.subheader("🎚️ ตัวกรองหุ้น")
    min_score = st.sidebar.slider("คะแนนขั้นต่ำ (Score)", 0, 100, 50)
    max_de = st.sidebar.slider("หนี้สินไม่เกิน (D/E)", 0.0, 5.0, 2.0)
    min_roe = st.sidebar.slider("ความเก่งขั้นต่ำ (ROE %)", 0, 50, 10)
    rsi_range = st.sidebar.slider("ช่วง RSI ที่ต้องการ", 0, 100, (0, 100))
    selected_sectors = st.sidebar.multiselect("เลือกกลุ่มอุตสาหกรรม:", market_df['Sector'].unique(), default=market_df['Sector'].unique())
    
    # Apply Filtering
    f_df = market_df[
        (market_df['Total_Score'] >= min_score) & 
        (market_df['DE'] <= max_de) & 
        (market_df['ROE'] >= min_roe) &
        (market_df['RSI'] >= rsi_range[0]) &
        (market_df['RSI'] <= rsi_range[1]) &
        (market_df['Sector'].isin(selected_sectors))
    ].sort_values('Total_Score', ascending=False)
    
    st.subheader(f"พบหุ้น {len(f_df)} ตัวที่ผ่านเกณฑ์")
    
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("💎 คะแนนรวม vs ระดับราคา")
        st.plotly_chart(px.scatter(f_df, x='Price_Position', y='Total_Score', size='Yield', color='ROE', 
                                   hover_name='Symbol', text='Symbol', title="บนซ้าย = หุ้นราคาถูกพื้นฐานดี"), use_container_width=True)
    with col2:
        st.subheader("🕒 จังหวะทางเทคนิค (RSI vs Score)")
        fig_rsi = px.scatter(f_df, x='RSI', y='Total_Score', size='Yield', color='DE', 
                             hover_name='Symbol', text='Symbol', title="หาจุดกลับตัว (RSI < 30)")
        fig_rsi.add_vline(x=30, line_dash="dash", line_color="green")
        fig_rsi.add_vline(x=70, line_dash="dash", line_color="red")
        st.plotly_chart(fig_rsi, use_container_width=True)
        
    st.subheader("🏆 รายชื่อหุ้นที่ผ่านการคัดกรอง")
    st.dataframe(f_df[['Symbol', 'Sector', 'Price', 'Total_Score', 'Yield', 'ROE', 'DE', 'RSI', 'Rationale']])

# --- MODE 3: SECTOR ANALYSIS ---
else:
    st.title("🏢 Sector Benchmark Analysis")
    
    with st.expander("📖 วิธีเทียบ 'ส้มกับส้ม' (อุตสาหกรรมเดียวกัน)"):
        st.write("- **PE:** หุ้นที่ PE ต่ำกว่าเส้นประ (**Sector Avg**) คือหุ้นที่ราคาถูกกว่าเพื่อนในกลุ่ม")
        st.write("- **ROE:** หุ้นที่อยู่เหนือเส้นประ (**Sector Avg**) คือหุ้นที่ทำกำไรได้เก่งกว่าค่าเฉลี่ยของกลุ่ม")

    all_sectors = sorted(market_df['Sector'].unique())
    selected_sector = st.selectbox("เลือกกลุ่มอุตสาหกรรมที่ต้องการเปรียบเทียบ:", all_sectors)
    
    s_df = market_df[market_df['Sector'] == selected_sector].sort_values('Total_Score', ascending=False)
    
    st.subheader(f"การเปรียบเทียบในกลุ่ม: {selected_sector}")
    
    row1_c1, row1_c2 = st.columns(2)
    with row1_c1:
        avg_pe = s_df['PE'].median()
        avg_roe = s_df['ROE'].median()
        fig = px.scatter(s_df, x='PE', y='ROE', text='Symbol', size='Yield', color='Total_Score', 
                         color_continuous_scale='RdYlGn', title=f"PE vs ROE (กลุ่ม {selected_sector})")
        fig.add_vline(x=avg_pe, line_dash="dash", annotation_text=f"Avg PE ({avg_pe:.1f})")
        fig.add_hline(y=avg_roe, line_dash="dash", annotation_text=f"Avg ROE ({avg_roe:.1f}%)")
        st.plotly_chart(fig, use_container_width=True)

    with row1_c2:
        st.subheader("คะแนนรวมเปรียบเทียบในกลุ่ม")
        st.plotly_chart(px.bar(s_df, x='Symbol', y='Total_Score', color='Total_Score', color_continuous_scale='RdYlGn'), use_container_width=True)

    st.subheader(f"🏆 ผู้นำในกลุ่ม {selected_sector}")
    st.dataframe(s_df[['Symbol', 'Price', 'PE', 'ROE', 'Yield', 'DE', 'Total_Score', 'Rationale']])
