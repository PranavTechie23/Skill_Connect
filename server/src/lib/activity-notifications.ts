import type { Storage } from "../storage";

const STATUS_LABELS: Record<string, string> = {
  applied: "Application received",
  pending: "Under review",
  reviewing: "Under review",
  reviewed: "Under review",
  review: "Under review",
  interview: "Interview stage",
  accepted: "Offer received",
  approved: "Approved",
  offer: "Offer received",
  rejected: "Not selected",
};

function statusTitle(status: string): string {
  return STATUS_LABELS[status.toLowerCase()] ?? "Application updated";
}

function statusBody(status: string, jobTitle: string): string {
  const label = statusTitle(status);
  switch (status.toLowerCase()) {
    case "interview":
      return `Your application for ${jobTitle} moved to the interview stage. Check messages for scheduling details.`;
    case "accepted":
    case "approved":
    case "offer":
      return `Great news — your application for ${jobTitle} has progressed to an offer stage.`;
    case "rejected":
      return `Your application for ${jobTitle} was not selected this time. Keep applying — the right role is out there.`;
    case "reviewed":
    case "reviewing":
    case "review":
    case "pending":
      return `Recruiters are reviewing your application for ${jobTitle}.`;
    default:
      return `${label} for ${jobTitle}.`;
  }
}

export async function notifyApplicationStatusChange(
  storage: Storage,
  params: {
    applicantId: string;
    applicationId: number | string;
    newStatus: string;
    oldStatus?: string | null;
    jobTitle?: string;
  }
): Promise<void> {
  const { applicantId, applicationId, newStatus, oldStatus, jobTitle = "your role" } = params;
  if (oldStatus && oldStatus.toLowerCase() === newStatus.toLowerCase()) return;

  await storage.createNotification({
    userId: applicantId,
    type: "application_status",
    title: statusTitle(newStatus),
    body: statusBody(newStatus, jobTitle),
    metadata: { applicationId: String(applicationId), status: newStatus },
    linkTab: "applications",
    isRead: false,
  });
}

export async function notifyApplicationSubmitted(
  storage: Storage,
  params: { applicantId: string; applicationId: number | string; jobTitle?: string }
): Promise<void> {
  const jobTitle = params.jobTitle ?? "the position";
  await storage.createNotification({
    userId: params.applicantId,
    type: "application_submitted",
    title: "Application submitted",
    body: `You applied for ${jobTitle}. We'll notify you when there's an update.`,
    metadata: { applicationId: String(params.applicationId) },
    linkTab: "applications",
    isRead: false,
  });
}

export async function notifyNewMessage(
  storage: Storage,
  params: {
    receiverId: string;
    senderName: string;
    preview: string;
    applicationId?: number | null;
  }
): Promise<void> {
  const preview =
    params.preview.length > 120 ? `${params.preview.slice(0, 117)}...` : params.preview;

  await storage.createNotification({
    userId: params.receiverId,
    type: "new_message",
    title: `Message from ${params.senderName}`,
    body: preview,
    metadata: {
      applicationId: params.applicationId != null ? String(params.applicationId) : undefined,
    },
    linkTab: "messages",
    isRead: false,
  });
}
