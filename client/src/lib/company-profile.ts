import { apiFetch } from "./api";

export interface CompanyCulture {
  tags: string[];
  benefits: string[];
}

export interface PublicCompanyProfile {
  id: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  description: string;
  location: string;
  logo?: string;
  coverImage?: string;
  openRoles: number;
  tags: string[];
  benefits: string[];
}

export interface ProfileCompleteness {
  score: number;
  missing: string[];
}

export function resolveCompanyAssetUrl(url?: string): string {
  if (!url?.trim()) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}`;
}

export function parseCulture(raw: unknown): CompanyCulture {
  if (!raw) return { tags: [], benefits: [] };
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { tags: [], benefits: [] };
    }
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { tags: [], benefits: [] };
  }
  const o = parsed as { tags?: unknown; benefits?: unknown };
  return {
    tags: Array.isArray(o.tags) ? o.tags.map(String) : [],
    benefits: Array.isArray(o.benefits) ? o.benefits.map(String) : [],
  };
}

export function calculateProfileCompleteness(profile: {
  name?: string;
  industry?: string;
  location?: string;
  size?: string;
  description?: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  tags?: string[];
  benefits?: string[];
}): ProfileCompleteness {
  const checks: { label: string; ok: boolean }[] = [
    { label: "Company name", ok: Boolean(profile.name?.trim()) },
    { label: "Industry", ok: Boolean(profile.industry?.trim()) },
    { label: "Location", ok: Boolean(profile.location?.trim()) },
    { label: "Company size", ok: Boolean(profile.size?.trim()) },
    { label: "About description", ok: Boolean(profile.description?.trim() && profile.description.trim().length >= 40) },
    { label: "Website", ok: Boolean(profile.website?.trim()) },
    { label: "Logo", ok: Boolean(profile.logo?.trim()) },
    { label: "Cover image", ok: Boolean(profile.coverImage?.trim()) },
    { label: "Culture tags", ok: (profile.tags?.length ?? 0) >= 2 },
    { label: "Employee benefits", ok: (profile.benefits?.length ?? 0) >= 2 },
  ];
  const completed = checks.filter((c) => c.ok).length;
  return {
    score: Math.round((completed / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}

export function toPublicCompanyFromEmployer(
  companyId: string,
  profile: {
    name: string;
    industry: string;
    size: string;
    website: string;
    description: string;
    location: string;
    logo?: string;
    coverImage?: string;
    tags?: string[];
    benefits?: string[];
  },
  openRoles = 0,
): PublicCompanyProfile {
  return {
    id: companyId,
    name: profile.name || "Company",
    industry: profile.industry || "",
    size: profile.size || "",
    website: profile.website || "",
    description: profile.description || "",
    location: profile.location || "",
    logo: profile.logo,
    coverImage: profile.coverImage,
    openRoles,
    tags: profile.tags ?? [],
    benefits: profile.benefits ?? [],
  };
}

export async function fetchPublicCompany(companyId: string): Promise<PublicCompanyProfile | null> {
  const response = await apiFetch(`/api/companies/${companyId}/public`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data as PublicCompanyProfile;
}
