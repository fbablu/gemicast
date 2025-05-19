import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  lastUpdated?: string;
  weatherDescription?: string;
  // Added from backend potential fields
  mixingHeight?: number;
  apparentTemperature?: number;
}

export interface RiskFactor {
  factor: string;
  value: string;
  severity: string;
}

export interface PredictionResult {
  outage_likely: boolean;
  probability: number;
  estimated_duration: number;
  recommendation: string;
  lastUpdated?: string;
  risk_factors: RiskFactor[];
}

export interface CountyRanking {
  county: string;
  probability: number;
}

export interface RankingsResponse {
  high_risk: CountyRanking[];
  low_risk: CountyRanking[];
}

@Injectable({
  providedIn: 'root',
})
export class PredictionService {
  private apiUrl = environment.apiUrl; // Ensure this is correctly set in your environment files

  constructor(private http: HttpClient) {
    console.log('Using API URL for PredictionService:', this.apiUrl);
  }

  predict(weatherData: WeatherData): Observable<PredictionResult> {
    const now = new Date();
    const payload = {
      ...weatherData,
      month: weatherData.month ?? now.getMonth() + 1,
      dayOfWeek: weatherData.dayOfWeek ?? now.getDay(),
      hour: weatherData.hour ?? now.getHours(),
    };

    return this.http
      .post<PredictionResult>(`${this.apiUrl}/predict`, payload)
      .pipe(
        tap((response) => console.log('Prediction API response:', response)),
        catchError((error) => {
          console.error('Error making prediction via API:', error);
          return of(this.getFallbackPrediction(payload));
        }),
      );
  }

  getCurrentWeather(county: string): Observable<WeatherData> {
    return this.http
      .get<WeatherData>(
        `${this.apiUrl}/weather?county=${encodeURIComponent(county)}`,
      )
      .pipe(
        tap((data) => console.log(`Weather data for ${county}:`, data)),
        catchError((error) => {
          console.error(`Error fetching weather for ${county}:`, error);
          const synthetic = this.generateSyntheticWeather(county);
          synthetic.weatherDescription = `API ERROR for ${county} - Using synthetic data`;
          return of(synthetic);
        }),
      );
  }

  getCountyRankings(): Observable<RankingsResponse> {
    return this.http.get<RankingsResponse>(`${this.apiUrl}/rankings`).pipe(
      tap((data) => console.log('County rankings data:', data)),
      catchError((error) => {
        console.error('Error fetching county rankings:', error);
        // Provide a fallback empty or mock ranking
        return of({ high_risk: [], low_risk: [] });
      }),
    );
  }

  private generateSyntheticWeather(county: string): WeatherData {
    const now = new Date();
    const temp = Math.round(50 + Math.random() * 40);
    const windSpeed = Math.round(5 + Math.random() * 25);
    return {
      windDirection: Math.round(Math.random() * 360),
      windGust: windSpeed + Math.round(Math.random() * 15),
      windSpeed: windSpeed,
      relativeHumidity: Math.round(30 + Math.random() * 60),
      temperature: temp,
      dewpoint: Math.round(temp - 10 - Math.random() * 20),
      precipitationChance: Math.round(Math.random() * 100),
      county: county,
      lastUpdated: now.toISOString(),
      weatherDescription: 'SYNTHETIC WEATHER (SERVICE FALLBACK)',
      month: now.getMonth() + 1,
      dayOfWeek: now.getDay(),
      hour: now.getHours(),
      mixingHeight: 500,
      apparentTemperature: temp,
    };
  }

  private getFallbackPrediction(data: WeatherData): PredictionResult {
    const windRisk = (data.windGust ?? 0) > 30 || (data.windSpeed ?? 0) > 25;
    const precipRisk = (data.precipitationChance ?? 0) > 70;
    let probability = 0.1; // Base
    if ((data.windGust ?? 0) > 40) probability += 0.3;
    else if ((data.windGust ?? 0) > 30) probability += 0.15;
    if ((data.windSpeed ?? 0) > 30) probability += 0.2;
    else if ((data.windSpeed ?? 0) > 20) probability += 0.1;
    if ((data.precipitationChance ?? 0) > 80) probability += 0.15;
    else if ((data.precipitationChance ?? 0) > 60) probability += 0.05;
    probability = Math.min(probability, 0.95);

    const duration = windRisk
      ? 1 + (data.windGust ?? 0) / 15
      : 0.5 + (data.precipitationChance ?? 0) / 150;
    const riskFactors: RiskFactor[] = [];
    if ((data.windGust ?? 0) > 30)
      riskFactors.push({
        factor: 'High Wind Gusts',
        value: `${data.windGust} mph`,
        severity: (data.windGust ?? 0) > 40 ? 'high' : 'medium',
      });
    if ((data.windSpeed ?? 0) > 20)
      riskFactors.push({
        factor: 'Sustained Wind',
        value: `${data.windSpeed} mph`,
        severity: (data.windSpeed ?? 0) > 30 ? 'high' : 'medium',
      });
    if ((data.precipitationChance ?? 0) > 60)
      riskFactors.push({
        factor: 'Precipitation Risk',
        value: `${data.precipitationChance}%`,
        severity: (data.precipitationChance ?? 0) > 80 ? 'high' : 'medium',
      });

    let recommendation = '';
    if (probability > 0.6)
      recommendation =
        'High risk of power outages. Implement emergency protocols.';
    else if (probability > 0.3)
      recommendation =
        'Moderate risk of power disruptions. Have backup plans ready.';
    else recommendation = 'Low risk of outages. Monitor weather conditions.';

    return {
      outage_likely: probability > 0.5,
      probability: probability,
      estimated_duration: roundToFirstDecimal(duration),
      recommendation: recommendation,
      risk_factors: riskFactors,
      lastUpdated: new Date().toISOString(),
    };
  }
}

function roundToFirstDecimal(num: number): number {
  return Math.round(num * 10) / 10;
}
