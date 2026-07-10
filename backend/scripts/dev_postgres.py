"""Manage a local dev Postgres instance with no Docker/system install required.

Uses pgserver (bundled Postgres binaries, pip-installable) to run a real
Postgres server out of backend/.pgdata. Analogous to `docker compose up -d` /
`down` for environments where Docker isn't available.

Usage (from backend/, with the venv active):
    python scripts/dev_postgres.py start
    python scripts/dev_postgres.py stop
"""

import re
import secrets
import shutil
import sys
from pathlib import Path

import pgserver

BACKEND_DIR = Path(__file__).resolve().parent.parent
PGDATA = BACKEND_DIR / ".pgdata"
ENV_FILE = BACKEND_DIR / ".env"
ENV_EXAMPLE = BACKEND_DIR / ".env.example"

DEV_DB = "everything_calendar"
TEST_DB = "everything_calendar_test"


def _ensure_database(db: "pgserver.PostgresServer", name: str) -> None:
    db.psql(
        f"SELECT 'CREATE DATABASE {name}' "
        f"WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '{name}')\\gexec"
    )


def _write_env(database_url: str, test_database_url: str) -> None:
    if not ENV_FILE.exists():
        shutil.copy(ENV_EXAMPLE, ENV_FILE)
        text = ENV_FILE.read_text()
        text = re.sub(
            r"^SECRET_KEY=.*$",
            f"SECRET_KEY={secrets.token_hex(32)}",
            text,
            flags=re.MULTILINE,
        )
    else:
        text = ENV_FILE.read_text()

    text = re.sub(r"^DATABASE_URL=.*$", f"DATABASE_URL={database_url}", text, flags=re.MULTILINE)
    text = re.sub(
        r"^TEST_DATABASE_URL=.*$",
        f"TEST_DATABASE_URL={test_database_url}",
        text,
        flags=re.MULTILINE,
    )
    ENV_FILE.write_text(text)


def start() -> None:
    PGDATA.parent.mkdir(parents=True, exist_ok=True)
    db = pgserver.get_server(PGDATA, cleanup_mode=None)

    _ensure_database(db, DEV_DB)
    _ensure_database(db, TEST_DB)

    database_url = db.get_uri(database=DEV_DB)
    test_database_url = db.get_uri(database=TEST_DB)
    _write_env(database_url, test_database_url)

    print(f"Postgres running (pid {db.get_pid()}) at pgdata={PGDATA}")
    print(f"DATABASE_URL={database_url}")
    print(f"TEST_DATABASE_URL={test_database_url}")
    print(f"Written to {ENV_FILE}")


def stop() -> None:
    if not PGDATA.exists():
        print("No pgdata directory found; nothing to stop.")
        return
    db = pgserver.get_server(PGDATA, cleanup_mode=None)
    db.cleanup()
    print("Postgres stopped.")


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("start", "stop"):
        print(f"Usage: python {Path(__file__).name} [start|stop]")
        sys.exit(1)

    {"start": start, "stop": stop}[sys.argv[1]]()
