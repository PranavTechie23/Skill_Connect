import { useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { getLoadingCount, subscribeLoading } from "@/lib/loading-store";

export function GlobalLoader() {
  const count = useSyncExternalStore(subscribeLoading, getLoadingCount, () => 0);
  const visible = count > 0;

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-background/90 px-8 py-6 shadow-lg">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-medium text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
