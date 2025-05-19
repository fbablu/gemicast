# app.py
import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import requests

app = Flask(__name__)
CORS(app)

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    
    try:
        # Create features from the input data
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
        
        # Calculate prediction based on a simplified algorithm
        probability = calculate_probability(features)
        is_outage_likely = probability > 0.5
        
        # Calculate estimated duration
        wind_factor = (features["weather_windGust"] * 0.4 + features["weather_windSpeed"] * 0.6) / 40
        base_duration = 2  # Base duration in hours
        estimated_duration = max(1, base_duration * wind_factor) if is_outage_likely else 0
        
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
        print(f"Error in prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500

def calculate_probability(features):
    """Calculate outage probability based on weather features"""
    base_prob = 0.05  # Base probability
    
    # Wind factors (most important)
    if features["weather_windGust"] > 50:
        base_prob += 0.4
    elif features["weather_windGust"] > 30:
        base_prob += 0.25
    
    if features["weather_windSpeed"] > 35:
        base_prob += 0.3
    elif features["weather_windSpeed"] > 20:
        base_prob += 0.15
    
    # Precipitation chance
    if features["weather_precipitationChance"] > 80:
        base_prob += 0.15
    elif features["weather_precipitationChance"] > 50:
        base_prob += 0.05
    
    # Cap probability at 95%
    return min(0.95, base_prob)

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
        risk_factors.append({
            "factor": "High Wind Gusts", 
            "value": f"{features['weather_windGust']} mph", 
            "severity": "high"
        })
    
    if features["weather_windSpeed"] > 25:
        risk_factors.append({
            "factor": "Sustained Wind", 
            "value": f"{features['weather_windSpeed']} mph", 
            "severity": "medium"
        })
    
    if features["weather_precipitationChance"] > 70:
        risk_factors.append({
            "factor": "Heavy Precipitation", 
            "value": f"{features['weather_precipitationChance']}%", 
            "severity": "medium"
        })
    
    return risk_factors

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)