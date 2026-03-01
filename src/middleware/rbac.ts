import { Context } from "hono";
import { ErrorCode } from "@so1-io/shared";
import { getAuth, requireAuth } from "./auth";
import { throwApiError } from "./error-handler";

/**
 * Permission levels for resources.
 */
export enum Permission {
  VIEW = "view",
  EDIT = "edit",
  DELETE = "delete",
  ADMIN = "admin",
}

/**
 * Check if user has permission for a resource in their org.
 *
 * TODO: In TASKSET 4+, integrate with actual permission model:
 * - Read org membership from directory
 * - Evaluate RBAC rules (role-based or attribute-based)
 * - Cache permissions with TTL
 *
 * For TASKSET 2: stub implementation (always allow if authenticated in org).
 */
export function checkPermission(
  c: Context,
  requiredPermission: Permission
): boolean {
  const auth = getAuth(c);
  if (!auth) {
    return false;
  }

  // TODO: Replace with actual permission evaluation
  // For now, stub: any authenticated user in the org can view/edit
  if (requiredPermission === Permission.ADMIN) {
    // Only mock admin check (would check role in real implementation)
    return false;
  }

  return true;
}

/**
 * Require specific permission or throw 403.
 */
export function requirePermission(
  c: Context,
  requiredPermission: Permission
): void {
  const auth = requireAuth(c);
  const requestId = c.get("requestId") || "unknown";

  if (!checkPermission(c, requiredPermission)) {
    console.log(
      `[${requestId}] Permission denied: ${requiredPermission} for ${auth.userId}`
    );
    throwApiError(
      ErrorCode.FORBIDDEN,
      `You do not have permission to perform this action`,
      403,
      {
        required: requiredPermission,
        orgId: auth.orgId,
      }
    );
  }
}

/**
 * Require user to be in a specific org (org scoping).
 */
export function requireOrgAccess(c: Context, requiredOrgId: string): void {
  const auth = requireAuth(c);
  const requestId = c.get("requestId") || "unknown";

  if (auth.orgId !== requiredOrgId) {
    console.log(
      `[${requestId}] Org access denied: user ${auth.userId} not in org ${requiredOrgId}`
    );
    throwApiError(
      ErrorCode.FORBIDDEN,
      `You do not have access to this organization`,
      403,
      {
        requestedOrg: requiredOrgId,
        userOrg: auth.orgId,
      }
    );
  }
}
