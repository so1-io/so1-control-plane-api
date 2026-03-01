import { Context, Next } from "hono";
import { v4 as uuidv4 } from "uuid";

/**
 * RequestId middleware: generates a unique UUID for each request
 * and attaches it to the context for propagation.
 */
export async function requestIdMiddleware(c: Context, next: Next) {
  const requestId = uuidv4();

  // Attach to context for downstream handlers
  c.set("requestId", requestId);

  // Add to response header for client tracing
  c.header("X-Request-Id", requestId);

  // Call next middleware/route
  await next();
}

/**
 * Get requestId from context (safe retrieval).
 */
export function getRequestId(c: Context): string {
  return (c.get("requestId") as string) || "unknown";
}
