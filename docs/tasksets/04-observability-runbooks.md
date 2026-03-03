# TASKSET 4 — Observability + Runbooks

Goal: make failures diagnosable quickly.

Deliverable
- Logs include `requestId` and route/method/status.
- Runbook documents how to verify health and inspect Railway logs.

Files likely touched
- `docs/DEPLOYMENT.md` (or new `docs/RUNBOOK.md`)
- `src/middleware/logging.ts`
- `src/middleware/request-id.ts`
