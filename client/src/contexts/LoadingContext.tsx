import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { GlobalLoader } from "@/components/GlobalLoader";
import {
  getLoadingCount,
  subscribeLoading,
  startGlobalLoading,
  stopGlobalLoading,
  withGlobalLoading,
} from "@/lib/loading-store";

interface LoadingContextValue {
  isLoading: boolean;
  loadingCount: number;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const loadingCount = useSyncExternalStore(subscribeLoading, getLoadingCount, () => 0);

  const value: LoadingContextValue = {
    isLoading: loadingCount > 0,
    loadingCount,
    startLoading: startGlobalLoading,
    stopLoading: stopGlobalLoading,
    withLoading: withGlobalLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoader />
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return ctx;
}
