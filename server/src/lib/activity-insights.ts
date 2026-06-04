import type { Application } from "../../../shared/schema";

export type PipelineCounts = {
  applied: number;
  inReview: number;
  interview: number;
  offer: number;
  rejected: number;
  total: number;
};

export function countPipeline(applications: { status?: string | null }[]): PipelineCounts {
  const counts: PipelineCounts = {
    applied: 0,
    inReview: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    total: applications.length,
  };

  for (const app of applications) {
    const s = String(app.status || "applied").toLowerCase();
    if (["rejected", "declined"].includes(s)) counts.rejected++;
    else if (["interview", "interviewing"].includes(s)) counts.interview++;
    else if (["accepted", "approved", "offer"].includes(s)) counts.offer++;
    else if (["reviewed", "reviewing", "review", "pending"].includes(s)) counts.inReview++;
    else counts.applied++;
  }
  return counts;
}

export function buildRuleBasedInsight(
  applications: { status?: string | null; job?: { title?: string | null } | null }[],
  profileCompletion: number
): { summary: string; nextStep: string; tips: string[] } {
  const pipeline = countPipeline(applications);
  const tips: string[] = [];

  if (profileCompletion < 70) {
    tips.push("Finish your headline & skills");
  }
  if (pipeline.interview > 0) {
    tips.push("Prep for upcoming interviews");
  }
  if (pipeline.inReview > 2) {
    tips.push("Follow up on stale applications");
  }
  if (pipeline.rejected > 0 && pipeline.total > 0 && pipeline.rejected / pipeline.total > 0.5) {
    tips.push("Tailor cover letters per role");
  }
  if (tips.length === 0) {
    tips.push("Apply to skill-matched roles");
  }

  let nextStep = "Browse roles that match your skills";
  if (pipeline.interview > 0) {
    nextStep = "Check Messages for interview updates";
  } else if (pipeline.inReview > 0) {
    nextStep = "Stay responsive — apps under review";
  } else if (pipeline.applied > 0 && pipeline.inReview === 0) {
    nextStep = "Widen your pipeline with more roles";
  } else if (pipeline.total === 0) {
    nextStep = "Start applying to track progress here";
  }

  const summary =
    pipeline.total === 0
      ? "No applications yet — start building your pipeline."
      : `${pipeline.total} application${pipeline.total === 1 ? "" : "s"} · ${pipeline.inReview} reviewing · ${pipeline.interview} interviewing · ${pipeline.offer} offer${pipeline.offer === 1 ? "" : "s"}`;

  return { summary, nextStep, tips: tips.slice(0, 3) };
}

export async function enrichInsightWithGemini(
  base: { summary: string; nextStep: string; tips: string[] },
  applications: Application[]
): Promise<{ summary: string; nextStep: string; tips: string[]; aiPowered: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ...base, aiPowered: false };
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const titles = applications
    .slice(0, 8)
    .map((a) => `${a.status}: job ${a.jobId}`)
    .join("; ");

  const prompt = `Career coach for a job platform. Data: ${base.summary} Apps: ${titles}. Reply JSON only: {"summary":"max 12 words","nextStep":"max 8 words, action verb","tips":["max 6 words each","max 2 tips"]}. Be ultra-concise, no filler words.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (!r.ok) return { ...base, aiPowered: false };

    const data: any = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ...base, aiPowered: false };

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : base.summary,
      nextStep: typeof parsed.nextStep === "string" ? parsed.nextStep : base.nextStep,
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3).map(String) : base.tips,
      aiPowered: true,
    };
  } catch {
    return { ...base, aiPowered: false };
  }
}
