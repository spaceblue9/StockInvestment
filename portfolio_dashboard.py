import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import os
import numpy as np

# Set Page Config
st.set_page_config(page_title="Stock Portfolio Dashboard", layout="wide", page_icon="📈")

st.title("📈 Thai Stock Portfolio Dashboard")
st.markdown("---")

# 1. File Selection
reports = [f for f in os.listdir('.') if f.endswith('_analysis_report.xlsx')]
if not reports:
    st.error("❌ ไม่พบไฟล์รายงาน Excel กรุณารันโปรแกรม main.py เพื่อสร้างรายงานก่อน")
    st.stop()

selected_file = st.sidebar.selectbox("เลือกไฟล์รายงานที่ต้องการดู:", reports)

# 2. Load Data
@st.cache_data
def load_data(file_path):
    try:
        df = pd.read_excel(file_path, sheet_name='Portfolio Analysis')
        # Fill missing columns with calculated values if possible
        if 'Market_Value' not in df.columns and 'Quantity' in df.columns and 'Price' in df.columns:
            df['Market_Value'] = df['Quantity'] * df['Price']
        if 'Gain_Loss_Value' not in df.columns and 'Market_Value' in df.columns:
            df['Gain_Loss_Value'] = df['Market_Value'] - (df['Quantity'] * df.get('Avg_Price', 0))
        if 'Gain_Loss_Pct' not in df.columns and 'Price' in df.columns:
            avg = df.get('Avg_Price', 1)
            df['Gain_Loss_Pct'] = ((df['Price'] - avg) / avg) * 100
        return df
    except Exception as e:
        st.error(f"Error loading file: {e}")
        return pd.DataFrame()

df = load_data(selected_file)

if df.empty:
    st.warning("ไฟล์รายงานไม่มีข้อมูลหรือรูปแบบไม่ถูกต้อง")
    st.stop()

# 3. Key Metrics Summary
total_cost = (df['Quantity'] * df.get('Avg_Price', 0)).sum()
total_market_value = df.get('Market_Value', 0).sum()
total_gain_loss = df.get('Gain_Loss_Value', 0).sum()
total_gain_loss_pct = (total_gain_loss / total_cost * 100) if total_cost > 0 else 0

col1, col2, col3, col4 = st.columns(4)
col1.metric("มูลค่าพอร์ตปัจจุบัน", f"{total_market_value:,.2f} THB")
col2.metric("ต้นทุนทั้งหมด", f"{total_cost:,.2f} THB")
col3.metric("กำไร/ขาดทุนรวม", f"{total_gain_loss:,.2f} THB", f"{total_gain_loss_pct:.2f}%")
col4.metric("จำนวนหุ้นในพอร์ต", f"{len(df)} ตัว")

st.markdown("---")

# 4. Charts Layout
row1_col1, row1_col2 = st.columns(2)

with row1_col1:
    st.subheader("💰 สัดส่วนการลงทุน (Allocation)")
    if 'Market_Value' in df.columns:
        fig_pie = px.pie(df, values='Market_Value', names='Symbol', 
                         title="Market Value by Stock", 
                         hole=0.4, 
                         color_discrete_sequence=px.colors.qualitative.Pastel)
        st.plotly_chart(fig_pie, use_container_width=True)
    else:
        st.info("ไม่มีข้อมูล Market_Value สำหรับทำกราฟวงกลม")

with row1_col2:
    st.subheader("📊 ผลตอบแทนรายตัว (Profit/Loss %)")
    if 'Gain_Loss_Pct' in df.columns:
        df_sorted = df.sort_values('Gain_Loss_Pct', ascending=True)
        fig_bar = px.bar(df_sorted, x='Gain_Loss_Pct', y='Symbol', orientation='h',
                         title="Gain/Loss Percentage",
                         color='Gain_Loss_Pct',
                         color_continuous_scale='RdYlGn')
        st.plotly_chart(fig_bar, use_container_width=True)
    else:
        st.info("ไม่มีข้อมูล Gain_Loss_Pct สำหรับทำกราฟแท่ง")

st.markdown("---")
row2_col1, row2_col2 = st.columns(2)

with row2_col1:
    st.subheader("🎯 จุดตัดสินใจ: RSI vs Strategy Score")
    if 'RSI' in df.columns and 'Total_Score' in df.columns:
        # Use 'Advice' as fallback for color if 'Advice_Excel' is missing
        color_col = 'Advice' if 'Advice' in df.columns else None
        
        fig_scatter = px.scatter(df, x='RSI', y='Total_Score',
                                 size=df['Market_Value'].fillna(1), color=color_col,
                                 hover_name='Symbol', text='Symbol',
                                 title="RSI vs Strategy Score",
                                 labels={'RSI': 'ความร้อนแรง (RSI)', 'Total_Score': 'คะแนนพื้นฐาน (Score)'},
                                 color_discrete_map={'Buy More': 'green', 'Hold': 'blue', 'Wait/Hold': 'orange', 'Sell': 'red', 'Reduce/Cut': 'darkred'})
        
        fig_scatter.add_vline(x=30, line_dash="dash", line_color="green", annotation_text="Oversold")
        fig_scatter.add_vline(x=70, line_dash="dash", line_color="red", annotation_text="Overbought")
        st.plotly_chart(fig_scatter, use_container_width=True)
        st.info("💡 มุมซ้ายบน (Score สูง + RSI ต่ำ) คือจุดเข้าซื้อที่ดีที่สุด")
    else:
        st.info("ข้อมูล RSI หรือ Total_Score ไม่ครบถ้วน")

with row2_col2:
    st.subheader("ธรรมาภิบาลและการเติบโต (PE vs ROE)")
    if 'PE' in df.columns and 'ROE' in df.columns:
        fig_bubble = px.scatter(df, x='PE', y='ROE',
                                size=df['Yield'].fillna(1), color='Symbol',
                                hover_name='Symbol',
                                title="ROE vs PE (Size = Dividend Yield)",
                                labels={'PE': 'ความแพง (PE)', 'ROE': 'ความเก่ง (ROE)'})
        st.plotly_chart(fig_bubble, use_container_width=True)
        st.info("💡 มุมซ้ายบน (ROE สูง + PE ต่ำ) คือหุ้นพื้นฐานดีราคาถูก")
    else:
        st.info("ข้อมูล PE หรือ ROE ไม่ครบถ้วน")

# 5. Full Data Table
st.markdown("---")
st.subheader("📋 ข้อมูลรายละเอียดทั้งหมด")
st.dataframe(df)

# Sidebar Info
st.sidebar.markdown("---")
st.sidebar.subheader("📖 วิธีการใช้งาน")
st.sidebar.write("1. Dashboard นี้ดึงข้อมูลจากไฟล์ Excel รายงาน")
st.sidebar.write("2. กราฟแต่ละอันสามารถเอาเมาส์ไปชี้เพื่อดูรายละเอียดได้")
st.sidebar.info("สรุปโดย AI สำหรับพอร์ต: " + selected_file)
