import pandas as pd
import yfinance as yf
import numpy as np

def run_strategy_simulation(symbol, start_date, initial_capital=100000):
    """
    Simulates the Elite Investor strategy on a single stock.
    """
    # 1. Fetch historical data (2 years to have baseline for 52W H/L)
    print(f"Fetching data for {symbol}...")
    df = yf.download(symbol, start=pd.to_datetime(start_date) - pd.DateOffset(years=1))
    if df.empty: return None

    # Flatten columns if multi-index (common in newer yfinance)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    # 2. Simulation State
    cash = initial_capital
    shares = 0
    portfolio_history = []
    trades = []

    # 3. Daily Loop
    # We start from start_date, but use previous data for calculations
    sim_data = df[df.index >= pd.to_datetime(start_date)].copy()
    
    for date, row in sim_data.iterrows():
        # Get window for 52W calculation (approx 252 trading days)
        window = df.loc[:date].tail(252)
        low_52w = window['Low'].min()
        high_52w = window['High'].max()
        price = row['Close']
        
        # Calculate RSI (Simplified 14-day)
        delta = df.loc[:date].tail(30)['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean().iloc[-1]
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean().iloc[-1]
        rs = gain / loss if loss > 0 else 100
        rsi = 100 - (100 / (1 + rs))
        
        # Define Zones
        entry_high = low_52w * 1.05
        exit_low = high_52w * 0.97
        stop_loss = low_52w * 0.95
        
        # LOGIC EXECUTION
        action = "HOLD"
        
        # BUY Logic: If we have cash and price is in Entry Zone
        # Allowing re-entry if we have enough cash for at least 10 shares
        if cash >= (price * 10) and price <= entry_high:
            buy_shares = int(cash // price)
            cost = buy_shares * price
            cash -= cost
            shares += buy_shares
            action = "BUY"
            trades.append({'Date': date, 'Action': 'BUY', 'Price': price, 'Shares': buy_shares})
        
        # SELL Logic 1: Stop Loss (Total Exit)
        elif shares > 0 and price <= stop_loss:
            cash += shares * price
            action = "STOP LOSS"
            trades.append({'Date': date, 'Action': 'STOP LOSS', 'Price': price, 'Shares': shares})
            shares = 0
            
        # SELL Logic 2: Take Profit (Partial Exit - 50%)
        elif shares >= 2 and price >= exit_low:
            sell_half = shares // 2
            cash += sell_half * price
            action = "TAKE PROFIT (50%)"
            trades.append({'Date': date, 'Action': 'TP 50%', 'Price': price, 'Shares': sell_half})
            shares -= sell_half

        # Track Portfolio Value
        total_value = cash + (shares * price)
        portfolio_history.append({
            'Date': date,
            'Price': price,
            'Portfolio_Value': total_value,
            'Cash': cash,
            'Shares': shares,
            'Action': action
        })

    # 4. Wrap up
    result_df = pd.DataFrame(portfolio_history).set_index('Date')
    # Add Buy & Hold comparison
    first_price = sim_data['Close'].iloc[0]
    result_df['Buy_Hold_Value'] = (initial_capital / first_price) * result_df['Price']
    
    return result_df, pd.DataFrame(trades)

if __name__ == "__main__":
    # Test simulation
    res, tr = run_strategy_simulation("CPALL.BK", "2024-01-01")
    print(res.tail())
