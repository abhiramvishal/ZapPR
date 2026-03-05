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

---

## Run on Your Device (Expo Go)

1. Install **Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779) (iOS) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android).
2. Clone the repo and start the backend (see above).
3. In `apps/mobile/`, copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL`:
   - Simulator: `http://localhost:8000`
   - Physical device: `http://YOUR_LAN_IP:8000` (same Wi‑Fi as your machine)
4. Run: `cd apps/mobile && npx expo start`
5. Scan the QR code:
   - **iOS**: Camera app → tap the banner
   - **Android**: Expo Go app → Scan QR code

### GitHub OAuth Setup

1. Create an OAuth App at https://github.com/settings/developers
2. Add **Authorization callback URL(s)** (GitHub allows multiple):
   - **Expo Go (dev)**: `exp://YOUR_IP:8081/--/auth/callback` (replace YOUR_IP with your machine's LAN IP)
   - **Standalone**: `zappr://auth/callback`
3. Copy Client ID and Client Secret to backend `.env`

### Expo Go Test Checklist

- [ ] App launches without crashing
- [ ] GitHub OAuth login completes (add `exp://YOUR_IP:8081/--/auth/callback` to GitHub OAuth app)
- [ ] Token is stored and persisted across restarts
- [ ] Repo list loads from API
- [ ] All navigation routes work
- [ ] Deep links work (where supported)

### Environment Variables

See `services/api/.env.example` and `infra/.env.example` for backend. For mobile: `apps/mobile/.env.example` → copy to `.env.local` and set `EXPO_PUBLIC_API_URL`.

## Project Structure

```
ZapPR/
├── apps/mobile/          # Expo React Native app
├── services/api/         # FastAPI backend
├── infra/                # Docker Compose, Caddy, deploy docs
└── README.md
```

---

## Share with Testers (Expo Go)

To share the app via Expo Go (QR code / link) without App Store distribution:

1. Log in: `npx expo login`
2. Initialize EAS (one-time): `cd apps/mobile && npx eas init`
3. Update `app.json`: set `owner` to your Expo username, and `updates.url` with your project ID from `eas init`
4. Publish: `cd apps/mobile && npm run share` (or `npx eas update --branch default --message "Update"`). On Unix, you can also run `./scripts/share.sh` (after `chmod +x scripts/share.sh`).
5. Share link: `https://expo.dev/@YOUR_USERNAME/zappr`

Testers open the link in Expo Go to load the published app.

---

## Core Flow

1. **Sign in** — GitHub OAuth (PKCE)
2. **Repo picker** — List your repos
3. **Branch picker** — Select or create branch
4. **Workspace** — File tree, file viewer, agent chat
5. **Diff review** — File-by-file unified diff; accept/reject
6. **Commit & PR** — Enter message, push, create PR

## Security

- Claude API key stored only on device (SecureStore when available; AsyncStorage fallback in Expo Go)
- Backend never persists user LLM keys
- Least-privilege GitHub OAuth scopes
- See [SECURITY.md](SECURITY.md) for threat model and security notes.

## License

MIT
