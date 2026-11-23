import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';

import { LoginRequest, LoginResponse } from '../pages/auth.models';

@Injectable({ providedIn: 'root' })
export class LoginApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000';

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, data)
      .pipe(timeout({ first: 15000 }));
  }
}
