export const USER_ACCOUNT_STATUSES = ["active", "pending", "suspended", "flagged"] as const;

export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];

export function normalizeAccountStatus(value: unknown): UserAccountStatus {
  const normalized = String(value ?? "active").toLowerCase().trim();
  if ((USER_ACCOUNT_STATUSES as readonly string[]).includes(normalized)) {
    return normalized as UserAccountStatus;
  }
  return "active";
}

export function readAccountStatusFromRow(row: Record<string, unknown>): UserAccountStatus {
  return normalizeAccountStatus(
    row.accountStatus ?? row.account_status ?? row.status ?? "active",
  );
}

export function accountStatusBlocksLogin(status: UserAccountStatus): boolean {
  return status === "suspended" || status === "flagged";
}

export function accountStatusLoginMessage(status: UserAccountStatus): string {
  if (status === "suspended") {
    return "Your account has been suspended. Please contact SkillConnect support.";
  }
  if (status === "flagged") {
    return "Your account is under review after automated moderation. Please contact support.";
  }
  return "Account access is restricted.";
}
