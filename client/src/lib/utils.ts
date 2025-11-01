import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeUserType(raw?: string) {
  const s = (raw || "").toString().toLowerCase();
  if (!s) return "";
  if (s.includes("professional") || s.includes("job") || s.includes("seeker") || s.includes("employee")) return "Professional";
  if (s.includes("employer") || s.includes("company") || s.includes("owner")) return "Employer";
  // fallback: return raw lowercase
  return s;
}