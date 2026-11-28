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

export interface CurrentUser {
  id: number;
  email: string;
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

  getMe(accessToken: string): Observable<CurrentUser> {
    return this.http
      .get<CurrentUser>(`${this.baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .pipe(timeout({ first: 15000 }));
  }

  logout(accessToken: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/auth/logout`, null, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .pipe(timeout({ first: 15000 }));
  }
}
