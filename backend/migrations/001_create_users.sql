-- Migration 001: create the users table.
-- No real password should ever be saved in password_hash.
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(80),
    nickname VARCHAR(50),
    avatar_id VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
