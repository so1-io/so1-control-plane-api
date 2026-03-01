# so1-control-plane-api

Backend-for-Frontend (BFF) service for the so1 platform. Brokers authentication, authorization, and access to GitHub, n8n, and MCP services. Handles session management, RBAC enforcement, token exchange, long-running job orchestration, and audit logging.

## What It Is

A Hono-based Node.js service that acts as a secure aggregation layer between `so1-console` and external integrations (GitHub, n8n, MCP). It enforces Clerk OIDC authentication, manages organization/project membership, brokers credentials securely (tokens never exposed to browser), and provides a unified error model and audit trail.

## What It Is Not

- **Not a general-purpose API gateway**: specific to so1-console needs
- **Not a message queue or worker service**: job execution runs separately (see TASKSET 5)
- **Not a database service**: doesn't own persistence (integrates with external systems)

## Repository Layout

- `src/index.ts` — Hono app entrypoint (middleware, routes)
- `src/middleware/` — auth, requestId, logging, error handling
- `src/routes/` — feature routes (catalog, workflows, jobs, mcp, etc.)
- `src/lib/` — adapters (GitHub, n8n, MCP), error models, utils
- `docs/` — API contract, deployment, security model
- `.github/workflows/` — CI/CD pipelines

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3001)
npm run dev

# Build and start
npm run build
npm start
```

Environment variables (see `.env.example` after first run):
- `CLERK_SECRET_KEY` — Clerk API secret
- `GITHUB_TOKEN` — GitHub org token (for API calls)
- `N8N_API_KEY` — n8n API key
- `N8N_BASE_URL` — n8n instance URL
- `OTEL_EXPORTER_OTLP_ENDPOINT` — OpenTelemetry collector (optional)

## Status

- Status: `draft`
- Versioning: semantic (major.minor.patch); tagged at releases

## Architecture Decision Records

See `_meta/adr/` at workspace root for design decisions:
- `001-auth.md` — Clerk OIDC, session, token exchange strategy
- `002-bff.md` — Hono rationale, same-origin, adapter pattern
- `003-job-model.md` — Long-running job lifecycle and streaming
- `004-error-envelope.md` — Standard error shapes and codes
