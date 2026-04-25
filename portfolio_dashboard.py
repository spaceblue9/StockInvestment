import streamlit as st
import pandas as pd
import plotly.express as px
import os
import numpy as np
from datetime import datetime, timedelta
from stock_simulator import run_strategy_simulation

# Set Page Config
st.set_page_config(page_title="Pro Investment Dashboard", layout="wide", page_icon="📊")

# Custom CSS for high-contrast Metrics
st.markdown("""
    <style>
    div[data-testid="stMetric"] {
        background-color: #ffffff !important;
        border: 1px solid #ced4da !important;
        padding: 15px !important;
        border-radius: 12px !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
    }
    div[data-testid="stMetric"] * {
        color: #000000 !important;
    }
    </style>
    """, unsafe_allow_html=True)

# 1. Load All Market Data
@st.cache_data
def load_market_data():
    if os.path.exists("recommended_stocks.csv"):
        df = pd.read_csv("recommended_stocks.csv")
        cols = ['Price', 'PE', 'Yield', 'ROE', 'Total_Score', 'DE', 'RSI', 'Price_Position', 'High_52W', 'Low_52W', 'RRR', 'Upside_Pct', 'Entry_Zone_Low', 'Entry_Zone_High', 'Exit_Zone_Low', 'Exit_Zone_High']
        for col in cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                if col in ['RRR', 'Yield', 'Market_Value']:
                    df[col] = df[col].clip(lower=0)
        return df
    return pd.DataFrame()

market_df = load_market_data()

# Helper: Shared Highlighting Logic
def get_row_style(row):
    price = row['Price']
    score = row.get('Total_Score', 0)
    e_high = row.get('Entry_Zone_High', -1)
    e_low = row.get('Entry_Zone_Low', -1)
    x_high = row.get('Exit_Zone_High', -1)
    x_low = row.get('Exit_Zone_Low', -1)
    advice = row.get('Advice', '')
    if score >= 70 and e_low <= price <= e_high: return ['background-color: #d4edda; color: #155724; font-weight: bold'] * len(row)
    if advice in ["Buy More", "Accumulate"] and x_low <= price <= x_high: return ['background-color: #f8d7da; color: #721c24; font-weight: bold'] * len(row)
    if x_low <= price <= x_high: return ['background-color: #fff3cd; color: #856404; font-weight: bold'] * len(row)
    return [''] * len(row)

# --- SIDEBAR: NAVIGATION ---
st.sidebar.title("🚀 Investment Hub")
view_mode = st.sidebar.radio("Select View Mode:", ["My Portfolio", "Stock Screener", "Sector Analysis", "Strategy Simulation"])

st.sidebar.markdown("---")
st.sidebar.subheader("💡 Analysis Guide")
with st.sidebar.expander("Elite Investor Guide (คู่มือฉบับเซียน)", expanded=True):
    st.markdown("### 🏆 ปรัชญาการลงทุน")
    st.info("เน้นหุ้นคุณภาพดี (Score สูง) ในราคาที่ได้เปรียบ (Entry Zone) และจำกัดการขาดทุนเสมอ (Stop Loss)")
    
    st.markdown("---")
    st.markdown("### 💎 1. การเลือกหุ้น (Selection)")
    st.write("**Total Score**: ✅ > 70 คือหุ้นเกรด A พื้นฐานแกร่งที่สุดในกลุ่ม")
    
    st.markdown("### 🏗️ พื้นฐานบริษัท (Fundamentals)")
    st.write("**ROE**: ✅ > 15% คือบริษัททำกำไรเก่งมาก")
    st.write("**P/E**: ยิ่งต่ำยิ่งดี (คืนทุนไว) แต่ควรเทียบกับหุ้นกลุ่มเดียวกัน")
    st.write("**D/E Ratio**: 🛡️ < 1.0 คือหนี้ต่ำ ปลอดภัย, ⚠️ > 2.0 คือหนี้สูงเกินไป")
    st.write("**RSI**: วัดความร้อนแรงของแรงซื้อขาย (🟢 < 35 คือราคาถูกเกินไป/จังหวะซื้อ, 🔴 > 70 คือราคาแพงเกินไป/จังหวะขาย)")
    st.write("**Upside %**: 🚀 **ระยะกำไรคาดหวัง** จากราคาปัจจุบันถึงเป้าหมาย (✅ > 15% คือมีพื้นที่กำไรกว้างมาก)")

    st.markdown("---")
    st.markdown("### 🎯 2. จังหวะและแนวโน้ม (Timing)")
    st.write("**Bullish 📈**: ขาขึ้นชัดเจน (RSI สูง + ราคาโซนบน) มั่นใจได้ในการรันเทรนด์")
    st.write("**Bearish 📉**: ขาลงชัดเจน (RSI ต่ำ + ราคาโซนล่าง) เสี่ยงสูง ไม่ควรสวน")
    st.write("**Sideways ➡️**: พักตัว/แกว่งในกรอบ (RSI กลางๆ) รอการเลือกทิศทาง")
    st.write("**Weak Trend ⚠️**: ทิศทางไม่ชัดเจนหรือแรงส่งเริ่มหมด ให้ระมัดระวัง")

    st.markdown("---")
    st.markdown("### 🗺️ 3. แผนที่ราคา (Zones)")
    st.write("**Entry Zone**: โซน 'เก็บของ' ที่ปลอดภัยที่สุด (ใกล้ราคาต่ำสุดรอบปี)")
    st.write("**Exit Zone**: โซน 'ขายทำกำไร' เมื่อราคาเข้าใกล้แนวต้านสำคัญ")
    st.write("**RRR**: 💎 **Risk-Reward Ratio** กำไรคาดหวังเทียบความเสี่ยง (> 2.0 คือดีมาก)")

    st.markdown("---")
    st.markdown("### 🛡️ 4. การคุมความเสี่ยง (Risk Control)")
    st.write("**Stop Loss (SL)**: 🚨 'จุดหนีตาย' หากหลุดตรงนี้ต้องขายทันที")
    
    st.markdown("---")
    st.markdown("### 🚨 5. ความหมายของสี (Alerts)")
    st.success("🟩 **สีเขียว**: จังหวะลุย! (หุ้นเกรด A + ราคาถูก)")
    st.warning("🟨 **สีทอง**: จังหวะเก็บกำไร! (ถึงเป้าหมาย)")
    st.error("🟥 **สีแดง**: ระวัง! (ห้ามไล่ราคา แม้หุ้นจะดี)")

# --- MODE 4: STRATEGY SIMULATION ---
if view_mode == "Strategy Simulation":
    st.title("🧪 Strategy Backtest Simulator")
    st.markdown("จำลองการลงทุนย้อนหลัง 1 ปี โดยใช้กฎความปลอดภัย (Stop Loss 5%, Entry/Exit Zones) เพื่อดูประสิทธิภาพของระบบ")
    
    col_input1, col_input2, col_input3 = st.columns(3)
    with col_input1:
        target_stock = st.text_input("Stock Symbol (e.g. CPALL.BK, PTT.BK)", "CPALL.BK").upper()
    with col_input2:
        initial_funds = st.number_input("Initial Capital (THB)", 10000, 1000000, 100000, 10000)
    with col_input3:
        years_back = st.slider("Years Back", 1, 3, 1)

    if st.button("Run Simulation"):
        start_date = (datetime.now() - timedelta(days=365*years_back)).strftime('%Y-%m-%d')
        history, trades = run_strategy_simulation(target_stock, start_date, initial_funds)
        
        if history is not None:
            # Metrics
            final_val = history['Portfolio_Value'].iloc[-1]
            bh_val = history['Buy_Hold_Value'].iloc[-1]
            roi = ((final_val - initial_funds) / initial_funds) * 100
            bh_roi = ((bh_val - initial_funds) / initial_funds) * 100
            
            m1, m2, m3 = st.columns(3)
            m1.metric("Strategy Value", f"{final_val:,.2f} THB", f"{roi:.2f}%", help="มูลค่าพอร์ตสะสมหากลงทุนตามกฎของระบบ (มีการตั้งรับและตัดขาดทุน)")
            m2.metric("Buy & Hold Value", f"{bh_val:,.2f} THB", f"{bh_roi:.2f}%", help="มูลค่าพอร์ตสะสมหากซื้อหุ้นตั้งแต่วันแรกและถือยาวโดยไม่ขายเลย")
            m3.metric("Total Trades", f"{len(trades)} Orders")
            
            # Chart
            st.subheader("📈 Portfolio Growth: Strategy vs Buy & Hold")
            fig = px.line(history, y=['Portfolio_Value', 'Buy_Hold_Value'], 
                         labels={'value': 'Capital (THB)', 'Date': 'Time', 'variable': 'Method'},
                         title=f"Backtest Result: {target_stock}",
                         color_discrete_map={
                             'Portfolio_Value': '#1f77b4', # Blue
                             'Buy_Hold_Value': '#ff7f0e'   # Orange
                         })
            st.plotly_chart(fig, use_container_width=True)
            
            # Detailed Explanation of Chart
            with st.expander("🔍 วิธีการอ่านกราฟนี้ (How to read this chart)", expanded=True):
                st.markdown("""
                *   **🔵 Portfolio_Value (เส้นสีฟ้า - มูลค่าตามระบบ):** แสดงการเติบโตของเงินทุนเมื่อคุณทำตามโปรแกรม (มีจุดซื้อเมื่อถูก และจุดหนีตายเมื่อหลุดแนวรับ)
                    *   *จุดสังเกต:* หากเส้นนี้กลายเป็นเส้นตรงราบ แสดงว่าช่วงนั้นระบบสั่งให้คุณ **'ถือเงินสด 100%'** เพื่อปกป้องเงินทุนไม่ให้หายไปกับตลาดขาลง
                *   **🟠 Buy_Hold_Value (เส้นสีส้ม - มูลค่าหากถือยาว):** แสดงมูลค่าเงินทุนหากคุณซื้อหุ้นตั้งแต่วันแรกแล้วถือไว้นิ่งๆ จนจบโดยไม่ขายเลย
                    *   *จุดสังเกต:* เส้นนี้จะเคลื่อนไหวตามราคาหุ้น 100% หากหุ้นตกหนัก เงินทุนของคุณจะลดลงตามทันทีโดยไม่มีตัวช่วยป้องกัน
                *   **🎯 เป้าหมาย:** หากเส้นสีฟ้าอยู่เหนือเส้นสีส้ม แปลว่ากลยุทธ์ของเราชนะตลาดและทำผลงานได้ดีกว่าการถือไว้เฉยๆ ครับ
                """)
            
            # Trade Log
            st.subheader("📜 Trade History")
            if not trades.empty:
                st.dataframe(trades)
            else:
                st.info("No trades executed within this period under current rules.")
        else:
            st.error("Could not fetch data for this symbol. Please check the ticker (e.g. adding .BK for Thai stocks).")

# --- MODE 1: PORTFOLIO ---
elif view_mode == "My Portfolio":
    st.title("📈 Portfolio Performance & Health")
    reports = [f for f in os.listdir('.') if f.endswith('_analysis_report.xlsx')]
    if not reports:
        st.error("❌ No analysis reports found. Please run main.py first.")
    else:
        selected_file = st.sidebar.selectbox("Select Portfolio:", reports)
        df = pd.read_excel(selected_file, sheet_name='Portfolio Analysis')
        
        # Ensure numeric
        numeric_cols = ['Price', 'Total_Score', 'RRR', 'Upside_Pct', 'Gain_Loss_Pct', 'Market_Value', 'Cost_Value', 'DE']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        # Metrics Header
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Current Market Value", f"{df['Market_Value'].sum():,.2f} THB")
        gl_val = df['Gain_Loss_Value'].sum() if 'Gain_Loss_Value' in df.columns else (df['Market_Value'].sum() - df['Cost_Value'].sum())
        total_cost = df['Cost_Value'].sum() if 'Cost_Value' in df.columns else 1
        gl_pct = (gl_val / total_cost * 100) if total_cost != 0 else 0
        m2.metric("Total Gain/Loss", f"{gl_val:,.2f} THB", f"{gl_pct:.2f}%")
        m3.metric("Avg Debt (D/E)", f"{df['DE'].mean():.2f}")
        m4.metric("Total Holdings", f"{len(df)} Stocks")
        
        st.markdown("---")
        
        col_left, col_right = st.columns(2)
        with col_left:
            st.subheader("🎯 Sector Allocation")
            st.plotly_chart(px.pie(df, values='Market_Value', names='Sector', hole=0.5), use_container_width=True)
        with col_right:
            st.subheader("📊 Individual Returns (%)")
            st.plotly_chart(px.bar(df.sort_values('Gain_Loss_Pct'), x='Gain_Loss_Pct', y='Symbol', orientation='h', color='Gain_Loss_Pct', color_continuous_scale='RdYlGn'), use_container_width=True)
        
        st.markdown("---")
        
        # Deep Dive Charts
        viz_cols = ['Market_Value', 'Total_Score', 'Price_Position', 'Gain_Loss_Pct', 'RSI', 'DE']
        for col in viz_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        st.subheader("🔍 Deep Dive: Quality & Risk Analysis")
        chart_col1, chart_col2 = st.columns(2)
        with chart_col1:
            st.plotly_chart(px.scatter(df, x='RSI', y='DE', size='Market_Value', color='Gain_Loss_Pct', color_continuous_scale='RdYlGn', text='Symbol', title="Debt vs Timing"), use_container_width=True)
        with chart_col2:
            st.plotly_chart(px.scatter(df, x='Price_Position', y='Total_Score', size='Market_Value', color='Gain_Loss_Pct', color_continuous_scale='RdYlGn', text='Symbol', title="Quality vs Price Level"), use_container_width=True)

        st.subheader("📋 Holding Details")
        detail_cols = ['Symbol', 'Trend_Status', 'Total_Score', 'Advice', 'Target_Action', 'Upside_Pct', 'RRR', 'Price', 'Entry_Zone', 'Exit_Zone', 'Stop_Loss', 'Gain_Loss_Pct']
        st.dataframe(
            df.style.apply(get_row_style, axis=1)
            .background_gradient(subset=['Total_Score'], cmap='RdYlGn')
            .background_gradient(subset=['RRR'], cmap='YlGn')
            .format({'Gain_Loss_Pct': '{:.2f}%', 'Total_Score': '{:.1f}', 'Upside_Pct': '{:.1f}%', 'RRR': '{:.2f}'}),
            column_order=detail_cols
        )

# --- MODE 2: SCREENER ---
elif view_mode == "Stock Screener":
    st.title("🔍 Multi-Factor Stock Screener")
    st.sidebar.subheader("🎚️ Elite Filters")
    min_score = st.sidebar.slider("Min Quality Score", 0, 100, 0)
    min_rrr = st.sidebar.slider("Min RRR", 0.0, 5.0, 0.0)
    max_de = st.sidebar.slider("Max Debt (D/E)", 0.0, 10.0, 5.0)
    all_trends = market_df['Trend_Status'].unique() if 'Trend_Status' in market_df.columns else []
    all_sectors = market_df['Sector'].unique() if 'Sector' in market_df.columns else []
    selected_trends = st.sidebar.multiselect("Trend Status:", all_trends, default=all_trends)
    selected_sectors = st.sidebar.multiselect("Select Sectors:", all_sectors, default=all_sectors)
    
    f_df = market_df[
        (market_df['Total_Score'] >= min_score) & 
        (market_df['RRR'] >= min_rrr) & 
        (market_df['DE'] <= max_de) & 
        (market_df['Trend_Status'].isin(selected_trends)) &
        (market_df['Sector'].isin(selected_sectors))
    ].sort_values('Total_Score', ascending=False)
    
    st.info(f"Found {len(f_df)} Elite Stocks matching your criteria.")
    
    col1, col2 = st.columns(2)
    with col1:
        st.plotly_chart(px.scatter(f_df, x='Price_Position', y='Total_Score', size='Yield', color='RRR', 
                                   hover_name='Symbol', text='Symbol', title="Quality vs Price Position"), use_container_width=True)
    with col2:
        st.plotly_chart(px.scatter(f_df, x='RSI', y='Total_Score', size='Yield', color='DE', 
                             hover_name='Symbol', text='Symbol', title="Momentum vs Quality"), use_container_width=True)
        
    st.subheader("🏆 Screened Elite Stocks")
    st.dataframe(
        f_df.style.apply(get_row_style, axis=1)
        .background_gradient(subset=['Total_Score'], cmap='RdYlGn')
        .background_gradient(subset=['RRR'], cmap='YlGn')
        .format({'Total_Score': '{:.1f}', 'RRR': '{:.2f}', 'Upside_Pct': '{:.1f}%'}),
        column_order=['Symbol', 'Trend_Status', 'Total_Score', 'RRR', 'Upside_Pct', 'Price', 'PE', 'ROE', 'DE', 'RSI', 'Rationale']
    )

# --- MODE 3: SECTOR ANALYSIS ---
else:
    st.title("🏢 Sector Benchmark Analysis")
    all_sectors = sorted(market_df['Sector'].unique())
    selected_sector = st.selectbox("Select Sector to Analyze:", all_sectors)
    s_df = market_df[market_df['Sector'] == selected_sector].sort_values('Total_Score', ascending=False)
    
    row1_c1, row1_c2 = st.columns(2)
    with row1_c1:
        med_pe = s_df['PE'].median()
        med_roe = s_df['ROE'].median()
        fig_pe_roe = px.scatter(s_df, x='PE', y='ROE', text='Symbol', size='Yield', color='Total_Score', 
                         color_continuous_scale='RdYlGn', title="Value vs Profitability")
        fig_pe_roe.add_vline(x=med_pe, line_dash="dash", line_color="blue", annotation_text="Median")
        fig_pe_roe.add_hline(y=med_roe, line_dash="dash", line_color="blue", annotation_text="Median")
        st.plotly_chart(fig_pe_roe, use_container_width=True)
    with row1_c2:
        st.plotly_chart(px.scatter(s_df, x='Price_Position', y='Total_Score', text='Symbol', size='RRR', color='Trend_Status', title="Identifying Hidden Gems"), use_container_width=True)

    st.subheader(f"🏆 {selected_sector} Leaders List")
    st.dataframe(
        s_df.style.apply(get_row_style, axis=1)
        .background_gradient(subset=['Total_Score'], cmap='RdYlGn')
        .format({'Total_Score': '{:.1f}', 'RRR': '{:.2f}'}),
        column_order=['Symbol', 'Trend_Status', 'Total_Score', 'RRR', 'Price', 'Price_Position', 'PE', 'ROE', 'Yield', 'DE', 'Rationale']
    )
