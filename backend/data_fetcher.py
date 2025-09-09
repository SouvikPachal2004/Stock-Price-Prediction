import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta

class DataFetcher:
    def __init__(self):
        pass
    
    def fetch_data(self, ticker, start_date, end_date):
        """Fetch historical stock data"""
        try:
            # Convert string dates to datetime objects
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
            
            # Fetch data using yfinance
            stock_data = yf.download(ticker, start=start_date, end=end_date)
            
            # Reset index to make Date a column
            stock_data.reset_index(inplace=True)
            
            # Format date column
            stock_data['Date'] = stock_data['Date'].dt.strftime('%Y-%m-%d')
            
            return stock_data
        
        except Exception as e:
            print(f"Error fetching data: {e}")
            return pd.DataFrame()  # Return empty DataFrame on error
    
    def get_latest_data(self, ticker, days=60):
        """Fetch the latest data for a stock"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        return self.fetch_data(ticker, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))