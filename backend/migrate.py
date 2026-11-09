"""Apply the first SQLite database migration (run: python migrate.py)."""

from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parent
DB_FILE = ROOT / "plot.db"
SQL_FILE = ROOT / "migrations" / "001_create_users.sql"


def main() -> None:
    with sqlite3.connect(DB_FILE) as db:
        version = db.execute("PRAGMA user_version").fetchone()[0]
        if version >= 1:
            print(f"Database is already at version {version}; no changes needed.")
            return

        sql = SQL_FILE.read_text(encoding="utf-8")
        # BEGIN/COMMIT make the table creation and version update atomic.
        db.executescript("BEGIN;\n" + sql + "\nPRAGMA user_version = 1;\nCOMMIT;")
        print(f"Migration 001 applied. Created {DB_FILE.name} and users table.")


if __name__ == "__main__":
    main()
