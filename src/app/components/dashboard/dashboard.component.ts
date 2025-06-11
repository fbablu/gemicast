// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

interface IndustryConfig {
  id: string;
  name: string;
  primaryTabs: string[];
  keyMetrics: Array<{
    id: string;
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    critical: boolean;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    icon: string;
    color: string;
  }>;
}

interface Tab {
  id: string;
  name: string;
  icon: string;
  description: string;
  alertCount: number;
  industryRelevance: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  activeTab = 'outages';
  sidebarCollapsed = false;
  userIndustry = '';
  userProfile: any = {};
  unreadNotifications = 3;

  industryConfigs: IndustryConfig[] = [
    {
      id: 'construction',
      name: 'Construction',
      primaryTabs: ['outages', 'predict', 'map', 'profile'],
      keyMetrics: [
        {
          id: 'active-sites',
          label: 'Active Sites',
          value: '8',
          trend: 'stable',
          critical: false,
        },
        {
          id: 'risk-sites',
          label: 'High Risk Sites',
          value: '2',
          trend: 'up',
          critical: true,
        },
        {
          id: 'downtime-cost',
          label: 'Potential Daily Loss',
          value: '$48K',
          trend: 'up',
          critical: true,
        },
        {
          id: 'weather-score',
          label: 'Weather Risk Score',
          value: '7.2/10',
          trend: 'up',
          critical: false,
        },
      ],
      quickActions: [
        {
          id: 'stage-generators',
          label: 'Stage Generators',
          icon: 'electrical_services',
          color: '#f59e0b',
        },
        {
          id: 'adjust-schedule',
          label: 'Adjust Schedule',
          icon: 'schedule',
          color: '#3b82f6',
        },
        {
          id: 'safety-alert',
          label: 'Safety Alert',
          icon: 'warning',
          color: '#ef4444',
        },
        {
          id: 'team-notify',
          label: 'Notify Teams',
          icon: 'group',
          color: '#10b981',
        },
      ],
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      primaryTabs: ['outages', 'predict', 'map', 'profile'],
      keyMetrics: [
        {
          id: 'facilities',
          label: 'Facilities Monitored',
          value: '4',
          trend: 'stable',
          critical: false,
        },
        {
          id: 'critical-patients',
          label: 'Critical Care Patients',
          value: '23',
          trend: 'stable',
          critical: false,
        },
        {
          id: 'backup-power',
          label: 'Backup Power Status',
          value: '96%',
          trend: 'stable',
          critical: false,
        },
        {
          id: 'risk-level',
          label: 'Facility Risk Level',
          value: 'Medium',
          trend: 'up',
          critical: true,
        },
      ],
      quickActions: [
        {
          id: 'test-generators',
          label: 'Test Generators',
          icon: 'power',
          color: '#f59e0b',
        },
        {
          id: 'patient-prep',
          label: 'Patient Prep',
          icon: 'local_hospital',
          color: '#ef4444',
        },
        {
          id: 'staff-alert',
          label: 'Staff Alert',
          icon: 'medical_services',
          color: '#3b82f6',
        },
        {
          id: 'emergency-plan',
          label: 'Emergency Plan',
          icon: 'emergency',
          color: '#dc2626',
        },
      ],
    },
    {
      id: 'data-centers',
      name: 'Data Centers',
      primaryTabs: ['outages', 'predict', 'map', 'profile'],
      keyMetrics: [
        {
          id: 'uptime',
          label: 'Current Uptime',
          value: '99.97%',
          trend: 'stable',
          critical: false,
        },
        {
          id: 'cooling-status',
          label: 'Cooling Systems',
          value: 'Optimal',
          trend: 'stable',
          critical: false,
        },
        {
          id: 'power-usage',
          label: 'Power Usage (PUE)',
          value: '1.42',
          trend: 'down',
          critical: false,
        },
        {
          id: 'outage-risk',
          label: 'Outage Risk (24h)',
          value: 'High',
          trend: 'up',
          critical: true,
        },
      ],
      quickActions: [
        {
          id: 'migrate-workloads',
          label: 'Migrate Workloads',
          icon: 'cloud_sync',
          color: '#3b82f6',
        },
        {
          id: 'cooling-check',
          label: 'Cooling Check',
          icon: 'ac_unit',
          color: '#06b6d4',
        },
        {
          id: 'ups-status',
          label: 'UPS Status',
          icon: 'battery_charging_full',
          color: '#10b981',
        },
        {
          id: 'incident-prep',
          label: 'Incident Prep',
          icon: 'report_problem',
          color: '#f59e0b',
        },
      ],
    },
  ];

  baseTabs: Tab[] = [
    {
      id: 'map',
      name: 'Risk Map',
      icon: 'map',
      description: 'Geographic risk visualization',
      alertCount: 0,
      industryRelevance: ['all'],
    },
    {
      id: 'outages',
      name: 'Outage Monitor',
      icon: 'warning',
      description: 'Current and predicted outages',
      alertCount: 2,
      industryRelevance: ['all'],
    },
    {
      id: 'predict',
      name: 'AI Insights',
      icon: 'psychology',
      description: 'AI-powered predictions & assistant',
      alertCount: 1,
      industryRelevance: ['all'],
    },
    {
      id: 'profile',
      name: 'Organization',
      icon: 'business',
      description: 'Team & settings management',
      alertCount: 0,
      industryRelevance: ['all'],
    },
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.updateAlertCounts();
    this.setDefaultActiveTab();
  }

  loadUserProfile(): void {
    const profile = localStorage.getItem('gemicast-user-profile');
    if (profile) {
      this.userProfile = JSON.parse(profile);
      this.userIndustry = this.userProfile.industry;
    }
  }

  updateAlertCounts(): void {
    // Industry-specific alert simulation
    const industryConfig = this.getCurrentIndustryConfig();
    const criticalMetrics = industryConfig.keyMetrics.filter(
      (m) => m.critical,
    ).length;

    if (criticalMetrics > 0) {
      this.baseTabs.find((t) => t.id === 'outages')!.alertCount =
        criticalMetrics;
      this.baseTabs.find((t) => t.id === 'predict')!.alertCount = Math.ceil(
        criticalMetrics / 2,
      );
    }
  }

  setDefaultActiveTab(): void {
    const industryConfig = this.getCurrentIndustryConfig();
    if (industryConfig.primaryTabs.length > 0) {
      this.activeTab = industryConfig.primaryTabs[0];
    }
  }

  getCurrentIndustryConfig(): IndustryConfig {
    return (
      this.industryConfigs.find((c) => c.id === this.userIndustry) || {
        id: 'default',
        name: 'Multi-Industry',
        primaryTabs: ['outages', 'predict', 'map', 'profile'],
        keyMetrics: [
          {
            id: 'total-alerts',
            label: 'Active Alerts',
            value: '3',
            trend: 'stable',
            critical: false,
          },
          {
            id: 'risk-score',
            label: 'Risk Score',
            value: '6.8/10',
            trend: 'up',
            critical: false,
          },
          {
            id: 'facilities',
            label: 'Monitored Locations',
            value: '12',
            trend: 'stable',
            critical: false,
          },
          {
            id: 'uptime',
            label: 'Overall Uptime',
            value: '99.2%',
            trend: 'stable',
            critical: false,
          },
        ],
        quickActions: [
          {
            id: 'view-alerts',
            label: 'View Alerts',
            icon: 'notification_important',
            color: '#ef4444',
          },
          {
            id: 'generate-report',
            label: 'Generate Report',
            icon: 'assessment',
            color: '#3b82f6',
          },
          {
            id: 'contact-support',
            label: 'Contact Support',
            icon: 'support_agent',
            color: '#10b981',
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: 'settings',
            color: '#6b7280',
          },
        ],
      }
    );
  }

  getFilteredTabs(): Tab[] {
    const industryConfig = this.getCurrentIndustryConfig();
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
    return this.getCurrentIndustryConfig().name;
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getActiveTabName(): string {
    const tab = this.baseTabs.find((t) => t.id === this.activeTab);
    return tab ? tab.name : '';
  }

  getActiveTabIcon(): string {
    const tab = this.baseTabs.find((t) => t.id === this.activeTab);
    return tab ? tab.icon : 'dashboard';
  }

  getTabDescription(tabId: string): string {
    const tab = this.baseTabs.find((t) => t.id === tabId);
    const industryConfig = this.getCurrentIndustryConfig();

    if (tab) {
      return `${tab.description} - Optimized for ${industryConfig.name} operations`;
    }
    return '';
  }

  getTotalAlerts(): number {
    return this.baseTabs.reduce((total, tab) => total + tab.alertCount, 0);
  }

  getCurrentWeather(): string {
    // Simulated weather data
    const conditions = [
      'Sunny',
      'Partly Cloudy',
      'Thunderstorms',
      'Clear',
      'Overcast',
    ];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      case 'stable':
        return 'trending_flat';
      default:
        return 'trending_flat';
    }
  }

  hasCriticalMetrics(): boolean {
    return this.getCurrentIndustryConfig().keyMetrics.some(
      (metric) => metric.critical,
    );
  }
}
