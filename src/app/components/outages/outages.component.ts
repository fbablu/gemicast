import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  PredictionService,
  WeatherData,
  PredictionResult,
} from '../../services/prediction.service';

interface CountyData {
  year: number;
  score: number;
}

interface WeatherInfo {
  temperature: number;
  windSpeed: number;
  precipitation: number;
}

@Component({
  selector: 'app-outages',
  templateUrl: './outages.component.html',
  styleUrls: ['./outages.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
})
export class OutagesComponent implements OnInit {
  predictionForm!: FormGroup;
  searchControl = new FormControl('');
  counties: string[] = [
    'Anderson',
    'Bedford',
    'Benton',
    'Bledsoe',
    'Blount',
    'Bradley',
    'Campbell',
    'Cannon',
    'Carroll',
    'Carter',
    'Cheatham',
    'Chester',
    'Claiborne',
    'Clay',
    'Cocke',
    'Coffee',
    'Crockett',
    'Cumberland',
    'Davidson',
    'Decatur',
    'DeKalb',
    'Dickson',
    'Dyer',
    'Fayette',
    'Fentress',
    'Franklin',
    'Gibson',
    'Giles',
    'Grainger',
    'Greene',
    'Grundy',
    'Hamblen',
    'Hamilton',
    'Hancock',
    'Hardeman',
    'Hardin',
    'Hawkins',
    'Haywood',
    'Henderson',
    'Henry',
    'Hickman',
    'Houston',
    'Humphreys',
    'Jackson',
    'Jefferson',
    'Johnson',
    'Knox',
    'Lake',
    'Lauderdale',
    'Lawrence',
    'Lewis',
    'Lincoln',
    'Loudon',
    'Macon',
    'Madison',
    'Marion',
    'Marshall',
    'Maury',
    'McMinn',
    'McNairy',
    'Meigs',
    'Monroe',
    'Montgomery',
    'Moore',
    'Morgan',
    'Obion',
    'Overton',
    'Perry',
    'Pickett',
    'Polk',
    'Putnam',
    'Rhea',
    'Roane',
    'Robertson',
    'Rutherford',
    'Scott',
    'Sequatchie',
    'Sevier',
    'Shelby',
    'Smith',
    'Stewart',
    'Sullivan',
    'Sumner',
    'Tipton',
    'Trousdale',
    'Unicoi',
    'Union',
    'Van Buren',
    'Warren',
    'Washington',
    'Wayne',
    'Weakley',
    'White',
    'Williamson',
    'Wilson',
  ];
  filteredCounties: string[] = [];
  selectedCounty: string | null = null;
  selectedCountyData: CountyData[] = [];
  latestScore: number = 0;
  countyInsight: string = '';
  weatherAlert: string | null = null;
  recommendations: string[] = [];
  currentWeather: WeatherInfo = {
    temperature: 0,
    windSpeed: 0,
    precipitation: 0,
  };
  weatherDescription: string = '';
  weatherDataLoading: boolean = false;
  lastUpdated: string = '';

  // Current prediction from API
  currentPrediction: PredictionResult | null = null;

  readonly MAX_EXPECTED_SCORE = 50;
  readonly CHART_MAX_SCORE = 30;

  // Historical outage data
  countyOutageData: { [key: string]: { [key: number]: number } } = {
    Loudon: {
      2015: 14.87,
      2017: 6.21,
      2019: 7.5,
      2021: 8.15,
      2022: 10.2,
      2023: 9.8,
      2024: 8.9,
    },
    Shelby: {
      2015: 7.52,
      2016: 7.22,
      2017: 8.06,
      2018: 6.97,
      2019: 7.69,
      2020: 15.5,
      2021: 12.8,
      2022: 44.17,
      2023: 31.5,
      2024: 23.7,
    },
    // More counties data...
  };

  constructor(
    private fb: FormBuilder,
    private predictionService: PredictionService,
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.setupSearch();
    // Set the current date for the "last updated" field
    this.updateLastUpdatedTime();
  }

  createForm(): void {
    this.predictionForm = this.fb.group({
      county: [this.selectedCounty, Validators.required],
    });
  }

  setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        if (searchTerm && searchTerm.trim().length > 0) {
          this.filteredCounties = this.counties.filter((county) =>
            county.toLowerCase().includes(searchTerm.toLowerCase()),
          );
        } else {
          this.filteredCounties = [];
        }
      });
  }

  selectCounty(county: string): void {
    this.predictionForm.patchValue({ county });
    this.searchControl.setValue('');
    this.filteredCounties = [];
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.predictionForm.invalid) {
      console.error('Form is invalid or no county selected');
      this.selectedCounty = null;
      this.selectedCountyData = [];
      this.countyInsight = '';
      this.recommendations = [];
      this.weatherAlert = null;
      return;
    }

    const selected = this.predictionForm.get('county')?.value;
    if (selected && this.counties.includes(selected)) {
      this.selectedCounty = selected;
      this.updateSelectedCountyData();
      this.fetchWeatherAndPrediction();
    } else {
      console.error('Invalid county selected:', selected);
      this.selectedCounty = null;
      this.selectedCountyData = [];
    }
  }

  updateSelectedCountyData(): void {
    if (!this.selectedCounty) {
      this.selectedCountyData = [];
      this.latestScore = 0;
      this.countyInsight = '';
      return;
    }

    this.selectedCountyData = [];
    if (this.countyOutageData[this.selectedCounty]) {
      const countyData = this.countyOutageData[this.selectedCounty];
      this.selectedCountyData = Object.keys(countyData)
        .map((yearStr) => {
          const year = parseInt(yearStr);
          return {
            year,
            score: countyData[year],
          };
        })
        .sort((a, b) => a.year - b.year);

      if (this.selectedCountyData.length > 0) {
        this.latestScore =
          this.selectedCountyData[this.selectedCountyData.length - 1].score;
      } else {
        this.latestScore = 0;
      }

      // This will be updated with real weather data
      this.generateCountyInsight();
    } else {
      console.warn(
        `No historical data found for ${this.selectedCounty}, though it should exist.`,
      );
      this.latestScore = 0;
      this.countyInsight = `Historical outage data for ${this.selectedCounty} County is currently unavailable. Monitoring general state trends is advised.`;
      this.recommendations = [
        'Monitor local weather alerts.',
        'Ensure basic emergency supplies are ready.',
      ];
    }
  }

  fetchWeatherAndPrediction(): void {
    if (!this.selectedCounty) return;

    this.weatherDataLoading = true;

    // Fetch real weather data from API
    this.predictionService.getCurrentWeather(this.selectedCounty).subscribe({
      next: (weatherData) => {
        // Update current weather display
        this.currentWeather = {
          temperature: weatherData.temperature,
          windSpeed: weatherData.windSpeed,
          precipitation: weatherData.precipitationChance / 100, // Convert to decimal for display
        };

        this.weatherDescription = weatherData.weatherDescription || '';

        // Save last updated time
        if (weatherData.lastUpdated) {
          this.lastUpdated = weatherData.lastUpdated;
        } else {
          this.updateLastUpdatedTime();
        }

        // Generate weather alert based on actual conditions
        this.generateWeatherAlert(weatherData);

        // Now get prediction based on this weather data
        this.predictionService.predict(weatherData).subscribe({
          next: (prediction) => {
            this.currentPrediction = prediction;

            // Update risk score based on prediction probability
            this.latestScore = prediction.probability * 100;

            // Generate insights and recommendations based on real prediction
            this.generateCountyInsight();
            this.generateRecommendations(
              this.calculateRiskLevel(this.latestScore),
            );

            this.weatherDataLoading = false;
          },
          error: (err) => {
            console.error('Error getting prediction:', err);
            // Fall back to historical data already loaded
            this.weatherDataLoading = false;
          },
        });
      },
      error: (err) => {
        console.error('Error getting weather data:', err);
        // Fall back to randomized data
        this.generateWeatherData();
        this.weatherDataLoading = false;
      },
    });
  }

  generateCountyInsight(): void {
    if (!this.selectedCounty || this.selectedCountyData.length === 0) {
      this.countyInsight = `No historical outage data available to generate insights for ${this.selectedCounty || 'the selected county'}.`;
      this.recommendations = [
        'Monitor local weather alerts.',
        'Ensure basic emergency supplies are ready.',
      ];
      return;
    }

    // If we have a current prediction from the API, use that probability
    if (this.currentPrediction) {
      const probability = this.currentPrediction.probability * 100;
      const riskLevel = this.calculateRiskLevel(probability);
      let riskDescription = 'unknown';

      switch (riskLevel) {
        case 'Very High':
          riskDescription = 'very high';
          break;
        case 'High':
          riskDescription = 'high';
          break;
        case 'Moderate':
          riskDescription = 'moderate';
          break;
        case 'Low':
          riskDescription = 'lower';
          break;
        case 'Very Low':
          riskDescription = 'very low';
          break;
      }

      this.countyInsight = `${this.selectedCounty} County shows a ${riskDescription} risk based on real-time weather data. Current outage probability is ${probability.toFixed(1)}%.`;

      // Add API recommendation if available
      if (this.currentPrediction.recommendation) {
        this.countyInsight += ` ${this.currentPrediction.recommendation}`;
      }

      return;
    }

    // Fall back to historical data analysis if no prediction
    let trendDescription = 'limited historical data';
    if (this.selectedCountyData.length >= 2) {
      const firstScore = this.selectedCountyData[0].score;
      const lastScore = this.latestScore;
      const secondLastScore =
        this.selectedCountyData.length > 1
          ? this.selectedCountyData[this.selectedCountyData.length - 2].score
          : lastScore;

      if (lastScore > firstScore * 1.3) {
        trendDescription = 'an increasing trend';
      } else if (lastScore < firstScore * 0.8) {
        trendDescription = 'a decreasing trend';
      } else {
        trendDescription = 'a relatively stable trend';
      }

      if (lastScore > secondLastScore * 1.15) {
        trendDescription += ', with a recent uptick';
      } else if (lastScore < secondLastScore * 0.85) {
        trendDescription += ', though potentially decreasing recently';
      }
    }

    const riskLevelString = this.calculateRiskLevel(this.latestScore);
    let riskDescription = 'unknown';
    switch (riskLevelString) {
      case 'Very High':
        riskDescription = 'very high';
        break;
      case 'High':
        riskDescription = 'high';
        break;
      case 'Moderate':
        riskDescription = 'moderate';
        break;
      case 'Low':
        riskDescription = 'lower';
        break;
      case 'Very Low':
        riskDescription = 'very low';
        break;
    }

    this.countyInsight = `${this.selectedCounty} County shows a ${riskDescription} risk based on the latest score of ${this.latestScore.toFixed(1)}. Historical data suggests ${trendDescription} in outage events.`;
    this.generateRecommendations(riskLevelString);
  }

  // Fallback method for generating weather data if API fails
  generateWeatherData(): void {
    // Simulate weather data - replace with actual API call
    this.currentWeather = {
      temperature: Math.floor(Math.random() * 30) + 55, // 55-84 F
      windSpeed: Math.floor(Math.random() * 25) + 5, // 5-29 mph
      precipitation:
        Math.random() > 0.7 ? parseFloat((Math.random() * 0.5).toFixed(2)) : 0, // 30% chance of 0-0.5 units (e.g., inches)
    };
    this.weatherDescription = 'Simulated weather conditions';
    this.updateLastUpdatedTime();
    this.generateWeatherAlert();
  }

  updateLastUpdatedTime(): void {
    const now = new Date();
    this.lastUpdated = now.toISOString();
  }

  generateWeatherAlert(weatherData?: WeatherData): void {
    this.weatherAlert = null;

    // If we have actual weather data from API
    if (weatherData) {
      if (weatherData.windGust > 30) {
        this.weatherAlert = `High wind warning: ${weatherData.windGust} mph gusts reported. Increased risk of localized outages.`;
      } else if (
        weatherData.precipitationChance > 70 &&
        weatherData.windSpeed > 15
      ) {
        this.weatherAlert = `Moderate rain (${weatherData.precipitationChance}% chance) and wind (${weatherData.windSpeed} mph) may increase outage potential.`;
      } else if (weatherData.temperature > 95) {
        this.weatherAlert = `Extreme heat warning: ${weatherData.temperature}°F. High demand may strain the grid.`;
      }
      return;
    }

    // Fallback to simulated alerts
    if (this.currentWeather.windSpeed > 25) {
      this.weatherAlert = `High wind warning: ${this.currentWeather.windSpeed} mph winds reported. Increased risk of localized outages.`;
    } else if (
      this.currentWeather.precipitation > 0.3 &&
      this.currentWeather.windSpeed > 15
    ) {
      this.weatherAlert = `Moderate rain (${this.currentWeather.precipitation}) and wind (${this.currentWeather.windSpeed} mph) may increase outage potential.`;
    } else if (this.currentWeather.temperature > 95) {
      this.weatherAlert = `Extreme heat warning: ${this.currentWeather.temperature}°F. High demand may strain the grid.`;
    }
  }

  generateRecommendations(riskLevel: string): void {
    // If we have recommendations from the API (prediction result)
    if (this.currentPrediction && this.currentPrediction.recommendation) {
      // Parse the recommendation into bullet points
      const recommendation = this.currentPrediction.recommendation;
      const sentences = recommendation.split(/\.\s+/);
      this.recommendations = sentences
        .filter((sentence) => sentence.trim().length > 0)
        .map(
          (sentence) => sentence.trim() + (sentence.endsWith('.') ? '' : '.'),
        );

      // Add standard preparation advice
      this.recommendations.push(
        'Keep phones and power banks charged.',
        'Have flashlights and extra batteries accessible.',
      );

      return;
    }

    // Fallback to standard recommendations
    this.recommendations = [
      'Keep phones and power banks charged.',
      'Have flashlights and extra batteries accessible.',
      'Know how to manually open your garage door if applicable.',
      "Check your utility provider's outage map/app for real-time updates.",
    ];

    switch (riskLevel) {
      case 'Very High':
        this.recommendations.push(
          'Strongly consider a backup generator or UPS for essential needs.',
          'Maintain a stock of non-perishable food and water for 3+ days.',
          'Review and communicate emergency plans with household members.',
        );
        break;
      case 'High':
        this.recommendations.push(
          'Ensure adequate non-perishable food and water for at least 1-2 days.',
          'Prepare a cooler for transferring perishable food if power is out long.',
          'Check on vulnerable neighbors if safe during an outage.',
        );
        break;
      case 'Moderate':
        this.recommendations.push('Have a cooler ready for perishables.');
        break;
      // Low/Very Low rely on base recommendations
    }

    if (this.weatherAlert?.includes('wind')) {
      this.recommendations.push(
        'Secure loose outdoor items (furniture, bins).',
      );
    }
    if (this.weatherAlert?.includes('heat')) {
      this.recommendations.push('Stay hydrated and check on cooling systems.');
    }
    if (
      this.weatherAlert?.includes('rain') &&
      this.currentWeather.precipitation > 0.1
    ) {
      this.recommendations.push(
        'Monitor for potential localized flooding if rain is heavy or persistent.',
      );
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'Not available';

    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return dateString;
    }
  }

  // Helper Functions for HTML Bindings
  calculateRiskLevel(score: number): string {
    if (score > 25) return 'Very High';
    if (score > 15) return 'High';
    if (score > 8) return 'Moderate';
    if (score > 4) return 'Low';
    return 'Very Low';
  }

  getColorForScore(score: number): string {
    if (score > 25) return '#d32f2f'; // Dark Red
    if (score > 15) return '#f44336'; // Red
    if (score > 8) return '#ff9800'; // Orange
    if (score > 4) return '#ffeb3b'; // Yellow
    return '#4caf50'; // Green
  }

  getBarHeight(score: number): number {
    const scaledScore = Math.min(score, this.CHART_MAX_SCORE);
    const heightPercentage = (scaledScore / this.CHART_MAX_SCORE) * 100;
    return Math.max(5, Math.min(100, heightPercentage)); // Min 5%, Max 100%
  }
}
