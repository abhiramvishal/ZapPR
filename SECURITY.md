# ZapPR Security Notes

## Threat Model (Summary)

| Threat | Mitigation |
|--------|------------|
| API key leakage | Claude key stored only in device SecureStore; never sent to backend except transiently per request; backend never persists |
| GitHub token compromise | Stored encrypted (AES-GCM) at rest; least-privilege OAuth scope (`repo`) |
| Malicious patches | Validation: blocked paths (.env, *.pem, secrets), file/line limits, secrets scan in diff |
| Injection / XSS | Pydantic validation; no file contents in logs |
| Rate abuse | Rate limiting on agent endpoints (10 req/min per user) |

## Security Requirements

- **OAuth scopes**: `repo` for full repo access. For public-only: `public_repo`.
- **JWT**: Short expiry (configurable, default 60 min); HS256 with strong secret.
- **CORS**: Lock to app scheme and API domain in production.
- **HTTPS**: Enforced via Caddy; HSTS header.
- **Request limits**: Patch size capped (100KB); Pydantic max lengths on inputs.
- **Logging**: No file contents, no API keys, no tokens in logs.

## Blocked Patch Paths

- `.env`, `.env.*`
- `*.pem`, `*.key`
- `secrets.*`, `*.secret`
- `config/secrets`, `*.credentials`
- `id_rsa`, `id_ed25519`

## Secrets Scanning

Diffs are scanned for patterns: `sk-*` (Anthropic/OpenAI), `ghp_*`, `gho_*`, AWS keys. Matches cause validation failure.
