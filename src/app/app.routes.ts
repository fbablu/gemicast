import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];

// const routes: Routes = [
//   {path: 'login', component: LoginComponent},
//   {path: '', redirectTo: '/login', pathMatch: 'full'},
//   {path: 'applayout', component: AppComponent, children:[
//      {path: 'dashboard', component: DashboardComponent }
//   ]}
// ];
