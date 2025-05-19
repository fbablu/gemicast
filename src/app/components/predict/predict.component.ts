// src/app/components/predict/predict.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  PredictionService,
  WeatherData,
  PredictionResult,
} from '../../services/prediction.service';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

type ActionType = 'calendar' | 'schedule' | 'event' | 'question' | null;
type ModelType = '2.5-pro' | '2.0-flash' | '2.0-flash-lite';

interface ModelOption {
  id: ModelType;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-predict',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './predict.component.html',
  styleUrls: ['./predict.component.css'],
})
export class PredictComponent implements OnInit {
  messages: Message[] = [];
  input = '';
  isLoading = false;
  currentAction: ActionType = null;
  isCalendarSynced = false;
  isCalendarSyncing = false;
  isWeatherRefreshing = false;
  selectedModel: ModelType = '2.0-flash';

  // Current weather data
  currentWeather: WeatherData | null = null;
  // Counties in Tennessee
  counties: string[] = [
    'Davidson',
    'Shelby',
    'Knox',
    'Hamilton',
    'Rutherford',
    'Williamson',
    'Sumner',
    'Montgomery',
    'Wilson',
    'Blount',
    'Anderson',
    'Bedford',
  ];
  // Selected county for predictions
  selectedCounty: string = 'Davidson';
  // Latest prediction result
  lastPrediction: PredictionResult | null = null;
  // Last updated timestamp
  lastUpdated: string = '';

  modelOptions: ModelOption[] = [
    {
      id: '2.5-pro',
      name: '2.5 Pro',
      icon: 'science',
      description:
        'Our most powerful thinking model with features for complex reasoning and much more',
    },
    {
      id: '2.0-flash',
      name: '2.0 Flash',
      icon: 'auto_awesome',
      description:
        'Our newest multimodal model, with next generation features and improved capabilities',
    },
    {
      id: '2.0-flash-lite',
      name: '2.0 Flash-Lite',
      icon: 'bolt',
      description:
        'Our fastest and most cost-efficient multimodal model with great performance for high-frequency tasks',
    },
  ];

  constructor(private predictionService: PredictionService) {}

  ngOnInit(): void {
    // Fetch weather for default county
    this.fetchWeatherData('Davidson');
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  handleSend(): void {
    if (!this.input.trim() && !this.currentAction) return;

    const id = Math.random().toString(36).substring(2, 11);

    const userMessage: Message = {
      id,
      content: this.input || this.getDefaultPromptForAction(this.currentAction),
      role: 'user',
      timestamp: new Date(),
    };

    this.messages = [...this.messages, userMessage];

    this.input = '';
    this.isLoading = true;

    setTimeout(() => {
      const inputElement = document.querySelector(
        'input[type="text"]',
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);

    // Process the message
    this.processUserMessage(userMessage);
  }

  processUserMessage(message: Message): void {
    // If we have a current action, handle it
    if (this.currentAction) {
      switch (this.currentAction) {
        case 'calendar':
          this.handleCalendarSync();
          return;
        case 'event':
          this.handleEventPlanning(message.content);
          return;
        case 'question':
          this.handleWeatherQuestion(message.content);
          return;
        case 'schedule':
          this.handleScheduleAnalysis(message.content);
          return;
      }
    }

    // No specific action, analyze the message
    const content = message.content.toLowerCase();

    if (content.includes('weather') || content.includes('forecast')) {
      this.handleWeatherQuestion(message.content);
    } else if (content.includes('outage') || content.includes('power')) {
      this.handleOutageQuestion(message.content);
    } else if (content.includes('calendar') || content.includes('sync')) {
      this.handleCalendarQuestion(message.content);
    } else if (content.includes('event') || content.includes('plan')) {
      this.handleEventPlanning(message.content);
    } else {
      // Generic response
      this.sendAssistantResponse(
        "I'm here to help with weather and power outage predictions. You can ask about current weather, outage risks, or plan events around potential outages. How can I assist you today?",
      );
    }
  }

  fetchWeatherData(county: string): void {
    this.isWeatherRefreshing = true;

    this.predictionService.getCurrentWeather(county).subscribe({
      next: (data) => {
        this.currentWeather = data;
        this.selectedCounty = county;
        this.isWeatherRefreshing = false;
        this.lastUpdated = data.lastUpdated || new Date().toISOString();

        // Make a prediction based on the new weather data
        this.makePrediction(data);
      },
      error: (err) => {
        console.error('Error fetching weather:', err);
        this.isWeatherRefreshing = false;
        this.sendAssistantResponse(
          "I couldn't fetch the latest weather data. Please try again later.",
        );
      },
    });
  }

  makePrediction(weatherData: WeatherData): void {
    this.predictionService.predict(weatherData).subscribe({
      next: (result) => {
        this.lastPrediction = result;
        this.lastUpdated = result.lastUpdated || this.lastUpdated;

        // If this was triggered by a user action, send a response
        if (this.isLoading) {
          const response = this.formatPredictionResponse(result, weatherData);
          this.sendAssistantResponse(response);
        }
      },
      error: (err) => {
        console.error('Prediction error:', err);
        if (this.isLoading) {
          this.sendAssistantResponse(
            "I'm having trouble making a prediction right now. Please try again later.",
          );
        }
      },
    });
  }

  formatPredictionResponse(
    prediction: PredictionResult,
    weather: WeatherData,
  ): string {
    const county = weather.county || this.selectedCounty;
    const outageStatus = prediction.outage_likely ? 'HIGH RISK' : 'Low risk';
    const probability = Math.round(prediction.probability * 100);
    const formattedDate = this.formatDateTime(this.lastUpdated);

    let response = `**${county} County Power Outage Forecast**\n\n`;
    response += `Status: **${outageStatus}**\n`;
    response += `Probability: ${probability}%\n`;

    if (prediction.outage_likely) {
      response += `Estimated duration if outage occurs: ${prediction.estimated_duration.toFixed(1)} hours\n\n`;
    }

    response += `**Current Weather**\n`;
    response += `Temperature: ${weather.temperature}°F\n`;
    response += `Wind: ${weather.windSpeed} mph (gusts to ${weather.windGust} mph)\n`;
    response += `Humidity: ${weather.relativeHumidity}%\n`;
    response += `Precipitation chance: ${weather.precipitationChance}%\n`;

    if (weather.weatherDescription) {
      response += `Conditions: ${weather.weatherDescription}\n`;
    }

    response += `\n`;

    if (prediction.risk_factors.length > 0) {
      response += `**Risk Factors**\n`;
      prediction.risk_factors.forEach((factor) => {
        response += `- ${factor.factor}: ${factor.value} (${factor.severity} risk)\n`;
      });
      response += '\n';
    }

    response += `**Recommendation**\n${prediction.recommendation}\n\n`;

    response += `Last updated: ${formattedDate}`;

    return response;
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';

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

  handleWeatherQuestion(message: string): void {
    // Extract county from message if mentioned
    const countyMatch = this.counties.find((county) =>
      message.toLowerCase().includes(county.toLowerCase()),
    );

    const county = countyMatch || this.selectedCounty;

    // Fetch latest weather for the county
    this.fetchWeatherData(county);
  }

  handleOutageQuestion(message: string): void {
    // Extract county from message if mentioned
    const countyMatch = this.counties.find((county) =>
      message.toLowerCase().includes(county.toLowerCase()),
    );

    const county = countyMatch || this.selectedCounty;

    // Fetch latest weather and make prediction
    this.fetchWeatherData(county);
  }

  handleCalendarQuestion(message: string): void {
    if (this.isCalendarSynced) {
      this.sendAssistantResponse(
        "Your Google Calendar is already connected. I'll analyze your upcoming events for weather and outage risks. Would you like me to look at a specific date or event?",
      );
    } else {
      this.sendAssistantResponse(
        'I can help you analyze your Google Calendar events for weather and outage risks. Please click the calendar icon below to connect your calendar.',
      );
    }
  }

  handleEventPlanning(message: string): void {
    // Try to extract date information from the message
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/;
    const match = message.match(dateRegex);

    if (match) {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();

      const eventDate = new Date(year, month - 1, day);
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      // Generate a response based on our current weather/prediction
      if (this.currentWeather && this.lastPrediction) {
        const riskLevel = this.lastPrediction.outage_likely ? 'high' : 'low';
        const recommendation = this.lastPrediction.outage_likely
          ? 'It would be advisable to have backup plans in place for power disruptions.'
          : 'Power conditions should be stable for your event.';

        this.sendAssistantResponse(
          `I've analyzed the conditions for your event on ${formattedDate} in ${this.currentWeather.county} County.\n\n` +
            `Based on historical patterns and current forecasts, there is a ${riskLevel} risk of power outages during this time. ${recommendation}\n\n` +
            `Would you like specific recommendations for preparing for this event?`,
        );
      } else {
        this.sendAssistantResponse(
          `I'll analyze the conditions for your event on ${formattedDate}. ` +
            `Please select a county to get specific outage risk predictions.`,
        );
      }
    } else {
      this.sendAssistantResponse(
        "I'd be happy to help plan your event with power outage risks in mind. " +
          'Could you provide the date of your event (MM/DD/YYYY format) and location?',
      );
    }
  }

  handleScheduleAnalysis(message: string): void {
    // Try to extract multiple dates from the message
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/g;
    const matches = [...message.matchAll(dateRegex)];

    if (matches.length > 0) {
      let response = "I've analyzed your schedule for power outage risks:\n\n";

      matches.forEach((match, index) => {
        const month = parseInt(match[1]);
        const day = parseInt(match[2]);
        const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();

        const eventDate = new Date(year, month - 1, day);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });

        // Generate random risk level for each date (in a real app, this would be based on predictions)
        const riskLevel =
          Math.random() > 0.7
            ? 'High'
            : Math.random() > 0.4
              ? 'Moderate'
              : 'Low';
        const riskEmoji =
          riskLevel === 'High' ? '🔴' : riskLevel === 'Moderate' ? '🟠' : '🟢';

        response += `${riskEmoji} **${formattedDate}**: ${riskLevel} outage risk\n`;
      });

      response +=
        '\nWould you like detailed recommendations for any specific date?';

      this.sendAssistantResponse(response);
    } else {
      this.sendAssistantResponse(
        'I can analyze your schedule for outage risks. Please share your schedule with dates in MM/DD/YYYY format.',
      );
    }
  }

  handleCalendarSync(): void {
    if (this.isCalendarSynced) {
      this.isCalendarSynced = false;
      this.sendAssistantResponse('Your Google Calendar has been disconnected.');
      return;
    }

    this.isCalendarSyncing = true;

    // Simulate API call to sync calendar
    setTimeout(() => {
      try {
        this.isCalendarSynced = true;
        this.sendAssistantResponse(
          'Your Google Calendar has been successfully connected. I can now analyze your events for weather and outage risks.\n\n' +
            "I've found 3 upcoming events:\n" +
            '- Team Meeting (Tomorrow, 10:00 AM) - Low outage risk\n' +
            '- Client Presentation (Friday, 2:00 PM) - Moderate outage risk\n' +
            '- Workshop (Next Monday, 9:00 AM) - Low outage risk\n\n' +
            'Would you like more details on any of these events?',
        );
      } catch (error) {
        console.error('Error syncing calendar:', error);
        this.sendAssistantResponse(
          "Sorry, I couldn't connect to your Google Calendar. Please try again later.",
        );
      } finally {
        this.isCalendarSyncing = false;
      }
    }, 2000);
  }

  handleWeatherRefresh(): void {
    this.fetchWeatherData(this.selectedCounty);
    this.sendAssistantResponse(
      `Refreshing weather data for ${this.selectedCounty} County...`,
    );
  }

  sendAssistantResponse(content: string): void {
    const assistantMessage: Message = {
      id: Math.random().toString(36).substring(2, 11),
      content: content,
      role: 'assistant',
      timestamp: new Date(),
    };

    // Add assistant message to chat
    this.messages = [...this.messages, assistantMessage];
    this.isLoading = false;
    this.scrollToBottom();
  }

  getDefaultPromptForAction(action: ActionType): string {
    switch (action) {
      case 'calendar':
        return "I'd like to connect my Google Calendar to analyze my events for weather and outage risks.";
      case 'schedule':
        return 'I want to paste my schedule for analysis.';
      case 'event':
        return "I'm planning a new event and want to check if the date is suitable.";
      case 'question':
        return 'I have a question about weather and potential outages.';
      default:
        return '';
    }
  }

  handleActionClick(action: ActionType): void {
    this.currentAction = action;
    this.handleSend();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSend();
    }
  }

  handleModelChange(modelId: ModelType): void {
    this.selectedModel = modelId;
    const modelChangeMessage: Message = {
      id: Math.random().toString(36).substring(2, 11),
      content: `I've switched to Gemini ${this.getSelectedModelName()}. How can I assist you with weather and outage predictions?`,
      role: 'assistant',
      timestamp: new Date(),
    };

    this.messages = [...this.messages, modelChangeMessage];
    this.scrollToBottom();
  }

  getSelectedModelName(): string {
    const model = this.modelOptions.find((m) => m.id === this.selectedModel);
    return model ? model.name : '2.0 Flash';
  }

  getSelectedModelIcon(): string {
    const model = this.modelOptions.find((m) => m.id === this.selectedModel);
    return model ? model.icon : 'auto_awesome';
  }

  formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
