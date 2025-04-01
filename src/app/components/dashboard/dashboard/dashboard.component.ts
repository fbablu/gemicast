// src/app/components/dashboard/dashboard.component.ts
// Main dashboard controller managing tab navigation and display

import { Component } from '@angular/core';

interface Tab {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  activeTab: string = 'home';
  
  tabs: Tab[] = [
    { id: 'home', name: 'Home', icon: 'home' },
    { id: 'map', name: 'Map', icon: 'map' },
    { id: 'outages', name: 'Outages', icon: 'warning' },
    { id: 'predict', name: 'Predict', icon: 'auto_awesome' }
  ];
  
  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }
  
  getActiveTabName(): string {
    return this.tabs.find(tab => tab.id === this.activeTab)?.name || '';
  }
}