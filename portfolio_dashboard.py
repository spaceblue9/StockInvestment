import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import os
import numpy as np

# Set Page Config
st.set_page_config(page_title="Investment Dashboard", layout="wide", page_icon="📈")

# Sidebar - Navigation & File Selection
st.sidebar.title("📌 Menu")
view_mode = st.sidebar.radio("เลือกโหมดการแสดงผล:", ["วิเคราะห์พอร์ต (Portfolio)", "คัดกรองหุ้น (Watchlist/Screener)"])

# 1. Load All Market Data (From recommended_stocks.csv)
@st.cache_data
def load_all_market_data():
    if os.path.exists("recommended_stocks.csv"):
        df = pd.read_csv("recommended_stocks.csv")
        # Clean numeric columns
        cols = ['Price', 'PE', 'Yield', 'ROE', 'Total_Score', 'DE', 'RSI', 'Price_Position']
        for col in cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.1)
        return df
    return pd.DataFrame()

market_df = load_all_market_data()

# --- PORTFOLIO VIEW ---
if view_mode == "วิเคราะห์พอร์ต (Portfolio)":
    st.title("📈 Thai Stock Portfolio Dashboard (Performance)")
    st.markdown("---")

    reports = [f for f in os.listdir('.') if f.endswith('_analysis_report.xlsx')]
    if not reports:
        st.error("❌ ไม่พบไฟล์รายงาน Excel กรุณารัน main.py ก่อน")
        st.stop()

    selected_file = st.sidebar.selectbox("เลือกไฟล์รายงานพอร์ต:", reports)

    @st.cache_data
    def load_port_data(file_path):
        df = pd.read_excel(file_path, sheet_name='Portfolio Analysis')
        # Fill missing values for plotting
        for col in ['Market_Value', 'Yield', 'Total_Score', 'RSI', 'DE', 'Gain_Loss_Pct']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        return df

    df = load_port_data(selected_file)

    # Metrics Summary
    total_cost = (df['Quantity'] * df.get('Avg_Price', 0)).sum()
    total_market = df['Market_Value'].sum()
    total_gl = df['Gain_Loss_Value'].sum()
    total_gl_pct = (total_gl / total_cost * 100) if total_cost > 0 else 0

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("มูลค่าพอร์ต", f"{total_market:,.2f} THB")
    m2.metric("กำไร/ขาดทุนรวม", f"{total_gl:,.2f} THB", f"{total_gl_pct:.2f}%")
    m3.metric("หนี้สินเฉลี่ย (D/E)", f"{df['DE'].mean():.2f}")
    m4.metric("หุ้นในพอร์ต", f"{len(df)} ตัว")

    st.markdown("---")
    
    # Portfolio Charts
    c1, c2 = st.columns(2)
    with c1:
        st.subheader("💰 สัดส่วนพอร์ต (Allocation)")
        st.plotly_chart(px.pie(df, values='Market_Value', names='Symbol', hole=0.4), use_container_width=True)
    with c2:
        st.subheader("📊 กำไร/ขาดทุนรายตัว (%)")
        st.plotly_chart(px.bar(df.sort_values('Gain_Loss_Pct'), x='Gain_Loss_Pct', y='Symbol', orientation='h', color='Gain_Loss_Pct', color_continuous_scale='RdYlGn'), use_container_width=True)

    st.markdown("---")
    c3, c4 = st.columns(2)
    with c3:
        st.subheader("🕒 จังหวะราคา: RSI vs Score")
        st.plotly_chart(px.scatter(df, x='RSI', y='Total_Score', size='Market_Value', hover_name='Symbol', text='Symbol', color='Symbol'), use_container_width=True)
    with c4:
        st.subheader("🛡️ หนี้สิน vs ผลตอบแทน")
        st.plotly_chart(px.scatter(df, x='DE', y='Gain_Loss_Pct', size='Market_Value', hover_name='Symbol', text='Symbol', color='Symbol'), use_container_width=True)

    st.subheader("📋 ตารางข้อมูลพอร์ต")
    st.dataframe(df)

# --- WATCHLIST / SCREENER VIEW ---
else:
    st.title("🔍 Stock Screener & Watchlist Analysis")
    st.markdown("---")

    if market_df.empty:
        st.warning("ไม่มีข้อมูลสำหรับคัดกรอง กรุณารัน main.py ก่อน")
        st.stop()

    # Filtering Options in Sidebar
    st.sidebar.subheader("🎚️ ตัวกรองหุ้น (Filter)")
    min_score = st.sidebar.slider("คะแนนขั้นต่ำ (Score)", 0, 100, 50)
    max_de = st.sidebar.slider("หนี้สินไม่เกิน (D/E)", 0.0, 5.0, 2.0)
    min_yield = st.sidebar.slider("ปันผลขั้นต่ำ (%)", 0.0, 10.0, 3.0)

    filtered_df = market_df[
        (market_df['Total_Score'] >= min_score) & 
        (market_df['DE'] <= max_de) & 
        (market_df['Yield'] >= min_yield)
    ].sort_values('Total_Score', ascending=False)

    # Metrics
    s1, s2, m3 = st.columns(3)
    s1.metric("จำนวนหุ้นที่ผ่านเกณฑ์", f"{len(filtered_df)} ตัว")
    s2.metric("คะแนนเฉลี่ย", f"{filtered_df['Total_Score'].mean():.1f}")
    m3.metric("ปันผลเฉลี่ย", f"{filtered_df['Yield'].mean():.2f}%")

    st.markdown("---")

    # Screener Charts
    sc1, sc2 = st.columns(2)
    with sc1:
        st.subheader("💎 หุ้นพรีเมียม (Score สูง + ราคาถูก)")
        fig_screener = px.scatter(filtered_df, x='Price_Position', y='Total_Score',
                                  size='Yield', color='ROE',
                                  hover_name='Symbol', text='Symbol',
                                  title="ยิ่งอยู่ 'ซ้ายบน' ยิ่งน่าสนใจ (ราคาถูก+พื้นฐานดี)",
                                  labels={'Price_Position': 'ระดับราคา (0=Low, 100=High)', 'Total_Score': 'คะแนนรวม'})
        fig_screener.add_vline(x=30, line_dash="dash", line_color="green")
        st.plotly_chart(fig_screener, use_container_width=True)

    with sc2:
        st.subheader("🕒 สัญญาณเทคนิค (RSI vs Score)")
        fig_tech = px.scatter(filtered_df, x='RSI', y='Total_Score',
                              size='Yield', color='DE',
                              hover_name='Symbol', text='Symbol',
                              title="ค้นหาจุดกลับตัว (RSI < 30)",
                              labels={'RSI': 'ดัชนีความร้อนแรง (RSI)', 'Total_Score': 'คะแนนรวม'})
        fig_tech.add_vline(x=30, line_dash="dash", line_color="green")
        fig_tech.add_vline(x=70, line_dash="dash", line_color="red")
        st.plotly_chart(fig_tech, use_container_width=True)

    st.markdown("---")
    st.subheader("🏆 รายชื่อหุ้นที่ผ่านการคัดกรอง (เรียงตามคะแนนความคุ้มค่า)")
    
    # Format dataframe for display
    display_df = filtered_df[['Symbol', 'Price', 'Total_Score', 'Yield', 'ROE', 'DE', 'RSI', 'Rationale']]
    st.dataframe(display_df.style.background_gradient(subset=['Total_Score', 'Yield', 'ROE'], cmap='RdYlGn')
                                .background_gradient(subset=['DE', 'RSI'], cmap='RdYlGn_r'))

st.sidebar.markdown("---")
st.sidebar.info("Dashboard นี้ช่วยให้คุณเปรียบเทียบหุ้นในพอร์ตกับโอกาสใหม่ๆ ในตลาดได้ทันที")
