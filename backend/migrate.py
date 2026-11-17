"""Apply numbered SQLite migrations (run: python migrate.py)."""

from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parent
DB_FILE = ROOT / "plot.db"
MIGRATIONS = ROOT / "migrations"


def main() -> None:
    with sqlite3.connect(DB_FILE) as db:
        current_version = db.execute("PRAGMA user_version").fetchone()[0]
        files = sorted(MIGRATIONS.glob("[0-9][0-9][0-9]_*.sql"))

        for sql_file in files:
            version = int(sql_file.name.split("_", 1)[0])
            if version <= current_version:
                continue
            if version != current_version + 1:
                raise RuntimeError("Missing database migration")

            sql = sql_file.read_text(encoding="utf-8")
            try:
                db.executescript(
                    f"BEGIN;\n{sql}\nPRAGMA user_version = {version};\nCOMMIT;"
                )
            except Exception:
                db.rollback()
                raise

            current_version = version
            print(f"Migration {version:03d} applied")

        print(f"Database version: {current_version}")


if __name__ == "__main__":
    main()
