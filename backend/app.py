from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
from lstm_model import LSTMModel
from data_fetcher import DataFetcher

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
CORS(app)  # Enable CORS for all routes

# Initialize model and data fetcher
model = LSTMModel()
data_fetcher = DataFetcher()

# Route for the main page
@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

# Route for static files
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

# Route for stock prediction
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get data from request
        data = request.json
        ticker = data['ticker']
        start_date = data['start_date']
        end_date = data['end_date']
        prediction_days = int(data['prediction_days'])
        
        # Validate inputs
        if not ticker or not start_date or not end_date or not prediction_days:
            return jsonify({'error': 'Missing required parameters'}), 400
        
        if prediction_days < 1 or prediction_days > 30:
            return jsonify({'error': 'Prediction days must be between 1 and 30'}), 400
        
        # Fetch historical data
        historical_data = data_fetcher.fetch_data(ticker, start_date, end_date)
        
        if historical_data.empty:
            return jsonify({'error': 'No data found for the specified ticker and date range'}), 404
        
        # Prepare data for model
        prepared_data = model.prepare_data(historical_data)
        
        # Make predictions
        predictions = model.predict(prepared_data, prediction_days)
        
        # Format response
        response = {
            'ticker': ticker,
            'historical_data': historical_data.to_dict('records'),
            'predictions': predictions,
            'current_price': float(historical_data['Close'].iloc[-1]),
            'predicted_price': float(predictions[-1]['price']),
            'change': float(predictions[-1]['price'] - historical_data['Close'].iloc[-1]),
            'confidence': float(np.random.uniform(0.7, 0.95))  # Random confidence for demo
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to get available stock tickers
@app.route('/tickers', methods=['GET'])
def get_tickers():
    try:
        # Return a list of available stock tickers
        tickers = [
            {'symbol': 'AAPL', 'name': 'Apple Inc.'},
            {'symbol': 'MSFT', 'name': 'Microsoft Corporation'},
            {'symbol': 'GOOGL', 'name': 'Alphabet Inc.'},
            {'symbol': 'AMZN', 'name': 'Amazon.com Inc.'},
            {'symbol': 'TSLA', 'name': 'Tesla Inc.'},
            {'symbol': 'META', 'name': 'Meta Platforms Inc.'},
            {'symbol': 'NVDA', 'name': 'NVIDIA Corporation'},
            {'symbol': 'JPM', 'name': 'JPMorgan Chase & Co.'}
        ]
        
        return jsonify(tickers)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)