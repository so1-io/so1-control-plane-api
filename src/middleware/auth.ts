import { Context, Next } from "hono";
import { ErrorCode } from "@so1-io/shared";
import { throwApiError } from "./error-handler";
import { getRequestId } from "./request-id";

/**
 * Auth context attached to request.
 */
export interface AuthContext {
  userId: string;
  orgId: string;
  email?: string;
  sessionId?: string;
}

/**
 * Clerk session validation middleware.
 *
 * Expects Clerk session token in Authorization header:
 *   Authorization: Bearer <clerk_session_token>
 *
 * In production, this would call Clerk's backend API to verify the token.
 * For TASKSET 2, we stub it with a simple check and mock verification.
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const requestId = getRequestId(c);

  // Check if Authorization header exists
  if (!authHeader) {
    console.log(`[${requestId}] Missing Authorization header`);
    throwApiError(
      ErrorCode.UNAUTHORIZED,
      "Missing or invalid authorization",
      401,
      { reason: "Missing Authorization header" }
    );
  }

  // Extract token from "Bearer <token>" format
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.log(`[${requestId}] Malformed Authorization header`);
    throwApiError(
      ErrorCode.UNAUTHORIZED,
      "Missing or invalid authorization",
      401,
      { reason: "Malformed Authorization header" }
    );
  }

  const token = parts[1];

  // TODO: In TASKSET 2 final, integrate actual Clerk backend verification.
  // For now, we'll parse a simple mock token format: "clerk_<userId>_<orgId>"
  // Production: await verifySessionToken(token, clerkSecretKey)
  if (!token.startsWith("clerk_")) {
    console.log(`[${requestId}] Invalid token format`);
    throwApiError(
      ErrorCode.UNAUTHORIZED,
      "Missing or invalid authorization",
      401,
      { reason: "Invalid token format" }
    );
  }

  // Mock token parsing (production: verify with Clerk)
  const tokenParts = token.split("_");
  if (tokenParts.length < 3) {
    console.log(`[${requestId}] Invalid token structure`);
    throwApiError(
      ErrorCode.UNAUTHORIZED,
      "Missing or invalid authorization",
      401
    );
  }

  const userId = tokenParts[1];
  const orgId = tokenParts[2];

  // Attach auth context to request
  const authContext: AuthContext = {
    userId,
    orgId,
    email: `user_${userId}@example.com`, // mock
    sessionId: token,
  };

  c.set("auth", authContext);
  console.log(`[${requestId}] Authorized: userId=${userId}, orgId=${orgId}`);

  await next();
}

/**
 * Optional: protected route wrapper that requires authentication.
 * Can be used in route definitions for additional security.
 */
export async function protectedRoute(c: Context, next: Next) {
  const auth = c.get("auth") as AuthContext | undefined;
  if (!auth) {
    const requestId = getRequestId(c);
    console.log(`[${requestId}] Protected route accessed without auth`);
    throwApiError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      401
    );
  }
  await next();
}

/**
 * Get auth context from request (safe retrieval).
 */
export function getAuth(c: Context): AuthContext | undefined {
  return c.get("auth");
}

/**
 * Require auth context, throw if missing.
 */
export function requireAuth(c: Context): AuthContext {
  const auth = getAuth(c);
  if (!auth) {
    const requestId = getRequestId(c);
    throwApiError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      401
    );
  }
  return auth;
}
