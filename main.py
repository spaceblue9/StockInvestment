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
    root.withdraw() 
    root.attributes("-topmost", True)
    file_path = filedialog.askopenfilename(title=title, filetypes=filetypes)
    root.destroy()
    return file_path

def main():
    print("="*50)
    print("Thai Stock Analysis System (Sector-Relative Version)")
    print("="*50)

    raw_file = "siamchart_raw.csv"
    rec_file = "recommended_stocks.csv"
    plot_file = "stock_analysis_dashboard.png"

    print("\n>>> กรุณาเลือกไฟล์ Watchlist (ถ้าไม่มีให้กด Cancel)")
    watchlist_path = select_file("เลือกไฟล์รายชื่อหุ้นที่สนใจ (Watchlist)", [("Text files", "*.txt"), ("All files", "*.*")])
    if not watchlist_path and os.path.exists("watchlist.txt"):
        watchlist_path = "watchlist.txt"

    print(">>> กรุณาเลือกไฟล์ Portfolio Excel (ถ้าไม่มีให้กด Cancel)")
    portfolio_path = select_file("เลือกไฟล์พอร์ตหุ้น (Portfolio)", [("Excel files", "*.xlsx *.xls"), ("All files", "*.*")])
    if not portfolio_path and os.path.exists("portfolio.xlsx"):
        portfolio_path = "portfolio.xlsx"

    print("\nStep 1: Gathering stock data with Sector info...")
    df_raw = scrape_siamchart_stocks(raw_file, watchlist_path=watchlist_path, portfolio_path=portfolio_path)

    if df_raw is None or df_raw.empty:
        print("Error: Could not obtain stock data.")
        return

    print("\nStep 2: Performing Sector-Relative Analysis...")
    recommendations = clean_and_analyze_stocks(raw_file, rec_file)

    if recommendations is None or recommendations.empty:
        print("Error: No recommendations generated.")
        return

    print("\nStep 3: Generating Visualizations...")
    create_visualizations(rec_file, plot_file)

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
                    status = "✅ น่าลงทุน" if score >= 70 else ("⏳ รอดูจังหวะ" if score >= 50 else "⚠️ เสี่ยงสูง/แพง")
                    
                    print(f"[{clean_symbol}] Sector: {row['Sector']} | Score: {score:.1f} | {status}")
                    print(f"   -> Price: {row['Price']:.2f} | RSI: {row['RSI']:.1f} | D/E: {row['DE']:.2f}")
                    print(f"   -> {row['Rationale']}")
                else:
                    print(f"[{symbol}] ❌ ไม่พบข้อมูล")
                print("-" * 30)
        except Exception as e:
            print(f"Error reading watchlist: {e}")

    if portfolio_path:
        print("\n" + "="*50)
        print(f"PORTFOLIO PERFORMANCE")
        print("="*50)
        
        try:
            portfolio = pd.read_excel(portfolio_path)
            portfolio.columns = [c.strip() for c in portfolio.columns]
            if 'Symbol' in portfolio.columns:
                portfolio['Symbol'] = portfolio['Symbol'].astype(str).str.strip().str.upper()
            
            market_data = recommendations
            merged = pd.merge(portfolio, market_data[['Symbol', 'Sector', 'Price', 'PE', 'Yield', 'ROE', 'Total_Score', 'High_52W', 'Low_52W', 'Price_Position', 'RSI', 'DE']], on='Symbol', how='left')
            
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
                
                display_cols = ['Symbol', 'Sector', 'Price', 'Gain_Loss_Pct', 'Total_Score', 'Advice']
                print(merged[display_cols].to_string(index=False))
                
                report_name = os.path.splitext(os.path.basename(portfolio_path))[0] + "_analysis_report.xlsx"
                excel_cols = ['Symbol', 'Sector', 'Quantity', 'Avg_Price', 'Price', 'Market_Value', 'Gain_Loss_Value', 'Gain_Loss_Pct', 'Total_Score', 'Advice', 'PE', 'Yield', 'ROE', 'DE', 'RSI']
                
                final_df = merged[excel_cols].copy()
                final_df = final_df.replace([np.inf, -np.inf], np.nan)
                
                instruction_data = {
                    'หัวข้อ (Field)': ['Total_Score', 'Sector Analysis', 'D/E Ratio', 'Advice'],
                    'ความหมาย': ['คะแนนเปรียบเทียบในกลุ่มอุตสาหกรรม', 'วิเคราะห์เทียบค่าเฉลี่ยของกลุ่มธุรกิจเดียวกัน', 'หนี้สินต่อทุน', 'คำแนะนำลงทุน'],
                    'เกณฑ์การดู': ['> 70 = แกร่งกว่าค่าเฉลี่ยกลุ่ม', 'ระบบคำนวณจาก PE/ROE เฉลี่ยของกลุ่ม', '< 1.0 = ปลอดภัย', 'ทำตามระบบ']
                }
                instruction_df = pd.DataFrame(instruction_data)

                with pd.ExcelWriter(report_name, engine='openpyxl') as writer:
                    final_df.to_excel(writer, index=False, sheet_name='Portfolio Analysis')
                    instruction_df.to_excel(writer, index=False, sheet_name='How to Read')
                    ws = writer.sheets['Portfolio Analysis']
                    for col in ws.columns:
                        ws.column_dimensions[col[0].column_letter].width = 15
                print(f"\n>>> รายงานถูกบันทึกที่: {report_name}")
        except Exception as e:
            print(f"Error analyzing portfolio: {e}")

    print("\n" + "="*50)
    print("TOP 10 SECTOR LEADERS (หุ้นที่แกร่งที่สุดในแต่ละกลุ่ม)")
    print("="*50)
    top_leaders = recommendations.sort_values(['Sector', 'Total_Score'], ascending=[True, False]).groupby('Sector').head(1)
    print(top_leaders[['Symbol', 'Sector', 'Total_Score', 'Rationale']].head(10).to_string(index=False))

if __name__ == "__main__":
    main()
