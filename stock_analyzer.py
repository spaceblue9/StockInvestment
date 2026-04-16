import pandas as pd
import numpy as np

def clean_and_analyze_stocks(input_file="siamchart_raw.csv", output_file="recommended_stocks.csv"):
    """
    Cleans stock data and applies a scoring system for Value & Growth investing.
    Now includes Sector-Relative Analysis.
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
        elif 'SECTOR' in c_upper: col_map[col] = 'Sector'

    df = df.rename(columns=col_map)

    # Convert numeric columns
    numeric_cols = ['Price', 'PE', 'PBV', 'Yield', 'ROE', 'High_52W', 'Low_52W', 'RSI', 'DE']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    df = df.dropna(subset=['Symbol'])
    if 'Sector' not in df.columns:
        df['Sector'] = 'Unknown'
    
    # Step 2: Sector-Relative Metrics
    print("Calculating sector-relative benchmarks...")
    # Calculate median PE and ROE for each sector
    sector_stats = df.groupby('Sector').agg({
        'PE': 'median',
        'ROE': 'median',
        'Yield': 'median'
    }).rename(columns={'PE': 'Sector_PE', 'ROE': 'Sector_ROE', 'Yield': 'Sector_Yield'})
    
    df = df.merge(sector_stats, on='Sector', how='left')

    # Step 3: Scoring System
    print("Calculating scores...")
    
    # 3.1 Financial Risk Score (D/E)
    def get_de_score(de):
        if pd.isna(de): return 50
        return 100 if de < 1.0 else (70 if de < 1.5 else (30 if de < 2.5 else 0))
    df['DE_Score'] = df['DE'].apply(get_de_score)

    # 3.2 Timing Score (Price Position & RSI)
    def get_price_pos(row):
        if pd.isna(row['High_52W']) or pd.isna(row['Low_52W']) or row['High_52W'] == row['Low_52W']: return 50
        pos = ((row['Price'] - row['Low_52W']) / (row['High_52W'] - row['Low_52W'])) * 100
        return max(0, min(100, pos))
    df['Price_Position'] = df.apply(get_price_pos, axis=1)
    
    def get_rsi_score(rsi):
        if pd.isna(rsi): return 50
        return 100 if rsi < 35 else (70 if rsi < 50 else (30 if rsi < 70 else 0))
    df['RSI_Score'] = df['RSI'].apply(get_rsi_score)

    # 3.3 Fundamental Score (Relative to Sector)
    # Give bonus if better than sector average
    def get_relative_score(row):
        score = 50 # Base
        # PE: Lower is better
        if row['PE'] < row['Sector_PE']: score += 20
        elif row['PE'] > row['Sector_PE'] * 1.5: score -= 20
        
        # ROE: Higher is better
        if row['ROE'] > row['Sector_ROE']: score += 20
        elif row['ROE'] < row['Sector_ROE'] * 0.5: score -= 20
        
        return max(0, min(100, score))
    
    df['Relative_Quality_Score'] = df.apply(get_relative_score, axis=1)

    # Standard Scores
    df['PE_Score'] = df['PE'].apply(lambda x: 100 if x < 12 else (70 if x < 18 else 30))
    df['ROE_Score'] = df['ROE'].apply(lambda x: 100 if x > 18 else (70 if x > 12 else 30))
    df['Yield_Score'] = df['Yield'].apply(lambda x: 100 if x > 5 else (70 if x > 3 else 30))

    # Total Score (Comprehensive Weights)
    # 20% Risk, 20% Timing, 30% Absolute Fundamental, 30% Sector-Relative
    df['Total_Score'] = (
        df['DE_Score'] * 0.20 +
        ((100 - df['Price_Position']) * 0.10 + df['RSI_Score'] * 0.10) +
        (df['PE_Score'] * 0.15 + df['ROE_Score'] * 0.15) +
        (df['Relative_Quality_Score'] * 0.30)
    )

    # Step 4: Filtering & Rationale
    recommendations = df.dropna(subset=['PE', 'ROE', 'Yield', 'DE'])
    recommendations = recommendations.sort_values(by='Total_Score', ascending=False)
    
    def get_rationale(row):
        reasons = []
        if row['PE'] < row['Sector_PE']: reasons.append(f"Cheaper than {row['Sector']} avg")
        if row['ROE'] > row['Sector_ROE']: reasons.append("Above sector profitability")
        if row['DE'] < 1.0: reasons.append("Strong balance sheet")
        if row['RSI'] < 35: reasons.append("Technical entry point")
        if row['Yield'] > row['Sector_Yield']: reasons.append("High relative dividend")
        return ", ".join(reasons) if reasons else "Balanced performance"

    recommendations['Rationale'] = recommendations.apply(get_rationale, axis=1)
    recommendations.to_csv(output_file, index=False, encoding='utf-8-sig')
    
    print(f"Sector Analysis Complete. Results saved to {output_file}")
    return recommendations

if __name__ == "__main__":
    clean_and_analyze_stocks()
