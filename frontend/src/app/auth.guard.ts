import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthApiService } from './services/auth-api.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authApi = inject(AuthApiService);

  if (authApi.getAccessToken()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
