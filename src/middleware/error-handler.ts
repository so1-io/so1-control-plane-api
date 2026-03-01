import { Context } from "hono";
import { ErrorCode, buildErrorEnvelope } from "@so1/shared";
import { getRequestId } from "./request-id";

/**
 * API error class for structured error handling.
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Error handler middleware: catches all errors and returns ErrorEnvelope.
 */
export async function errorMiddleware(
  err: unknown,
  c: Context
): Promise<Response> {
  const requestId = getRequestId(c);

  // Handle known ApiError instances
  if (err instanceof ApiError) {
    const envelope = buildErrorEnvelope(
      requestId,
      err.code,
      err.message,
      err.details
    );
    return c.json(envelope, err.statusCode as any);
  }

  // Handle standard Error instances
  if (err instanceof Error) {
    const envelope = buildErrorEnvelope(
      requestId,
      ErrorCode.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
      { originalMessage: err.message }
    );
    console.error(`[${requestId}] Unhandled error:`, err);
    return c.json(envelope, 500 as any);
  }

  // Handle unknown errors
  const envelope = buildErrorEnvelope(
    requestId,
    ErrorCode.INTERNAL_SERVER_ERROR,
    "An unknown error occurred"
  );
  console.error(`[${requestId}] Unknown error:`, err);
  return c.json(envelope, 500 as any);
}

/**
 * Helper function to throw an API error.
 */
export function throwApiError(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): never {
  throw new ApiError(code, message, statusCode, details);
}
