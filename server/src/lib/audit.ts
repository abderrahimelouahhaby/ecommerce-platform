import { logger } from "./logger.js";

// One log line for each sensitive admin action: who did what, on what.
export function logAdminAction(
  adminId: string,
  action: string,
  details: Record<string, unknown> = {},
): void {
  logger.info({ audit: true, adminId, action, ...details }, "Admin action");
}
