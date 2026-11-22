-- Migration 002: store login sessions (24-hour expiration as Unix timestamp).
-- Only the SHA-256 hash of the random token is stored.
CREATE TABLE sessions (
    token_hash VARCHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
);

CREATE INDEX ix_sessions_user_id ON sessions (user_id);
