# TASKSET 2 — CORS + Console Domain Alignment

Goal: allow the console to call BFF endpoints from production while keeping origins tight.

Deliverable
- Requests from `https://console.so1.io` succeed (preflight + actual).

Notes
- If console uses same-origin proxying, browser CORS needs are minimized.

Files likely touched
- `src/index.ts` (CORS middleware)

Verification
- `OPTIONS /health` with Origin header returns expected CORS headers.
