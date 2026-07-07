# EverythingCalendar Backend Plan

## Context
Building a FastAPI + PostgreSQL backend for a personal management app. The backend must support multiple user accounts with JWT auth, flexible per-user data categories (modules), and per-module entries with freeform JSONB payloads. Deployment target is Railway (public internet), with the same codebase also usable on a home server (Radagast via Docker Compose) or local dev (venv + local Postgres). All configuration is via environment variables.

---

## Directory Layout

```
EverythingCalendar/
├── .env.example               # Root env template (for Docker Compose on Radagast)
├── .gitignore
├── docker-compose.yml         # Radagast self-hosting
└── backend/
    ├── .env.example           # Local dev env template
    ├── Dockerfile
    ├── railway.json           # Railway start command (runs migrations then uvicorn)
    ├── requirements.txt
    ├── alembic.ini
    ├── alembic/
    │   ├── env.py             # Reads DATABASE_URL from env, imports Base
    │   ├── script.py.mako     # Standard Alembic migration template
    │   └── versions/          # Empty — migrations generated here
    └── app/
        ├── __init__.py
        ├── main.py            # App factory, CORS, router registration
        ├── config.py          # Pydantic Settings (reads .env)
        ├── database.py        # SQLAlchemy engine, SessionLocal, Base, get_db
        ├── models.py          # User, Module, Entry ORM models
        ├── schemas.py         # Pydantic request/response shapes
        ├── auth.py            # JWT create/verify, get_current_user dependency
        └── routers/
            ├── __init__.py
            ├── auth.py        # /register, /login, /me
            ├── modules.py     # CRUD — user-scoped
            └── entries.py     # CRUD — user-scoped through module ownership
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| email | String UNIQUE | indexed |
| hashed_password | String | bcrypt |
| is_active | Boolean | default True |
| created_at | DateTime TZ | default utcnow |

### `modules`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| user_id | Integer FK → users | indexed |
| name | String | unique per user (unique constraint on user_id + name) |
| schema_definition | JSONB | frontend contract for payload shape |
| is_active | Boolean | default True |
| created_at | DateTime TZ | default utcnow |

### `entries`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| module_id | Integer FK → modules | indexed |
| status | String | default "active" |
| payload | JSONB | GIN indexed |
| created_at | DateTime TZ | default utcnow |
| updated_at | DateTime TZ | default + onupdate utcnow |

User ownership of entries is implicit through module ownership. Queries scope entries by subquerying the user's module IDs.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | none | Health check |
| POST | /api/auth/register | none | Create account |
| POST | /api/auth/login | none | Returns JWT Bearer token |
| GET | /api/auth/me | JWT | Current user info |
| GET | /api/modules | JWT | List user's modules (filter: is_active) |
| POST | /api/modules | JWT | Create module |
| GET | /api/modules/{id} | JWT | Get module |
| PUT | /api/modules/{id} | JWT | Update module |
| DELETE | /api/modules/{id} | JWT | Hard delete (blocked if entries exist) |
| GET | /api/entries | JWT | List entries (filter: module_id, status; paginate: limit, offset) |
| POST | /api/entries | JWT | Create entry |
| GET | /api/entries/{id} | JWT | Get entry |
| PUT | /api/entries/{id} | JWT | Update status/payload |
| DELETE | /api/entries/{id} | JWT | Delete entry |

---

## Key Implementation Details

### Auth (`app/auth.py`)
- `HTTPBearer` security scheme (reads `Authorization: Bearer <token>`)
- JWT signed with `SECRET_KEY`, 7-day expiry by default
- `get_current_user(credentials, db)` → `models.User` — used as a FastAPI Depends in every protected route
- Passwords hashed with `passlib[bcrypt]`

### Config (`app/config.py`)
Pydantic `BaseSettings` reads from `.env` file. Required vars:
- `DATABASE_URL` — full Postgres connection string
- `SECRET_KEY` — random secret for JWT signing (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)

Optional:
- `ACCESS_TOKEN_EXPIRE_MINUTES` — default `10080` (7 days)
- `PORT` — default `8000`

### User-scoping pattern
All module queries filter by `Module.user_id == current_user.id`.  
All entry queries filter by `Entry.module_id.in_(subquery of user's module IDs)`.  
A user can never see or touch another user's data, even if they guess an ID.

### Delete rules
- Module delete is blocked if any entries exist → user must deactivate instead
- Entry delete is hard (no soft-delete for entries)

### Deployment portability
- Local dev: `cp backend/.env.example backend/.env`, fill in local Postgres URL, run `uvicorn app.main:app --reload`
- Radagast: `cp .env.example .env`, fill in, `docker compose up -d`
- Railway: set env vars in Railway dashboard, Railway builds from `backend/Dockerfile`, `railway.json` runs `alembic upgrade head && uvicorn ...` on start

---

## Requirements

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
psycopg2-binary==2.9.9
alembic==1.13.3
pydantic[email]==2.9.2
pydantic-settings==2.5.2
python-dotenv==1.0.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
```

---

## Verification

After scaffolding, to verify locally:
1. Create a local Postgres database named `everything_calendar`
2. Copy `backend/.env.example` → `backend/.env`, fill in `DATABASE_URL` and a random `SECRET_KEY`
3. `cd backend && pip install -r requirements.txt`
4. `alembic upgrade head` — creates all three tables
5. `uvicorn app.main:app --reload`
6. Open `http://localhost:8000/docs` — register a user, log in, get token, test module/entry CRUD via Swagger UI
