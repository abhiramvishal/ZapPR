# ZapPR Deployment Guide

Deploy ZapPR backend on a single Ubuntu VM (Hetzner, DigitalOcean, AWS Lightsail).

## Step 1: Create VM

- **Hetzner**: Create a CX21 or larger (2 vCPU, 4GB RAM)
- **DigitalOcean**: Create a Basic Droplet (2GB RAM)
- **AWS Lightsail**: Create $10/mo instance

Use Ubuntu 22.04 LTS. Ensure ports 22 (SSH), 80, 443 are open.

## Step 2: Install Docker

```bash
ssh root@YOUR_VM_IP

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose plugin
apt-get update && apt-get install -y docker-compose-plugin
```

## Step 3: Set DNS

Point your domain (e.g. `api.zappr.example.com`) to the VM's IP via an A record.

## Step 4: Clone and Configure

```bash
git clone https://github.com/YOUR_ORG/ZapPR.git
cd ZapPR/infra
cp .env.example .env
nano .env
```

Required `.env` values:

| Variable | Description |
|----------|-------------|
| GITHUB_CLIENT_ID | From GitHub OAuth App |
| GITHUB_CLIENT_SECRET | From GitHub OAuth App |
| JWT_SECRET | 32+ char random string |
| TOKEN_ENCRYPTION_KEY | Base64-encoded 32-byte key: `openssl rand -base64 32` |
| POSTGRES_PASSWORD | Strong password |
| DOMAIN | Your API domain (e.g. api.zappr.example.com) |
| EMAIL | For Let's Encrypt (e.g. admin@example.com) |
| OAUTH_REDIRECT_URI | `zappr://auth/callback` for mobile; add to GitHub OAuth app |

## Step 5: Bring Up Stack

```bash
# Development (no Caddy/TLS)
docker compose up -d

# Production (with Caddy + HTTPS)
docker compose --profile production up -d
```

## Step 6: Run Migrations

```bash
docker compose exec api alembic upgrade head
```

## Step 7: Verify

- `https://YOUR_DOMAIN/docs` — API docs
- `https://YOUR_DOMAIN/health` — Health check

## Mobile App Configuration

Set `EXPO_PUBLIC_API_URL=https://YOUR_DOMAIN` in `apps/mobile/.env` before building.

## Troubleshooting

- **502 Bad Gateway**: Ensure API is running: `docker compose ps`
- **CORS errors**: Verify `CORS_ORIGINS` includes your app scheme
- **OAuth redirect**: Add `https://YOUR_DOMAIN/auth/callback` to GitHub OAuth app callback URLs (if using web callback)
