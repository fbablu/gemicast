// src/app/components/predict/predict.component.ts
// AI-powered prediction component for weather and outage forecasting

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

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

  constructor() {}

  ngOnInit(): void {}

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

    // Simulate API call
    setTimeout(() => {
      try {
        const responseContent = this.generateResponse(
          this.currentAction,
          userMessage.content,
        );
        const assistantMessage: Message = {
          id: Math.random().toString(36).substring(2, 11),
          content: responseContent,
          role: 'assistant',
          timestamp: new Date(),
        };

        // Add assistant message to chat
        this.messages = [...this.messages, assistantMessage];

        // Reset current action
        this.currentAction = null;
      } catch (error) {
        console.error('Error generating response:', error);
      } finally {
        this.isLoading = false;
        this.scrollToBottom();
      }
    }, 1500);
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

  generateResponse(action: ActionType | null, userInput: string): string {
    // Call the Gemini API with the selected model
    const modelInfo = `Using Gemini ${this.getSelectedModelName()} to analyze your request.`;

    switch (action) {
      case 'calendar':
        return `${modelInfo}\n\nI'd be happy to analyze your Google Calendar events. To connect your Google Calendar, please authorize access using the button below:\n\n[Connect Google Calendar]\n\nOnce connected, I'll analyze your upcoming events for potential weather issues and outage risks.`;

      case 'schedule':
        return `${modelInfo}\n\nGreat! Please paste your schedule below, and I'll analyze it for weather and outage risks. Include dates, times, and locations if possible for more accurate predictions.`;

      case 'event':
        return `${modelInfo}\n\nI'd be happy to help you plan your event. Could you provide me with the following details?\n\n1. Event date and time\n2. Location\n3. Type of event (indoor/outdoor)\n4. Expected duration\n\nWith this information, I can assess weather conditions and potential outage risks for your event.`;

      case 'question':
        return `${modelInfo}\n\nI'm here to answer your questions about weather conditions and potential outages. What specific information are you looking for? You can ask about:\n\n- Weather forecasts for specific dates\n- Historical outage patterns in your area\n- Recommendations for scheduling important events\n- Preparation tips for potential weather disruptions`;

      default:
        if (userInput.toLowerCase().includes('weather')) {
          return `${modelInfo}\n\nBased on the forecast data, there's a 30% chance of rain tomorrow with potential for minor power fluctuations. If you have outdoor events planned, consider having a backup indoor location.`;
        } else if (userInput.toLowerCase().includes('outage')) {
          return `${modelInfo}\n\nI've analyzed the historical outage data for your area. There's a heightened risk of power outages next Tuesday due to scheduled maintenance and predicted thunderstorms. Consider rescheduling any critical events.`;
        } else if (userInput.toLowerCase().includes('calendar')) {
          return `${modelInfo}\n\nI can help you analyze your Google Calendar events for weather and outage risks. Would you like to connect your Google Calendar now?`;
        } else if (
          userInput.toLowerCase().includes('schedule') ||
          userInput.toLowerCase().includes('event')
        ) {
          return `${modelInfo}\n\nI'd be happy to analyze your schedule for potential weather or outage risks. You can share specific dates and locations, and I'll provide insights on potential disruptions.`;
        } else {
          return `${modelInfo}\n\nI'm your AI assistant for predicting weather and outage impacts on your events. I can help you plan around potential disruptions by analyzing your schedule or specific events. What would you like to know?`;
        }
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

  handleCalendarSync(): void {
    if (this.isCalendarSynced) {
      this.isCalendarSynced = false;
      return;
    }
    this.isCalendarSyncing = true;
    // Simulate API call to sync calendar
    setTimeout(() => {
      try {
        this.isCalendarSynced = true;
        const syncMessage: Message = {
          id: Math.random().toString(36).substring(2, 11),
          content:
            'Your Google Calendar has been successfully connected. I can now analyze your events for weather and outage risks.',
          role: 'assistant',
          timestamp: new Date(),
        };

        this.messages = [...this.messages, syncMessage];
        this.scrollToBottom();
      } catch (error) {
        console.error('Error syncing calendar:', error);
      } finally {
        this.isCalendarSyncing = false;
      }
    }, 2000);
  }

  handleWeatherRefresh(): void {
    this.isWeatherRefreshing = true;

    // Simulate API call to refresh weather data
    setTimeout(() => {
      try {
        const refreshMessage: Message = {
          id: Math.random().toString(36).substring(2, 11),
          content:
            "I've refreshed the weather data. The latest forecast shows a 20% chance of precipitation tomorrow with mild temperatures. No significant outage risks detected for the next 48 hours.",
          role: 'assistant',
          timestamp: new Date(),
        };

        this.messages = [...this.messages, refreshMessage];
        this.scrollToBottom();
      } catch (error) {
        console.error('Error refreshing weather data:', error);
      } finally {
        this.isWeatherRefreshing = false;
      }
    }, 2000);
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
