import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { DashboardComponent } from './app/components/dashboard/dashboard.component';

bootstrapApplication(DashboardComponent, appConfig).catch((err) =>
  console.error(err),
);
