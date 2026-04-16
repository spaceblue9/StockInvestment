import pandas as pd
import yfinance as yf
import os
import numpy as np

def calculate_rsi(prices, window=14):
    """Calculates the Relative Strength Index (RSI)."""
    if len(prices) < window + 1:
        return 50 # Default to neutral if not enough data
    
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1.0 + rs))
    return rsi.iloc[-1]

def scrape_siamchart_stocks(output_file="siamchart_raw.csv", watchlist_path=None, portfolio_path=None):
    """
    Scrapes or fetches Thai stock data. Uses yfinance to fetch 
    data for all symbols found in the provided watchlist and portfolio files.
    """
    print("Gathering symbols from provided files...")
    
    all_needed_symbols = []
    
    # 1. Get symbols from the actual selected watchlist file
    if watchlist_path and os.path.exists(watchlist_path):
        try:
            with open(watchlist_path, "r", encoding='utf-8-sig') as f:
                all_needed_symbols.extend([line.strip().upper() for line in f if line.strip()])
        except Exception as e:
            print(f"Warning: Could not read watchlist file: {e}")
            
    # 2. Get symbols from the actual selected portfolio file
    if portfolio_path and os.path.exists(portfolio_path):
        try:
            port_df = pd.read_excel(portfolio_path)
            if 'Symbol' in port_df.columns:
                all_needed_symbols.extend(port_df['Symbol'].astype(str).str.strip().str.upper().tolist())
        except Exception as e:
            print(f"Warning: Could not read portfolio file: {e}")
            
    # Remove duplicates, empty, and non-stock markers (like 'XD')
    exclude_list = ['XD', 'SYMBOL', 'NAME']
    symbols = sorted(list(set([s for s in all_needed_symbols if s and s not in exclude_list])))
    
    if not symbols:
        print("No valid symbols found. Using default top stocks list.")
        # Fallback to a core list of SET50 if nothing provided
        symbols = ['PTT', 'CPALL', 'AOT', 'ADVANC', 'SCB', 'KBANK', 'DELTA', 'GULF', 'BDMS', 'PTTEP']

    print(f"Fetching LIVE data for {len(symbols)} symbols from Yahoo Finance...")
    
    data_rows = []
    for symbol in symbols:
        try:
            # Thai stocks in Yahoo Finance use .BK suffix
            ticker_symbol = f"{symbol}.BK"
            ticker = yf.Ticker(ticker_symbol)
            info = ticker.info
            
            # Extract key metrics
            price = info.get('currentPrice') or info.get('regularMarketPrice') or 0
            # Skip if we can't even get a price (invalid symbol)
            if price == 0:
                print(f"   [-] {symbol}: No price data, skipping")
                continue

            pe = info.get('trailingPE') or 0
            pbv = info.get('priceToBook') or 0
            
            # Smart Scaling for Yield
            raw_yield = info.get('dividendYield') or info.get('trailingAnnualDividendYield') or 0
            dividend_yield = raw_yield if raw_yield > 1 else raw_yield * 100
                
            # Smart Scaling for ROE
            raw_roe = info.get('returnOnEquity') or 0
            roe = raw_roe if abs(raw_roe) > 1 else raw_roe * 100
            
            # --- NEW: RSI Calculation ---
            hist = ticker.history(period="1mo")
            rsi_val = calculate_rsi(hist['Close']) if not hist.empty else 50
            
            data_rows.append({
                'Symbol': symbol,
                'Price': price,
                'PE': pe,
                'PBV': pbv,
                'Yield': dividend_yield,
                'ROE': roe,
                'High_52W': info.get('fiftyTwoWeekHigh'),
                'Low_52W': info.get('fiftyTwoWeekLow'),
                'RSI': rsi_val
            })
            print(f"   [+] {symbol}: Success (RSI: {rsi_val:.1f})")
        except Exception as e:
            print(f"   [-] {symbol}: Failed ({e})")
            
    if not data_rows:
        print("Error: Could not fetch data for any symbols.")
        return None
        
    df = pd.DataFrame(data_rows)
    df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"Successfully saved {len(df)} stocks to {output_file}")
    
    return df

if __name__ == "__main__":
    scrape_siamchart_stocks()
