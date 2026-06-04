/**
 * Platform HR is represented by users with userType `admin`.
 * There is no separate HR role in the schema.
 */

export function normalizeUserType(value: unknown): string {
  return (value ?? "").toString().toLowerCase().trim();
}

export function isHrUser(user: { userType?: unknown; user_type?: unknown } | null | undefined): boolean {
  if (!user) return false;
  const type = normalizeUserType((user as { userType?: unknown }).userType ?? (user as { user_type?: unknown }).user_type);
  return type === "admin";
}

export function isProfessionalUser(user: { userType?: unknown; user_type?: unknown } | null | undefined): boolean {
  if (!user) return false;
  const type = normalizeUserType((user as { userType?: unknown }).userType ?? (user as { user_type?: unknown }).user_type);
  return type === "professional" || type === "job_seeker";
}

export function isHrUserType(userType: unknown): boolean {
  return normalizeUserType(userType) === "admin";
}

export function isProfessionalUserType(userType: unknown): boolean {
  const type = normalizeUserType(userType);
  return type === "professional" || type === "job_seeker";
}

export function isEmployerUser(
  user: { userType?: unknown; user_type?: unknown } | null | undefined,
): boolean {
  if (!user) return false;
  const type = normalizeUserType(
    (user as { userType?: unknown }).userType ??
      (user as { user_type?: unknown }).user_type,
  );
  return type === "employer";
}

/**
 * Canonicalize raw application statuses so policy checks remain predictable.
 */
export function normalizeApplicationStatus(status: unknown): string {
  const normalized = normalizeUserType(status || "applied");
  if (!normalized) return "applied";

  if (["new", "pending"].includes(normalized)) return "applied";
  if (["review", "reviewing", "reviewed", "screening"].includes(normalized)) {
    return "under_review";
  }
  if (["interview", "interviewing"].includes(normalized)) return "interview";
  if (["shortlisted"].includes(normalized)) return "shortlisted";
  if (["accepted", "approved", "offer"].includes(normalized)) return "hired";
  if (["declined"].includes(normalized)) return "rejected";
  return normalized;
}

export type EmployeeMessagingAccess = {
  canSend: boolean;
  unlockReason: string | null;
};

/**
 * Policy for employee -> employer outbound messaging.
 * Conservative default: user can always reply once employer has messaged,
 * or proactively message when the application reaches later-stage pipeline states.
 */
export function resolveEmployeeMessagingAccess(
  status: unknown,
  employerHasMessaged: boolean,
): EmployeeMessagingAccess {
  const normalizedStatus = normalizeApplicationStatus(status);
  if (employerHasMessaged) {
    return { canSend: true, unlockReason: "employer_started_thread" };
  }

  const statusUnlocked = ["interview", "shortlisted", "hired"].includes(
    normalizedStatus,
  );
  if (statusUnlocked) {
    return { canSend: true, unlockReason: `status_${normalizedStatus}` };
  }

  return { canSend: false, unlockReason: "awaiting_recruiter_or_stage" };
}

export function employeeMessagingHint(
  status: unknown,
  employerHasMessaged: boolean,
): string {
  const access = resolveEmployeeMessagingAccess(status, employerHasMessaged);
  if (access.canSend) {
    return "Messaging is available for this application.";
  }
  return "You can message this recruiter after they contact you first or once your application reaches interview stage.";
}
