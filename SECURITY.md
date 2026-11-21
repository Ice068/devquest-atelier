# Security Architecture — DevQuest Atelier

## Security Controls Implemented

| Layer | Control | Implementation |
|---|---|---|
| **Password Storage** | Salted Adaptive Hashing | `bcrypt` (12 rounds) via `app/core/security.py` — plaintext passwords are never stored or logged. |
| **Authentication** | Signed JWT + Instant Revocation | `PyJWT` (HS256) with unique `jti`, `iat`, `exp`, `type="access"`. `POST /auth/logout` revokes the `jti` immediately. |
| **Authorization (Anti-IDOR)** | Server-Derived Identity | `/users/me`, `/users/me/exp`, and `/users/me/quests/{id}/complete` read `sub` exclusively from the verified JWT — never from client-supplied user IDs. |
| **Input Validation** | Strict Schemas | Pydantic v2 regex & length limits on usernames, password complexity, bounded EXP updates (`1–1000`), and strict quest ID allowlist (`lesson-1..12`, `boss-1..2`). |
| **Brute-Force Protection** | Per-IP Rate Limiting | `slowapi`: `/auth/signup` (5/min), `/auth/login` (10/min), `/auth/logout` (20/min), `/ai/solo-analyze` (20/min). |
| **Browser Security** | CSP + Security Headers + Sandboxed Iframe | `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS (production). Learner HTML executes only inside `<iframe sandbox="allow-scripts">`. |
| **Database Isolation** | Default-Deny Firestore Rules | `firestore.rules` blocks all direct browser/client reads and writes (`allow read, write: if false`). Only the FastAPI backend (Admin SDK) accesses Firestore. |
| **AI Safety** | Prompt-Injection Guardrails | Untrusted student HTML is length-capped, control-char stripped, fenced as untrusted data, and paired with a no-spoiler Socratic system instruction. |
| **Container Hardening** | Multi-stage Non-Root Docker | Runs as unprivileged `appuser` with `ENABLE_DOCS=false` and built-in `HEALTHCHECK`. |
| **CI/CD Security Gates** | Automated SAST & Audit | GitHub Actions runs `ruff`, `bandit` (SAST), `pip-audit` (CVEs), `pytest`, and JS syntax validation on every PR. |
