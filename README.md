# ZapPR

**Agentic Git Client Mobile** — Lightweight Claude-powered code changes on your phone. Connect GitHub, pick a repo and branch, ask an agent to generate a patch, review the diff, then commit, push, and open a PR.

## Quickstart

### Prerequisites

- Node.js 18+, npm/yarn
- Python 3.11+
- Docker & Docker Compose
- Expo CLI (`npm i -g expo-cli`) or use `npx expo`

### Backend (Docker)

```bash
cd infra
cp .env.example .env
# Edit .env with your values (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, etc.)
docker compose up -d
```

Backend runs at `http://localhost:8000`. API docs: `http://localhost:8000/docs`

### Backend (Local dev)

```bash
cd services/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile

```bash
cd apps/mobile
npm install
# Create .env with EXPO_PUBLIC_API_URL=http://YOUR_IP:8000 (use your machine IP for device testing)
npx expo start
```

Scan QR code with Expo Go (iOS/Android) or run in simulator.

### GitHub OAuth Setup

1. Create an OAuth App at https://github.com/settings/developers
2. Set **Authorization callback URL** to:
   - Production: `zappr://auth/callback`
   - Expo Go (dev): `exp://YOUR_IP:8081/--/auth/callback` (replace YOUR_IP with your machine's LAN IP)
3. Copy Client ID and Client Secret to `.env`

### Environment Variables

See `services/api/.env.example` and `infra/.env.example` for all required variables.

## Project Structure

```
ZapPR/
├── apps/mobile/          # Expo React Native app
├── services/api/         # FastAPI backend
├── infra/                # Docker Compose, Caddy, deploy docs
└── README.md
```

## Core Flow

1. **Sign in** — GitHub OAuth (PKCE)
2. **Repo picker** — List your repos
3. **Branch picker** — Select or create branch
4. **Workspace** — File tree, file viewer, agent chat
5. **Diff review** — File-by-file unified diff; accept/reject
6. **Commit & PR** — Enter message, push, create PR

## Security

- Claude API key stored only on device (Expo SecureStore)
- Backend never persists user LLM keys
- Least-privilege GitHub OAuth scopes
- See [SECURITY.md](SECURITY.md) for threat model and security notes.

## License

MIT
