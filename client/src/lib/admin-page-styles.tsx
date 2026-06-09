import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

/** Resolves whether admin UI should render in dark mode. */
export function useAdminDarkMode(): boolean {
  const { theme } = useTheme();
  return (
    typeof window !== "undefined" &&
    (theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches))
  );
}

/** Root admin shell — gradient background like employer dashboard. */
export function adminShellClass(isDark: boolean) {
  return cn(
    "admin-shell min-h-screen w-full overflow-x-hidden transition-colors duration-300 flex flex-col relative",
    isDark
      ? "bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950"
      : "bg-gray-50",
  );
}

export function adminHeaderClass(isDark: boolean) {
  return cn(
    "fixed top-0 left-0 right-0 z-50 h-20 border-b backdrop-blur-xl",
    isDark
      ? "bg-gray-900/90 border-gray-800/80 shadow-lg shadow-black/25"
      : "bg-white/95 border-gray-100 shadow-sm",
  );
}

export function adminSidebarClass(isDark: boolean) {
  return cn(
    "border-r backdrop-blur-sm transition-all duration-300",
    isDark
      ? "bg-gray-900/80 border-gray-700/50 shadow-2xl shadow-black/30"
      : "bg-white/95 border-gray-200 backdrop-blur-xl",
  );
}

export function adminHeaderClusterClass(isDark: boolean) {
  return cn(
    "flex min-w-0 max-w-full items-center gap-1.5 sm:gap-2 rounded-2xl border p-1.5 shadow-sm",
    isDark
      ? "bg-gray-900/50 border-white/[0.08]"
      : "bg-white border-gray-200",
  );
}

export function adminIconButtonClass(isDark: boolean) {
  return cn(
    "grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl transition-all",
    isDark
      ? "text-gray-300 hover:bg-white/10 hover:text-white"
      : "text-gray-600 hover:bg-gray-100",
  );
}

export function adminMenuToggleClass(isDark: boolean) {
  return cn(
    "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-all",
    isDark
      ? "bg-gray-900/40 border-gray-700/80 text-gray-300 hover:bg-gray-800/80 hover:border-gray-600"
      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50",
  );
}

export function adminPremiumSurface(isDark: boolean) {
  return isDark
    ? "bg-gray-800/50 border-white/[0.06] backdrop-blur-sm"
    : "bg-white border-gray-200";
}

export function adminPremiumInset(isDark: boolean) {
  return isDark
    ? "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]"
    : "bg-gray-50 border-gray-200 hover:bg-gray-100";
}

export function adminPageTitleClass(isDark: boolean) {
  return cn(
    "text-4xl font-extrabold tracking-tight sm:text-5xl",
    isDark ? "text-gray-100" : "text-gray-900",
  );
}

export function adminStatCardClass(isDark: boolean, accent?: "rose" | "blue" | "violet" | "emerald" | "amber") {
  const accents: Record<string, string> = {
    rose: isDark
      ? "border-rose-500/20 bg-gradient-to-br from-slate-900/95 via-rose-950/20 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(244,63,94,0.35)]"
      : "border-rose-100 bg-gradient-to-br from-white via-rose-50/30 to-white",
    blue: isDark
      ? "border-blue-500/20 bg-gradient-to-br from-slate-900/95 via-blue-950/25 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(59,130,246,0.4)]"
      : "border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white",
    violet: isDark
      ? "border-violet-500/20 bg-gradient-to-br from-slate-900/95 via-violet-950/25 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(139,92,246,0.4)]"
      : "border-violet-100 bg-gradient-to-br from-white via-violet-50/35 to-white",
    emerald: isDark
      ? "border-emerald-500/20 bg-gradient-to-br from-slate-900/95 via-emerald-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(16,185,129,0.4)]"
      : "border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white",
    amber: isDark
      ? "border-amber-500/20 bg-gradient-to-br from-slate-900/95 via-amber-950/20 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(245,158,11,0.35)]"
      : "border-amber-100 bg-gradient-to-br from-white via-amber-50/30 to-white",
  };
  if (accent && accents[accent]) {
    return cn("rounded-2xl border backdrop-blur-sm transition-all duration-300", accents[accent]);
  }
  return cn(
    "rounded-2xl border backdrop-blur-sm transition-all duration-300",
    isDark
      ? "border-white/[0.07] bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]"
      : "border-gray-200 bg-white shadow-sm",
  );
}

/** Dot grid + ambient orbs — matches employer dashboard depth. */
export function AdminAmbientBackground({ isDark }: { isDark: boolean }) {
  return (
    <>
      {/* Subtle Dot Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: isDark 
            ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)' 
            : 'radial-gradient(circle at 1px 1px, rgba(79,70,229,0.07) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} 
      />
      {/* Enhanced Animated background matching Employer's aesthetics */}
      <div className={cn("fixed inset-0 overflow-hidden pointer-events-none", isDark ? "opacity-100" : "opacity-70")}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </>
  );
}

/** Top-edge shine for premium cards (employer WidgetShine pattern). */
export function AdminWidgetShine({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-px",
        isDark
          ? "bg-gradient-to-r from-transparent via-white/12 to-transparent"
          : "bg-gradient-to-r from-transparent via-slate-300/70 to-transparent",
      )}
      aria-hidden
    />
  );
}
