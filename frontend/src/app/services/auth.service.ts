import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

import { RegisterApiService, RegisterResponse } from './register-api.service';
import { LoginApiService } from './login-api.service';
import { LoginRequest, LoginResponse, RegisterRequest } from '../pages/auth.models';
import { AuthApiService } from './auth-api.service';

const ACCESS_TOKEN_KEY = 'plot-access-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly registerApi = inject(RegisterApiService);
  private readonly loginApi = inject(LoginApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly authenticated = signal(this.hasStoredSession());

  isAuthenticated(): boolean {
    return this.authenticated();
  }

  accessToken(): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  startSession(accessToken: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }

    this.authenticated.set(true);
  }

  endSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }

    this.authenticated.set(false);
  }

  logout(): Observable<void> {
    const accessToken = this.accessToken();
    if (!accessToken) {
      this.endSession();
      return of(void 0);
    }

    return this.authApi.logout(accessToken);
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.registerApi.register({
      email: data.email,
      password: data.password,
    });
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.loginApi.login(data);
  }

  private hasStoredSession(): boolean {
    return (
      typeof sessionStorage !== 'undefined' &&
      Boolean(sessionStorage.getItem(ACCESS_TOKEN_KEY))
    );
  }
}
