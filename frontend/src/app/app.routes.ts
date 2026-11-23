import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/onboarding/onboarding').then((module) => module.Onboarding),
  },
  {
    path: 'onboarding',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/home/home').then((module) => module.Home),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/reg/reg').then((module) => module.Reg),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/auth').then((module) => module.Auth),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
