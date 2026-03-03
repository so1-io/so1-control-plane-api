# TASKSET 3 — Auth/Session Endpoint Contract Hardening

Goal: make `/api/auth/session` stable and predictable for console.

Deliverable
- `GET /api/auth/session` returns:
  - 200 with `{ requestId, session: { userId, orgId?, email? } }` when token valid
  - 401 with standard error envelope when token missing/invalid

Notes
- `orgId` may be null if user has not selected an org.

Verification
- With valid Clerk token: returns 200
- Without token: returns 401 + envelope
