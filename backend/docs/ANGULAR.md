Це було згенеровано ШІ, тому хз чи правильно

# Перевірка FastAPI з Angular

Це **приклад для фронтенд-команди**. Не замінюйте ним наявні компоненти PLOT; інтегруйте лише необхідні рядки.

## 1. Сервіс `src/app/services/health-api.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HealthResponse {
  status: 'ok';
}

@Injectable({ providedIn: 'root' })
export class HealthApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000';

  checkHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }
}
```

## 2. Переконайтеся, що `HttpClient` доступний

У Angular v21+ `HttpClient` доступний за замовчуванням. В інших конфігураціях у
`app.config.ts` додайте `provideHttpClient()` до наявного масиву `providers`. Не видаляйте
існуючих провайдерів і маршрутів.

```typescript
import { provideHttpClient } from '@angular/common/http';

// Додати до providers: provideHttpClient()
```

## 3. Викличте сервіс у будь-якому компоненті Angular

```typescript
private healthApi = inject(HealthApiService);

checkBackend() {
  this.healthApi.checkHealth().subscribe({
    next: (result) => console.log('Backend status:', result.status),
    error: (error) => console.error('Backend unavailable:', error),
  });
}
```

Після виклику `checkBackend()` при запущеному FastAPI очікуйте `Backend status: ok`.
Відправлення запиту відбувається після `subscribe()`.

## Чому CORS?

Порт 4200 і порт 8000 — різні origin. Браузер дозволяє Angular читати відповідь
від FastAPI тільки за відповідних CORS-заголовків. Для локальної розробки вони
налаштовані в `plot_api/main.py` через `CORSMiddleware`.
