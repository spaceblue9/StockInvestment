import pandas as pd
import os
import tkinter as tk
from tkinter import filedialog
import numpy as np
from openpyxl.styles import PatternFill
from stock_scraper import scrape_siamchart_stocks
from stock_analyzer import clean_and_analyze_stocks
from stock_visualizer import create_visualizations

def select_file(title, filetypes):
    """Opens a file selection dialog."""
    root = tk.Tk()
    root.withdraw() # Hide the main tkinter window
    root.attributes("-topmost", True)
    file_path = filedialog.askopenfilename(title=title, filetypes=filetypes)
    root.destroy()
    return file_path

def main():
    print("="*50)
    print("Thai Stock Analysis System (SiamChart Data)")
    print("="*50)

    raw_file = "siamchart_raw.csv"
    rec_file = "recommended_stocks.csv"
    plot_file = "stock_analysis_dashboard.png"

    # Step 0: Select Files First
    print("\n>>> กรุณาเลือกไฟล์ Watchlist (ถ้าไม่มีให้กด Cancel)")
    watchlist_path = select_file("เลือกไฟล์รายชื่อหุ้นที่สนใจ (Watchlist)", [("Text files", "*.txt"), ("All files", "*.*")])
    if not watchlist_path and os.path.exists("watchlist.txt"):
        watchlist_path = "watchlist.txt"

    print(">>> กรุณาเลือกไฟล์ Portfolio Excel (ถ้าไม่มีให้กด Cancel)")
    portfolio_path = select_file("เลือกไฟล์พอร์ตหุ้น (Portfolio)", [("Excel files", "*.xlsx *.xls"), ("All files", "*.*")])
    if not portfolio_path and os.path.exists("portfolio.xlsx"):
        portfolio_path = "portfolio.xlsx"

    # Step 1: Data Source
    print("\nStep 1: Gathering stock data...")
    df_raw = scrape_siamchart_stocks(raw_file, watchlist_path=watchlist_path, portfolio_path=portfolio_path)

    if df_raw is None or df_raw.empty:
        print("Error: Could not obtain stock data. Exiting.")
        return

    # Step 2: Analysis & Scoring
    print("\nStep 2: Cleaning and Analyzing stocks...")
    recommendations = clean_and_analyze_stocks(raw_file, rec_file)

    if recommendations is None or recommendations.empty:
        print("Error: No recommendations generated.")
        return

    # Step 3: Visualization
    print("\nStep 3: Generating Visualizations...")
    create_visualizations(rec_file, plot_file)

    # Step 4: Watchlist Analysis
    if watchlist_path:
        print(f"\n" + "="*50)
        print(f"WATCHLIST ANALYSIS: {os.path.basename(watchlist_path)}")
        print("="*50)
        
        try:
            with open(watchlist_path, "r", encoding='utf-8-sig') as f:
                watchlist = [line.strip().upper() for line in f if line.strip()]
            
            all_data = recommendations
            for symbol in watchlist:
                clean_symbol = symbol.split()[0] if symbol else ""
                stock = all_data[all_data['Symbol'] == clean_symbol]
                
                if not stock.empty:
                    row = stock.iloc[0]
                    score = row['Total_Score']
                    status = "✅ น่าลงทุน" if score >= 75 else ("⏳ รอดูจังหวะ" if score >= 50 else "⚠️ เสี่ยงสูง/แพง")
                    pos = row['Price_Position']
                    price_desc = "💎 ถูกมาก (Near Low)" if pos < 20 else ("🟢 ราคาถูก" if pos < 40 else ("🟡 กลางๆ" if pos < 60 else ("🟠 เริ่มแพง" if pos < 80 else "🔴 แพง (Near High)")))
                    rsi = row['RSI']
                    rsi_desc = "💎 จุดกลับตัว (Oversold)" if rsi < 30 else ("🔥 ร้อนแรง (Overbought)" if rsi > 70 else "⚖️ ปกติ")
                    de = row['DE']
                    de_status = "🛡️ หนี้ต่ำ (ปลอดภัย)" if de < 1.0 else ("⚠️ หนี้เริ่มสูง" if de > 2.0 else "⚖️ หนี้ปกติ")

                    print(f"[{clean_symbol}] ราคาปัจจุบัน: {row['Price']:.2f} | Score: {score:.1f} | {status}")
                    print(f"   -> Price Status: {price_desc} (Position: {pos:.1f}%)")
                    print(f"   -> Technical: RSI {rsi:.1f} ({rsi_desc})")
                    print(f"   -> Risk: D/E {de:.2f} ({de_status})")
                    print(f"   -> PE: {row['PE']:.1f}, Yield: {row['Yield']:.1f}%, ROE: {row['ROE']:.1f}%")
                    print(f"   -> เหตุผล: {row['Rationale']}")
                else:
                    print(f"[{symbol}] ❌ ไม่พบข้อมูลในระบบ")
                print("-" * 30)
        except Exception as e:
            print(f"Error reading watchlist: {e}")

    # Step 5: Portfolio Analysis
    if portfolio_path:
        print("\n" + "="*50)
        print(f"PORTFOLIO PERFORMANCE: {os.path.basename(portfolio_path)}")
        print("="*50)
        
        try:
            portfolio = pd.read_excel(portfolio_path)
            portfolio.columns = [c.strip() for c in portfolio.columns]
            if 'Symbol' in portfolio.columns:
                portfolio['Symbol'] = portfolio['Symbol'].astype(str).str.strip().str.upper()
            
            market_data = recommendations
            merged = pd.merge(portfolio, market_data[['Symbol', 'Price', 'PE', 'Yield', 'ROE', 'Total_Score', 'High_52W', 'Low_52W', 'Price_Position', 'RSI', 'DE']], on='Symbol', how='left')
            
            if not merged.empty:
                merged['Market_Value'] = merged['Quantity'] * merged['Price']
                merged['Cost_Value'] = merged['Quantity'] * merged['Avg_Price']
                merged['Gain_Loss_Value'] = merged['Market_Value'] - merged['Cost_Value']
                merged['Gain_Loss_Pct'] = ((merged['Price'] - merged['Avg_Price']) / merged['Avg_Price']) * 100
                
                def get_advice(row):
                    if pd.isna(row['Total_Score']): return "No Data"
                    score, gl = row['Total_Score'], row['Gain_Loss_Pct']
                    if score >= 70: return "Buy More" if gl < 0 else "Hold"
                    elif score >= 45: return "Wait/Hold"
                    else: return "Sell" if gl > 0 else "Reduce/Cut"

                merged['Advice'] = merged.apply(get_advice, axis=1)
                
                # Screen display
                display_cols = ['Symbol', 'Quantity', 'Avg_Price', 'Price', 'Gain_Loss_Pct', 'Total_Score']
                print(merged[display_cols].to_string(index=False, formatters={'Gain_Loss_Pct': '{:,.2f}%'.format}))
                
                total_cost, total_market = merged['Cost_Value'].sum(), merged['Market_Value'].sum()
                total_gl_pct = ((total_market - total_cost) / total_cost) * 100 if total_cost > 0 else 0
                print("-" * 50)
                print(f"สรุปพอร์ต: ต้นทุน {total_cost:,.2f} | มูลค่าปัจจุบัน {total_market:,.2f} | ผลตอบแทน {total_gl_pct:,.2f}%")

                # Export to Excel
                report_name = os.path.splitext(os.path.basename(portfolio_path))[0] + "_analysis_report.xlsx"
                excel_cols = ['Symbol', 'Quantity', 'Avg_Price', 'Price', 'Market_Value', 'Gain_Loss_Value', 'Gain_Loss_Pct', 'Total_Score', 'Advice', 'PE', 'Yield', 'ROE', 'DE', 'RSI', 'Low_52W', 'High_52W']
                
                final_df = merged[excel_cols].copy()
                final_df = final_df.replace([np.inf, -np.inf], np.nan)
                
                instruction_data = {
                    'หัวข้อ (Field)': ['Total_Score', 'D/E Ratio', 'Price (แถบสี)', 'Advice', 'PE', 'Yield (%)', 'ROE (%)', 'RSI'],
                    'ความหมาย (Meaning)': ['คะแนนรวม (ความคุ้มค่า+ความปลอดภัย)', 'หนี้สินต่อทุน (ความเสี่ยงการเงิน)', 'ความถูกแพงเทียบรอบปี', 'คำแนะนำลงทุน', 'ราคาหุ้นเทียบกำไร', 'ปันผลต่อปี', 'ประสิทธิภาพบริษัท', 'ความร้อนแรงราคา'],
                    'เกณฑ์การดู (Criterion)': ['> 70 = ดีมาก', '< 1.0 = ปลอดภัยมาก, > 2.0 = หนี้สูงเสี่ยง', 'เขียว=ถูก, แดง=แพง', 'ทำตามระบบ', '< 15 = ดี', '> 4-5% = ดี', '> 15% = ดี', '< 30=น่าซื้อ, > 70=เริ่มแพง']
                }
                instruction_df = pd.DataFrame(instruction_data)

                with pd.ExcelWriter(report_name, engine='openpyxl') as writer:
                    final_df.to_excel(writer, index=False, sheet_name='Portfolio Analysis')
                    instruction_df.to_excel(writer, index=False, sheet_name='คู่มือการอ่าน (How to Read)')
                    ws = writer.sheets['Portfolio Analysis']
                    price_idx = excel_cols.index('Price') + 1
                    for row_idx, row_data in enumerate(merged.itertuples(), start=2):
                        pos = row_data.Price_Position
                        if not pd.isna(pos):
                            color = 'FFC7CE' if pos > 80 else ('C6EFCE' if pos < 20 else 'FFF2CC')
                            ws.cell(row=row_idx, column=price_idx).fill = PatternFill(start_color=color, end_color=color, fill_type="solid")
                    for col in ws.columns:
                        ws.column_dimensions[col[0].column_letter].width = 15
                print(f"\n>>> รายงานถูกบันทึกที่: {report_name}")
        except Exception as e:
            print(f"Error analyzing portfolio: {e}")

    # Final Opportunity
    print("\n" + "="*50)
    print("TOP 10 NEW OPPORTUNITIES (กรองหุ้นหนี้ต่ำ)")
    print("="*50)
    portfolio_symbols = merged['Symbol'].tolist() if 'merged' in locals() else []
    new_opps = recommendations[(~recommendations['Symbol'].isin(portfolio_symbols)) & (recommendations['DE'] < 1.5)].head(10)
    print(new_opps[['Symbol', 'Price', 'DE', 'Total_Score', 'Rationale']].to_string(index=False))

if __name__ == "__main__":
    main()
