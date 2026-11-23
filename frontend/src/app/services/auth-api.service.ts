import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000';

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, data)
      .pipe(timeout({ first: 15000 }));
  }

  logout(): Observable<void> {
    const accessToken = this.getAccessToken();
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined;

    return this.http
      .post<void>(`${this.baseUrl}/auth/logout`, null, { headers })
      .pipe(timeout({ first: 15000 }));
  }

  getAccessToken(): string | null {
    try {
      return (
        localStorage.getItem('access_token') ??
        localStorage.getItem('accessToken')
      );
    } catch {
      return null;
    }
  }

  clearSession(): void {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('accessToken');
    } catch {
      // The route is protected again once there is no readable session.
    }
  }
}
