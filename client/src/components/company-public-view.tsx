import {
  Building,
  MapPin,
  Globe,
  Users,
  Briefcase,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicCompanyProfile } from "@/lib/company-profile";
import { resolveCompanyAssetUrl } from "@/lib/company-profile";

interface CompanyPublicViewProps {
  company: PublicCompanyProfile;
  darkMode?: boolean;
  compact?: boolean;
  className?: string;
}

export function CompanyPublicView({
  company,
  darkMode = false,
  compact = false,
  className,
}: CompanyPublicViewProps) {
  const cover = resolveCompanyAssetUrl(company.coverImage);
  const logo = resolveCompanyAssetUrl(company.logo);
  const initials = (company.name || "CO").substring(0, 2).toUpperCase();
  const websiteHref = company.website?.startsWith("http")
    ? company.website
    : company.website
      ? `https://${company.website.replace(/^\/+/, "")}`
      : "";

  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      <div
        className={cn(
          "relative",
          compact ? "h-36" : "h-44 sm:h-52",
        )}
      >
        {cover ? (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            className={cn(
              "absolute inset-0",
              darkMode
                ? "bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-900"
                : "bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700",
            )}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.35),transparent_55%)]" />

        <div className={cn("absolute bottom-0 left-0 right-0 flex items-end gap-4", compact ? "p-4" : "p-5 sm:p-6")}>
          {logo ? (
            <img
              src={logo}
              alt={company.name}
              className={cn(
                "rounded-2xl object-cover border-2 border-white/20 shadow-2xl shrink-0",
                compact ? "h-14 w-14" : "h-16 w-16 sm:h-20 sm:w-20",
              )}
            />
          ) : (
            <div
              className={cn(
                "rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white border-2 border-white/20 shadow-2xl shrink-0",
                compact ? "h-14 w-14 text-lg" : "h-16 w-16 sm:h-20 sm:w-20 text-xl sm:text-2xl",
              )}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0 pb-0.5 flex-1">
            <h2 className={cn("font-extrabold text-white tracking-tight truncate", compact ? "text-lg" : "text-xl sm:text-2xl")}>
              {company.name}
            </h2>
            <p className="text-sm text-indigo-100/90 font-medium truncate">
              {[company.industry, company.location].filter(Boolean).join(" · ") || "Employer on SkillConnect"}
            </p>
            {company.openRoles > 0 && (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                <Briefcase className="w-3 h-3" />
                {company.openRoles} open role{company.openRoles === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "border-x border-b rounded-b-2xl",
          darkMode
            ? "bg-slate-900/80 border-slate-700/60"
            : "bg-white border-slate-200/90",
          compact ? "p-4 space-y-4" : "p-5 sm:p-6 space-y-5",
        )}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { icon: Building, label: "Industry", value: company.industry },
            { icon: MapPin, label: "Location", value: company.location },
            { icon: Users, label: "Size", value: company.size },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className={cn(
                "rounded-xl px-3 py-2.5",
                darkMode ? "bg-white/[0.04] border border-white/10" : "bg-slate-50 border border-slate-100",
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={cn("w-3.5 h-3.5", darkMode ? "text-indigo-400" : "text-indigo-600")} />
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", darkMode ? "text-gray-500" : "text-gray-500")}>
                  {label}
                </span>
              </div>
              <p className={cn("text-sm font-semibold truncate", darkMode ? "text-white" : "text-gray-900")}>
                {value || "—"}
              </p>
            </div>
          ))}
        </div>

        {company.description ? (
          <div>
            <h3 className={cn("text-sm font-bold mb-2 flex items-center gap-2", darkMode ? "text-white" : "text-gray-900")}>
              <Sparkles className={cn("w-4 h-4", darkMode ? "text-amber-400" : "text-amber-600")} />
              About the company
            </h3>
            <p className={cn("text-sm leading-relaxed", darkMode ? "text-slate-300" : "text-gray-600")}>
              {company.description}
            </p>
          </div>
        ) : (
          <p className={cn("text-sm italic", darkMode ? "text-gray-500" : "text-gray-400")}>
            This employer has not added a company description yet.
          </p>
        )}

        {company.tags.length > 0 && (
          <div>
            <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-2", darkMode ? "text-gray-500" : "text-gray-500")}>
              Culture
            </h3>
            <div className="flex flex-wrap gap-2">
              {company.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold",
                    darkMode
                      ? "bg-violet-500/15 text-violet-200 border border-violet-400/25"
                      : "bg-violet-50 text-violet-700 border border-violet-100",
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {company.benefits.length > 0 && (
          <div>
            <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-2", darkMode ? "text-gray-500" : "text-gray-500")}>
              Benefits
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {company.benefits.map((benefit) => (
                <li
                  key={benefit}
                  className={cn(
                    "flex items-center gap-2 text-sm rounded-lg px-3 py-2",
                    darkMode ? "bg-emerald-500/10 text-emerald-100" : "bg-emerald-50 text-emerald-900",
                  )}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {websiteHref && (
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-semibold transition-colors",
              darkMode ? "text-indigo-300 hover:text-white" : "text-indigo-600 hover:text-indigo-800",
            )}
          >
            <Globe className="w-4 h-4" />
            Visit company website
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        )}
      </div>
    </div>
  );
}
