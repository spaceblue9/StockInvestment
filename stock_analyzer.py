import pandas as pd
import numpy as np

def clean_and_analyze_stocks(input_file="siamchart_raw.csv", output_file="recommended_stocks.csv"):
    """
    Cleans stock data and applies a scoring system for Value & Growth investing.
    """
    print(f"Loading data from {input_file}...")
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print("Error: siamchart_raw.csv not found. Please run the scraper first.")
        return None

    # Step 1: Data Cleaning
    print("Cleaning data...")
    df = df.replace('-', np.nan)
    
    col_map = {}
    for col in df.columns:
        c_upper = str(col).upper()
        if 'NAME' in c_upper or 'ชื่อ' in c_upper or 'SYMBOL' in c_upper: col_map[col] = 'Symbol'
        elif 'P/E' in c_upper or 'PE' == c_upper: col_map[col] = 'PE'
        elif 'P/BV' in c_upper or 'PBV' == c_upper: col_map[col] = 'PBV'
        elif 'YIELD' in c_upper or 'ปันผล' in c_upper: col_map[col] = 'Yield'
        elif 'ROE' in c_upper: col_map[col] = 'ROE'
        elif 'PRICE' in c_upper or 'ราคา' in c_upper: col_map[col] = 'Price'
        elif 'DE' in c_upper: col_map[col] = 'DE'

    if len(col_map) < 3:
        print("Warning: Could not detect column names. Using positional defaults.")
        if len(df.columns) >= 10:
            df.columns = ['Symbol', 'PE', 'PBV', 'DE', 'DPS', 'EPS', 'ROA', 'ROE', 'NPM', 'Yield', 'PEG'] + list(df.columns[11:])
        else:
            print("Error: Table structure unexpected.")
            return None
    else:
        df = df.rename(columns=col_map)

    # Convert numeric columns
    numeric_cols = ['Price', 'PE', 'PBV', 'Yield', 'ROE', 'High_52W', 'Low_52W', 'RSI', 'DE']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Drop rows without Symbol or Price
    df = df.dropna(subset=['Symbol'])
    
    # Step 2: Scoring System
    print("Calculating scores...")
    
    # NEW: D/E Score (Financial Risk - Safety)
    # Low D/E is good (< 1.0), High D/E is risky (> 2.0)
    def get_de_score(de):
        if pd.isna(de): return 50
        if de < 0.8: return 100
        elif de < 1.2: return 80
        elif de < 1.8: return 40
        else: return 0
    
    df['DE_Score'] = df['DE'].apply(get_de_score)

    # Timing Scores
    def calculate_price_position(row):
        if pd.isna(row['High_52W']) or pd.isna(row['Low_52W']) or row['High_52W'] == row['Low_52W']:
            return 50
        pos = ((row['Price'] - row['Low_52W']) / (row['High_52W'] - row['Low_52W'])) * 100
        return max(0, min(100, pos))

    df['Price_Position'] = df.apply(calculate_price_position, axis=1)
    df['Price_Scale_Score'] = 100 - df['Price_Position'] 

    def get_rsi_score(rsi):
        if pd.isna(rsi): return 50
        if rsi < 30: return 100 # Oversold
        elif rsi < 45: return 80
        elif rsi < 60: return 50
        elif rsi < 70: return 20
        else: return 0
    
    df['RSI_Score'] = df['RSI'].apply(get_rsi_score)

    # Fundamental Scores
    df['PE_Score'] = df['PE'].apply(lambda x: 100 if x < 10 else (70 if x < 15 else (30 if x < 25 else 0)))
    df['PBV_Score'] = df['PBV'].apply(lambda x: 100 if x < 1.0 else (70 if x < 1.5 else (30 if x < 2.5 else 0)))
    df['Yield_Score'] = df['Yield'].apply(lambda x: 100 if x > 6 else (70 if x > 4 else (30 if x > 2 else 0)))
    df['ROE_Score'] = df['ROE'].apply(lambda x: 100 if x > 20 else (70 if x > 15 else (30 if x > 10 else 0)))
    
    # Combined Score (Weighted for Safety)
    # Value: 20%, Growth: 25%, Yield: 15%, Timing: 20%, Risk(DE): 20%
    df['Total_Score'] = (
        df['PE_Score'] * 0.10 + 
        df['PBV_Score'] * 0.10 + 
        df['Yield_Score'] * 0.15 + 
        df['ROE_Score'] * 0.25 +
        df['DE_Score'] * 0.20 +
        df['Price_Scale_Score'] * 0.10 +
        df['RSI_Score'] * 0.10
    )
    
    # Apply Penalty for high debt
    df.loc[df['DE'] > 2.5, 'Total_Score'] *= 0.7 # 30% Score Penalty for very high debt
    
    # Step 3: Filtering & Ranking
    recommendations = df.dropna(subset=['PE', 'PBV', 'Yield', 'ROE', 'RSI', 'DE'])
    recommendations = recommendations.sort_values(by='Total_Score', ascending=False)
    
    # Step 4: Rationale
    def get_rationale(row):
        reasons = []
        if row['PE'] < 12: reasons.append("Undervalued")
        if row['Yield'] > 5: reasons.append("High Dividend")
        if row['ROE'] > 18: reasons.append("High Efficiency")
        if row['DE'] < 0.8: reasons.append("Safe (Low Debt)")
        if row['RSI'] < 35: reasons.append("Oversold")
        if row['DE'] > 2.0: reasons.append("⚠️ HIGH DEBT")
        return ", ".join(reasons) if reasons else "Balanced Metrics"

    recommendations['Rationale'] = recommendations.apply(get_rationale, axis=1)
    recommendations.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"Analysis complete. Recommendations saved to {output_file}")
    
    return recommendations

if __name__ == "__main__":
    clean_and_analyze_stocks()
