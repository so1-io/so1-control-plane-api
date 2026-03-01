import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestIdMiddleware, getRequestId } from "./middleware/request-id";
import { loggingMiddleware } from "./middleware/logging";
import { authMiddleware, getAuth } from "./middleware/auth";
import { errorMiddleware, throwApiError } from "./middleware/error-handler";
import { ErrorCode } from "@so1/shared";

// Initialize Hono app
const app = new Hono();

// === GLOBAL MIDDLEWARE ===

// CORS middleware (allow requests from so1-console origin)
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost"],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["X-Request-Id"],
  })
);

// RequestId middleware (must be first to attach requestId to all requests)
app.use("*", requestIdMiddleware);

// Logging middleware (logs all requests/responses)
app.use("*", loggingMiddleware);

// === UNPROTECTED ROUTES ===

// Health check endpoint (no authentication required)
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// === PROTECTED ROUTES ===

// Auth middleware (requires Authorization header for all routes below this)
app.use("/api/*", authMiddleware);

/**
 * Session info endpoint: returns authenticated user's session details.
 * GET /api/auth/session
 * Authorization: Bearer <clerk_token>
 *
 * Response: { requestId, userId, orgId, email }
 */
app.get("/api/auth/session", (c) => {
  const auth = getAuth(c);
  if (!auth) {
    throwApiError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      401
    );
  }

  return c.json({
    requestId: getRequestId(c),
    session: {
      userId: auth.userId,
      orgId: auth.orgId,
      email: auth.email,
    },
  });
});

/**
 * Placeholder: Catalog endpoints (GitHub repos).
 * Implemented in TASKSET 6.
 */
app.get("/api/catalog/repos", (c) => {
  return c.json({
    requestId: getRequestId(c),
    message: "Catalog endpoint - coming in TASKSET 6",
    repos: [],
  });
});

/**
 * Placeholder: Workflow endpoints (n8n workflows).
 * Implemented in TASKSET 7.
 */
app.get("/api/workflows", (c) => {
  return c.json({
    requestId: getRequestId(c),
    message: "Workflows endpoint - coming in TASKSET 7",
    workflows: [],
  });
});

/**
 * Placeholder: Job endpoints (long-running jobs).
 * Implemented in TASKSET 5.
 */
app.post("/api/jobs", (c) => {
  return c.json(
    {
      requestId: getRequestId(c),
      message: "Job creation endpoint - coming in TASKSET 5",
      jobId: "placeholder",
    },
    202
  );
});

app.get("/api/jobs/:jobId", (c) => {
  return c.json({
    requestId: getRequestId(c),
    message: "Job status endpoint - coming in TASKSET 5",
  });
});

/**
 * Placeholder: MCP endpoints (MCP registry and invocation).
 * Implemented in TASKSET 8.
 */
app.get("/api/mcp/registry", (c) => {
  return c.json({
    requestId: getRequestId(c),
    message: "MCP registry endpoint - coming in TASKSET 8",
    tools: [],
  });
});

// === 404 HANDLER ===

app.all("*", (c) => {
  const requestId = getRequestId(c);
  return c.json(
    {
      requestId,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: "Endpoint not found",
        details: {
          method: c.req.method,
          path: c.req.path,
        },
      },
    },
    404 as any
  );
});

// === ERROR HANDLER ===

app.onError(errorMiddleware);

// === STARTUP ===

const port = process.env.PORT || 3001;
console.log(`🚀 so1-control-plane-api listening on http://localhost:${port}`);
console.log(`📝 Health check: GET http://localhost:${port}/health`);
console.log(`🔐 Session endpoint: GET http://localhost:${port}/api/auth/session`);

export default app;
