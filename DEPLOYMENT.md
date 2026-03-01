# so1-control-plane-api Deployment Guide

## Quick Start with Railway

Railway is the easiest way to deploy Node.js apps:

1. Go to [Railway.app](https://railway.app)
2. Create a new project → "Deploy from GitHub"
3. Select `so1-io/so1-control-plane-api`
4. Add environment variables (see `.env.example`)
5. Deploy → Auto-deploys on push to `main`

Your BFF will be available at: `https://<project-name>.up.railway.app`

Then set in Vercel:
```
NEXT_PUBLIC_BFF_URL=https://<project-name>.up.railway.app
```

## Architecture

The BFF brokers access to:
- **Clerk** (authentication)
- **GitHub** (org/repo management)
- **n8n** (workflow orchestration)
- **MCP** (tool invocation)

```
Frontend (Vercel) → BFF (Railway/Heroku) → External Services
```

## Environment Variables

All variables must be set before deployment:

- **CLERK_SECRET_KEY**: From Clerk dashboard
- **GITHUB_TOKEN**: GitHub personal access token
- **N8N_API_KEY**: n8n API key
- **N8N_BASE_URL**: n8n instance URL

## Other Deployment Options

### Heroku
```bash
heroku create so1-control-plane-api
heroku config:set CLERK_SECRET_KEY=... GITHUB_TOKEN=... etc
git push heroku main
```

### Docker (Self-Hosted)

The Docker build requires a GitHub token to install `@so1-io/shared` from GitHub Packages:

```bash
# Build with GitHub token
docker build \
  --build-arg GITHUB_TOKEN=$(gh auth token) \
  -t so1-control-plane-api .

# Run
docker run -p 3001:3001 -e PORT=3001 so1-control-plane-api
```

For CI/CD, use a GitHub Actions secret or PAT with `read:packages` scope.

## Local Development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

The BFF runs at `http://localhost:3001`

## Health Check

```bash
curl https://<your-bff-url>/health
# Response: { "status": "ok" }
```

## Troubleshooting

**"Connection refused"** → Check environment variables are set  
**"Invalid token"** → Verify CLERK_SECRET_KEY and GITHUB_TOKEN  
**"Frontend can't reach BFF"** → Check CORS headers and `NEXT_PUBLIC_BFF_URL` in Vercel
