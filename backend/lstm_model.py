import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
import os
from datetime import datetime, timedelta

class LSTMModel:
    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.time_steps = 60  # Number of time steps to look back
        
    def prepare_data(self, data):
        """Prepare data for LSTM model"""
        # Extract closing prices
        closing_prices = data['Close'].values.reshape(-1, 1)
        
        # Scale data
        scaled_data = self.scaler.fit_transform(closing_prices)
        
        return scaled_data
    
    def build_model(self, input_shape):
        """Build LSTM model"""
        model = Sequential()
        
        # First LSTM layer
        model.add(LSTM(units=50, return_sequences=True, input_shape=input_shape))
        model.add(Dropout(0.2))
        
        # Second LSTM layer
        model.add(LSTM(units=50, return_sequences=False))
        model.add(Dropout(0.2))
        
        # Dense layer
        model.add(Dense(units=25))
        
        # Output layer
        model.add(Dense(units=1))
        
        # Compile model
        model.compile(optimizer='adam', loss='mean_squared_error')
        
        return model
    
    def train(self, data, epochs=25, batch_size=32):
        """Train the LSTM model"""
        # Create training data
        X_train = []
        y_train = []
        
        for i in range(self.time_steps, len(data)):
            X_train.append(data[i-self.time_steps:i, 0])
            y_train.append(data[i, 0])
        
        X_train, y_train = np.array(X_train), np.array(y_train)
        
        # Reshape X_train for LSTM input
        X_train = np.reshape(X_train, (X_train.shape[0], X_train.shape[1], 1))
        
        # Build and train model
        self.model = self.build_model((X_train.shape[1], 1))
        self.model.fit(X_train, y_train, epochs=epochs, batch_size=batch_size, verbose=1)
        
        # Save model
        self.model.save('lstm_model.h5')
    
    def load_saved_model(self):
        """Load a saved model if it exists"""
        if os.path.exists('lstm_model.h5'):
            self.model = load_model('lstm_model.h5')
            return True
        return False
    
    def predict(self, data, days):
        """Make predictions for the specified number of days"""
        # Try to load saved model
        if not self.load_saved_model():
            # If no saved model, train a new one
            self.train(data)
        
        # Get the last time_steps days
        last_sequence = data[-self.time_steps:]
        
        # Reshape for prediction
        X_test = np.reshape(last_sequence, (1, self.time_steps, 1))
        
        # Make predictions
        predictions = []
        current_sequence = X_test[0]
        
        for _ in range(days):
            # Reshape for model input
            current_input = np.reshape(current_sequence, (1, self.time_steps, 1))
            
            # Make prediction
            predicted_price = self.model.predict(current_input, verbose=0)[0][0]
            
            # Inverse transform to get actual price
            predicted_price = self.scaler.inverse_transform([[predicted_price]])[0][0]
            
            # Add to predictions list
            predictions.append(predicted_price)
            
            # Update sequence for next prediction
            new_value = self.scaler.transform([[predicted_price]])[0][0]
            current_sequence = np.append(current_sequence[1:], new_value)
        
        # Format predictions with dates
        last_date = datetime.now()
        formatted_predictions = []
        
        for i, price in enumerate(predictions):
            # Skip weekends
            next_date = last_date + timedelta(days=i+1)
            while next_date.weekday() > 4:  # 5 = Saturday, 6 = Sunday
                next_date += timedelta(days=1)
            
            formatted_predictions.append({
                'date': next_date.strftime('%Y-%m-%d'),
                'price': float(price)
            })
        
        return formatted_predictions