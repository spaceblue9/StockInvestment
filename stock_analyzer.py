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
    # Note: Column names might be messy. We'll try to identify them by position or common patterns.
    # Typical order in SiamChart var stock_data for financial:
    # 0: Name, 1: PE, 2: PBV, 3: DE, 4: DPS, 5: EPS, 6: ROA, 7: ROE, 8: NPM, 9: Yield, 10: PEG
    
    # Let's assume the scraper captured the table correctly. 
    # We will rename based on known headers or positions.
    print("Cleaning data...")
    
    # Basic cleaning: convert all to numeric where possible, replace '-' with NaN
    df = df.replace('-', np.nan)
    
    # Try to identify columns by keywords if they exist, otherwise use positions
    col_map = {}
    for col in df.columns:
        c_upper = str(col).upper()
        if 'NAME' in c_upper or 'ชื่อ' in c_upper or 'SYMBOL' in c_upper: col_map[col] = 'Symbol'
        elif 'P/E' in c_upper or 'PE' == c_upper: col_map[col] = 'PE'
        elif 'P/BV' in c_upper or 'PBV' == c_upper: col_map[col] = 'PBV'
        elif 'YIELD' in c_upper or 'ปันผล' in c_upper: col_map[col] = 'Yield'
        elif 'ROE' in c_upper: col_map[col] = 'ROE'
        elif 'PRICE' in c_upper or 'ราคา' in c_upper: col_map[col] = 'Price'

    if len(col_map) < 3:
        # If auto-detection fails, use positional assumptions for SiamChart financial table
        print("Warning: Could not detect column names. Using positional defaults.")
        # Assuming table has at least 10 columns
        if len(df.columns) >= 10:
            df.columns = ['Symbol', 'PE', 'PBV', 'DE', 'DPS', 'EPS', 'ROA', 'ROE', 'NPM', 'Yield', 'PEG'] + list(df.columns[11:])
        else:
            print("Error: Table structure unexpected.")
            return None
    else:
        df = df.rename(columns=col_map)

    # Convert numeric columns
    numeric_cols = ['Price', 'PE', 'PBV', 'Yield', 'ROE']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Drop rows without Symbol or Price
    df = df.dropna(subset=['Symbol'])
    
    # Step 2: Scoring System
    print("Calculating scores...")
    
    # Value Score (0-100)
    # Low PE is good (< 15), Low PBV is good (< 1.5), High Yield is good (> 4%)
    df['PE_Score'] = df['PE'].apply(lambda x: 100 if x < 10 else (70 if x < 15 else (30 if x < 25 else 0)))
    df['PBV_Score'] = df['PBV'].apply(lambda x: 100 if x < 1.0 else (70 if x < 1.5 else (30 if x < 2.5 else 0)))
    df['Yield_Score'] = df['Yield'].apply(lambda x: 100 if x > 6 else (70 if x > 4 else (30 if x > 2 else 0)))
    
    # Growth Score (0-100)
    # High ROE is good (> 15%)
    df['ROE_Score'] = df['ROE'].apply(lambda x: 100 if x > 20 else (70 if x > 15 else (30 if x > 10 else 0)))
    
    # Combined Score (Weighted)
    # Value: 60%, Growth: 40%
    df['Total_Score'] = (
        df['PE_Score'] * 0.2 + 
        df['PBV_Score'] * 0.2 + 
        df['Yield_Score'] * 0.2 + 
        df['ROE_Score'] * 0.4
    )
    
    # Step 3: Filtering & Ranking
    # Filter out extremely high PE (outliers) and very low liquidity (if volume was available)
    # For now, just keep those with all core metrics
    recommendations = df.dropna(subset=['PE', 'PBV', 'Yield', 'ROE'])
    recommendations = recommendations.sort_values(by='Total_Score', ascending=False)
    
    # Step 4: Rationale
    def get_rationale(row):
        reasons = []
        if row['PE'] < 12: reasons.append("Undervalued (Low PE)")
        if row['PBV'] < 1.2: reasons.append("Cheap (Low PBV)")
        if row['Yield'] > 5: reasons.append("High Dividend")
        if row['ROE'] > 18: reasons.append("High Efficiency (ROE)")
        return ", ".join(reasons) if reasons else "Balanced Metrics"

    recommendations['Rationale'] = recommendations.apply(get_rationale, axis=1)
    
    # Save results
    recommendations.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"Analysis complete. Recommendations saved to {output_file}")
    
    return recommendations

if __name__ == "__main__":
    # For testing, we need a dummy file if real one is missing
    # In real run, the scraper will provide it.
    clean_and_analyze_stocks()
