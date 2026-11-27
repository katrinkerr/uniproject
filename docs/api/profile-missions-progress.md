# PLOT — Profile, User Missions and Progress API

**Task:** RMG-58  
**Status:** Draft for team approval — API contract only; not yet implemented  
**Base URL (local):** `http://127.0.0.1:8000`

This contract extends the existing `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, and `GET /missions/random` APIs. It does **not** replace them. The existing random-mission endpoint returns a *mission template*. Starting that mission creates a separate *user mission* (an attempt).

## Conventions

- JSON field names use `snake_case`.
- All endpoints below require `Authorization: Bearer <access_token>` and operate only on the authenticated user; the client never sends a `user_id`.
- A missing, invalid, revoked or expired session returns `401 Unauthorized`.
- Date-time values are ISO 8601 in UTC, for example `2026-11-25T12:00:00Z`.
- The server calculates XP, levels and streaks. The client cannot directly edit them.
- A mission *template* has an `id` in the static `GET /missions/random` catalog; a *user mission* has its **own** `id` after being started. In `/users/me/missions/{id}/complete`, `{id}` is the **user-mission ID**, not the catalog mission ID.

## Common objects

### Profile

```json

{
  "id": 1,
  "email": "andrii@example.com",
  "display_name": "Андрій",
  "nickname": "yuko",
  "avatar_id": "cat_blue",
  "stats": {
    "total_xp": 120,
    "level": 1,
    "xp_in_level": 120,
    "xp_to_next_level": 380,
    "completed_missions": 3,
    "active_missions": 1,
    "streak_days": 2
  },
  "recent_completed_missions": [
    {
      "id": 101,
      "mission": {
        "id": 2,
        "title": "Планка з віршем",
        "description": "Протримайся в планці, поки читаєш короткий вірш.",
        "category": "sport",
        "difficulty": "easy",
        "xp": 30
      },
      "status": "completed",
      "started_at": "2026-11-25T12:00:00Z",
      "completed_at": "2026-11-25T12:15:00Z",
      "earned_xp": 30
    }
  ]
}

```

`display_name`, `nickname` and `avatar_id` may be `null` for profiles that have not been configured. `email` remains read-only in this API.

### User mission

```json
{
  "id": 101,
  "mission": {
    "id": 2,
    "title": "Планка з віршем",
    "description": "Протримайся в планці, поки читаєш короткий вірш.",
    "category": "sport",
    "difficulty": "easy",
    "xp": 30
  },
  "status": "active",
  "started_at": "2026-11-25T12:00:00Z",
  "completed_at": null,
  "earned_xp": 0
}
```

The `mission` object uses the same fields as `GET /missions/random`. `status` is `active` or `completed`. On completion, `completed_at` becomes a timestamp and `earned_xp` becomes the granted XP. The example description above is illustrative; the actual description comes from the existing mission catalog.

## 1. GET /users/me

Returns the authenticated user's profile and progress statistics.

**Request:** `GET /users/me` with Bearer token; no request body.

**Success:** `200 OK`, response body is the **Profile** object above.

**Errors:** `401` if not authenticated.

**Note:** This endpoint extends, rather than replaces, `GET /auth/me`, which currently returns only `id` and `email`.

## 2. PATCH /users/me

Updates the authenticated user's optional profile fields. Only fields present in the body are updated. **Omitted** means "leave unchanged"; `null` means "clear value" (where allowed).

**Example request:**

```json
{
  "display_name": "Андрій",
  "nickname": "yuko",
  "avatar_id": "cat_blue"
}
```

| Field | Type | Rules |
| --- | --- | --- |
| `display_name` | string or null | 1–80 characters if set |
| `nickname` | string or null | 1–50 characters if set |
| `avatar_id` | string or null | Up to 50 characters; must identify a supported preset avatar |

At least one field must be supplied. Whitespace-only names are invalid. `email`, `id`, `total_xp`, `level`, `streak_days` and other statistics cannot be changed through this endpoint.

**Success:** `200 OK`, response body is the **Profile**
object above, including user statistics and the five most
recent completed missions.

The `recent_completed_missions` field contains up to five
completed mission attempts, ordered by completion date
(newest first). If the user has no completed missions,
an empty array is returned.

**Implementation status:** Implemented (RMG-60).

**Errors:** `401` unauthenticated; `422` invalid field/value or empty update. Nickname uniqueness is **not required** in the current draft; see decisions to approve.

## 3. POST /users/me/missions

Starts a new attempt of a mission from the existing static mission catalog.

**Request:**

```json
{
  "mission_id": 2
}
```

`mission_id` is obtained from `GET /missions/random`.

**Success:** `201 Created`, returns the **User mission** object above with a newly generated user-mission `id`, `status="active"` and `earned_xp=0`.

**Errors:** `401` unauthenticated; `404` unknown mission template; `409` user already has an active mission; `422` invalid body.

**MVP rule proposed:** At most **one active mission per user**. Completing it frees the slot for the next mission. Whether the same template can be started again later remains a team decision.

## 4. POST /users/me/missions/{id}/complete

Completes an *active user mission* owned by the current user, grants XP once and updates progress.

**Request:** `POST /users/me/missions/101/complete` with Bearer token and **no request body**.

**Success:** `200 OK`:

```json
{
  "user_mission": {
    "id": 101,
    "mission": {
      "id": 2,
      "title": "Планка з віршем",
      "description": "Протримайся в планці, поки читаєш короткий вірш.",
      "category": "sport",
      "difficulty": "easy",
      "xp": 30
    },
    "status": "completed",
    "started_at": "2026-11-25T12:00:00Z",
    "completed_at": "2026-11-25T12:10:00Z",
    "earned_xp": 30
  },
  "stats": {
    "total_xp": 150,
    "level": 1,
    "xp_in_level": 150,
    "xp_to_next_level": 350,
    "completed_missions": 4,
    "active_missions": 0,
    "streak_days": 2
  }
}
```

**Errors:** `401` unauthenticated; `404` user mission does not exist **or belongs to someone else**; `409` user mission is already completed; `422` invalid ID path parameter.

**Critical rule:** Completing the same user-mission ID twice **must never grant XP twice**. The change of status, XP award and streak update must be performed as one database transaction, with protection against concurrent completion requests.

## 5. GET /users/me/missions

Returns the authenticated user's active and completed mission attempts.

**Optional query parameter:** `status=active` or `status=completed`; without the filter, returns both statuses.

**Example request:** `GET /users/me/missions?status=active`

**Success:** `200 OK`:

```json
{
  "items": [
    {
      "id": 101,
      "mission": {
        "id": 2,
        "title": "Планка з віршем",
        "description": "Протримайся в планці, поки читаєш короткий вірш.",
        "category": "sport",
        "difficulty": "easy",
        "xp": 30
      },
      "status": "active",
      "started_at": "2026-11-25T12:00:00Z",
      "completed_at": null,
      "earned_xp": 0
    }
  ]
}
```

Results are ordered by `started_at` descending. If there are no matching attempts, return `200 OK` with `{"items": []}` rather than `404`.

**Errors:** `401` unauthenticated; `422` invalid status filter.

## Proposed progress rules (approval required)

| Item | Proposed rule |
| --- | --- |
| XP award | `easy = 30`, `medium = 50`, `hard = 80` XP, matching the previous mission proposal |
| XP timing | XP is granted only when an active mission is completed; starting grants 0 XP |
| Levels | Level 1 starts at 0 XP. Every 500 cumulative XP adds one level: `level = 1 + total_xp // 500` |
| Level progress | `xp_in_level = total_xp % 500`; `xp_to_next_level = 500 - (total_xp % 500)` |
| Daily streak | A day counts if at least one mission is completed that day; additional completions that day do not increase streak |
| Consecutive days | Completion the next calendar day increases streak by 1; a longer gap resets it to 1 upon the next completion |
| Displayed streak | If last completed date is neither today nor yesterday, display streak 0; otherwise display current streak |
| Calendar timezone | Use `Europe/Kyiv` for MVP streak-day boundaries; store precise timestamps in UTC |
| Repeat completion | Return `409` and grant **0 additional XP** for an already completed user-mission ID |
| Data ownership | Only the authenticated user can view/change their own profile and mission attempts |

