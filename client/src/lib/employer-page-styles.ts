import { cn } from "@/lib/utils";

/** Main page title — uniform across employer dashboard tabs (Job Postings style). */
export function employerPageTitleClass(isDark: boolean) {
  return cn(
    "text-4xl font-extrabold tracking-tight sm:text-5xl",
    isDark ? "text-gray-100" : "text-gray-900",
  );
}
