# AGENTS.md

## Cursor Cloud specific instructions

ZapPR is a monorepo with two components: a Python FastAPI backend (`services/api/`) and an Expo React Native mobile app (`apps/mobile/`).

### Services overview

| Service | Path | How to run |
|---------|------|-----------|
| FastAPI Backend | `services/api/` | `cd services/api && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` |
| PostgreSQL 16 | Docker | `sudo docker start postgres` (container pre-created) |
| Redis 7 | Docker | `sudo docker start redis` (container pre-created) |
| Mobile App | `apps/mobile/` | `cd apps/mobile && npx expo start` (requires physical device/emulator) |

### Running the backend

The Docker daemon must be started first (`sudo dockerd &>/tmp/dockerd.log &`), then PostgreSQL and Redis containers started (`sudo docker start postgres redis`). The FastAPI app auto-creates database tables on startup via `Base.metadata.create_all` in `app/main.py`, so Alembic migrations are not strictly required.

The backend `.env` file lives at `services/api/.env`; see `services/api/.env.example` for all variables. `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are needed for real OAuth flows but the server starts fine with placeholders.

### Testing and linting

See the CI config in `.github/workflows/ci.yml` for the canonical test/lint commands. Key commands:
- **Tests:** `cd services/api && source venv/bin/activate && pytest tests -v`
- **Bandit:** `cd services/api && source venv/bin/activate && bandit -r app -ll`
- **Mypy:** `cd services/api && source venv/bin/activate && mypy app --ignore-missing-imports` (runs with `|| true` in CI; has pre-existing type errors)

### Gotchas

- `requirements.txt` pins `pytest==8.0.0` and `pytest-asyncio==0.23.4`, which conflict. Install with `pytest>=7.0,<8` instead to resolve.
- Alembic's `env.py` has a driver mismatch (sets a sync URL but uses `async_engine_from_config`). The app's lifespan auto-creates tables, so you can skip `alembic upgrade head` for local dev.
- The mobile app has pre-existing TypeScript type errors (TS2339, TS2322 in `lib/api.ts` and `app/(auth)/sign-in.tsx`). `npx tsc --noEmit` will report errors but the Expo bundler still works.
- The mobile app is iOS/Android only; `expo export --platform web` requires additional deps (`react-native-web`, `react-dom`) that are not in the project.
