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

interface CountyData {
  year: number;
  score: number;
}

interface WeatherInfo {
  temperature: number;
  windSpeed: number;
  precipitation: number; // Assuming this is a placeholder value, not necessarily percentage
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
  selectedCounty: string | null = null; // Initialize as null
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

  readonly MAX_EXPECTED_SCORE = 50; // Adjust if highest scores exceed this
  readonly CHART_MAX_SCORE = 30; // Visual maximum for chart scaling

  // Expanded historical outage data
  countyOutageData: { [key: string]: { [key: number]: number } } = {
    Loudon: { 2015: 14.87, 2017: 6.21, 2019: 7.5, 2021: 8.15 },
    Shelby: {
      2015: 7.52,
      2016: 7.22,
      2017: 8.06,
      2018: 6.97,
      2019: 7.69,
      2020: 15.5,
      2021: 12.8,
      2022: 44.17,
    },
    Coffee: { 2015: 5.41, 2017: 4.9, 2019: 6.1, 2021: 7.3, 2022: 8.05 },
    Giles: { 2015: 4.68, 2017: 5.1, 2019: 4.95, 2021: 6.2 },
    Marshall: { 2015: 4.16, 2017: 4.55, 2019: 5.0, 2021: 5.8 },
    Monroe: { 2016: 6.49, 2018: 6.74, 2019: 7.1, 2020: 16.93, 2022: 9.5 },
    Sumner: { 2016: 4.64, 2018: 5.1, 2020: 6.8, 2021: 18.44, 2022: 11.2 },
    Knox: { 2016: 3.99, 2017: 7.27, 2019: 5.5, 2020: 8.1, 2022: 9.9 },
    Davidson: { 2016: 3.71, 2018: 4.2, 2020: 7.5, 2021: 9.84, 2022: 7.94 },
    Jefferson: {
      2017: 19.68,
      2018: 5.57,
      2019: 6.2,
      2020: 5.6,
      2021: 7.8,
      2022: 4.85,
    },
    Blount: { 2017: 17.48, 2018: 6.05, 2019: 8.3, 2020: 9.1, 2022: 11.5 },
    Obion: {
      2017: 10.62,
      2018: 10.81,
      2019: 9.15,
      2020: 12.3,
      2021: 43.81,
      2022: 11.67,
    },
    Macon: { 2019: 10.42, 2017: 6.8, 2020: 8.9, 2021: 11.5 },
    Campbell: { 2019: 8.12, 2017: 5.9, 2018: 6.4, 2020: 9.5, 2022: 7.7 },
    Claiborne: { 2019: 7.95, 2017: 6.1, 2018: 6.6, 2020: 9.2, 2022: 8.1 },
    Polk: { 2020: 6.12, 2016: 4.3, 2018: 5.5, 2019: 5.8, 2022: 7.2 },
    Henry: { 2020: 5.94, 2018: 6.2, 2019: 7.0, 2021: 9.04, 2022: 8.5 },
    Williamson: { 2020: 5.27, 2016: 3.8, 2018: 4.5, 2019: 4.9, 2022: 6.1 },
    Dyer: { 2021: 8.5, 2017: 7.1, 2019: 7.8, 2020: 9.6, 2022: 5.58 },
    Anderson: { 2016: 5.82, 2018: 6.15, 2020: 7.9, 2022: 8.8 },
    Bedford: { 2015: 4.31, 2017: 4.88, 2019: 5.3, 2021: 6.5 },
    Benton: { 2016: 5.11, 2018: 5.7, 2020: 6.9, 2022: 7.4 },
    Bledsoe: { 2017: 4.95, 2019: 5.5, 2021: 6.2, 2022: 6.8 },
    Bradley: { 2015: 5.2, 2017: 6.3, 2019: 7.1, 2021: 8.5, 2022: 9.3 },
    Cannon: { 2016: 4.05, 2018: 4.6, 2020: 5.8, 2022: 6.3 },
    Carroll: { 2017: 6.7, 2019: 7.4, 2021: 8.8, 2022: 9.1 },
    Carter: { 2015: 5.9, 2017: 6.8, 2019: 7.7, 2021: 9.2 },
    Cheatham: { 2016: 4.4, 2018: 5.0, 2020: 6.4, 2022: 7.1 },
    Chester: { 2017: 6.1, 2019: 6.9, 2021: 8.0, 2022: 8.6 },
    Clay: { 2015: 3.9, 2017: 4.45, 2019: 5.1, 2021: 5.9 },
    Cocke: { 2016: 6.6, 2018: 7.2, 2020: 8.8, 2022: 9.7 },
    Crockett: { 2017: 5.75, 2019: 6.5, 2021: 7.6, 2022: 8.2 },
    Cumberland: { 2015: 5.4, 2017: 6.0, 2019: 6.8, 2021: 8.1 },
    Decatur: { 2016: 5.3, 2018: 5.9, 2020: 7.2, 2022: 7.9 },
    DeKalb: { 2017: 4.7, 2019: 5.4, 2021: 6.6, 2022: 7.3 },
    Dickson: { 2015: 4.6, 2017: 5.25, 2019: 6.0, 2021: 7.4 },
    Fayette: { 2016: 6.3, 2018: 7.0, 2020: 8.5, 2022: 9.4 },
    Fentress: { 2017: 5.0, 2019: 5.6, 2021: 6.7, 2022: 7.5 },
    Franklin: { 2015: 4.9, 2017: 5.55, 2019: 6.3, 2021: 7.7 },
    Gibson: { 2016: 7.2, 2018: 8.0, 2020: 9.8, 2022: 10.5 },
    Grainger: { 2017: 5.6, 2019: 6.4, 2021: 7.5, 2022: 8.3 },
    Greene: { 2015: 6.1, 2017: 7.0, 2019: 8.0, 2021: 9.5 },
    Grundy: { 2016: 5.5, 2018: 6.2, 2020: 7.6, 2022: 8.4 },
    Hamblen: { 2017: 6.0, 2019: 6.8, 2021: 8.2, 2022: 9.0 },
    Hamilton: { 2015: 6.9, 2017: 7.8, 2019: 8.9, 2021: 10.8, 2022: 12.1 },
    Hancock: { 2016: 4.2, 2018: 4.8, 2020: 5.9, 2022: 6.5 },
    Hardeman: { 2017: 7.0, 2019: 7.9, 2021: 9.3, 2022: 10.0 },
    Hardin: { 2015: 5.7, 2017: 6.5, 2019: 7.3, 2021: 8.7 },
    Hawkins: { 2016: 5.35, 2018: 6.0, 2020: 7.4, 2022: 8.2 },
    Haywood: { 2017: 6.8, 2019: 7.6, 2021: 9.0, 2022: 9.8 },
    Henderson: { 2015: 6.2, 2017: 7.1, 2019: 8.1, 2021: 9.6 },
    Hickman: { 2016: 4.55, 2018: 5.15, 2020: 6.5, 2022: 7.2 },
    Houston: { 2017: 4.1, 2019: 4.7, 2021: 5.7, 2022: 6.4 },
    Humphreys: { 2015: 4.8, 2017: 5.45, 2019: 6.2, 2021: 7.6 },
    Jackson: { 2016: 4.35, 2018: 4.95, 2020: 6.1, 2022: 6.7 },
    Johnson: { 2017: 5.8, 2019: 6.6, 2021: 7.9, 2022: 8.7 },
    Lake: { 2015: 7.4, 2017: 8.3, 2019: 9.5, 2021: 11.0 },
    Lauderdale: { 2016: 7.1, 2018: 7.9, 2020: 9.4, 2022: 10.2 },
    Lawrence: { 2017: 5.1, 2019: 5.8, 2021: 7.0, 2022: 7.8 },
    Lewis: { 2015: 4.0, 2017: 4.6, 2019: 5.2, 2021: 6.1 },
    Lincoln: { 2016: 4.75, 2018: 5.4, 2020: 6.7, 2022: 7.4 },
    Madison: { 2017: 7.3, 2019: 8.2, 2021: 9.9, 2022: 10.8 },
    Marion: { 2015: 5.65, 2017: 6.4, 2019: 7.2, 2021: 8.6 },
    Maury: { 2016: 5.05, 2018: 5.7, 2020: 7.0, 2022: 7.9 },
    McMinn: { 2017: 6.4, 2019: 7.3, 2021: 8.8, 2022: 9.6 },
    McNairy: { 2015: 6.5, 2017: 7.4, 2019: 8.4, 2021: 10.0 },
    Meigs: { 2016: 5.25, 2018: 5.9, 2020: 7.1, 2022: 7.8 },
    Montgomery: { 2017: 6.7, 2019: 7.6, 2021: 9.1, 2022: 10.1 },
    Moore: { 2015: 3.8, 2017: 4.3, 2019: 4.9, 2021: 5.6 },
    Morgan: { 2016: 5.45, 2018: 6.1, 2020: 7.5, 2022: 8.3 },
    Overton: { 2017: 4.85, 2019: 5.5, 2021: 6.5, 2022: 7.2 },
    Perry: { 2015: 4.25, 2017: 4.8, 2019: 5.4, 2021: 6.3 },
    Pickett: { 2016: 4.15, 2018: 4.7, 2020: 5.8, 2022: 6.4 },
    Putnam: { 2017: 5.95, 2019: 6.7, 2021: 8.0, 2022: 8.9 },
    Rhea: { 2015: 5.55, 2017: 6.3, 2019: 7.1, 2021: 8.4 },
    Roane: { 2016: 5.7, 2018: 6.4, 2020: 7.8, 2022: 8.6 },
    Robertson: { 2017: 5.3, 2019: 6.0, 2021: 7.3, 2022: 8.1 },
    Rutherford: { 2015: 5.0, 2017: 5.8, 2019: 6.7, 2021: 8.3, 2022: 9.2 },
    Scott: { 2016: 5.15, 2018: 5.8, 2020: 7.0, 2022: 7.7 },
    Sequatchie: { 2017: 4.65, 2019: 5.3, 2021: 6.4, 2022: 7.0 },
    Sevier: { 2015: 6.8, 2017: 7.7, 2019: 8.8, 2021: 10.5, 2022: 11.8 },
    Smith: { 2016: 4.45, 2018: 5.05, 2020: 6.3, 2022: 6.9 },
    Stewart: { 2017: 4.5, 2019: 5.1, 2021: 6.0, 2022: 6.6 },
    Sullivan: { 2015: 6.25, 2017: 7.15, 2019: 8.2, 2021: 9.7, 2022: 10.6 },
    Tipton: { 2016: 6.95, 2018: 7.8, 2020: 9.2, 2022: 10.0 },
    Trousdale: { 2017: 4.0, 2019: 4.5, 2021: 5.3, 2022: 5.9 },
    Unicoi: { 2015: 5.75, 2017: 6.6, 2019: 7.5, 2021: 8.9 },
    Union: { 2016: 5.0, 2018: 5.65, 2020: 6.9, 2022: 7.6 },
    'Van Buren': { 2017: 4.3, 2019: 4.9, 2021: 5.8, 2022: 6.4 },
    Warren: { 2015: 5.15, 2017: 5.9, 2019: 6.8, 2021: 8.1 },
    Washington: { 2016: 6.05, 2018: 6.9, 2020: 8.4, 2022: 9.4 },
    Wayne: { 2017: 5.35, 2019: 6.1, 2021: 7.2, 2022: 7.9 },
    Weakley: { 2015: 6.65, 2017: 7.5, 2019: 8.6, 2021: 10.2 },
    White: { 2016: 4.9, 2018: 5.55, 2020: 6.8, 2022: 7.5 },
    Wilson: { 2017: 5.4, 2019: 6.2, 2021: 7.7, 2022: 8.5 },
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.createForm();
    this.setupSearch();
    // Optionally select a default county on load
    // this.selectCounty('Shelby'); // Example: Load Shelby data initially
  }

  createForm(): void {
    this.predictionForm = this.fb.group({
      // Initialize county as null or with a default value, mark as required
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
    this.filteredCounties = []; // Hide dropdown
    this.onSubmit(); // Trigger data update immediately
  }

  onSubmit(): void {
    if (this.predictionForm.invalid) {
      console.error('Form is invalid or no county selected');
      this.selectedCounty = null; // Ensure no data is shown if invalid
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
      this.generateWeatherData(); // Generate new weather data for context
    } else {
      console.error('Invalid county selected:', selected);
      this.selectedCounty = null; // Reset if invalid
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
        .sort((a, b) => a.year - b.year); // Sort by year

      if (this.selectedCountyData.length > 0) {
        this.latestScore =
          this.selectedCountyData[this.selectedCountyData.length - 1].score;
      } else {
        this.latestScore = 0;
      }
      this.generateCountyInsight();
    } else {
      // Fallback if data is somehow missing despite being in the list
      console.warn(
        `No data found for ${this.selectedCounty}, though it should exist.`,
      );
      this.latestScore = 0;
      this.countyInsight = `Historical outage data for ${this.selectedCounty} County is currently unavailable. Monitoring general state trends is advised.`;
      this.recommendations = [
        'Monitor local weather alerts.',
        'Ensure basic emergency supplies are ready.',
      ];
    }
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

  generateWeatherData(): void {
    // Simulate weather data - replace with actual API call
    this.currentWeather = {
      temperature: Math.floor(Math.random() * 30) + 55, // 55-84 F
      windSpeed: Math.floor(Math.random() * 25) + 5, // 5-29 mph
      precipitation:
        Math.random() > 0.7 ? parseFloat((Math.random() * 0.5).toFixed(2)) : 0, // 30% chance of 0-0.5 units (e.g., inches)
    };
    this.generateWeatherAlert();
  }

  generateWeatherAlert(): void {
    this.weatherAlert = null;
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
    // Add more sophisticated conditions as needed
  }

  generateRecommendations(riskLevel: string): void {
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
