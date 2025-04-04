// src/app/components/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  OutagePredictionService,
  PredictionResponse,
  PredictionRequest,
  RiskFactor,
} from '../../services/outage-prediction.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  prediction: PredictionResponse | null = null;
  loading = false;
  error = '';
  currentWeather: PredictionRequest = {
    windDirection: 180,
    windGust: 20,
    windSpeed: 10,
    relativeHumidity: 70,
    temperature: 75,
    dewpoint: 60,
    precipitationChance: 30,
    county: 'Davidson',
  };
  counties = [
    'Anderson',
    'Bedford',
    'Davidson',
    'Hamilton',
    'Knox',
    'Montgomery',
    'Shelby',
    'Sullivan',
    'Washington',
  ];

  constructor(private predictionService: OutagePredictionService) {}

  ngOnInit(): void {
    this.getPrediction();
  }

  getPrediction(): void {
    this.loading = true;
    this.error = '';

    // Use this for mock data testing
    // this.prediction = this.predictionService.getMockPrediction();
    // this.loading = false;

    // Use this for real API
    this.predictionService.predictOutage(this.currentWeather).subscribe({
      next: (data) => {
        this.prediction = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error getting prediction:', err);
        this.error = 'Failed to get prediction. Using mock data instead.';
        this.prediction = this.predictionService.getMockPrediction();
        this.loading = false;
      },
    });
  }

  updateWeather(): void {
    this.getPrediction();
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getRiskIcon(severity: string): string {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'help';
    }
  }
}
