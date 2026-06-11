import { useEffect, useState } from "react";
import { X, Loader2, Building2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { fetchPublicCompany, type PublicCompanyProfile } from "@/lib/company-profile";
import { CompanyPublicView } from "@/components/company-public-view";

interface CompanyProfileModalProps {
  companyId: string | null | undefined;
  companyName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyProfileModal({
  companyId,
  companyName,
  isOpen,
  onClose,
}: CompanyProfileModalProps) {
  const { theme } = useTheme();
  const darkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !companyId) {
      setCompany(null);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const data = await fetchPublicCompany(companyId);
      if (cancelled) return;
      if (!data) {
        setError("Company profile is not available.");
        setCompany(null);
      } else {
        setCompany(data);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, companyId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-profile-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className={cn(
          "relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col",
          darkMode ? "bg-slate-950 border border-slate-700/80" : "bg-white border border-slate-200",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-5 py-4 border-b shrink-0",
            darkMode ? "border-slate-800" : "border-slate-100",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className={cn("w-5 h-5 shrink-0", darkMode ? "text-indigo-400" : "text-indigo-600")} />
            <h2
              id="company-profile-title"
              className={cn("font-bold truncate", darkMode ? "text-white" : "text-gray-900")}
            >
              {company?.name || companyName || "Company"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors",
              darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-600",
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5 flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className={cn("w-10 h-10 animate-spin", darkMode ? "text-indigo-400" : "text-indigo-600")} />
              <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>Loading company profile…</p>
            </div>
          )}
          {!loading && error && (
            <p className={cn("text-center py-12 text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>{error}</p>
          )}
          {!loading && company && <CompanyPublicView company={company} darkMode={darkMode} />}
        </div>
      </div>
    </div>
  );
}
