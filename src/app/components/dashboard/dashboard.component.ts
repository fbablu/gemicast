// src/app/components/dashboard/dashboard.component.ts
// Main dashboard controller managing tab navigation and display

import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { CommonEngine } from '@angular/ssr/node';
import { OutagesComponent } from '../outages/outages.component';
import { PredictComponent } from '../predict/predict.component';
import { HomeComponent } from '../home/home.component';
import { MapComponent } from '../map/map.component';
import { ProfileComponent } from '../profile/profile.component';

interface Tab {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [
    CommonModule,
    OutagesComponent,
    PredictComponent,
    HomeComponent,
    MapComponent,
    ProfileComponent,
  ],
  standalone: true,
})
export class DashboardComponent {
  activeTab: string = 'home';

  tabs: Tab[] = [
    { id: 'map', name: 'Map', icon: 'map' },
    { id: 'outages', name: 'Outages', icon: 'warning' },
    { id: 'predict', name: 'Predict', icon: 'auto_awesome' },
    { id: 'profile', name: 'Profile', icon: 'person' },
  ];

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  getActiveTabName(): string {
    return this.tabs.find((tab) => tab.id === this.activeTab)?.name || '';
  }
}
