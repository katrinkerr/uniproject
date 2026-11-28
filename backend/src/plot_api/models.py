"""SQLite connection and the User model for PLOT."""

from datetime import datetime
from pathlib import Path

from sqlalchemy import DateTime, ForeignKey, Integer, String, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from sqlalchemy import event

from sqlalchemy import CheckConstraint, Index, text
# Put plot.db directly in backend/, regardless of where the app is launched.
DB_FILE = Path(__file__).resolve().parents[2] / "plot.db"
engine = create_engine(f"sqlite:///{DB_FILE}")
SessionLocal = sessionmaker(bind=engine)

@event.listens_for(engine, "connect")
def enable_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(50), nullable=True)
    avatar_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )


class UserSession(Base):
    """Server-side login session. Never store the raw access token."""

    __tablename__ = "sessions"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    expires_at: Mapped[int] = mapped_column(Integer, nullable=False)


class UserMission(Base):
    """A mission attempt owned by one user."""

    __tablename__ = "user_missions"

    __table_args__ = (
        CheckConstraint(
            "status IN ('in_progress', 'completed')",
            name="ck_user_mission_status",
        ),
        CheckConstraint(
            "earned_xp >= 0",
            name="ck_user_mission_xp",
        ),
        CheckConstraint(
            "(status = 'in_progress' AND completed_at IS NULL "
            "AND earned_xp = 0) OR "
            "(status = 'completed' AND completed_at IS NOT NULL)",
            name="ck_user_mission_completion",
        ),
        Index(
            "ux_user_missions_one_in_progress",
            "user_id",
            unique=True,
            sqlite_where=text("status = 'in_progress'"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    mission_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="in_progress",
    )

    started_at: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    completed_at: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    earned_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
