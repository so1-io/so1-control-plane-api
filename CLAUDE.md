# so1-control-plane-api — Agent Instructions

`so1-control-plane-api` is a Hono-based Backend-for-Frontend (BFF) service. It brokers Clerk auth, coordinates access to GitHub/n8n/MCP, enforces RBAC, and maintains audit logs.

## Key Rules

1. **Clerk session is the trust boundary**. Validate every request via `verifyAuth()` middleware (checks `Authorization` header for Clerk session token).
2. **Never expose secrets to the browser**. GitHub/n8n/MCP tokens are stored server-side in a secrets manager (KMS/Vault). BFF exchanges them for browser-safe session tokens.
3. **Consistent error envelope**. All errors return `{ requestId, error: { code, message, details } }` (see ADR-004).
4. **Adapter pattern for integrations**. Each service (GitHub, n8n, MCP) has a `lib/adapters/{service}.ts` file that encapsulates API calls, error handling, and response transformation.
5. **Propagate requestId everywhere**. Every log line and downstream call includes `requestId` for traceability (OpenTelemetry).
6. **One-way dependencies**: depends on `@so1/shared` for types; no dependency on `so1-console`.

## Repository Structure

```
src/
  index.ts                  # Hono app setup, middleware, route mounting
  middleware/
    auth.ts                 # Clerk session validation
    request-id.ts           # Generate/propagate requestId
    logger.ts               # Structured logging with OpenTelemetry
    error-handler.ts        # Catch-all error wrapper
  routes/
    health.ts               # Health check (no auth)
    auth.ts                 # Session info endpoint
    catalog.ts              # GitHub org/repo endpoints
    workflows.ts            # n8n workflow endpoints
    jobs.ts                 # Job status/logs endpoints
    mcp.ts                  # MCP registry/invoke endpoints
  lib/
    adapters/
      github.ts             # GitHub API client
      n8n.ts                # n8n API client
      mcp.ts                # MCP broker
    errors.ts               # Error envelope and codes
    secrets.ts              # Credential store access (stub)
    audit.ts                # Audit log builder
```

## Development

- `npm run dev` — Start Hono with hot reload (via `tsx watch`)
- `npm run build && npm start` — Build and run production server
- `npm run lint` — Run ESLint

## Testing

TBD in TASKSET 9. Placeholder: MSW (Mock Service Worker) for mocking external APIs.

## Debugging Tips

- **Auth failures**: check `CLERK_SECRET_KEY` is set and Clerk token in `Authorization` header is valid
- **Integration failures**: enable `DEBUG=*` environment variable to see adapter logs
- **RequestId missing**: verify `request-id` middleware is mounted before routes
