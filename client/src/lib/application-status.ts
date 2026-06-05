/** Normalize backend application status for UI filters and labels */
export function normalizeApplicationStatus(status?: string | null): string {
  const s = String(status || "applied").toLowerCase();
  if (["applied"].includes(s)) return "applied";
  if (["pending", "review", "reviewing", "reviewed"].includes(s)) return "reviewed";
  if (["interview", "interviewing"].includes(s)) return "interview";
  if (["accepted", "approved", "offer"].includes(s)) return "accepted";
  if (["rejected", "declined"].includes(s)) return "rejected";
  return s;
}

export function getStatusLabel(status?: string | null): string {
  switch (normalizeApplicationStatus(status)) {
    case "accepted":
      return "Offer Received";
    case "rejected":
      return "Not Selected";
    case "reviewed":
      return "Under Review";
    case "interview":
      return "Interview Stage";
    case "applied":
      return "Application Sent";
    default:
      return "Application Sent";
  }
}

export const DEFAULT_STATUS_EXPLANATIONS: Record<string, string> = {
  applied: "Your application was received and is in the employer queue.",
  reviewed: "Recruiters are reviewing your profile against the role requirements.",
  interview: "You're in the interview stage. Respond promptly in Messages.",
  accepted: "Congratulations — this application reached an offer or acceptance stage.",
  rejected: "This role wasn't a match this time. Use Activity insights for your next steps.",
};
