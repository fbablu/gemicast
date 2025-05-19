# app/api.py

import os
import numpy as np
# pandas is not strictly needed if we construct the SQL string directly,
# but can be useful if you prefer to build a dict/series first.
# For this version, we'll build the SQL string directly.
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

# --- Only if calling BQML directly from Flask ---
from google.cloud import bigquery
# --- ---

app = Flask(__name__)
CORS(app)

# --- Configuration for BigQuery ML ---
# Ensure your Flask environment has credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS env var)
# or that the service running Flask (e.g., Cloud Run) has appropriate IAM permissions.
try:
    bq_client = bigquery.Client()
    # THIS IS THE MODEL YOU TRAINED WITH THE EXPANDED SQL
    MODEL_ID = "custom-sylph-460317-i5.power_outages.outage_model_v2" 
except Exception as e:
    print(f"************************************************************")
    print(f"WARNING: Failed to initialize BigQuery client: {e}")
    print(f"The /api/predict endpoint will use MOCK PREDICTIONS.")
    print(f"Ensure GOOGLE_APPLICATION_CREDENTIALS is set or your environment has BQ permissions.")
    print(f"************************************************************")
    bq_client = None
# --- ---

# This list MUST match all one-hot encoded county columns used in training.
# Extracted from your bigquery_training_data.csv header.
ALL_COUNTIES = [
    'anderson', 'bedford', 'bledsoe', 'blount', 'bradley', 'campbell', 'cannon',
    'cheatham', 'chester', 'claiborne', 'clay', 'cocke', 'coffee', 'crockett',
    'cumberland', 'davidson', 'fayette', 'fentress', 'franklin', 'gibson',
    'giles', 'grainger', 'greene', 'hamblen', 'hamilton', 'hancock', 'hawkins',
    'haywood', 'henry', 'jefferson', 'knox', 'lawrence', 'loudon', 'macon',
    'madison', 'marion', 'marshall', 'maury', 'mcminn', 'meigs', 'monroe',
    'montgomery', 'moore', 'obion', 'overton', 'polk', 'putnam', 'rhea',
    'roane', 'robertson', 'rutherford', 'sevier', 'shelby', 'stewart',
    'sullivan', 'sumner', 'tipton', 'union', 'washington', 'white',
    'williamson', 'wilson'
]

# Helper to determine season from month
def get_season(month_num):
    if month_num in [3, 4, 5]:
        return "spring"
    elif month_num in [6, 7, 8]:
        return "summer"
    elif month_num in [9, 10, 11]:
        return "autumn" # Your training data CSV implies autumn/winter by spring=0, summer=0
    else:  # 12, 1, 2
        return "winter"

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json # Data from Angular service
    
    current_dt = datetime.now()
    month_val = data.get("month", current_dt.month)
    day_of_week_val = data.get("dayOfWeek", current_dt.weekday()) # 0=Monday, 6=Sunday for Python; BQ is 1=Sun, 7=Sat
    hour_of_day_val = data.get("hour", current_dt.hour)
    
    # Frontend sends county name like "Davidson"
    county_input_original = data.get("county", "davidson") # Default for safety
    county_input_lowercase = county_input_original.lower()

    # --- Construct the features dictionary for BQML ---
    # Default values should ideally come from your training data's statistics (mean/median/mode)
    # or be otherwise sensible if a feature is not provided by the frontend.
    features_for_bqml_dict = {
        "weather_apparentTemperature": float(data.get("apparentTemperature", data.get("temperature", 20.5))),
        "weather_dewpoint": float(data.get("dewpoint", 17.7)),
        "weather_heatIndex": float(data.get("heatIndex", data.get("temperature", 22.2))),
        "weather_iceAccumulation": float(data.get("iceAccumulation", 0.0)),
        "weather_mixingHeight": float(data.get("mixingHeight", 542.8)),
        "weather_probabilityOfPrecipitation": float(data.get("precipitationChance", 18.0)), # Mapped from precipitationChance
        "weather_quantitativePrecipitation": float(data.get("quantitativePrecipitation", 0.0)),
        "weather_relativeHumidity": float(data.get("relativeHumidity", 74.0)),
        "weather_skyCover": float(data.get("skyCover", 50.0)),
        "weather_snowfallAmount": float(data.get("snowfallAmount", 0.0)),
        "weather_temperature": float(data.get("temperature", 20.5)),
        "weather_transportWindSpeed": float(data.get("transportWindSpeed", data.get("windSpeed", 16.6))),
        "weather_windDirection": float(data.get("windDirection", 230.0)),
        "weather_windGust": float(data.get("windGust", 25.9)),
        "weather_windSpeed": float(data.get("windSpeed", 9.26)),
        "weather_visibility": float(data.get("visibility", 10000.0)), # Default to ~6 miles if not 0
        "weather_alert_count": int(data.get("alertCount", 0)),
        "weather_severe_alert": 1 if data.get("severeAlert", False) else 0,

        "month": int(month_val),
        "sin_month": np.sin(2 * np.pi * month_val / 12),
        "cos_month": np.cos(2 * np.pi * month_val / 12),
        "day_of_week": int(day_of_week_val), # Python: Mon=0, Sun=6. BQ: Sun=1, Sat=7. Adjust if your training data used BQ's convention
        "hour_of_day": int(hour_of_day_val),
    }

    # One-hot encode county
    for c in ALL_COUNTIES:
        features_for_bqml_dict[f"county_{c}"] = 1 if c == county_input_lowercase else 0
    
    # One-hot encode season (assuming autumn/winter is base case if only spring/summer are explicit)
    current_season = get_season(month_val)
    features_for_bqml_dict["season_spring"] = 1 if current_season == "spring" else 0
    features_for_bqml_dict["season_summer"] = 1 if current_season == "summer" else 0
    # If you had season_autumn and season_winter in your training data/SQL, add them:
    # features_for_bqml_dict["season_autumn"] = 1 if current_season == "autumn" else 0
    # features_for_bqml_dict["season_winter"] = 1 if current_season == "winter" else 0
    
    if not bq_client:
        # Fallback to simplified logic if BQ client isn't available
        print("WARNING: BigQuery client not available. Using MOCK prediction.")
        probability = calculate_probability_simple(data) # data is the raw request.json here
        is_outage_likely = probability > 0.5
        estimated_duration = calculate_estimated_duration_simple(data, is_outage_likely)
        recommendation = generate_recommendation(data, is_outage_likely, estimated_duration)
        risk_factors = get_risk_factors_simple(data)
        return jsonify({
            "outage_likely": is_outage_likely,
            "probability": probability,
            "estimated_duration": estimated_duration,
            "recommendation": recommendation,
            "risk_factors": risk_factors,
            "lastUpdated": datetime.now().isoformat(),
            "prediction_source": "mock"
        })

    # Construct the SELECT statement part for the ML.PREDICT query
    # Ensure order and names match the columns in your CREATE MODEL ... AS SELECT ...
    # (though for ML.PREDICT with a subquery selecting named columns, order isn't strictly vital as long as names match)
    select_expressions = []
    for key, value in features_for_bqml_dict.items():
        if isinstance(value, (int, np.integer)):
            select_expressions.append(f"CAST({value} AS INT64) AS {key}")
        elif isinstance(value, (float, np.floating)):
            select_expressions.append(f"CAST({value} AS FLOAT64) AS {key}")
        else: # Should not happen if types are correct
            select_expressions.append(f"CAST('{value}' AS STRING) AS {key}") # Fallback, but likely error if not expected
    
    feature_select_string = ",\n      ".join(select_expressions)

    query = f"""
    SELECT
      predicted_outage_occurred,
      predicted_outage_occurred_probs[OFFSET(CASE predicted_outage_occurred WHEN 1 THEN 1 ELSE 0 END)].prob AS probability_of_outage -- More robust way to get prob for the predicted class
      -- Or, if you always want prob of class 1 (outage):
      -- (SELECT p.prob FROM UNNEST(predicted_outage_occurred_probs) p WHERE p.label = 1) AS probability_of_outage
    FROM
      ML.PREDICT(MODEL `{MODEL_ID}`,
        (
          SELECT
            {feature_select_string}
        )
      )
    """
    # print(f"--- BigQuery ML Query ---\n{query}\n-------------------------") # For debugging

    try:
        query_job = bq_client.query(query)
        results = query_job.result() 
        
        prediction_row = next(results, None)

        if prediction_row:
            # BQML returns 0 or 1 for predicted_outage_occurred
            # predicted_outage_occurred_probs is an array of structs: [{label:0, prob:0.X}, {label:1, prob:0.Y}]
            is_outage_likely = bool(prediction_row.predicted_outage_occurred == 1)
            
            # Find the probability for the positive class (outage_occurred = 1)
            probability = 0.0 # Default
            for prob_info in prediction_row.predicted_outage_occurred_probs:
                if prob_info['label'] == 1: # Assuming 1 is the "outage occurred" label
                    probability = prob_info['prob']
                    break
        else:
            # This case should ideally not happen if the query is well-formed and the model exists.
            print("Error: ML.PREDICT did not return any rows.")
            return jsonify({"error": "Prediction query returned no results"}), 500

        # Use the prediction results
        # features_for_bqml_dict contains all features sent to BQML
        # data contains the original request from frontend
        estimated_duration = calculate_estimated_duration_simple(data, is_outage_likely) # Can refine this later
        recommendation = generate_recommendation(data, is_outage_likely, estimated_duration)
        risk_factors = get_risk_factors_simple(data) # Can refine this later

        return jsonify({
            "outage_likely": is_outage_likely,
            "probability": float(probability),
            "estimated_duration": round(estimated_duration, 1),
            "recommendation": recommendation,
            "risk_factors": risk_factors,
            "lastUpdated": datetime.now().isoformat(),
            "prediction_source": "bigquery_ml"
        })

    except Exception as e:
        print(f"Error executing BigQuery ML.PREDICT query: {str(e)}")
        # Fallback to your simple logic if BQML call fails
        probability = calculate_probability_simple(data)
        is_outage_likely = probability > 0.5
        estimated_duration = calculate_estimated_duration_simple(data, is_outage_likely)
        recommendation = generate_recommendation(data, is_outage_likely, estimated_duration)
        risk_factors = get_risk_factors_simple(data)
        
        return jsonify({
            "outage_likely": bool(is_outage_likely),
            "probability": float(probability),
            "estimated_duration": round(estimated_duration, 1),
            "recommendation": f"Fallback (BQML Error): {recommendation}",
            "risk_factors": risk_factors,
            "error_message": f"BigQuery ML prediction failed: {str(e)}",
            "lastUpdated": datetime.now().isoformat(),
            "prediction_source": "mock_due_to_bqml_error"
        }), 200 # Return 200 to frontend but indicate error and fallback


def calculate_probability_simple(features_data):
    """Simplified probability calculation for fallback or initial testing."""
    # 'features_data' here is the raw JSON from the request
    base_prob = 0.05
    if features_data.get("windGust", 0) > 50: base_prob += 0.4
    elif features_data.get("windGust", 0) > 30: base_prob += 0.25
    
    if features_data.get("windSpeed", 0) > 35: base_prob += 0.3
    elif features_data.get("windSpeed", 0) > 20: base_prob += 0.15
    
    if features_data.get("precipitationChance", 0) > 80: base_prob += 0.15
    elif features_data.get("precipitationChance", 0) > 50: base_prob += 0.05
    
    return min(0.95, base_prob)

def calculate_estimated_duration_simple(features_data, is_likely):
    if not is_likely:
        return 0.0
    wind_gust = features_data.get("windGust", 0)
    wind_speed = features_data.get("windSpeed", 0)
    wind_factor = (wind_gust * 0.4 + wind_speed * 0.6) / 40 
    base_duration = 2.0
    estimated_duration = max(1.0, base_duration * wind_factor)
    return round(estimated_duration, 1)


def get_risk_factors_simple(features_data):
    """Simplified risk factor generation."""
    risk_factors = []
    wind_gust = features_data.get("windGust", 0)
    wind_speed = features_data.get("windSpeed", 0)
    precip_chance = features_data.get("precipitationChance", 0)

    if wind_gust > 30:
        risk_factors.append({
            "factor": "High Wind Gusts", 
            "value": f"{wind_gust} mph", 
            "severity": "high" if wind_gust > 40 else "medium"
        })
    if wind_speed > 20:
        risk_factors.append({
            "factor": "Sustained Wind", 
            "value": f"{wind_speed} mph", 
            "severity": "high" if wind_speed > 30 else "medium"
        })
    if precip_chance > 60:
        risk_factors.append({
            "factor": "Precipitation Risk", 
            "value": f"{precip_chance}%", 
            "severity": "high" if precip_chance > 80 else "medium"
        })
    # You can add more based on other features sent by frontend if needed
    return risk_factors

def generate_recommendation(features_data, is_outage_likely, duration):
    if not is_outage_likely:
        return "No significant outage risk detected. Normal operations recommended."
    
    if duration < 2:
        return "Minor outage risk detected. Consider charging devices and have flashlights ready."
    elif duration < 4:
        return "Moderate outage risk detected. Prepare emergency supplies and consider backing up critical systems."
    else:
        return "Significant outage risk detected. Implement emergency protocols, ensure backup generators are operational, and consider proactive power management."


@app.route('/api/weather', methods=['GET'])
def get_weather():
    county_name = request.args.get('county', 'Davidson')
    if not county_name:
        return jsonify({"error": "County name is required"}), 400

    now = datetime.now()
    temp_c = round(5 + np.random.rand() * 25, 1) # Temp in Celsius
    wind_speed_mph = round(5 + np.random.rand() * 25, 1)
    precip_chance = round(np.random.rand() * 100, 0)
    
    weather_data = {
        "windDirection": round(np.random.rand() * 360, 1),
        "windGust": round(wind_speed_mph + np.random.rand() * 15, 1),
        "windSpeed": wind_speed_mph,
        "relativeHumidity": round(30 + np.random.rand() * 60, 1),
        "temperature": round(temp_c * 9/5 + 32, 1), # Fahrenheit
        "dewpoint": round((temp_c - 5 - np.random.rand() * 10) * 9/5 + 32, 1), # Approx dewpoint in F
        "precipitationChance": precip_chance, # %
        "county": county_name.capitalize(),
        "lastUpdated": now.isoformat(),
        "weatherDescription": f"Mock conditions for {county_name.capitalize()}",
        # Adding other fields based on your BQML model
        "apparentTemperature": round((temp_c - np.random.rand()*3) * 9/5 + 32, 1),
        "heatIndex": round((temp_c + np.random.rand()*2) * 9/5 + 32, 1),
        "iceAccumulation": 0.0,
        "mixingHeight": round(200 + np.random.rand() * 2000, 1), # meters
        "quantitativePrecipitation": round(np.random.rand() * 5 if precip_chance > 50 else 0, 2), # mm
        "skyCover": round(np.random.rand() * 100, 1), # %
        "snowfallAmount": 0.0, # mm
        "transportWindSpeed": round(wind_speed_mph * 0.9, 1), # mph
        "visibility": round(16093 - np.random.rand() * 10000, 1), # meters (up to 10 miles)
        "alertCount": 0, # Placeholder
        "severeAlert": False # Placeholder
    }
    return jsonify(weather_data)


@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    # For a production system, these rankings should be pre-calculated and stored,
    # not computed on-the-fly for all counties in an API call.
    # This mock generates random scores for demonstration.
    rankings = []
    for county_name_iter in ALL_COUNTIES:
        # Simulate features for the simple probability calculation
        mock_features_for_ranking = {
            "windGust": np.random.uniform(5, 60),
            "windSpeed": np.random.uniform(0, 40),
            "precipitationChance": np.random.uniform(0, 100)
        }
        prob = calculate_probability_simple(mock_features_for_ranking) 
        rankings.append({"county": county_name_iter.capitalize(), "probability": round(prob, 3)})

    rankings.sort(key=lambda x: x["probability"], reverse=True)
    
    high_risk = rankings[:5]
    low_risk = sorted(rankings, key=lambda x: x["probability"])[:5] # Get lowest 5

    return jsonify({
        "high_risk": high_risk,
        "low_risk": low_risk,
        "lastUpdated": datetime.now().isoformat()
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)