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