import { useSyncExternalStore } from "react";
import { getLoadingCount, subscribeLoading } from "@/lib/loading-store";
import { LogoLoader } from "./LogoLoader";

export function GlobalLoader() {
  const count = useSyncExternalStore(subscribeLoading, getLoadingCount, () => 0);
  const visible = count > 0;

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white dark:bg-slate-950 transition-opacity duration-300"
    >
      <div className="flex flex-col items-center justify-center">
        <LogoLoader size="xl" />
      </div>
    </div>
  );
}
