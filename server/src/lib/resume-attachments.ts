import path from "node:path";

export type ResumeSummary = {
  resumeUrl: string;
  originalName: string;
};

type ResumeAttachmentLike = {
  filename?: unknown;
  originalName?: unknown;
  path?: unknown;
  url?: unknown;
  resumeUrl?: unknown;
  name?: unknown;
};

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePossiblyJson(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return raw;
  }
}

function normalizeResumeUrl(value: unknown): string | null {
  const raw = asNonEmptyString(value);
  if (!raw) return null;
  return raw.replace(/\\/g, "/");
}

function getBestName(candidate: ResumeAttachmentLike, resumeUrl: string): string {
  const explicitName =
    asNonEmptyString(candidate.originalName) ??
    asNonEmptyString(candidate.name) ??
    asNonEmptyString(candidate.filename);
  if (explicitName) return explicitName;
  return path.basename(resumeUrl) || "resume";
}

function toSummary(candidate: ResumeAttachmentLike): ResumeSummary | null {
  const resumeUrl =
    normalizeResumeUrl(candidate.path) ??
    normalizeResumeUrl(candidate.url) ??
    normalizeResumeUrl(candidate.resumeUrl) ??
    normalizeResumeUrl(candidate.filename);
  if (!resumeUrl) return null;
  return {
    resumeUrl,
    originalName: getBestName(candidate, resumeUrl),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function resumeSummaryFromRaw(raw: unknown): ResumeSummary | null {
  const parsed = parsePossiblyJson(raw);

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (!isRecord(item)) continue;
      const summary = toSummary(item);
      if (summary) return summary;
    }
    return null;
  }

  if (isRecord(parsed)) {
    return toSummary(parsed);
  }

  const directString = normalizeResumeUrl(parsed);
  if (!directString) return null;
  return {
    resumeUrl: directString,
    originalName: path.basename(directString) || "resume",
  };
}
