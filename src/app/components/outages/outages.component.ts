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
    'Anderson', 'Bedford', 'Benton', 'Bledsoe', 'Blount', 'Bradley', 'Campbell', 'Cannon', 'Carroll', 'Carter',
    'Cheatham', 'Chester', 'Claiborne', 'Clay', 'Cocke', 'Coffee', 'Crockett', 'Cumberland', 'Davidson', 'Decatur',
    'DeKalb', 'Dickson', 'Dyer', 'Fayette', 'Fentress', 'Franklin', 'Gibson', 'Giles', 'Grainger', 'Greene',
    'Grundy', 'Hamblen', 'Hamilton', 'Hancock', 'Hardeman', 'Hardin', 'Hawkins', 'Haywood', 'Henderson', 'Henry',
    'Hickman', 'Houston', 'Humphreys', 'Jackson', 'Jefferson', 'Johnson', 'Knox', 'Lake', 'Lauderdale', 'Lawrence',
    'Lewis', 'Lincoln', 'Loudon', 'Macon', 'Madison', 'Marion', 'Marshall', 'Maury', 'McMinn', 'McNairy',
    'Meigs', 'Monroe', 'Montgomery', 'Moore', 'Morgan', 'Obion', 'Overton', 'Perry', 'Pickett', 'Polk',
    'Putnam', 'Rhea', 'Roane', 'Robertson', 'Rutherford', 'Scott', 'Sequatchie', 'Sevier', 'Shelby', 'Smith',
    'Stewart', 'Sullivan', 'Sumner', 'Tipton', 'Trousdale', 'Unicoi', 'Union', 'Van Buren', 'Warren', 'Washington',
    'Wayne', 'Weakley', 'White', 'Williamson', 'Wilson',
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

  currentPrediction: PredictionResult | null = null;

  readonly MAX_EXPECTED_SCORE = 50; // Example, adjust if historical scores have a different max
  readonly CHART_MAX_SCORE = 30; // For chart display scaling

  // Simplified map data for demo
  mapCounties = [
    { name: 'Davidson', x: 100, y: 50, width: 60, height: 40 },
    { name: 'Shelby', x: 20, y: 100, width: 50, height: 40 },
    { name: 'Knox', x: 180, y: 60, width: 50, height: 40 },
    { name: 'Hamilton', x: 150, y: 110, width: 60, height: 40 },
  ];

  // Historical outage data
  countyOutageData: { [key: string]: { [key: number]: number } } = {
    Loudon: { 2015: 14.87, 2017: 6.21, 2019: 7.5, 2021: 8.15, 2022: 10.2, 2023: 9.8, 2024: 8.9 },
    Shelby: { 2015: 7.52, 2016: 7.22, 2017: 8.06, 2018: 6.97, 2019: 7.69, 2020: 15.5, 2021: 12.8, 2022: 44.17, 2023: 31.5, 2024: 23.7 },
    Davidson: { 2018: 5.1, 2019: 6.3, 2020: 12.1, 2021: 9.5, 2022: 10.8, 2023: 8.2, 2024: 7.5 },
    Knox: { 2018: 4.5, 2019: 5.8, 2020: 10.2, 2021: 8.1, 2022: 9.9, 2023: 7.5, 2024: 6.9 },
    Hamilton: { 2018: 6.0, 2019: 7.1, 2020: 11.5, 2021: 9.0, 2022: 10.3, 2023: 7.9, 2024: 7.2 },
  };

  constructor(
    private fb: FormBuilder,
    private predictionService: PredictionService,
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.setupSearch();
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
    this.searchControl.setValue(''); // Clear search input
    this.filteredCounties = []; // Hide suggestions
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.predictionForm.invalid) {
      this.resetCountyData();
      return;
    }

    const selected = this.predictionForm.get('county')?.value;
    if (selected && this.counties.includes(selected)) {
      this.selectedCounty = selected;
      this.updateSelectedCountyData(); // Load historical data and set initial score
      this.fetchWeatherAndPrediction(); // Fetch live weather and prediction
    } else {
      this.resetCountyData();
    }
  }

  refreshData(): void {
    if (this.selectedCounty && !this.weatherDataLoading) {
      this.fetchWeatherAndPrediction();
    }
  }

  resetCountyData(): void {
    this.selectedCounty = null;
    this.selectedCountyData = [];
    this.latestScore = 0;
    this.countyInsight = '';
    this.recommendations = [];
    this.weatherAlert = null;
    this.currentPrediction = null;
    this.currentWeather = { temperature: 0, windSpeed: 0, precipitation: 0 };
    this.weatherDescription = '';
  }

  updateSelectedCountyData(): void {
    if (!this.selectedCounty) {
      this.resetCountyData();
      return;
    }

    this.selectedCountyData = [];
    this.currentPrediction = null; // Reset current prediction when county changes before new fetch

    if (this.countyOutageData[this.selectedCounty]) {
      const countyData = this.countyOutageData[this.selectedCounty];
      this.selectedCountyData = Object.keys(countyData)
        .map((yearStr) => {
          const year = parseInt(yearStr);
          return { year, score: countyData[year] };
        })
        .sort((a, b) => a.year - b.year);

      if (this.selectedCountyData.length > 0) {
        this.latestScore = this.selectedCountyData[this.selectedCountyData.length - 1].score;
      } else {
        this.latestScore = 0;
      }
    } else {
      this.latestScore = 0; // Default if no historical data
      this.countyInsight = `Historical outage data for ${this.selectedCounty} County is currently unavailable. Monitoring general state trends is advised.`;
      this.recommendations = ['Monitor local weather alerts.', 'Ensure basic emergency supplies are ready.'];
    }
     // This will be updated by fetchWeatherAndPrediction if successful
    this.generateCountyInsight();
    this.generateRecommendations(this.calculateRiskLevel(this.latestScore));
  }

  fetchWeatherAndPrediction(): void {
    if (!this.selectedCounty) return;

    this.weatherDataLoading = true;
    this.currentPrediction = null; // Clear previous prediction

    this.predictionService.getCurrentWeather(this.selectedCounty).subscribe({
      next: (weatherData) => {
        this.currentWeather = {
          temperature: weatherData.temperature,
          windSpeed: weatherData.windSpeed,
          precipitation: weatherData.precipitationChance / 100,
        };
        this.weatherDescription = weatherData.weatherDescription || '';
        this.lastUpdated = weatherData.lastUpdated || new Date().toISOString();
        this.generateWeatherAlert(weatherData);

        this.predictionService.predict(weatherData).subscribe({
          next: (prediction) => {
            this.currentPrediction = prediction;
            this.latestScore = prediction.probability * 100; // Update score from prediction
            
            this.generateCountyInsight(); // Regenerate with new score and prediction
            this.generateRecommendations(this.calculateRiskLevel(this.latestScore));
            this.weatherDataLoading = false;
          },
          error: (err) => {
            console.error('Error getting prediction:', err);
            // If prediction fails, insights will use historical score (already set or re-set if needed)
            this.generateCountyInsight();
            this.generateRecommendations(this.calculateRiskLevel(this.latestScore));
            this.weatherDataLoading = false;
          },
        });
      },
      error: (err) => {
        console.error('Error getting weather data:', err);
        this.generateWeatherData(); // Fallback to simulated weather
        // Insights will use historical score
        this.generateCountyInsight();
        this.generateRecommendations(this.calculateRiskLevel(this.latestScore));
        this.weatherDataLoading = false;
      },
    });
  }

  generateCountyInsight(): void {
    if (!this.selectedCounty) {
        this.countyInsight = 'Please select a county to see insights.';
        this.recommendations = [];
        return;
    }

    if (this.currentPrediction) {
        const probability = this.currentPrediction.probability * 100; // Score is already probability * 100
        const riskLevel = this.calculateRiskLevel(this.latestScore); // Use this.latestScore
        let riskDescription = 'unknown';

        switch (riskLevel) {
            case 'Very High': riskDescription = 'very high'; break;
            case 'High': riskDescription = 'high'; break;
            case 'Moderate': riskDescription = 'moderate'; break;
            case 'Low': riskDescription = 'lower'; break;
            case 'Very Low': riskDescription = 'very low'; break;
        }

        this.countyInsight = `${this.selectedCounty} County shows a ${riskDescription} risk based on current weather data. Outage probability is ${this.latestScore.toFixed(1)}%.`;
        if (this.currentPrediction.recommendation) {
             // this.countyInsight += ` Recommendation: ${this.currentPrediction.recommendation}`;
        }

    } else if (this.selectedCountyData.length > 0) {
        // Fallback to historical data analysis if no current prediction
        let trendDescription = 'limited historical data';
        if (this.selectedCountyData.length >= 2) {
            const firstScore = this.selectedCountyData[0].score;
            const lastScore = this.latestScore; // This is from historical here
            const secondLastScore = this.selectedCountyData.length > 1 ? this.selectedCountyData[this.selectedCountyData.length - 2].score : lastScore;

            if (lastScore > firstScore * 1.3) trendDescription = 'an increasing trend';
            else if (lastScore < firstScore * 0.8) trendDescription = 'a decreasing trend';
            else trendDescription = 'a relatively stable trend';

            if (lastScore > secondLastScore * 1.15) trendDescription += ', with a recent uptick';
            else if (lastScore < secondLastScore * 0.85) trendDescription += ', though potentially decreasing recently';
        }

        const riskLevelString = this.calculateRiskLevel(this.latestScore);
        let riskDescription = 'unknown';
        switch (riskLevelString) {
            case 'Very High': riskDescription = 'very high'; break;
            case 'High': riskDescription = 'high'; break;
            case 'Moderate': riskDescription = 'moderate'; break;
            case 'Low': riskDescription = 'lower'; break;
            case 'Very Low': riskDescription = 'very low'; break;
        }
        this.countyInsight = `${this.selectedCounty} County shows a ${riskDescription} risk based on the latest historical score of ${this.latestScore.toFixed(1)}. Historical data suggests ${trendDescription} in outage events.`;
    
    } else {
        this.countyInsight = `No current prediction or historical outage data available to generate insights for ${this.selectedCounty}.`;
        this.recommendations = ['Monitor local weather alerts.', 'Ensure basic emergency supplies are ready.'];
    }
  }
  
  generateWeatherData(): void {
    this.currentWeather = {
      temperature: Math.floor(Math.random() * 30) + 55,
      windSpeed: Math.floor(Math.random() * 25) + 5,
      precipitation: Math.random() > 0.7 ? parseFloat((Math.random() * 0.5).toFixed(2)) : 0,
    };
    this.weatherDescription = 'Simulated weather conditions (API fallback)';
    this.updateLastUpdatedTime();
    this.generateWeatherAlert();
  }

  updateLastUpdatedTime(): void {
    const now = new Date();
    this.lastUpdated = now.toISOString();
  }

  generateWeatherAlert(weatherData?: WeatherData): void {
    this.weatherAlert = null;
    const data = weatherData || this.currentWeather; // Use API data if available, else simulated

    if (weatherData) { // Prioritize actual weatherData if passed
        if (weatherData.windGust > 30) {
            this.weatherAlert = `High wind warning: ${weatherData.windGust} mph gusts reported. Increased risk of localized outages.`;
        } else if (weatherData.precipitationChance > 70 && weatherData.windSpeed > 15) {
            this.weatherAlert = `Moderate rain (${weatherData.precipitationChance}% chance) and wind (${weatherData.windSpeed} mph) may increase outage potential.`;
        } else if (weatherData.temperature > 95) {
            this.weatherAlert = `Extreme heat warning: ${weatherData.temperature}°F. High demand may strain the grid.`;
        }
    } else { // Fallback to current (potentially simulated) weather
        if (this.currentWeather.windSpeed > 25) { // Assuming windSpeed is main indicator if windGust not in simulated
             this.weatherAlert = `High wind warning: ${this.currentWeather.windSpeed} mph winds reported. Increased risk of localized outages.`;
        } else if (this.currentWeather.precipitation > 0.3 && this.currentWeather.windSpeed > 15) {
            this.weatherAlert = `Moderate rain (${this.currentWeather.precipitation}) and wind (${this.currentWeather.windSpeed} mph) may increase outage potential.`;
        } else if (this.currentWeather.temperature > 95) { // Assuming temperature is in F
            this.weatherAlert = `Extreme heat warning: ${this.currentWeather.temperature}°F. High demand may strain the grid.`;
        }
    }
  }

  generateRecommendations(riskLevel: string): void {
    if (this.currentPrediction && this.currentPrediction.recommendation) {
      const sentences = this.currentPrediction.recommendation.split(/\.\s+/);
      this.recommendations = sentences
        .filter((sentence) => sentence.trim().length > 0)
        .map((sentence) => sentence.trim() + (sentence.endsWith('.') ? '' : '.'));
      this.recommendations.push('Keep phones and power banks charged.', 'Have flashlights and extra batteries accessible.');
      return;
    }

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
    }

    if (this.weatherAlert?.includes('wind')) {
      this.recommendations.push('Secure loose outdoor items (furniture, bins).');
    }
    if (this.weatherAlert?.includes('heat')) {
      this.recommendations.push('Stay hydrated and check on cooling systems.');
    }
    if (this.weatherAlert?.includes('rain') && this.currentWeather.precipitation > 0.1) {
      this.recommendations.push('Monitor for potential localized flooding if rain is heavy or persistent.');
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    } catch (error) {
      return dateString;
    }
  }

  calculateRiskLevel(score: number): string {
    if (score > 25) return 'Very High'; // If from prediction, 25% prob. If historical, score 25.
    if (score > 15) return 'High';
    if (score > 8) return 'Moderate';
    if (score > 4) return 'Low';
    return 'Very Low';
  }

  getColorForScore(score: number): string {
    if (score > 25) return '#d32f2f';
    if (score > 15) return '#f44336';
    if (score > 8) return '#ff9800';
    if (score > 4) return '#ffeb3b'; // Consider a less vibrant yellow for text contrast if used as background
    return '#4caf50';
  }

  getBarHeight(score: number): number {
    const scaledScore = Math.min(score, this.CHART_MAX_SCORE);
    const heightPercentage = (scaledScore / this.CHART_MAX_SCORE) * 100;
    return Math.max(5, Math.min(100, heightPercentage));
  }
}