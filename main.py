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
                    print(f"   -> Price: {row['Price']:.2f} (52W H/L: {row['High_52W']:.2f}/{row['Low_52W']:.2f})")
                    print(f"   -> RSI: {row['RSI']:.1f} | D/E: {row['DE']:.2f} | Vol Ratio: {row['Volume_Ratio']:.1f}x")
                    print(f"   -> SMART ZONES: Entry {row['Entry_Zone_Low']:.2f}-{row['Entry_Zone_High']:.2f} | Exit {row['Exit_Zone_Low']:.2f}-{row['Exit_Zone_High']:.2f}")
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
            merged = pd.merge(portfolio, market_data[['Symbol', 'Sector', 'Price', 'PE', 'Yield', 'ROE', 'Total_Score', 'High_52W', 'Low_52W', 'Price_Position', 'RSI', 'DE', 'Entry_Zone_Low', 'Entry_Zone_High', 'Exit_Zone_Low', 'Exit_Zone_High', 'Volume_Ratio', 'Stop_Loss', 'Trend_Status', 'RRR', 'Upside_Pct']], on='Symbol', how='left')
            
            if not merged.empty:
                merged['Market_Value'] = merged['Quantity'] * merged['Price']
                merged['Cost_Value'] = merged['Quantity'] * merged['Avg_Price']
                merged['Gain_Loss_Value'] = merged['Market_Value'] - merged['Cost_Value']
                merged['Gain_Loss_Pct'] = ((merged['Price'] - merged['Avg_Price']) / merged['Avg_Price']) * 100
                
                # Recovery Analysis
                def get_recovery(gl_pct):
                    if gl_pct >= 0: return 0.0
                    loss = abs(gl_pct) / 100
                    return ((1 / (1 - loss)) - 1) * 100
                
                merged['Recovery_Pct'] = merged['Gain_Loss_Pct'].apply(get_recovery)

                # Position Sizing (Risk per Trade = 5,000 THB)
                def get_suggested_shares(row):
                    risk_amt = 5000 
                    entry = row['Entry_Zone_High']
                    sl = row['Stop_Loss']
                    risk_per_share = entry - sl
                    if risk_per_share <= 0: return 0
                    return int(risk_amt / risk_per_share)

                merged['Suggested_Shares'] = merged.apply(get_suggested_shares, axis=1)

                def get_advice(row):
                    if pd.isna(row['Total_Score']): return "No Data"
                    score = row['Total_Score']
                    gl = row['Gain_Loss_Pct']
                    pos = row['Price_Position']
                    
                    if score >= 70:
                        if gl < 0:
                            return "Buy More" # หุ้นดี ราคาลง = เก็บเพิ่ม (ถัวล่าง)
                        elif pos < 40: 
                            return "Accumulate" # หุ้นดี มีกำไร แต่ราคายังอยู่โซนล่าง = ทยอยสะสมเพิ่ม
                        else:
                            return "Hold" # หุ้นดี มีกำไร แต่ราคาเริ่มสูง = ถือรันกำไร
                    elif score >= 45:
                        return "Wait/Hold"
                    else:
                        return "Sell" if gl > 0 else "Reduce/Cut"

                merged['Advice'] = merged.apply(get_advice, axis=1)

                def get_target_action(row):
                    advice = row['Advice']
                    price = row['Price']
                    e_high = row['Entry_Zone_High']
                    x_low = row['Exit_Zone_Low']
                    sl = row['Stop_Loss']
                    score = row['Total_Score']
                    rrr = row['RRR']
                    
                    # Exit Strategy Logic
                    if price <= sl or score < 30:
                        return "Exit All (100%)"
                    elif advice in ["Sell", "Reduce/Cut"] or (30 <= score < 45):
                        return "Reduce 50%"
                    elif advice == "Hold" and price >= x_low:
                        return f"TP 50% @ {x_low:.2f}"
                    
                    # Entry Strategy Logic
                    if advice in ["Buy More", "Accumulate"]:
                        if price > e_high:
                            return f"Wait & Bid @ {e_high:.2f}"
                        elif rrr >= 2.0:
                            return "Buy Now (Good RRR)"
                        else:
                            return "Buy Now (Low RRR)"
                    
                    return "Keep Holding"

                merged['Target_Action'] = merged.apply(get_target_action, axis=1)
                
                # Format Zones for Excel
                merged['Entry_Zone'] = merged.apply(lambda r: f"{r['Entry_Zone_Low']:.2f} - {r['Entry_Zone_High']:.2f}" if not pd.isna(r['Entry_Zone_Low']) else "-", axis=1)
                merged['Exit_Zone'] = merged.apply(lambda r: f"{r['Exit_Zone_Low']:.2f} - {r['Exit_Zone_High']:.2f}" if not pd.isna(r['Exit_Zone_Low']) else "-", axis=1)

                display_cols = ['Symbol', 'Price', 'Total_Score', 'Advice', 'Target_Action']
                print(merged[display_cols].to_string(index=False))
                
                report_name = os.path.splitext(os.path.basename(portfolio_path))[0] + "_analysis_report.xlsx"
                excel_cols = ['Symbol', 'Sector', 'Quantity', 'Avg_Price', 'Price', 'Trend_Status', 'Entry_Zone', 'Exit_Zone', 'Stop_Loss', 'Upside_Pct', 'RRR', 'Cost_Value', 'Market_Value', 'Gain_Loss_Value', 'Gain_Loss_Pct', 'Price_Position', 'Total_Score', 'Advice', 'Target_Action', 'Volume_Ratio', 'PE', 'Yield', 'ROE', 'DE', 'RSI', 'Entry_Zone_Low', 'Entry_Zone_High', 'Exit_Zone_Low', 'Exit_Zone_High']
                
                final_df = merged[excel_cols].copy()
                final_df = final_df.replace([np.inf, -np.inf], np.nan)
                
                instruction_data = {
                    'หัวข้อ (Field)': ['Total_Score', 'Upside_Pct', 'RRR', 'Target_Action', 'Stop_Loss'],
                    'ความหมาย': ['คะแนนเปรียบเทียบในกลุ่มอุตสาหกรรม', 'โอกาสกำไร (%) จากราคาปัจจุบันถึงเป้าหมาย', 'Risk-Reward Ratio (ความคุ้มค่า)', 'แผนปฏิบัติการระบุราคาและสัดส่วนชัดเจน', 'จุดตัดขาดทุนเมื่อหลุดแนวรับ'],
                    'เกณฑ์การดู': ['> 70 = แกร่งกว่าค่าเฉลี่ยกลุ่ม', '> 10% = น่าสนใจสะสม', '> 2.0 = คุ้มค่าที่จะเสี่ยง', 'TP = ขายทำกำไร, Reduce = ลดพอร์ต', 'ห้ามถือหุ้นหากราคาหลุดจุดนี้']
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
