# BFF Tasksets Overview

This directory captures remaining work for `so1-control-plane-api` as ordered, independently verifiable TASKSETS.

Execution protocol:
- Do not start a TASKSET until explicit confirmation: `GO TASKSET {N}`.

Recommended order:
1. TASKSET 1: Restore service health + deployment stability
2. TASKSET 2: CORS + console domain alignment
3. TASKSET 3: Auth/session endpoint contract hardening
4. TASKSET 4: Observability + runbooks
