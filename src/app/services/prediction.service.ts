import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeatherData {
  windDirection: number;
  windGust: number;
  windSpeed: number;
  relativeHumidity: number;
  temperature: number;
  dewpoint: number;
  precipitationChance: number;
  month?: number;
  dayOfWeek?: number;
  hour?: number;
  county: string;
}

export interface PredictionResult {
  outage_likely: boolean;
  probability: number;
  estimated_duration: number;
  recommendation: string;
  risk_factors: {
    factor: string;
    value: string;
    severity: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class PredictionService {
  private apiUrl = 'http://localhost:5000/api'; // Development
  // private apiUrl = 'https://your-cloud-run-url/api'; // Production

  constructor(private http: HttpClient) {}

  predict(weatherData: WeatherData): Observable<PredictionResult> {
    // Auto-populate missing time fields if not provided
    if (!weatherData.month) {
      const now = new Date();
      weatherData.month = now.getMonth() + 1;
      weatherData.dayOfWeek = now.getDay();
      weatherData.hour = now.getHours();
    }

    return this.http.post<PredictionResult>(
      `${this.apiUrl}/predict`,
      weatherData,
    );
  }

  /**
   * Get feature importance from the model
   * This is hardcoded based model output for now, but wo be an API call
   */
  getFeatureImportance(): Observable<
    { feature: string; importance: number }[]
  > {
    const featureImportance = [
      { feature: 'Wind Direction', importance: 3632.09 },
      { feature: 'Wind Gust', importance: 368.04 },
      { feature: 'Relative Humidity', importance: 9.8 },
      { feature: 'Wind Speed', importance: 9.35 },
      { feature: 'Mixing Height', importance: 6.38 },
      { feature: 'Apparent Temperature', importance: 5.34 },
      { feature: 'Dew Point', importance: 5.2 },
    ];

    return new Observable((observer) => {
      observer.next(featureImportance);
      observer.complete();
    });
  }

  /**
   * Get model accuracy metrics
   */
  getModelMetrics(): Observable<any> {
    const metrics = {
      accuracy: 0.998,
      precision: 0.998,
      recall: 0.998,
      f1Score: 0.998,
      confusionMatrix: {
        truePositives: 504,
        falsePositives: 1,
        trueNegatives: 504,
        falseNegatives: 1,
      },
    };

    return new Observable((observer) => {
      observer.next(metrics);
      observer.complete();
    });
  }
}
