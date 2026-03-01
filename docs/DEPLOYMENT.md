# Deployment Guide: so1-control-plane-api

**Status**: TASKSET 2 - Skeleton Implementation  
**Last Updated**: March 1, 2026

This guide covers local development, Docker deployment, and production deployment strategies for the so1-control-plane-api (BFF) service.

---

## Local Development

### Prerequisites

- Node.js 20.x LTS
- npm 10.x or higher
- Git

### Setup

```bash
# Clone/navigate to repo
cd /home/devarno/code/lab/so1-io/platform-tools/so1-control-plane-api

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# - CLERK_SECRET_KEY (from https://dashboard.clerk.com)
# - GITHUB_TOKEN (from https://github.com/settings/tokens)
# - N8N_API_KEY, N8N_BASE_URL (from n8n instance)
```

### Running Dev Server

```bash
# Start with hot reload (uses tsx watch)
npm run dev

# Output:
# 🚀 so1-control-plane-api listening on http://localhost:3001
# 📝 Health check: GET http://localhost:3001/health
# 🔐 Session endpoint: GET http://localhost:3001/api/auth/session
```

### Testing Endpoints Locally

#### Health Check (no auth)

```bash
curl http://localhost:3001/health

# Response:
# {
#   "status": "ok",
#   "timestamp": "2026-03-01T10:00:00Z"
# }
```

#### Session Endpoint (with auth)

```bash
# Mock token format: clerk_<userId>_<orgId>
TOKEN="clerk_user123_org456"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/session

# Response (200):
# {
#   "requestId": "550e8400-e29b-41d4-a716-446655440000",
#   "session": {
#     "userId": "user123",
#     "orgId": "org456",
#     "email": "user_user123@example.com"
#   }
# }
```

#### Missing Auth Header (401 error)

```bash
curl http://localhost:3001/api/auth/session

# Response (401):
# {
#   "requestId": "550e8400-e29b-41d4-a716-446655440000",
#   "error": {
#     "code": "UNAUTHORIZED",
#     "message": "Missing or invalid authorization",
#     "details": {
#       "reason": "Missing Authorization header"
#     }
#   }
# }
```

---

## Docker Deployment

### Build Docker Image

```bash
cd /home/devarno/code/lab/so1-io/platform-tools/so1-control-plane-api

# Build image
docker build -t so1-control-plane-api:latest .

# Tag for registry (e.g., GCP Container Registry)
docker tag so1-control-plane-api:latest gcr.io/YOUR_PROJECT/so1-control-plane-api:latest
```

### Run with Docker

```bash
# Create .env file for Docker
cat > .env << EOF
NODE_ENV=production
PORT=3001
CLERK_SECRET_KEY=sk_test_...
GITHUB_TOKEN=ghp_...
N8N_API_KEY=...
N8N_BASE_URL=https://n8n.example.com
EOF

# Run container
docker run -p 3001:3001 \
  --env-file .env \
  --name so1-bff \
  so1-control-plane-api:latest

# Check health
curl http://localhost:3001/health
```

### Run with Docker Compose

```bash
# BFF only
docker-compose up bff

# Or with frontend (commented out by default)
# Uncomment 'console' service in docker-compose.yml first
docker-compose up

# Access
# BFF: http://localhost:3001
# Frontend: http://localhost:3000 (if enabled)
```

---

## Production Deployment

### Google Cloud Run

```bash
# Authenticate with GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT/so1-control-plane-api:latest

# Deploy to Cloud Run
gcloud run deploy so1-control-plane-api \
  --image gcr.io/YOUR_PROJECT/so1-control-plane-api:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars "NODE_ENV=production,CLERK_SECRET_KEY=sk_...,GITHUB_TOKEN=ghp_..." \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --allow-unauthenticated

# Get service URL
gcloud run services describe so1-control-plane-api --platform managed --region us-central1 --format="value(status.url)"
```

### AWS ECS (Fargate)

```bash
# 1. Push image to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag so1-control-plane-api:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/so1-control-plane-api:latest

docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/so1-control-plane-api:latest

# 2. Create ECS task definition (todo-fargate-task-def.json)
# 3. Create ECS service
# 4. Set up ALB + target group

# See AWS ECS documentation for detailed steps
```

### Environment Variables (Production)

All environment variables should be injected at runtime, never hardcoded:

```bash
# Use Cloud Run secrets or AWS Secrets Manager
# Example: GCP Secret Manager
gcloud secrets create CLERK_SECRET_KEY --replication-policy="automatic"
echo "sk_test_..." | gcloud secrets versions add CLERK_SECRET_KEY --data-file=-

# Reference in deployment
gcloud run deploy ... --set-env-vars CLERK_SECRET_KEY=/secrets/CLERK_SECRET_KEY
```

---

## Monitoring & Health Checks

### Health Check Endpoint

```
GET /health
Response: { "status": "ok", "timestamp": "..." }
HTTP 200
```

This endpoint:
- Requires **no authentication**
- Returns immediately with service status
- Used by Kubernetes liveness/readiness probes
- Used by load balancers for health monitoring

### Logging

All requests are logged with structured format:

```json
{
  "timestamp": "2026-03-01T10:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/auth/session",
  "status": 200,
  "duration_ms": 45,
  "userId": "user_123",
  "orgId": "org_456"
}
```

**LogLevel**: set via `LOG_LEVEL` environment variable (default: `debug`)

### RequestId Tracing

Every request generates a unique `requestId` (UUID) that:
- Is logged with every log line
- Is returned in response header: `X-Request-Id`
- Is forwarded to external API calls
- Can be used to correlate logs across services

Example: if you see an error, use the `requestId` to find all related logs.

---

## Scaling Considerations

### Horizontal Scaling

The BFF is **stateless** and can be scaled horizontally:

```bash
# Run multiple instances behind a load balancer
docker run -p 3001:3001 so1-control-plane-api:latest &
docker run -p 3002:3001 so1-control-plane-api:latest &
docker run -p 3003:3001 so1-control-plane-api:latest &

# Load balancer routes /health -> all instances
```

### Resource Requirements

**Minimum** (for local dev):
- CPU: 0.25 cores
- Memory: 256 MB

**Recommended** (production):
- CPU: 1-2 cores
- Memory: 512 MB - 1 GB
- Disk: ephemeral only (stateless)

### Performance Targets

- **Latency**: <100ms (health check), <200ms (auth), <500ms (external API calls)
- **Throughput**: 1000+ req/s per instance
- **Availability**: 99.9% (managed by Cloud Run/ECS autoscaling)

---

## Troubleshooting

### Service won't start

**Error**: `Cannot find module '@so1/shared'`

**Solution**: Ensure npm workspaces are configured (coming in TASKSET 4), or copy types manually.

### Auth failures

**Error**: `Missing or invalid authorization`

**Check**:
1. Is Authorization header present?
2. Does it follow format: `Authorization: Bearer <token>`?
3. Is token in mock format: `clerk_<userId>_<orgId>`?

### RequestId not propagating

**Check**:
1. All middleware is mounted in correct order (requestId must be first)
2. Logs are checking `c.get("requestId")`
3. External API calls include `X-Request-Id` header

### High latency on external API calls

**Typical causes**:
- GitHub/n8n API is slow (check their status page)
- Network connectivity issues (check VPC/security groups)
- No connection pooling (implementation issue in adapters)

**Solution**: Add caching (TASKSET 4), implement retries (TASKSET 5).

---

## Rollback Strategy

If a deployment fails:

```bash
# GCP Cloud Run: Automatic rollback
gcloud run deploy so1-control-plane-api \
  --image gcr.io/YOUR_PROJECT/so1-control-plane-api:PREVIOUS_TAG

# AWS ECS: Update service with previous task definition
aws ecs update-service --cluster production \
  --service so1-control-plane-api \
  --task-definition so1-control-plane-api:PREVIOUS_VERSION
```

All requests will be directed to the previous version within seconds.

---

## Next Steps (Future TASKSETs)

- **TASKSET 3**: Integrate Clerk backend verification (replace mock auth)
- **TASKSET 4**: Add caching + Redis integration
- **TASKSET 5**: Implement job queue + streaming endpoints
- **TASKSET 6+**: Add GitHub/n8n/MCP adapters
- **TASKSET 9**: Add comprehensive monitoring + observability

---

## Support

For issues:
1. Check logs with `requestId` from error response
2. Verify `.env.local` has all required variables
3. Test with curl (see examples above)
4. Check GitHub issues or open a new one
