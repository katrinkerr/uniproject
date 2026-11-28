import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './pages/auth/auth.guard';

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
    loadComponent: () => import('./pages/home/home').then((module) => module.Home),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile').then((module) => module.Profile),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/reg/reg').then((module) => module.RegisterComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/auth').then((module) => module.Auth),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
