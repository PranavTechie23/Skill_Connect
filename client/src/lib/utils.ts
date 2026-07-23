import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeUserType(raw?: string) {
  // If raw is undefined, null, or empty string, return empty string
  if (!raw) return "";
  
  // Convert to string and lowercase for comparison
  const s = raw.toString().toLowerCase();
  
  // Professional checks
  if (s === "professional" || 
      s === "job_seeker" ||
      s === "employee" ||
      s.includes("professional") ||
      s.includes("job") ||
      s.includes("seeker") ||
      s.includes("employee")) {
    return "professional";
  }
  
  // Employer checks
  if (s === "employer" ||
      s === "company" ||
      s === "owner" ||
      s.includes("employer") ||
      s.includes("company") ||
      s.includes("owner")) {
    return "employer";
  }
  
  // Admin check
  if (s === "admin") {
    return "admin";
  }

  // If raw input exactly matches expected cases, preserve it
  if (raw.toLowerCase() === "professional" || raw.toLowerCase() === "employer" || raw.toLowerCase() === "admin") {
    return raw.toLowerCase();
  }
  
  // When no matches, return Professional as default for safer UX
  console.warn("Unrecognized user type:", raw, "defaulting to Professional");
  return "professional";
}

export function getDashboardPathForRole(raw?: string): string {
  const role = normalizeUserType(raw);
  if (role === "professional") return "/employee/dashboard";
  if (role === "employer") return "/employer/dashboard";
  if (role === "admin") return "/admin";
  return "/";
}

export function resolveResumeUrl(resume?: string | null): string | null {
  if (!resume?.trim()) return null;
  const raw = resume.trim();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0] as { path?: string; filename?: string };
      // If path is a full URL (Cloudinary), use it directly
      if (first.path && first.path.startsWith('http')) {
        return first.path;
      }
      const filePath = first.path || first.filename;
      if (filePath) {
        if (String(filePath).startsWith('http')) return String(filePath);
        const normalized = String(filePath).replace(/\\/g, "/");
        const base = normalized.split("/").pop();
        return base ? `/uploads/${base}` : null;
      }
    }
  } catch {
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('/uploads/')) return raw;
  }
  return null;
}