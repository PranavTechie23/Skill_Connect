import type { EmployerTabStatus } from "@/lib/employer-service";

export type HiringPipelineQuery = {
  jobId?: string;
  stage?: EmployerTabStatus | "all";
};

/** Build employer hiring pipeline URL (embedded dashboard or standalone route). */
export function buildEmployerHiringUrl(
  query?: HiringPipelineQuery,
  embedded = true,
): string {
  const params = new URLSearchParams();
  if (embedded) {
    params.set("tab", "applications");
  }
  if (query?.jobId) params.set("jobId", query.jobId);
  if (query?.stage && query.stage !== "all") params.set("stage", query.stage);
  const qs = params.toString();
  if (embedded) {
    return `/employer/dashboard${qs ? `?${qs}` : "?tab=applications"}`;
  }
  return `/employer/applications${qs ? `?${qs}` : ""}`;
}

export function parseHiringPipelineSearch(search: string): HiringPipelineQuery {
  const params = new URLSearchParams(search);
  const jobId = params.get("jobId") ?? undefined;
  const stageRaw = params.get("stage");
  const allowed: EmployerTabStatus[] = [
    "new",
    "reviewing",
    "shortlisted",
    "interview",
    "hired",
    "rejected",
  ];
  const stage =
    stageRaw && allowed.includes(stageRaw as EmployerTabStatus)
      ? (stageRaw as EmployerTabStatus)
      : undefined;
  return { jobId, stage };
}
