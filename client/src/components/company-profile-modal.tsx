import { useEffect, useState } from "react";
import { X, Loader2, Building2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { fetchPublicCompany, type PublicCompanyProfile } from "@/lib/company-profile";
import { CompanyPublicView } from "@/components/company-public-view";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent 
        className={cn(
          "w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col p-0 border-0 [&>button]:hidden",
          darkMode ? "bg-slate-950" : "bg-white"
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
            <DialogTitle
              id="company-profile-title"
              className={cn("font-bold truncate m-0", darkMode ? "text-white" : "text-gray-900")}
            >
              {company?.name || companyName || "Company"}
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "p-2 rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500",
              darkMode 
                ? "bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white" 
                : "bg-slate-100 hover:bg-slate-200 text-gray-600 hover:text-gray-900",
            )}
            aria-label="Close modal"
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
      </DialogContent>
    </Dialog>
  );
}
