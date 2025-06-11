// src/app/components/dashboard/dashboard.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { OutagesComponent } from '../outages/outages.component';
import { PredictComponent } from '../predict/predict.component';
import { HomeComponent } from '../home/home.component';
import { MapComponent } from '../map/map.component';
import { ProfileComponent } from '../profile/profile.component';

interface Tab {
  id: string;
  name: string;
  icon: string;
  description: string;
  industryRelevance: string[];
  alertCount?: number;
}

interface IndustryConfig {
  id: string;
  name: string;
  primaryTabs: string[];
  dashboardMetrics: string[];
  alertThresholds: {
    high: number;
    medium: number;
  };
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule,
    OutagesComponent,
    PredictComponent,
    HomeComponent,
    MapComponent,
    ProfileComponent,
  ],
  standalone: true,
})
export class DashboardComponent implements OnInit {
  activeTab: string = 'home';
  userIndustry: string = '';
  userProfile: any = null;
  sidebarCollapsed = false;

  industryConfigs: IndustryConfig[] = [
    {
      id: 'data-centers',
      name: 'Data Centers',
      primaryTabs: ['outages', 'predict', 'map'],
      dashboardMetrics: ['uptime', 'workload_distribution', 'cooling_status'],
      alertThresholds: { high: 85, medium: 60 },
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      primaryTabs: ['outages', 'predict', 'profile'],
      dashboardMetrics: ['facility_status', 'cold_chain', 'emergency_power'],
      alertThresholds: { high: 70, medium: 40 },
    },
    {
      id: 'construction',
      name: 'Construction',
      primaryTabs: ['predict', 'map', 'outages'],
      dashboardMetrics: ['site_weather', 'equipment_status', 'schedule_risk'],
      alertThresholds: { high: 75, medium: 50 },
    },
  ];

  baseTabs: Tab[] = [
    {
      id: 'home',
      name: 'Overview',
      icon: 'dashboard',
      description: 'Industry-specific insights',
      industryRelevance: ['all'],
    },
    {
      id: 'map',
      name: 'Risk Map',
      icon: 'map',
      description: 'Geographic outage visualization',
      industryRelevance: ['construction', 'utilities', 'telecommunications'],
      alertCount: 0,
    },
    {
      id: 'outages',
      name: 'Outage Risk',
      icon: 'warning',
      description: 'County-specific assessments',
      industryRelevance: ['data-centers', 'healthcare', 'manufacturing'],
      alertCount: 0,
    },
    {
      id: 'predict',
      name: 'AI Planning',
      icon: 'auto_awesome',
      description: 'Predictive scheduling assistant',
      industryRelevance: ['construction', 'manufacturing', 'events'],
      alertCount: 0,
    },
    {
      id: 'profile',
      name: 'Organization',
      icon: 'group',
      description: 'Team & notification management',
      industryRelevance: ['all'],
    },
  ];

  get filteredTabs(): Tab[] {
    if (!this.userIndustry) return this.baseTabs;

    const industryConfig = this.industryConfigs.find(
      (c) => c.id === this.userIndustry,
    );
    if (!industryConfig) return this.baseTabs;

    // Reorder tabs based on industry priority
    const prioritizedTabs = [...this.baseTabs];
    prioritizedTabs.sort((a, b) => {
      const aPriority = industryConfig.primaryTabs.indexOf(a.id);
      const bPriority = industryConfig.primaryTabs.indexOf(b.id);

      if (aPriority === -1 && bPriority === -1) return 0;
      if (aPriority === -1) return 1;
      if (bPriority === -1) return -1;
      return aPriority - bPriority;
    });

    return prioritizedTabs;
  }

  get industryName(): string {
    const config = this.industryConfigs.find((c) => c.id === this.userIndustry);
    return config ? config.name : 'Multi-Industry';
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.updateAlertCounts();

    // Set default active tab based on industry
    if (this.userIndustry) {
      const industryConfig = this.industryConfigs.find(
        (c) => c.id === this.userIndustry,
      );
      if (industryConfig && industryConfig.primaryTabs.length > 0) {
        this.activeTab = industryConfig.primaryTabs[0];
      }
    }
  }

  loadUserProfile(): void {
    const profile = localStorage.getItem('gemicast-user-profile');
    if (profile) {
      this.userProfile = JSON.parse(profile);
      this.userIndustry = this.userProfile.industry;
    }
  }

  updateAlertCounts(): void {
    // Simulate alert counts based on industry
    if (this.userIndustry === 'data-centers') {
      this.baseTabs.find((t) => t.id === 'outages')!.alertCount = 3;
      this.baseTabs.find((t) => t.id === 'predict')!.alertCount = 1;
    } else if (this.userIndustry === 'healthcare') {
      this.baseTabs.find((t) => t.id === 'outages')!.alertCount = 2;
      this.baseTabs.find((t) => t.id === 'map')!.alertCount = 1;
    }
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  getActiveTabName(): string {
    const tab = this.baseTabs.find((tab) => tab.id === this.activeTab);
    return tab ? tab.name : '';
  }

  getTabDescription(tabId: string): string {
    const tab = this.baseTabs.find((tab) => tab.id === tabId);
    return tab ? tab.description : '';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getIndustrySpecificMetrics(): any[] {
    const config = this.industryConfigs.find((c) => c.id === this.userIndustry);
    if (!config) return [];

    // Return mock metrics based on industry
    const metricsMap: { [key: string]: any } = {
      uptime: { label: 'System Uptime', value: '99.97%', status: 'good' },
      workload_distribution: {
        label: 'Workload Balance',
        value: '78%',
        status: 'warning',
      },
      cooling_status: {
        label: 'Cooling Efficiency',
        value: '92%',
        status: 'good',
      },
      facility_status: {
        label: 'Facility Status',
        value: 'Operational',
        status: 'good',
      },
      cold_chain: {
        label: 'Cold Chain Integrity',
        value: '98%',
        status: 'good',
      },
      emergency_power: {
        label: 'Backup Power',
        value: 'Ready',
        status: 'good',
      },
      site_weather: {
        label: 'Site Weather Risk',
        value: 'Medium',
        status: 'warning',
      },
      equipment_status: {
        label: 'Equipment Health',
        value: '94%',
        status: 'good',
      },
      schedule_risk: { label: 'Schedule Risk', value: 'Low', status: 'good' },
    };

    return config.dashboardMetrics
      .map((metric) => metricsMap[metric])
      .filter(Boolean);
  }
}
