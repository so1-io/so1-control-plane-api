import { Context, Next } from "hono";
import { getRequestId } from "./request-id";
import { getAuth, AuthContext } from "./auth";

/**
 * Structured logging middleware: logs request/response with requestId and auth context.
 */
export async function loggingMiddleware(c: Context, next: Next) {
  const requestId = getRequestId(c);
  const method = c.req.method;
  const path = c.req.path;
  const startTime = Date.now();

  // Log request
  console.log(`[${requestId}] ${method} ${path} - request started`);

  await next();

  // Log response
  const duration = Date.now() - startTime;
  const status = c.res.status;
  const auth = getAuth(c) as AuthContext | undefined;

  const logData = {
    requestId,
    method,
    path,
    status,
    duration_ms: duration,
    userId: auth?.userId || "anonymous",
    orgId: auth?.orgId || "unknown",
  };

  console.log(
    `[${requestId}] ${method} ${path} - ${status} (${duration}ms)`,
    logData
  );
}

/**
 * Structured error logging (called by error middleware).
 */
export function logError(
  requestId: string,
  code: string,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
) {
  const logData = {
    requestId,
    error: {
      code,
      message,
      statusCode,
      details,
    },
  };

  if (statusCode >= 500) {
    console.error(`[${requestId}] Server error:`, logData);
  } else {
    console.warn(`[${requestId}] Client error:`, logData);
  }
}
