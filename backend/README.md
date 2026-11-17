# PLOT Backend

Початковий бекенд для PLOT
На поточному етапі реалізовано структуру сервісу, конфігурацію, тестовий `GET /health`
і автоматичні тести. Авторизація, база даних і генератор місій ще не реалізовані.

## Вимоги

- Python 3.11 або новіший
- `pip`
- Git (необов'язково для локального запуску)

## Запуск у нормальних ОС (Linux/macOS)

Виконуйте команди з кореня директорії `PLOT-backend`:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
cp .env.example .env
python -m uvicorn plot_api.main:app --reload --host 127.0.0.1 --port 8000
```

## Запуск у Windows (PowerShell)

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
python -m uvicorn plot_api.main:app --reload --host 127.0.0.1 --port 8000
```

Якщо PowerShell забороняє активацію, можна запускати команди через
`.\.venv\Scripts\python.exe` без активації.

## Перевірка

Відкрийте у браузері:

- **Health check:** http://127.0.0.1:8000/health
- **Swagger UI (документація API):** http://127.0.0.1:8000/docs

Має вибити на `GET /health`:

```json
{"status": "ok"}
```

Або перевірте в терміналі:

```bash
curl http://127.0.0.1:8000/health
```

## Тести

У другому терміналі (після активації `.venv`):

```bash
python -m pytest -q
```

Тести перевіряють HTTP-код і JSON для `/health`, OpenAPI документацію
та базовий CORS для локального Angular-фронтенду (:4200).


## Налаштування

Скопіюйте `.env.example` у `.env`; цей файл не повинен потрапляти до Git.
`FRONTEND_ORIGINS` — адреси дозволених фронтендів через кому
(за замовчуванням Angular `:4200`).

## Інтеграція з Angular

Angular зазвичай працює на `http://localhost:4200`, а FastAPI — на `http://127.0.0.1:8000`.
Тому ми дозволили адресу Angular у налаштуванні `FRONTEND_ORIGINS`.

У Angular можна створити сервіс з `HttpClient` та викликати `GET http://127.0.0.1:8000/health`.
Приклад коду й пояснення — у `docs/ANGULAR.md`.



## User Registration API

### POST /auth/register

Registers a new user in the PLOT application.

**Request**

- Method: `POST`
- Endpoint: `/auth/register`
- Content-Type: `application/json`

Request body:

```json
{
  "email": "paterega@example.com",
  "password": "MyPassword123!"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | Yes | Valid, unique email address |
| `password` | string | Yes | Password containing 8–128 characters |

**Successful response — 201 Created**

```json
{
  "id": 1,
  "email": "paterega@example.com"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Unique user identifier |
| `email` | string | Registered email address |

**Error responses**

| HTTP Status | Description |
|---|---|
| `409 Conflict` | Email is already registered |
| `422 Unprocessable Content` | Invalid email, password or request data |
| `500 Internal Server Error` | Unexpected server error |

Example error response — `409 Conflict`:

```json
{
  "detail": "Email already registered"
}
```

**Validation and security requirements**

- Email must have a valid format.
- Email addresses must be unique, case-insensitively.
- Password must contain 8–128 characters.
- Passwords must be securely hashed before being stored in the database.
- Passwords and password hashes must never be returned by the API.
- Successful registration creates an account but does not automatically log the user in.

**Implementation status:** Planned. The endpoint will be implemented in the next task.

## Authentication and Mission API

This section describes the planned API endpoints for user authentication and random mission generation in PLOT.

Base URL for local development: `http://127.0.0.1:8000`

### 1. POST /auth/login

Authenticates a user using their email and password.

**Request body:**

```json
{
  "email": "paterega@example.com",
  "password": "MyPassword123!"
}
```

**Successful response — 200 OK:**

```json
{
  "access_token": "example-session-token",
  "token_type": "bearer"
}
```

**Errors:**

| Status | Description |
|---|---|
| 401 Unauthorized | Invalid email or password |
| 422 Unprocessable Content | Invalid request data |

Email matching is case-insensitive. Passwords are verified against their stored Argon2 hashes.

A successful login creates a server-side session. The session token expires after 24 hours.

### 2. GET /auth/me

Returns information about the currently authenticated user.

**Required header:**

```http
Authorization: Bearer <access_token>
```

**Successful response — 200 OK:**

```json
{
  "id": 1,
  "email": "andrii@example.com"
}
```

**Errors:**

| Status | Description |
|---|---|
| 401 Unauthorized | Missing, invalid or expired session token |

### 3. POST /auth/logout

Ends the current user session.

**Required header:**

```http
Authorization: Bearer <access_token>
```

**Successful response — 204 No Content**

The response body is empty.

The server invalidates the session. The previous token can no longer access protected endpoints.

**Errors:**

| Status | Description |
|---|---|
| 401 Unauthorized | Missing, invalid or expired session token |

### 4. GET /missions/random

Returns one randomly selected mission from a predefined list.

**Example request:**

```http
GET /missions/random?category=sport&difficulty=easy
Authorization: Bearer <access_token>
```

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | No | Mission category |
| `difficulty` | string | No | Mission difficulty |

Supported categories:

`sport`, `education`, `good_deeds`, `self_development`, `household`, `creativity`

Supported difficulties:

`easy`, `medium`, `hard`

If a parameter is omitted, missions from any matching category or difficulty may be selected.

**Successful response — 200 OK:**

```json
{
  "id": 1,
  "title": "Try a new walking route",
  "description": "Take a 20-minute walk along a route you have never tried.",
  "category": "sport",
  "difficulty": "easy",
  "xp": 50
}
```

**Errors:**

| Status | Description |
|---|---|
| 401 Unauthorized | Missing, invalid or expired session |
| 404 Not Found | No matching missions available |
| 422 Unprocessable Content | Invalid category or difficulty |

### Authentication Rules

Protected endpoints require a valid session token in the `Authorization` header.

Session tokens are generated securely and stored as hashes in SQLite. Tokens expire after 24 hours and are invalidated immediately after logout.

Passwords and password hashes are never included in API responses.

### Implementation Status

- `POST /auth/register` — Implemented
- `POST /auth/login` — Planned
- `GET /auth/me` — Planned
- `POST /auth/logout` — Planned
- `GET /missions/random` — Planned