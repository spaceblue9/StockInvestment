import pandas as pd
import os
import tkinter as tk
from tkinter import filedialog
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

    # Step 0: Select Files First (New Order)
    print("\n>>> กรุณาเลือกไฟล์ Watchlist (ถ้าไม่มีให้กด Cancel)")
    watchlist_path = select_file("เลือกไฟล์รายชื่อหุ้นที่สนใจ (Watchlist)", [("Text files", "*.txt"), ("All files", "*.*")])
    if not watchlist_path and os.path.exists("watchlist.txt"):
        watchlist_path = "watchlist.txt"

    print(">>> กรุณาเลือกไฟล์ Portfolio Excel (ถ้าไม่มีให้กด Cancel)")
    portfolio_path = select_file("เลือกไฟล์พอร์ตหุ้น (Portfolio)", [("Excel files", "*.xlsx *.xls"), ("All files", "*.*")])
    if not portfolio_path and os.path.exists("portfolio.xlsx"):
        portfolio_path = "portfolio.xlsx"

    # Step 1: Data Source (Knows about selected files now)
    print("\nStep 1: Gathering stock data...")
    # Always try to fetch if we have new files, or if raw file is missing
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
                    print(f"[{clean_symbol}] Score: {score:.1f} | {status}")
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
            
            # Normalize Symbols to Uppercase String to fix issues like 'True' vs 'TRUE'
            if 'Symbol' in portfolio.columns:
                portfolio['Symbol'] = portfolio['Symbol'].astype(str).str.strip().str.upper()
            
            market_data = recommendations
            merged = pd.merge(portfolio, market_data[['Symbol', 'Price', 'PE', 'Yield', 'ROE', 'Total_Score']], on='Symbol', how='left')
            
            if not merged.empty:
                merged['Market_Value'] = merged['Quantity'] * merged['Price']
                merged['Cost_Value'] = merged['Quantity'] * merged['Avg_Price']
                merged['Gain_Loss_Pct'] = ((merged['Price'] - merged['Avg_Price']) / merged['Avg_Price']) * 100
                
                def get_portfolio_advice(row):
                    if pd.isna(row['Total_Score']): return "❌ ไม่มีข้อมูล"
                    score, gl = row['Total_Score'], row['Gain_Loss_Pct']
                    if score >= 70: return "✅ ซื้อเพิ่ม" if gl < 0 else "📦 ถือต่อ"
                    elif score >= 45: return "⏳ ถือ/รอดู"
                    else: return "💰 ขายทำกำไร" if gl > 0 else "✂️ ลดสัดส่วน/Cut"

                merged['Advice'] = merged.apply(get_portfolio_advice, axis=1)
                display_cols = ['Symbol', 'Quantity', 'Avg_Price', 'Price', 'Gain_Loss_Pct', 'Total_Score', 'Advice']
                print(merged[display_cols].to_string(index=False, formatters={'Gain_Loss_Pct': '{:,.2f}%'.format, 'Total_Score': '{:,.1f}'.format}))
                
                total_cost, total_market = merged['Cost_Value'].sum(), merged['Market_Value'].sum()
                total_gl = ((total_market - total_cost) / total_cost) * 100 if total_cost > 0 else 0
                print("-" * 50)
                print(f"สรุปพอร์ต: ต้นทุน {total_cost:,.2f} | มูลค่าปัจจุบัน {total_market:,.2f} | ผลตอบแทน {total_gl:,.2f}%")

                # Export to Excel Report (New Feature)
                report_name = os.path.splitext(os.path.basename(portfolio_path))[0] + "_analysis_report.xlsx"
                merged[display_cols].to_excel(report_name, index=False)
                print(f"\n>>> ส่งออกรายงานการวิเคราะห์พอร์ตแล้ว: {report_name}")
        except Exception as e:
            print(f"Error reading portfolio: {e}")

    # Step 6: New Opportunity Analysis (Refined)
    print("\n" + "="*50)
    print("TOP 10 NEW OPPORTUNITIES (หุ้นแนะนำปันผลสูงที่ยังไม่มีในพอร์ต)")
    print("="*50)
    
    # Identify symbols already in portfolio to exclude them
    portfolio_symbols = []
    if 'portfolio' in locals() and not portfolio.empty:
        portfolio_symbols = portfolio['Symbol'].astype(str).str.strip().str.upper().unique().tolist()
    
    # Filter: Not in portfolio AND Yield > 5% (as requested)
    # Then sort by Total_Score
    new_opps = recommendations[
        (~recommendations['Symbol'].isin(portfolio_symbols)) & 
        (recommendations['Yield'] > 5)
    ].sort_values(by='Total_Score', ascending=False).head(10)
    
    if not new_opps.empty:
        opps_display = ['Symbol', 'Price', 'PE', 'Yield', 'ROE', 'Total_Score', 'Rationale']
        print(new_opps[opps_display].to_string(index=False, formatters={'Total_Score': '{:,.1f}'.format, 'Yield': '{:,.2f}%'.format}))
        print("\n* คัดกรองเฉพาะหุ้นที่มีปันผล > 5% และเรียงลำดับตามคะแนนความคุ้มค่าสูงสุด")
    else:
        # Fallback to top scores if no high yield found
        new_opps_fallback = recommendations[~recommendations['Symbol'].isin(portfolio_symbols)].head(10)
        if not new_opps_fallback.empty:
            print("หมายเหตุ: ไม่พบหุ้นปันผล > 5% ที่เข้าเกณฑ์ จึงแสดงหุ้นที่คะแนนสูงสุดแทน\n")
            print(new_opps_fallback[['Symbol', 'Price', 'PE', 'Yield', 'Total_Score', 'Rationale']].to_string(index=False))
        else:
            print("ไม่พบโอกาสใหม่ๆ ในขณะนี้")

    # Final Summary
    print("\n" + "="*50)
    print("ANALYSIS COMPLETE (สรุปผลการทำงาน)")
    print("="*50)
    print(f"1. รายชื่อหุ้นแนะนำทั้งหมด: recommended_stocks.csv")
    print(f"2. กราฟวิเคราะห์ภาพรวม: stock_analysis_dashboard.png")
    if 'report_name' in locals():
        print(f"3. รายงานพอร์ตของคุณ: {report_name}")
    print("="*50)

if __name__ == "__main__":
    main()
