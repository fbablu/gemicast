// src/app/services/outage-prediction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PredictionRequest {
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

export interface RiskFactor {
  factor: string;
  value: string;
  severity: 'low' | 'medium' | 'high';
}

export interface PredictionResponse {
  outage_likely: boolean;
  probability: number;
  estimated_duration: number;
  recommendation: string;
  risk_factors: RiskFactor[];
}

@Injectable({
  providedIn: 'root',
})
export class OutagePredictionService {
  private apiUrl = 'http://localhost:5000/api/predict';

  constructor(private http: HttpClient) {}

  predictOutage(data: PredictionRequest): Observable<PredictionResponse> {
    return this.http.post<PredictionResponse>(this.apiUrl, data);
  }

  // Mock data method for testing without API
  getMockPrediction(): PredictionResponse {
    return {
      outage_likely: Math.random() > 0.5,
      probability: Math.random(),
      estimated_duration: Math.random() * 5,
      recommendation:
        'Prepare for potential power disruptions. Keep devices charged and have emergency supplies ready.',
      risk_factors: [
        { factor: 'High Wind Gusts', value: '35 mph', severity: 'high' },
        { factor: 'Precipitation', value: '80%', severity: 'medium' },
      ],
    };
  }
}
