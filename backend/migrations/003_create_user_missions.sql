-- RMG-59: each row represents one user's attempt of a catalog mission.
-- IDs from the static Python mission catalog have no SQL foreign key.
CREATE TABLE user_missions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed')),
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    earned_xp INTEGER NOT NULL DEFAULT 0 CHECK (earned_xp >= 0),
    CHECK (
        (status = 'in_progress' AND completed_at IS NULL AND earned_xp = 0)
        OR (status = 'completed' AND completed_at IS NOT NULL)
    )
);

CREATE INDEX ix_user_missions_user_id ON user_missions (user_id);

-- Enforce the MVP rule: no more than one unfinished attempt per user.
-- A finished template may be started again as a new attempt.
CREATE UNIQUE INDEX ux_user_missions_one_in_progress
    ON user_missions (user_id)
    WHERE status = 'in_progress';
