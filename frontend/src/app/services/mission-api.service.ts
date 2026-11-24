import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { AuthService } from './auth.service';

export type MissionCategory =
  | 'sport'
  | 'good_deeds'
  | 'mental_health'
  | 'education'
  | 'household'
  | 'creativity';

export type MissionDifficulty = 'easy' | 'medium' | 'hard';

export interface Mission {
  id: number;
  title: string;
  description: string;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  xp: number;
}

export interface RandomMissionFilters {
  category?: MissionCategory;
  difficulty?: MissionDifficulty;
}

@Injectable({ providedIn: 'root' })
export class MissionApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = 'http://127.0.0.1:8000';

  getRandomMission(filters: RandomMissionFilters = {}): Observable<Mission> {
    let params = new HttpParams();

    if (filters.category) {
      params = params.set('category', filters.category);
    }
    if (filters.difficulty) {
      params = params.set('difficulty', filters.difficulty);
    }

    const accessToken = this.authService.accessToken();
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined;

    return this.http
      .get<Mission>(`${this.baseUrl}/missions/random`, { params, headers })
      .pipe(timeout({ first: 15000 }));
  }
}
