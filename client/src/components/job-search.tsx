import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Briefcase,
  IndianRupee,
  X,
  ChevronDown,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface JobSearchProps {
  onSearch: (filters: {
    search: string;
    location: string;
    jobType: string;
    salary: string;
  }) => void;
  className?: string;
}

const LOCATIONS = [
  "All Locations","Pune","New Delhi","Nashik","Kolkata","Mumbai",
  "Chennai","Bangalore","Amritsar","Nagpur","Hyderabad","Jaipur","Ahmedabad",
];

const JOB_TYPES = ["All Jobs","Full-time","Part-time","Contract","Internship","Remote"];

const SALARY_RANGES = [
  "All Salaries","₹0 – ₹3 LPA","₹3 – ₹6 LPA","₹6 – ₹10 LPA",
  "₹10 – ₹20 LPA","₹20 LPA+",
];

const JOB_TITLES = [
  "All Job Titles","Software Engineer","Web Developer","Data Scientist",
  "UX Designer","Product Manager","Senior Full Stack Developer",
  "Machine Learning Engineer","DevOps Cloud Architect","Mobile App Developer",
  "Cloud Solutions Architect","Cybersecurity Analyst","Blockchain Developer",
  "Data Engineer","QA Automation Engineer","Systems Administrator",
  "React Native Developer","Vue.js Frontend Lead","Node.js Backend Expert",
  "Python Django Developer","Java Spring Boot Developer","Go Language Engineer",
  "Flutter Mobile Developer","AWS Solutions Architect","Kubernetes Administrator",
  "Database Architect","Computer Vision Engineer","Technical Product Manager",
  "Carpenter","Plumber","Electrician","House Maid","Cleaner","Architect",
  "Delivery Man","Driver","Cook","Gardener","Security Guard","Receptionist",
  "Sales Executive","Accountant","Teacher","Nurse","Doctor","Mechanic",
  "Painter","Mason","Welder","Tailor","Beautician","Barber","Chef",
  "Housekeeper","Babysitter","Office Assistant","Supervisor","Manager",
  "Cashier","Waiter","Peon","Office Boy",
];

const TRENDING = ["Software Engineer","UI/UX Designer","Data Scientist","DevOps","Driver"];

// ─── Searchable Dropdown ────────────────────────────────────────────────────

interface DropdownProps {
  value: string;
  setValue: (v: string) => void;
  options: string[];
  icon: React.ElementType;
  label: string;
  placeholder: string;
  defaultLabel: string;
}

function SearchableDropdown({
  value, setValue, options, icon: Icon, label, placeholder, defaultLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = value !== defaultLabel;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setQuery(""); }
  }, []);

  return (
    <div className="relative" ref={ref} onKeyDown={handleKey}>
      <p style={{
        fontSize: "0.68rem", letterSpacing: "0.12em", fontWeight: 700,
        textTransform: "uppercase", color: isActive ? "var(--sc-accent)" : "var(--sc-muted)",
        marginBottom: "6px", paddingLeft: "2px", transition: "color 0.2s",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </p>

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "10px",
          padding: "0 14px", height: "48px", borderRadius: "12px", cursor: "pointer",
          border: `1px solid ${isActive ? "var(--sc-accent)" : "var(--sc-border)"}`,
          background: isActive ? "rgba(139,92,246,0.08)" : "var(--sc-surface)",
          color: isActive ? "var(--sc-accent-light)" : "var(--sc-fg)",
          transition: "all 0.2s", outline: "none", textAlign: "left",
          boxShadow: open ? "0 0 0 3px rgba(139,92,246,0.15)" : "none",
        }}
        onMouseEnter={e => {
          if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "var(--sc-border-hover)";
        }}
        onMouseLeave={e => {
          if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "var(--sc-border)";
        }}
      >
        <Icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.5 }} />
        <span style={{
          flex: 1, fontSize: "0.875rem", fontWeight: isActive ? 600 : 400,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {value}
        </span>
        {isActive && (
          <span
            onClick={e => { e.stopPropagation(); setValue(defaultLabel); }}
            style={{ cursor: "pointer", opacity: 0.7, display: "flex", alignItems: "center" }}
          >
            <X size={14} />
          </span>
        )}
        {!isActive && (
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}
            style={{ display: "flex", opacity: 0.35 }}>
            <ChevronDown size={15} />
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              zIndex: 100, borderRadius: "14px",
              border: "1px solid var(--sc-border)", background: "var(--sc-panel)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
              overflow: "hidden", display: "flex", flexDirection: "column",
              maxHeight: "300px",
            }}
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
                  style={{
                    width: "100%", padding: "7px 10px 7px 30px",
                    background: "var(--sc-surface)", border: "1px solid var(--sc-border)",
                    borderRadius: "8px", outline: "none", fontSize: "0.8rem",
                    color: "var(--sc-fg)", fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
            </div>

            <div style={{ overflowY: "auto", padding: "6px" }}>
              {filtered.length > 0 ? filtered.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setValue(opt); setOpen(false); setQuery(""); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "9px 12px",
                    borderRadius: "8px", fontSize: "0.84rem", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", border: "none",
                    background: opt === value ? "rgba(139,92,246,0.2)" : "transparent",
                    color: opt === value ? "var(--sc-accent-light)" : "var(--sc-fg-muted)",
                    fontWeight: opt === value ? 600 : 400,
                    transition: "background 0.12s, color 0.12s",
                  }}
                  onMouseEnter={e => {
                    if (opt !== value) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLElement).style.color = "var(--sc-fg)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (opt !== value) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--sc-fg-muted)";
                    }
                  }}
                >
                  {opt}
                </button>
              )) : (
                <p style={{
                  textAlign: "center", padding: "24px 0", fontSize: "0.8rem",
                  color: "var(--sc-muted)", fontStyle: "italic",
                  fontFamily: "'DM Sans', sans-serif",
                }}>No results found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function JobSearch({ onSearch, className = "" }: JobSearchProps) {
  const [jobTitle, setJobTitle]     = useState("All Job Titles");
  const [jobLocation, setJobLocation] = useState("All Locations");
  const [jobType, setJobType]       = useState("All Jobs");
  const [salary, setSalary]         = useState("All Salaries");
  const [pulse, setPulse]           = useState(false);

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
  };

  const handleSearch = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
    onSearch({
      search:   jobTitle   === "All Job Titles"  ? "" : jobTitle,
      location: jobLocation === "All Locations"  ? "" : jobLocation,
      jobType:  jobType    === "All Jobs"        ? "" : jobType,
      salary:   salary     === "All Salaries"    ? "" : salary,
    });
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');

    .sc-root {
      --sc-bg:           #0d0d0f;
      --sc-surface:      rgba(255,255,255,0.04);
      --sc-panel:        #18181c;
      --sc-border:       rgba(255,255,255,0.09);
      --sc-border-hover: rgba(255,255,255,0.2);
      --sc-fg:           #f0eff4;
      --sc-fg-muted:     rgba(240,239,244,0.65);
      --sc-muted:        rgba(240,239,244,0.35);
      --sc-accent:       #8b5cf6;
      --sc-accent-light: #c4b5fd;
      --sc-accent2:      #06b6d4;
      font-family: 'DM Sans', sans-serif;
    }

    .sc-card {
      background: linear-gradient(135deg, #141418 0%, #0f0f14 60%, #11101a 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 24px;
      padding: 32px;
      position: relative;
      overflow: hidden;
    }

    .sc-card::before {
      content: '';
      position: absolute;
      top: -80px; right: -80px;
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
      pointer-events: none;
    }

    .sc-card::after {
      content: '';
      position: absolute;
      bottom: -60px; left: -40px;
      width: 240px; height: 240px;
      background: radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%);
      pointer-events: none;
    }

    .sc-search-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; height: 52px; border-radius: 14px; border: none; cursor: pointer;
      font-size: 0.95rem; font-weight: 700; letter-spacing: 0.02em;
      font-family: 'DM Sans', sans-serif;
      background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #6d28d9 100%);
      color: #fff;
      position: relative; overflow: hidden;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 4px 24px rgba(139,92,246,0.35), 0 1px 3px rgba(0,0,0,0.4);
    }

    .sc-search-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 32px rgba(139,92,246,0.45), 0 2px 6px rgba(0,0,0,0.4);
    }

    .sc-search-btn:active { transform: translateY(0); }

    .sc-search-btn::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
      pointer-events: none;
    }

    .sc-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 20px; font-size: 0.73rem; font-weight: 600;
      background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3);
      color: var(--sc-accent-light); cursor: pointer; font-family: 'DM Sans', sans-serif;
      transition: background 0.15s;
    }

    .sc-pill:hover { background: rgba(139,92,246,0.25); }

    .sc-trend-pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 500;
      background: rgba(255,255,255,0.04); border: 1px solid var(--sc-border);
      color: var(--sc-muted); cursor: pointer; font-family: 'DM Sans', sans-serif;
      transition: all 0.15s;
    }

    .sc-trend-pill:hover {
      background: rgba(255,255,255,0.08);
      color: var(--sc-fg-muted);
      border-color: rgba(255,255,255,0.15);
    }

    .sc-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
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
  `;

  return (
    <>
      <style>{css}</style>
      <div className={`sc-root ${className}`}>
        <motion.div
          className="sc-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{ marginBottom: "28px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Sparkles size={15} style={{ color: "var(--sc-accent-light)", opacity: 0.8 }} />
              <span style={{
                fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "var(--sc-accent-light)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Smart Search
              </span>
            </div>
            <h2 style={{
              fontSize: "1.6rem", fontWeight: 400, color: "var(--sc-fg)",
              fontFamily: "'DM Serif Display', serif", lineHeight: 1.25,
              margin: 0,
            }}>
              Find your next opportunity
            </h2>
          </motion.div>

          {/* Primary search */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <SearchableDropdown
              value={jobTitle}
              setValue={setJobTitle}
              options={JOB_TITLES}
              icon={Search}
              label="Job Title or Role"
              placeholder="Search titles, skills..."
              defaultLabel="All Job Titles"
            />
          </motion.div>

          <div className="sc-divider" />

          {/* Secondary filters */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}
          >
            <SearchableDropdown
              value={jobLocation}
              setValue={setJobLocation}
              options={LOCATIONS}
              icon={MapPin}
              label="Location"
              placeholder="Search cities..."
              defaultLabel="All Locations"
            />
            <SearchableDropdown
              value={jobType}
              setValue={setJobType}
              options={JOB_TYPES}
              icon={Briefcase}
              label="Job Type"
              placeholder="Filter type..."
              defaultLabel="All Jobs"
            />
            <SearchableDropdown
              value={salary}
              setValue={setSalary}
              options={SALARY_RANGES}
              icon={IndianRupee}
              label="Salary Range"
              placeholder="Filter salary..."
              defaultLabel="All Salaries"
            />
          </motion.div>

          {/* Active filter chips */}
          <AnimatePresence>
            {activeCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ marginBottom: "16px", overflow: "hidden" }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                  <span style={{
                    fontSize: "0.7rem", color: "var(--sc-muted)", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.1em", marginRight: "2px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Active:
                  </span>

                  {jobTitle !== "All Job Titles" && (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="sc-pill" onClick={() => setJobTitle("All Job Titles")}>
                      {jobTitle} <X size={11} />
                    </motion.span>
                  )}
                  {jobLocation !== "All Locations" && (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="sc-pill" onClick={() => setJobLocation("All Locations")}>
                      {jobLocation} <X size={11} />
                    </motion.span>
                  )}
                  {jobType !== "All Jobs" && (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="sc-pill" onClick={() => setJobType("All Jobs")}>
                      {jobType} <X size={11} />
                    </motion.span>
                  )}
                  {salary !== "All Salaries" && (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="sc-pill" onClick={() => setSalary("All Salaries")}>
                      {salary} <X size={11} />
                    </motion.span>
                  )}

                  <button
                    onClick={clearAll}
                    style={{
                      marginLeft: "4px", background: "none", border: "none", cursor: "pointer",
                      fontSize: "0.72rem", color: "var(--sc-muted)",
                      textDecoration: "underline", fontFamily: "'DM Sans', sans-serif",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--sc-fg)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--sc-muted)")}
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <button
              onClick={handleSearch}
              className={`sc-search-btn${pulse ? " sc-pulse" : ""}`}
            >
              <Search size={17} />
              Search Jobs
              {activeCount > 0 && (
                <span style={{
                  marginLeft: "4px", background: "rgba(255,255,255,0.2)",
                  borderRadius: "10px", padding: "1px 8px",
                  fontSize: "0.75rem", fontWeight: 700,
                }}>
                  {activeCount} filter{activeCount > 1 ? "s" : ""}
                </span>
              )}
            </button>
          </motion.div>

          {/* Trending row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}
          >
            <TrendingUp size={13} style={{ color: "var(--sc-muted)", flexShrink: 0 }} />
            <span style={{
              fontSize: "0.7rem", color: "var(--sc-muted)", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.1em",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Trending:
            </span>
            {TRENDING.map(t => (
              <button
                key={t}
                className="sc-trend-pill"
                onClick={() => { setJobTitle(t); }}
              >
                {t}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}