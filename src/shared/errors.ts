import { z } from "zod";

/**
 * Standard error envelope returned by all BFF endpoints.
 * Includes requestId for traceability.
 */
export const ErrorEnvelopeSchema = z.object({
  requestId: z.string().uuid().describe("Unique request ID for tracing"),
  error: z.object({
    code: z.string().describe("Machine-readable error code"),
    message: z.string().describe("Human-readable error message"),
    details: z.record(z.string(), z.unknown()).optional().describe("Additional error context"),
  }),
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/**
 * Success response envelope (optional; many endpoints just return data).
 */
export const SuccessEnvelopeSchema = z.object({
  requestId: z.string().uuid(),
  data: z.unknown(),
});

export type SuccessEnvelope = z.infer<typeof SuccessEnvelopeSchema>;

/**
 * Error code enum.
 */
export enum ErrorCode {
  // Auth errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // Validation errors
  BAD_REQUEST = "BAD_REQUEST",
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // Not found
  NOT_FOUND = "NOT_FOUND",

  // Integration errors
  GITHUB_ERROR = "GITHUB_ERROR",
  N8N_ERROR = "N8N_ERROR",
  MCP_ERROR = "MCP_ERROR",

  // Server errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

/**
 * Build an error envelope.
 */
export function buildErrorEnvelope(
  requestId: string,
  code: ErrorCode | string,
  message: string,
  details?: Record<string, unknown>
): ErrorEnvelope {
  return {
    requestId,
    error: {
      code,
      message,
      details,
    },
  };
}
