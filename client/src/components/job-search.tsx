import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ElementType, KeyboardEvent as ReactKeyboardEvent, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Briefcase,
  IndianRupee,
  X,
  ChevronDown,
  TrendingUp,
  Check,
} from "lucide-react";
import { normalizeJobTypeFilter } from "@/lib/job-filters";

interface SearchFilters {
  search: string;
  location: string;
  jobType: string;
  salary: string;
}

interface JobSearchProps {
  onSearch: (filters: SearchFilters) => void;
  className?: string;
  /** When changed, dropdowns reset to defaults (e.g. after "View all jobs"). */
  resetToken?: number;
  /** Called after a search is triggered (e.g. scroll to results). */
  onAfterSearch?: () => void;
}

const LOCATIONS = [
  "All Locations", "Pune", "New Delhi", "Nashik", "Kolkata", "Mumbai",
  "Chennai", "Bangalore", "Amritsar", "Nagpur", "Hyderabad", "Jaipur", "Ahmedabad",
];

const JOB_TYPES = ["All Jobs", "Full-time", "Part-time", "Contract", "Internship", "Remote"];

const SALARY_RANGES = [
  "All Salaries", "₹0 – ₹3 LPA", "₹3 – ₹6 LPA", "₹6 – ₹10 LPA",
  "₹10 – ₹20 LPA", "₹20 LPA+",
];

const JOB_TITLES = [
  "All Job Titles", "Software Engineer", "Web Developer", "Data Scientist",
  "UX Designer", "Product Manager", "Senior Full Stack Developer",
  "Machine Learning Engineer", "DevOps Cloud Architect", "Mobile App Developer",
  "Cloud Solutions Architect", "Cybersecurity Analyst", "Blockchain Developer",
  "Data Engineer", "QA Automation Engineer", "Systems Administrator",
  "React Native Developer", "Vue.js Frontend Lead", "Node.js Backend Expert",
  "Python Django Developer", "Java Spring Boot Developer", "Go Language Engineer",
  "Flutter Mobile Developer", "AWS Solutions Architect", "Kubernetes Administrator",
  "Database Architect", "Computer Vision Engineer", "Technical Product Manager",
  "Carpenter", "Plumber", "Electrician", "House Maid", "Cleaner", "Architect",
  "Delivery Man", "Driver", "Cook", "Gardener", "Security Guard", "Receptionist",
  "Sales Executive", "Accountant", "Teacher", "Nurse", "Doctor", "Mechanic",
  "Painter", "Mason", "Welder", "Tailor", "Beautician", "Barber", "Chef",
  "Housekeeper", "Babysitter", "Office Assistant", "Supervisor", "Manager",
  "Cashier", "Waiter", "Peon", "Office Boy",
];

const TRENDING = ["Software Engineer", "UI/UX Designer", "Wireman", "DevOps", "Driver"];

type FilterField = "jobTitle" | "jobLocation" | "jobType" | "salary";

// ─── Searchable Dropdown ────────────────────────────────────────────────────

interface DropdownProps {
  value: string;
  setValue: (v: string) => void;
  options: string[];
  icon: ElementType;
  label: string;
  placeholder: string;
  defaultLabel: string;
  field: FilterField;
  onSelect?: (field: FilterField, value: string) => void;
  compact?: boolean;
  dropdownId: string;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}

function SearchableDropdown({
  value, setValue, options, icon: Icon, label, placeholder, defaultLabel,
  field, onSelect, compact = false, dropdownId, openDropdownId, setOpenDropdownId,
}: DropdownProps) {
  const open = openDropdownId === dropdownId;
  const setOpen = useCallback((next: boolean) => {
    setOpenDropdownId(next ? dropdownId : null);
  }, [dropdownId, setOpenDropdownId]);
  const [query, setQuery] = useState("");
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = value !== defaultLabel;

  const updatePanelPosition = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const panelMaxH = 280;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < panelMaxH + gap && spaceAbove > spaceBelow;
    setPlacement(openUp ? "top" : "bottom");
    setPanelStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 10000,
      maxHeight: panelMaxH,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const onReflow = () => updatePanelPosition();
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setHoverIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setHoverIndex(-1);
    }
  }, [open]);

  const q = query.trim();
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()));
  const exact = q.length > 0
    ? options.find(o => o.toLowerCase() === q.toLowerCase())
    : undefined;

  const listOptions = filtered;
  const showCustomOption = q.length > 0 && !exact;

  const selectValue = useCallback((next: string) => {
    setValue(next);
    setOpen(false);
    setQuery("");
    onSelect?.(field, next);
  }, [setValue, setOpen, onSelect, field]);

  const selectBestMatch = useCallback(() => {
    if (!open) return;
    if (q.length === 0) { setOpen(false); return; }
    if (exact) return selectValue(exact);
    if (filtered.length > 0) return selectValue(filtered[0]);
    return selectValue(q);
  }, [exact, filtered, open, q, selectValue]);

  const handleKey = useCallback((e: ReactKeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setQuery(""); return; }
    if (!open) return;

    const total = listOptions.length + (showCustomOption ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHoverIndex((i) => (i + 1) % Math.max(total, 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHoverIndex((i) => (i <= 0 ? total - 1 : i - 1));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (hoverIndex >= 0) {
        if (showCustomOption && hoverIndex === 0) return selectValue(q);
        const optIndex = showCustomOption ? hoverIndex - 1 : hoverIndex;
        if (listOptions[optIndex]) return selectValue(listOptions[optIndex]);
      }
      selectBestMatch();
    }
  }, [hoverIndex, listOptions, open, q, selectBestMatch, showCustomOption, selectValue]);

  return (
    <div className="relative" ref={ref} onKeyDown={handleKey}>
      {!compact && (
        <p style={{
          fontSize: "0.68rem", letterSpacing: "0.12em", fontWeight: 700,
          textTransform: "uppercase", color: isActive ? "var(--sc-accent)" : "var(--sc-muted)",
          marginBottom: "6px", paddingLeft: "2px", transition: "color 0.2s",
          fontFamily: "'Outfit', sans-serif",
        }}>
          {label}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`sc-dd-btn${isActive ? " sc-dd-active" : ""}${open ? " sc-dd-open" : ""}`}
      >
        <span className="sc-dd-icon-wrap" aria-hidden>
          <Icon size={16} className="sc-dd-icon" />
        </span>
        <span className="sc-dd-value">
          {isActive ? value : defaultLabel}
        </span>
        {isActive ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Clear ${label}`}
            onClick={e => { e.stopPropagation(); setValue(defaultLabel); onSelect?.(field, defaultLabel); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setValue(defaultLabel); onSelect?.(field, defaultLabel); } }}
            className="sc-dd-clear"
          >
            <X size={14} />
          </span>
        ) : (
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}
            className="sc-dd-chevron">
            <ChevronDown size={15} />
          </motion.span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: placement === "top" ? 10 : -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={panelStyle}
            className="sc-dd-panel sc-dd-panel-portal"
          >
            <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid var(--sc-border)" }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  color: "var(--sc-muted)",
                }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={placeholder}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") e.preventDefault();
                  }}
                  style={{
                    width: "100%", padding: "7px 10px 7px 30px",
                    background: "rgba(255,255,255,0.6)", border: "1px solid var(--sc-border)",
                    borderRadius: "8px", outline: "none", fontSize: "0.8rem",
                    color: "var(--sc-fg)", fontFamily: "'Outfit', sans-serif",
                  }}
                />
              </div>
            </div>

            <div className="sc-dd-list" style={{ overflowY: "auto", padding: "6px", flex: 1 }}>
              {showCustomOption && (
                <button
                  type="button"
                  onMouseEnter={() => setHoverIndex(0)}
                  onClick={() => selectValue(q)}
                  className={`sc-dd-opt sc-dd-custom${hoverIndex === 0 ? " sc-dd-opt-hover" : ""}`}
                >
                  Use “{q}”
                </button>
              )}

              {listOptions.length > 0 ? listOptions.map((opt, index) => {
                const rowIndex = showCustomOption ? index + 1 : index;
                const isSelected = opt === value;
                return (
                  <button
                    type="button"
                    key={opt}
                    onMouseEnter={() => setHoverIndex(rowIndex)}
                    onClick={() => selectValue(opt)}
                    className={`sc-dd-opt${isSelected ? " sc-dd-opt-selected" : ""}${hoverIndex === rowIndex ? " sc-dd-opt-hover" : ""}${opt === defaultLabel ? " sc-dd-opt-default" : ""}`}
                  >
                    <span className="sc-dd-opt-label">{opt}</span>
                    {isSelected && <Check size={14} className="sc-dd-opt-check" aria-hidden />}
                  </button>
                );
              }) : !showCustomOption && (
                <p className="sc-dd-empty">No results found</p>
              )}
            </div>
          </motion.div>,
        document.body
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function JobSearch({ onSearch, className = "", resetToken = 0, onAfterSearch }: JobSearchProps) {
  const [jobTitle, setJobTitle] = useState("All Job Titles");
  const [jobLocation, setJobLocation] = useState("All Locations");
  const [jobType, setJobType] = useState("All Jobs");
  const [salary, setSalary] = useState("All Salaries");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    setJobTitle("All Job Titles");
    setJobLocation("All Locations");
    setJobType("All Jobs");
    setSalary("All Salaries");
  }, [resetToken]);

  const buildFilters = useCallback((
    overrides: Partial<{ jobTitle: string; jobLocation: string; jobType: string; salary: string }> = {}
  ): SearchFilters => {
    const title = overrides.jobTitle ?? jobTitle;
    const location = overrides.jobLocation ?? jobLocation;
    const type = overrides.jobType ?? jobType;
    const sal = overrides.salary ?? salary;
    return {
      search: title === "All Job Titles" ? "" : title,
      location: location === "All Locations" ? "" : location,
      jobType: type === "All Jobs" ? "" : normalizeJobTypeFilter(type),
      salary: sal === "All Salaries" ? "" : sal,
    };
  }, [jobTitle, jobLocation, jobType, salary]);

  const runSearch = useCallback((
    overrides?: Partial<{ jobTitle: string; jobLocation: string; jobType: string; salary: string }>
  ) => {
    onSearch(buildFilters(overrides));
    onAfterSearch?.();
  }, [buildFilters, onSearch, onAfterSearch]);

  const activeCount = [
    jobTitle !== "All Job Titles",
    jobLocation !== "All Locations",
    jobType !== "All Jobs",
    salary !== "All Salaries",
  ].filter(Boolean).length;

  const clearAll = () => {
    setJobTitle("All Job Titles");
    setJobLocation("All Locations");
    setJobType("All Jobs");
    setSalary("All Salaries");
    runSearch({
      jobTitle: "All Job Titles",
      jobLocation: "All Locations",
      jobType: "All Jobs",
      salary: "All Salaries",
    });
  };

  const handleFilterSelect = useCallback((field: FilterField, value: string) => {
    runSearch({ [field]: value });
  }, [runSearch]);

  const applyTrending = (term: string) => {
    setJobTitle(term);
    runSearch({ jobTitle: term });
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Sora:wght@500;600&display=swap');

    .sc-root {
      --sc-border: rgba(15, 23, 42, 0.1);
      --sc-border-hover: rgba(15, 23, 42, 0.18);
      --sc-fg: #0f172a;
      --sc-fg-muted: #475569;
      --sc-muted: #94a3b8;
      --sc-hover: rgba(248, 250, 252, 0.85);
      --sc-accent: #0f172a;
      --sc-accent-light: #6366f1;
      --sc-surface: rgba(255, 255, 255, 0.42);
      --sc-surface2: rgba(255, 255, 255, 0.28);
      --sc-panel: rgba(255, 255, 255, 0.94);
      --sc-shadow-sm: 0 1px 2px rgba(15,23,42,0.04);
      --sc-shadow-lg: 0 24px 48px -16px rgba(15,23,42,0.16);
      font-family: 'Outfit', sans-serif;
      color: var(--sc-fg);
    }

    .dark .sc-root {
      --sc-border: rgba(255,255,255,0.09);
      --sc-border-hover: rgba(255,255,255,0.16);
      --sc-fg: #f1f5f9;
      --sc-fg-muted: #cbd5e1;
      --sc-muted: #64748b;
      --sc-hover: rgba(255,255,255,0.06);
      --sc-accent: #f8fafc;
      --sc-accent-light: #a5b4fc;
      --sc-surface: rgba(255,255,255,0.04);
      --sc-surface2: rgba(255,255,255,0.03);
      --sc-panel: rgba(14, 14, 22, 0.96);
      --sc-shadow-sm: none;
      --sc-shadow-lg: 0 24px 56px -20px rgba(0,0,0,0.65);
    }

    .sc-card {
      background: rgba(255, 255, 255, 0.68);
      backdrop-filter: blur(22px) saturate(1.35);
      -webkit-backdrop-filter: blur(22px) saturate(1.35);
      border: 1px solid rgba(255, 255, 255, 0.72);
      border-radius: 20px;
      padding: 1.25rem 1.35rem 1.1rem;
      box-shadow:
        0 0 0 1px rgba(15, 23, 42, 0.04) inset,
        0 12px 40px -20px rgba(15,23,42,0.12);
    }

    .dark .sc-card {
      background: rgba(14, 14, 22, 0.52);
      border-color: rgba(255,255,255,0.08);
      box-shadow: 0 20px 50px -24px rgba(0,0,0,0.5);
    }

    .sc-toolbar {
      display: grid;
      grid-template-columns: 1.35fr 1fr 1fr 1fr auto;
      gap: 10px;
      align-items: end;
    }

    @media (max-width: 1024px) {
      .sc-toolbar {
        grid-template-columns: 1fr 1fr;
      }
      .sc-toolbar-search { grid-column: 1 / -1; }
      .sc-toolbar-btn { grid-column: 1 / -1; }
    }

    @media (max-width: 560px) {
      .sc-toolbar { grid-template-columns: 1fr; }
    }

    .sc-search-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 44px;
      padding: 0 1.25rem;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: 'Outfit', sans-serif;
      background: #0f172a;
      color: #fff;
      white-space: nowrap;
      transition: background 0.15s, transform 0.15s;
    }

    .sc-search-btn:hover { background: #1e293b; }
    .dark .sc-search-btn { background: #f8fafc; color: #0f172a; }
    .dark .sc-search-btn:hover { background: #e2e8f0; }

    .sc-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 11px; border-radius: 999px; font-size: 0.73rem; font-weight: 600;
      background: rgba(15, 23, 42, 0.05);
      border: 1px solid rgba(15, 23, 42, 0.1);
      color: #334155; cursor: pointer; font-family: 'Outfit', sans-serif;
      transition: background 0.15s, border-color 0.15s, transform 0.15s;
    }

    .sc-pill:hover {
      background: rgba(15, 23, 42, 0.08);
      border-color: rgba(15, 23, 42, 0.16);
      transform: translateY(-1px);
    }
    .dark .sc-pill {
      background: rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.1);
      color: #e2e8f0;
    }
    .dark .sc-pill:hover { background: rgba(255,255,255,0.1); }

    .sc-active-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(15, 23, 42, 0.06);
    }
    .dark .sc-active-row { border-top-color: rgba(255,255,255,0.06); }

    .sc-active-label {
      font-size: 0.6875rem;
      color: var(--sc-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-right: 2px;
      font-family: 'Outfit', sans-serif;
    }

    .sc-trend-pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 500;
      background: transparent;
      border: 1px solid rgba(15, 23, 42, 0.08);
      color: var(--sc-fg-muted); cursor: pointer; font-family: 'Outfit', sans-serif;
      transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
    }

    .sc-trend-pill:hover {
      background: rgba(15, 23, 42, 0.04);
      color: var(--sc-fg);
      border-color: rgba(15, 23, 42, 0.14);
      transform: translateY(-1px);
    }
    .dark .sc-trend-pill {
      border-color: rgba(255,255,255,0.08);
      color: #94a3b8;
    }
    .dark .sc-trend-pill:hover {
      background: rgba(255,255,255,0.05);
      color: #e2e8f0;
      border-color: rgba(255,255,255,0.14);
    }

    .sc-clear-all {
      margin-left: 4px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.72rem;
      color: var(--sc-muted);
      text-decoration: underline;
      font-family: 'Outfit', sans-serif;
      transition: color 0.15s;
      padding: 0;
    }
    .sc-clear-all:hover { color: var(--sc-fg); }

    .sc-trending-row {
      margin-top: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding-top: 2px;
    }
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--sc-border), transparent);
      margin: 24px 0;
    }

    .sc-pulse::after {
      content: '';
      position: absolute; inset: 0; border-radius: 14px;
      background: rgba(255,255,255,0.15);
      animation: sc-ripple 0.4s ease-out forwards;
    }

    @keyframes sc-ripple {
      0%   { opacity: 1; transform: scale(0.96); }
      100% { opacity: 0; transform: scale(1.04); }
    }

    .sc-dd-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 12px 0 14px;
      height: 44px;
      border-radius: 12px;
      cursor: pointer;
      border: 1px solid rgba(15, 23, 42, 0.07);
      background: rgba(255, 255, 255, 0.32);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      color: var(--sc-fg);
      transition: border-color 0.18s, box-shadow 0.18s, background 0.18s, color 0.18s;
      outline: none;
      text-align: left;
    }

    .sc-dd-btn:hover:not(.sc-dd-open) {
      border-color: rgba(15, 23, 42, 0.14);
      background: rgba(255, 255, 255, 0.52);
    }

    .sc-dd-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1.25rem;
    }

    .sc-dd-icon {
      opacity: 0.45;
      transition: opacity 0.18s;
    }

    .sc-dd-btn:hover .sc-dd-icon,
    .sc-dd-active .sc-dd-icon,
    .sc-dd-open .sc-dd-icon {
      opacity: 0.85;
    }

    .sc-dd-value {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 400;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: 'Outfit', sans-serif;
      color: var(--sc-muted);
    }

    .sc-dd-active .sc-dd-value {
      font-weight: 600;
      color: var(--sc-fg);
    }

    .sc-dd-chevron {
      display: flex;
      opacity: 0.35;
      flex-shrink: 0;
    }

    .sc-dd-active {
      border-color: rgba(15, 23, 42, 0.14);
      background: rgba(255, 255, 255, 0.48);
    }

    .dark .sc-dd-btn {
      background: rgba(255,255,255,0.03);
      border-color: rgba(255,255,255,0.07);
    }
    .dark .sc-dd-btn:hover:not(.sc-dd-open) { background: rgba(255,255,255,0.06); }
    .dark .sc-dd-active { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); }
    .dark .sc-dd-value { color: #64748b; }
    .dark .sc-dd-active .sc-dd-value { color: #f1f5f9; }

    .sc-dd-open {
      box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.06);
      border-color: rgba(15, 23, 42, 0.18);
      background: rgba(255, 255, 255, 0.72);
    }
    .dark .sc-dd-open {
      box-shadow: 0 0 0 3px rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.16);
      background: rgba(255,255,255,0.08);
    }

    .sc-dd-clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      padding: 0;
      cursor: pointer;
      opacity: 0.7;
      color: inherit;
    }
    .sc-dd-clear:hover { opacity: 1; }

    .sc-dd-panel-portal {
      border-radius: 14px;
      border: 1px solid rgba(15, 23, 42, 0.1);
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(24px) saturate(1.45);
      -webkit-backdrop-filter: blur(24px) saturate(1.45);
      box-shadow: var(--sc-shadow-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .dark .sc-dd-panel-portal {
      background: rgba(14, 14, 22, 0.96);
      border-color: rgba(255,255,255,0.1);
    }

    .sc-dd-opt {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      text-align: left;
      padding: 9px 12px;
      border-radius: 9px;
      font-size: 0.8125rem;
      cursor: pointer;
      font-family: 'Outfit', sans-serif;
      border: none;
      background: transparent;
      color: var(--sc-fg-muted);
      font-weight: 400;
      transition: background 0.12s, color 0.12s, transform 0.12s;
    }

    .sc-dd-opt-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sc-dd-opt-check {
      flex-shrink: 0;
      opacity: 0.7;
      color: #0f172a;
    }
    .dark .sc-dd-opt-check { color: #e2e8f0; }

    .sc-dd-opt-default {
      color: var(--sc-muted);
      font-weight: 500;
    }

    .sc-dd-opt:hover,
    .sc-dd-opt-hover {
      background: rgba(15, 23, 42, 0.05);
      color: var(--sc-fg);
    }
    .dark .sc-dd-opt:hover,
    .dark .sc-dd-opt-hover {
      background: rgba(255,255,255,0.06);
      color: #f1f5f9;
    }

    .sc-dd-opt-selected {
      background: rgba(15, 23, 42, 0.06);
      color: var(--sc-fg);
      font-weight: 600;
    }
    .dark .sc-dd-opt-selected { background: rgba(255,255,255,0.08); color: #f8fafc; }

    .sc-dd-opt-selected.sc-dd-opt-hover,
    .sc-dd-opt-selected:hover {
      background: rgba(15, 23, 42, 0.08);
    }

    .sc-dd-empty {
      text-align: center;
      padding: 24px 0;
      font-size: 0.8rem;
      color: var(--sc-muted);
      font-style: italic;
      font-family: 'Outfit', sans-serif;
      margin: 0;
    }

    .sc-dd-custom {
      color: var(--sc-fg);
      font-weight: 600;
      background: rgba(15, 23, 42, 0.04);
      border: 1px dashed rgba(15, 23, 42, 0.12);
      margin: 2px 4px 4px;
      width: calc(100% - 8px);
    }
    .sc-dd-custom:hover,
    .sc-dd-custom.sc-dd-opt-hover {
      background: rgba(15, 23, 42, 0.07);
      border-color: rgba(15, 23, 42, 0.18);
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div
        className={`sc-root ${className}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement)?.tagName !== "BUTTON") runSearch();
        }}
      >
        <motion.div
          className="sc-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="sc-toolbar">
            <div className="sc-toolbar-search">
              <SearchableDropdown
                dropdownId="role"
                field="jobTitle"
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                value={jobTitle}
                setValue={setJobTitle}
                options={JOB_TITLES}
                icon={Search}
                label="Role or keyword"
                placeholder="Search roles..."
                defaultLabel="All Job Titles"
                compact
                onSelect={handleFilterSelect}
              />
            </div>
            <SearchableDropdown
              dropdownId="location"
              field="jobLocation"
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              value={jobLocation}
              setValue={setJobLocation}
              options={LOCATIONS}
              icon={MapPin}
              label="Location"
              placeholder="City..."
              defaultLabel="All Locations"
              compact
              onSelect={handleFilterSelect}
            />
            <SearchableDropdown
              dropdownId="type"
              field="jobType"
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              value={jobType}
              setValue={setJobType}
              options={JOB_TYPES}
              icon={Briefcase}
              label="Job type"
              placeholder="Type..."
              defaultLabel="All Jobs"
              compact
              onSelect={handleFilterSelect}
            />
            <SearchableDropdown
              dropdownId="salary"
              field="salary"
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              value={salary}
              setValue={setSalary}
              options={SALARY_RANGES}
              icon={IndianRupee}
              label="Salary"
              placeholder="Range..."
              defaultLabel="All Salaries"
              compact
              onSelect={handleFilterSelect}
            />
            <div className="sc-toolbar-btn">
              <button
                type="button"
                onClick={() => runSearch()}
                className="sc-search-btn"
                style={{ width: "100%" }}
              >
                <Search size={16} />
                Search
                {activeCount > 0 && (
                  <span style={{
                    marginLeft: "2px",
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "999px",
                    padding: "1px 7px",
                    fontSize: "0.7rem",
                  }}>
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          <AnimatePresence>
            {activeCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                <div className="sc-active-row">
                  <span className="sc-active-label">Active</span>

                  {jobTitle !== "All Job Titles" && (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="sc-pill" onClick={() => { setJobTitle("All Job Titles"); runSearch({ jobTitle: "All Job Titles" }); }}>
                      {jobTitle} <X size={11} />
                    </motion.span>
                  )}
                  {jobLocation !== "All Locations" && (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="sc-pill" onClick={() => { setJobLocation("All Locations"); runSearch({ jobLocation: "All Locations" }); }}>
                      {jobLocation} <X size={11} />
                    </motion.span>
                  )}
                  {jobType !== "All Jobs" && (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="sc-pill" onClick={() => { setJobType("All Jobs"); runSearch({ jobType: "All Jobs" }); }}>
                      {jobType} <X size={11} />
                    </motion.span>
                  )}
                  {salary !== "All Salaries" && (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="sc-pill" onClick={() => { setSalary("All Salaries"); runSearch({ salary: "All Salaries" }); }}>
                      {salary} <X size={11} />
                    </motion.span>
                  )}

                  <button
                    type="button"
                    onClick={clearAll}
                    className="sc-clear-all"
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="sc-trending-row">
            <TrendingUp size={13} style={{ color: "var(--sc-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.6875rem", color: "var(--sc-muted)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Trending
            </span>
            {TRENDING.map(t => (
              <button
                type="button"
                key={t}
                className="sc-trend-pill"
                onClick={() => applyTrending(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}