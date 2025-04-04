# app/api.py
import os
import numpy as np
import pandas as pd
import tensorflow as tf
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load the model
MODEL_PATH = "models/v1"
model = tf.keras.models.load_model(MODEL_PATH)

# Feature importance from the model results
FEATURE_IMPORTANCE = {
    "weather_windDirection": 3632.09,
    "weather_windGust": 368.04,
    "weather_relativeHumidity": 9.80,
    "weather_windSpeed": 9.35,
    "weather_mixingHeight": 6.38,
    "weather_apparentTemperature": 5.34,
    "weather_dewpoint": 5.20
}

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    
    # Create features similar to what the model was trained on
    features = {
        "weather_windDirection": data.get("windDirection", 0),
        "weather_windGust": data.get("windGust", 0),
        "weather_windSpeed": data.get("windSpeed", 0),
        "weather_relativeHumidity": data.get("relativeHumidity", 0),
        "weather_temperature": data.get("temperature", 0),
        "weather_dewpoint": data.get("dewpoint", 0),
        "weather_precipitationChance": data.get("precipitationChance", 0),
        "month": data.get("month", datetime.now().month),
        "day_of_week": data.get("dayOfWeek", datetime.now().weekday()),
        "hour_of_day": data.get("hour", datetime.now().hour),
        "county": data.get("county", "")
    }
    
    # Add sin/cos for month (seasonal features)
    features["sin_month"] = np.sin(2 * np.pi * features["month"] / 12)
    features["cos_month"] = np.cos(2 * np.pi * features["month"] / 12)
    
    # Convert to DataFrame
    df = pd.DataFrame([features])
    
    # Make prediction
    try:
        probability = model.predict(df)[0][0]
        is_outage_likely = probability > 0.5
        
        # Calculate estimated duration based on wind factors
        estimated_duration = 0
        if is_outage_likely:
            # Simple formula based on wind factors
            wind_factor = (features["weather_windGust"] * 0.4 + features["weather_windSpeed"] * 0.6) / 40
            base_duration = 2  # Base duration in hours
            estimated_duration = max(1, base_duration * wind_factor)
        
        # Generate recommendation
        recommendation = generate_recommendation(features, is_outage_likely, estimated_duration)
        
        # Risk factors
        risk_factors = get_risk_factors(features)
        
        return jsonify({
            "outage_likely": bool(is_outage_likely),
            "probability": float(probability),
            "estimated_duration": round(estimated_duration, 1),
            "recommendation": recommendation,
            "risk_factors": risk_factors
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_recommendation(features, is_outage_likely, duration):
    if not is_outage_likely:
        return "No significant outage risk detected. Normal operations recommended."
    
    if duration < 2:
        return "Minor outage risk detected. Consider charging devices and having flashlights ready."
    elif duration < 4:
        return "Moderate outage risk detected. Prepare emergency supplies and consider backing up critical systems."
    else:
        return "Significant outage risk detected. Implement emergency protocols, ensure backup generators are operational, and consider proactive power management."

def get_risk_factors(features):
    risk_factors = []
    
    if features["weather_windGust"] > 35:
        risk_factors.append({"factor": "High Wind Gusts", "value": f"{features['weather_windGust']} mph", "severity": "high"})
    
    if features["weather_windSpeed"] > 25:
        risk_factors.append({"factor": "Sustained Wind", "value": f"{features['weather_windSpeed']} mph", "severity": "medium"})
    
    if features["weather_precipitationChance"] > 70:
        risk_factors.append({"factor": "Heavy Precipitation", "value": f"{features['weather_precipitationChance']}%", "severity": "medium"})
    
    return risk_factors

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)