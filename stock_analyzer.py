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

    # Step 4: Smart Price Zones (Entry/Exit)
    print("Calculating Smart Price Zones & Volume Analysis...")
    # Entry Zone: 52W Low to 52W Low + 5%
    df['Entry_Zone_Low'] = df['Low_52W']
    df['Entry_Zone_High'] = df['Low_52W'] * 1.05
    
    # Exit Zone: 52W High - 3% to 52W High
    df['Exit_Zone_Low'] = df['High_52W'] * 0.97
    df['Exit_Zone_High'] = df['High_52W']

    # Volume Analysis
    df['Volume_Ratio'] = df.apply(lambda r: r['Volume'] / r['Avg_Vol_10D'] if r['Avg_Vol_10D'] > 0 else 0, axis=1)

    # Capital Protection (Stop Loss)
    df['Stop_Loss'] = df['Low_52W'] * 0.95

    # Upside & RRR Analysis
    def calculate_rrr(row):
        price = row['Price']
        target = row['Exit_Zone_Low']
        sl = row['Stop_Loss']
        
        reward = target - price
        risk = price - sl
        
        upside = (reward / price * 100) if price > 0 else 0
        rrr = (reward / risk) if risk > 0 else 5.0 # High RRR if price is at/below SL
        return pd.Series([upside, rrr])

    df[['Upside_Pct', 'RRR']] = df.apply(calculate_rrr, axis=1)

    # Break-even / Recovery Analysis
    # Formula: (1 / (1 - loss_pct)) - 1
    def calculate_recovery(row):
        # We'll calculate this specifically in main.py where we have actual Gain/Loss Pct
        # Here we just prepare the column
        return 0.0
    
    df['Recovery_Pct'] = 0.0

    # Trend Status Analysis
    def get_trend_status(row):
        rsi, pos = row['RSI'], row['Price_Position']
        if rsi > 55 and pos > 50: return "Bullish 📈"
        elif rsi < 45 and pos < 40: return "Bearish 📉"
        elif 45 <= rsi <= 55: return "Sideways ➡️"
        else: return "Weak Trend ⚠️"
    
    df['Trend_Status'] = df.apply(get_trend_status, axis=1)

    # Step 5: Rationale & Sorting
    # We no longer drop stocks missing data here, to allow them to show up in the screener
    # but we will handle NaNs during scoring.
    recommendations = df.sort_values(by='Total_Score', ascending=False)
    
    def get_rationale(row):
        reasons = []
        if row['PE'] < row['Sector_PE']: reasons.append(f"Cheaper than {row['Sector']} avg")
        if row['ROE'] > row['Sector_ROE']: reasons.append("Above sector profitability")
        if row['DE'] < 1.0: reasons.append("Strong balance sheet")
        if row['RSI'] < 35: reasons.append("Technical entry point")
        if row['Yield'] > row['Sector_Yield']: reasons.append("High relative dividend")
        if row['Price'] <= row['Entry_Zone_High']: reasons.append("Within Entry Zone")
        if row['Volume_Ratio'] > 2.0: reasons.append(f"Volume Spike ({row['Volume_Ratio']:.1f}x)")
        return ", ".join(reasons) if reasons else "Balanced performance"

    recommendations['Rationale'] = recommendations.apply(get_rationale, axis=1)
    recommendations.to_csv(output_file, index=False, encoding='utf-8-sig')
    
    print(f"Sector Analysis Complete. Results saved to {output_file}")
    return recommendations

if __name__ == "__main__":
    clean_and_analyze_stocks()
