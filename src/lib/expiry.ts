export type ExpiryStatus = "expired" | "expiring-soon" | "ok" | "unknown";

export interface ExpiryInfo {
  daysToExpiry: number | null;
  expiryStatus: ExpiryStatus;
}

/** Medical stock within this window needs action (return to supplier,
 * discount, or destroy) before it becomes an unsellable write-off. */
export const EXPIRING_SOON_WINDOW_DAYS = 60;

export function computeExpiryInfo(expiryDate: string | null): ExpiryInfo {
  if (!expiryDate) return { daysToExpiry: null, expiryStatus: "unknown" };

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return { daysToExpiry: null, expiryStatus: "unknown" };

  const today = new Date();
  const daysToExpiry = Math.floor((expiry.getTime() - today.getTime()) / 86400000);

  if (daysToExpiry <= 0) return { daysToExpiry, expiryStatus: "expired" };
  if (daysToExpiry <= EXPIRING_SOON_WINDOW_DAYS) return { daysToExpiry, expiryStatus: "expiring-soon" };
  return { daysToExpiry, expiryStatus: "ok" };
}
