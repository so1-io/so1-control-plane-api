# TASKSET 1 — Restore Service Health + Deployment Stability

Goal: bring `control.so1.io` back online and ensure Railway deploys are deterministic.

Deliverable
- `GET https://control.so1.io/health` returns 200 with JSON payload.
- Railway deployment completes successfully from `main`.

Investigation checklist
- Railway deploy logs:
  - build errors (TypeScript, missing files)
  - runtime crash loops (port binding, env vars)
- Validate start command and `PORT` binding.

Verification
- Local: `npm ci && npm run build && npm start`
- Remote: `curl -s https://control.so1.io/health`
