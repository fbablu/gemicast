// src/app/components/onboarding/onboarding.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  priority: 'tier1' | 'tier2' | 'tier3';
  averageCost: string;
  useCases: string[];
}

interface UserProfile {
  industry: string;
  role: string;
  organizationSize: string;
  primaryConcerns: string[];
  notifications: {
    email: boolean;
    sms: boolean;
    slack: boolean;
  };
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatStepperModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6"
    >
      <div class="max-w-4xl w-full">
        <!-- Welcome Header -->
        <div class="text-center mb-8" *ngIf="currentStep === 0">
          <div
            class="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4"
          >
            <span class="material-icons text-white text-3xl">bolt</span>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Gemicast
          </h1>
          <p class="text-xl text-gray-600">
            AI-powered outage prediction for mission-critical operations
          </p>
        </div>

        <!-- Industry Selection -->
        <mat-card *ngIf="currentStep === 1" class="p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            What industry do you work in?
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              *ngFor="let industry of industries"
              class="industry-card p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg"
              [class.selected]="userProfile.industry === industry.id"
              [class.border-blue-500]="userProfile.industry === industry.id"
              [class.bg-blue-50]="userProfile.industry === industry.id"
              [class.border-gray-200]="userProfile.industry !== industry.id"
              (click)="selectIndustry(industry.id)"
            >
              <div class="flex items-center mb-3">
                <span
                  class="material-icons text-2xl mr-3"
                  [class.text-blue-600]="userProfile.industry === industry.id"
                >
                  {{ industry.icon }}
                </span>
                <h3 class="font-semibold text-lg">{{ industry.name }}</h3>
                <span
                  *ngIf="industry.priority === 'tier1'"
                  class="ml-auto px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                >
                  High Priority
                </span>
              </div>

              <p class="text-gray-600 text-sm mb-2">
                {{ industry.description }}
              </p>
              <p class="text-blue-600 font-medium text-sm">
                Avg. Outage Cost: {{ industry.averageCost }}
              </p>

              <!-- Use Cases Preview -->
              <div class="mt-3" *ngIf="userProfile.industry === industry.id">
                <p class="text-sm font-medium text-gray-700 mb-2">
                  Key Use Cases:
                </p>
                <ul class="text-xs text-gray-600 space-y-1">
                  <li
                    *ngFor="let useCase of industry.useCases"
                    class="flex items-center"
                  >
                    <span class="material-icons text-sm mr-1">check</span>
                    {{ useCase }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </mat-card>

        <!-- Role & Organization -->
        <mat-card *ngIf="currentStep === 2" class="p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            Tell us about your role
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Your Role</mat-label>
              <mat-select [(value)]="userProfile.role">
                <mat-option
                  *ngFor="let role of getRolesForIndustry()"
                  [value]="role.id"
                >
                  {{ role.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Organization Size</mat-label>
              <mat-select [(value)]="userProfile.organizationSize">
                <mat-option value="small">1-50 employees</mat-option>
                <mat-option value="medium">51-500 employees</mat-option>
                <mat-option value="large">500+ employees</mat-option>
                <mat-option value="enterprise">Enterprise (1000+)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Primary Concerns -->
          <div class="mt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              What are your primary outage concerns?
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label
                *ngFor="let concern of getConcernsForIndustry()"
                class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  [value]="concern.id"
                  (change)="toggleConcern(concern.id, $event)"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="ml-3 text-sm">{{ concern.name }}</span>
              </label>
            </div>
          </div>
        </mat-card>

        <!-- Notification Preferences -->
        <mat-card *ngIf="currentStep === 3" class="p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            How would you like to receive alerts?
          </h2>

          <div class="space-y-4">
            <div
              class="flex items-center justify-between p-4 border rounded-lg"
            >
              <div class="flex items-center">
                <span class="material-icons text-blue-600 mr-3">email</span>
                <div>
                  <h3 class="font-medium">Email Notifications</h3>
                  <p class="text-sm text-gray-600">
                    Detailed outage forecasts and reports
                  </p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="userProfile.notifications.email"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                ></div>
              </label>
            </div>

            <div
              class="flex items-center justify-between p-4 border rounded-lg"
            >
              <div class="flex items-center">
                <span class="material-icons text-green-600 mr-3">sms</span>
                <div>
                  <h3 class="font-medium">SMS Alerts</h3>
                  <p class="text-sm text-gray-600">
                    Critical outage warnings (recommended)
                  </p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="userProfile.notifications.sms"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                ></div>
              </label>
            </div>

            <div
              class="flex items-center justify-between p-4 border rounded-lg"
            >
              <div class="flex items-center">
                <span class="material-icons text-purple-600 mr-3">chat</span>
                <div>
                  <h3 class="font-medium">Slack Integration</h3>
                  <p class="text-sm text-gray-600">
                    Team notifications and collaboration
                  </p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="userProfile.notifications.slack"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                ></div>
              </label>
            </div>
          </div>
        </mat-card>

        <!-- Navigation -->
        <div class="flex justify-between mt-8">
          <button
            *ngIf="currentStep > 0"
            mat-button
            (click)="previousStep()"
            class="px-6 py-2"
          >
            <span class="material-icons mr-2">arrow_back</span>
            Back
          </button>

          <div class="flex-1"></div>

          <button
            *ngIf="currentStep === 0"
            mat-raised-button
            color="primary"
            (click)="nextStep()"
            class="px-8 py-3"
          >
            Get Started
            <span class="material-icons ml-2">arrow_forward</span>
          </button>

          <button
            *ngIf="currentStep > 0 && currentStep < 3"
            mat-raised-button
            color="primary"
            [disabled]="!canProceed()"
            (click)="nextStep()"
            class="px-6 py-2"
          >
            Continue
            <span class="material-icons ml-2">arrow_forward</span>
          </button>

          <button
            *ngIf="currentStep === 3"
            mat-raised-button
            color="primary"
            (click)="completeOnboarding()"
            class="px-8 py-3"
          >
            Complete Setup
            <span class="material-icons ml-2">check</span>
          </button>
        </div>

        <!-- Progress Indicator -->
        <div class="mt-8 flex justify-center" *ngIf="currentStep > 0">
          <div class="flex space-x-2">
            <div
              *ngFor="let step of [1, 2, 3]; let i = index"
              class="w-3 h-3 rounded-full"
              [class.bg-blue-600]="currentStep > i"
              [class.bg-blue-300]="currentStep === i + 1"
              [class.bg-gray-300]="currentStep < i + 1"
            ></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .industry-card:hover {
        transform: translateY(-2px);
      }

      .selected {
        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1);
      }
    `,
  ],
})
export class OnboardingComponent implements OnInit {
  currentStep = 0;

  userProfile: UserProfile = {
    industry: '',
    role: '',
    organizationSize: '',
    primaryConcerns: [],
    notifications: {
      email: true,
      sms: true,
      slack: false,
    },
  };

  industries: Industry[] = [
    {
      id: 'data-centers',
      name: 'Data Centers & IT',
      icon: 'dns',
      description: 'Cloud providers, colocation, enterprise IT',
      priority: 'tier1',
      averageCost: '$9K/minute',
      useCases: [
        'Workload migration',
        'SLA protection',
        'Generator management',
        'Cooling optimization',
      ],
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      icon: 'local_hospital',
      description: 'Hospitals, clinics, medical supply chains',
      priority: 'tier1',
      averageCost: '$60K/year',
      useCases: [
        'Life support systems',
        'Cold chain integrity',
        'Emergency preparedness',
        'Equipment protection',
      ],
    },
    {
      id: 'utilities',
      name: 'Utilities & Energy',
      icon: 'electrical_services',
      description: 'Power companies, grid operators',
      priority: 'tier1',
      averageCost: '$500K/event',
      useCases: [
        'Crew pre-positioning',
        'Vegetation management',
        'Grid resilience',
        'Customer communications',
      ],
    },
    {
      id: 'construction',
      name: 'Construction',
      icon: 'construction',
      description: 'Project management, site operations',
      priority: 'tier2',
      averageCost: '$15.52/kWh',
      useCases: [
        'Schedule optimization',
        'Equipment protection',
        'Site safety',
        'Timeline management',
      ],
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing',
      icon: 'precision_manufacturing',
      description: 'Industrial facilities, production lines',
      priority: 'tier2',
      averageCost: '$500K/hour',
      useCases: [
        'Production scheduling',
        'Equipment protection',
        'Supply chain coordination',
        'Quality control',
      ],
    },
    {
      id: 'financial',
      name: 'Financial Services',
      icon: 'account_balance',
      description: 'Banks, trading, payment processors',
      priority: 'tier2',
      averageCost: '$1M+/hour',
      useCases: [
        'Trading continuity',
        'Branch operations',
        'Data center failover',
        'Regulatory compliance',
      ],
    },
    {
      id: 'agriculture',
      name: 'Agriculture',
      icon: 'agriculture',
      description: 'Farms, livestock, irrigation systems',
      priority: 'tier3',
      averageCost: '$100K/event',
      useCases: [
        'Irrigation management',
        'Livestock protection',
        'Cold storage',
        'Feed systems',
      ],
    },
    {
      id: 'telecommunications',
      name: 'Telecommunications',
      icon: 'cell_tower',
      description: 'Network operators, cell towers',
      priority: 'tier3',
      averageCost: '$250K/event',
      useCases: [
        'Tower backup power',
        'Network resilience',
        'Emergency communications',
        'Coverage optimization',
      ],
    },
    {
      id: 'education',
      name: 'Education',
      icon: 'school',
      description: 'Schools, universities, research facilities',
      priority: 'tier3',
      averageCost: '$50K/day',
      useCases: [
        'Class continuity',
        'Research protection',
        'Campus safety',
        'Remote learning backup',
      ],
    },
  ];

  constructor(private router: Router) {}

  ngOnInit() {}

  selectIndustry(industryId: string) {
    this.userProfile.industry = industryId;
  }

  getRolesForIndustry() {
    const roleMap: { [key: string]: Array<{ id: string; name: string }> } = {
      'data-centers': [
        { id: 'facility-manager', name: 'Facility Manager' },
        { id: 'sre', name: 'Site Reliability Engineer' },
        { id: 'ops-manager', name: 'Operations Manager' },
        { id: 'cto', name: 'CTO/Technical Executive' },
      ],
      healthcare: [
        { id: 'facility-manager', name: 'Facility Manager' },
        { id: 'risk-manager', name: 'Risk Manager' },
        { id: 'supply-chain', name: 'Supply Chain Manager' },
        { id: 'administrator', name: 'Healthcare Administrator' },
      ],
      utilities: [
        { id: 'grid-operator', name: 'Grid Operator' },
        { id: 'outage-manager', name: 'Outage Management' },
        { id: 'field-supervisor', name: 'Field Supervisor' },
        { id: 'reliability-engineer', name: 'Reliability Engineer' },
      ],
      construction: [
        { id: 'project-manager', name: 'Project Manager' },
        { id: 'site-supervisor', name: 'Site Supervisor' },
        { id: 'safety-manager', name: 'Safety Manager' },
        { id: 'operations-director', name: 'Operations Director' },
      ],
    };

    return (
      roleMap[this.userProfile.industry] || [
        { id: 'manager', name: 'Manager' },
        { id: 'supervisor', name: 'Supervisor' },
        { id: 'director', name: 'Director' },
        { id: 'executive', name: 'Executive' },
      ]
    );
  }

  getConcernsForIndustry() {
    const concernMap: { [key: string]: Array<{ id: string; name: string }> } = {
      'data-centers': [
        { id: 'uptime-sla', name: 'SLA compliance & uptime' },
        { id: 'cooling-failure', name: 'Cooling system failures' },
        { id: 'workload-migration', name: 'Workload migration planning' },
        {
          id: 'generator-maintenance',
          name: 'Generator maintenance scheduling',
        },
      ],
      healthcare: [
        { id: 'life-support', name: 'Life support equipment' },
        { id: 'cold-chain', name: 'Medication cold chain' },
        { id: 'emergency-response', name: 'Emergency response coordination' },
        { id: 'patient-safety', name: 'Patient safety & evacuation' },
      ],
    };

    return (
      concernMap[this.userProfile.industry] || [
        { id: 'downtime-cost', name: 'Operational downtime costs' },
        { id: 'safety', name: 'Safety & compliance' },
        { id: 'communication', name: 'Team communication' },
        { id: 'planning', name: 'Proactive planning' },
      ]
    );
  }

  toggleConcern(concernId: string, event: any) {
    if (event.target.checked) {
      this.userProfile.primaryConcerns.push(concernId);
    } else {
      this.userProfile.primaryConcerns =
        this.userProfile.primaryConcerns.filter((c) => c !== concernId);
    }
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.userProfile.industry;
      case 2:
        return !!this.userProfile.role && !!this.userProfile.organizationSize;
      case 3:
        return true;
      default:
        return true;
    }
  }

  nextStep() {
    if (this.canProceed()) {
      this.currentStep++;
    }
  }

  previousStep() {
    this.currentStep--;
  }

  completeOnboarding() {
    // Save user profile to service/localStorage
    localStorage.setItem(
      'gemicast-user-profile',
      JSON.stringify(this.userProfile),
    );
    localStorage.setItem('gemicast-onboarding-complete', 'true');

    // Navigate to main dashboard
    this.router.navigate(['/dashboard']);
  }
}
