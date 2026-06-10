import JobCard from "@/components/job-card";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { QuickApplyModal } from "@/components/quick-apply-modal";
import { CompanyProfileModal } from "@/components/company-profile-modal";
import JobSearch from "@/components/job-search";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/lib/api";
import { Sparkles } from "lucide-react";
import {
  motion,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  Briefcase,
  MapPin,
  Clock,
  IndianRupee,
  TrendingUp,
  Zap,
  ArrowRight,
  Building,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { hasActiveJobFilters, normalizeJobTypeFilter } from "@/lib/job-filters";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─── Types ─────────────────────────────────────────────────────── */
interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  skills: string[];
  companyId: string;
  employerId: string;
  isActive: boolean;
  createdAt: string;
  company?: { id?: string; name: string };
  employer?: { firstName: string; lastName: string };
  matchScore?: number;
  matchReasons?: string[];
}

interface JobsApiResponse {
  jobs: Job[];
  totalCount: number;
}

/* ─── CSS injected at runtime ────────────────────────────────────── */
const OBSIDIAN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .obs-root {
    font-family: 'Outfit', sans-serif;
    transition: background .45s ease, color .45s ease;
    -webkit-overflow-scrolling: touch;
    
    /* Theme Variables - Default Light */
    --obs-bg: #f3f4f6;
    --jobs-surface: #ffffff;
    --jobs-surface-border: rgba(15, 23, 42, 0.08);
    --jobs-row-hover: rgba(248, 250, 252, 0.95);
    --jobs-row-border: rgba(15, 23, 42, 0.06);
    --obs-text: hsl(var(--foreground));
    --obs-feat-bg: linear-gradient(160deg, #ffffff 0%, #eef2ff 60%, #faf5ff 100%);
    --obs-feat-border: linear-gradient(135deg, rgba(129,140,248,.35) 0%, rgba(196,181,253,.25) 40%, rgba(248,250,252,1) 100%);
    --obs-headline-grad: linear-gradient(135deg, #0f172a 0%, #4f46e5 50%, #7c3aed 100%);
    --obs-ticker-bg: linear-gradient(90deg, transparent, rgba(99,102,241,.03) 50%, transparent);
    --obs-ticker-text: rgba(15,23,42,.6);
    --obs-sub-text: #475569;
    --obs-modal-header: #0f172a;
    --obs-badge-bg: rgba(99,102,241,.12);
    --obs-badge-text: #4f46e5;
    --obs-badge-border: rgba(99,102,241,.35);
    --obs-badge-icon: #f59e0b;
    
    background: var(--obs-bg);
    color: var(--obs-text);
  }

  .dark .obs-root {
    --jobs-surface: rgba(14, 14, 22, 0.88);
    --jobs-surface-border: rgba(255, 255, 255, 0.07);
    --jobs-row-hover: rgba(255, 255, 255, 0.03);
    --jobs-row-border: rgba(255, 255, 255, 0.06);
    --obs-bg: linear-gradient(160deg, #07070f 0%, #0c0b1a 50%, #080714 100%);
    --obs-text: #e2e8f0;
    --obs-feat-bg: linear-gradient(160deg, #0d0d1f 0%, #0a0a18 100%);
    --obs-feat-border: linear-gradient(135deg, rgba(139,92,246,.5) 0%, rgba(99,102,241,.25) 40%, rgba(245,158,11,.2) 100%);
    --obs-headline-grad: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 50%, #c084fc 100%);
    --obs-ticker-bg: linear-gradient(90deg, transparent, rgba(99,102,241,.05) 50%, transparent);
    --obs-ticker-text: rgba(241,245,249,.6);
    --obs-sub-text: #94a3b8;
    --obs-modal-header: #f1f5f9;
    --obs-badge-bg: rgba(165,180,252,.15);
    --obs-badge-text: #a5b4fc;
    --obs-badge-border: rgba(165,180,252,.4);
    --obs-badge-icon: #fbbf24;
  }

  .obs-display { font-family: 'Sora', sans-serif; }

  /* ── Keyframes ── */
  @keyframes orb-a {
    0%,100%  { transform: translate(0,0)   scale(1);    }
    30%      { transform: translate(50px,-35px) scale(1.08); }
    70%      { transform: translate(-25px,45px) scale(0.93); }
  }
  @keyframes orb-b {
    0%,100%  { transform: translate(0,0)    scale(1);   }
    40%      { transform: translate(-55px,30px) scale(1.1); }
    80%      { transform: translate(35px,-45px) scale(0.9); }
  }
  @keyframes orb-c {
    0%,100%  { transform: translate(0,0)   scale(1);    }
    50%      { transform: translate(30px,-20px) scale(1.06); }
  }
  @keyframes grain-shift {
    0%,100% { transform: translate(0,0); }
    10%  { transform: translate(-2%,-2%); }
    20%  { transform: translate(-4%, 0%); }
    30%  { transform: translate(4%,  2%); }
    40%  { transform: translate(-2%, 6%); }
    50%  { transform: translate(-4%, 4%); }
    60%  { transform: translate(2%,  2%); }
    70%  { transform: translate(2%, -4%); }
    80%  { transform: translate(-4%, 6%); }
    90%  { transform: translate(4%,  4%); }
  }
  @keyframes shimmer-slide {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: .7; }
    100% { transform: scale(1.8); opacity: 0;  }
  }
  @keyframes float-y {
    0%,100% { transform: translateY(0px);  }
    50%     { transform: translateY(-10px); }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes fade-up {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes ticker-scroll {
    from { transform: translateX(0);     }
    to   { transform: translateX(-50%);  }
  }

  /* ── Noise grain overlay ── */
  .obs-grain {
    position: fixed; inset: -50%;
    width: 200%; height: 200%;
    opacity: .03; pointer-events: none; z-index: 1;
    animation: grain-shift 8s steps(10) infinite;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 256px 256px;
    will-change: transform;
    transform: translateZ(0);
  }

  /* ── Glass surface ── */
  .obs-glass {
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(22px) saturate(140%);
    border: 1px solid rgba(255,255,255,.09);
    transition: all .3s cubic-bezier(.4,0,.2,1);
    will-change: transform;
    transform: translateZ(0);
  }
  .obs-glass:hover {
    background: rgba(255,255,255,.07);
    border-color: rgba(99,102,241,.4);
    box-shadow:
      0 0 0 1px rgba(99,102,241,.15),
      0 24px 64px -20px rgba(99,102,241,.3),
      0 4px 24px -4px rgba(0,0,0,.6);
    transform: translateY(-4px);
  }

  /* ── Stat card ── */
  .obs-stat {
    position: relative; overflow: hidden;
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(28px) saturate(130%);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 20px;
    transition: all .4s cubic-bezier(.4,0,.2,1);
  }
  .obs-stat::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,.9) 40%, rgba(167,139,250,.7) 60%, transparent);
  }
  .obs-stat::after {
    content:'';
    position:absolute; inset:0; border-radius:inherit;
    background: radial-gradient(ellipse at top, rgba(99,102,241,.06) 0%, transparent 65%);
    pointer-events:none;
  }
  .obs-stat:hover {
    border-color: rgba(99,102,241,.35);
    box-shadow:
      0 0 0 1px rgba(99,102,241,.2),
      0 32px 64px -24px rgba(99,102,241,.25),
      inset 0 1px 0 rgba(255,255,255,.08);
    transform: translateY(-6px);
  }

  /* ── Gradient text helpers ── */
  .obs-text-violet {
    background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 50%, #e879f9 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .obs-text-amber {
    background: linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #f59e0b 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .obs-text-blue {
    background: linear-gradient(135deg, #93c5fd 0%, #6366f1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .obs-gradient-text {
    background-clip: text !important;
    -webkit-background-clip: text !important;
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    display: inline-block;
  }

  /* ── Shimmer button ── */
  .obs-btn-shimmer {
    background: linear-gradient(90deg,#4f46e5,#7c3aed,#4338ca,#4f46e5);
    background-size: 300% auto;
    animation: shimmer-slide 4s linear infinite;
    border: none; outline: none;
  }
  .obs-btn-shimmer:hover { opacity: .9; transform: translateY(-1px); }

  /* ── Badge pulse ring ── */
  .obs-badge-pulse { position: relative; }
  .obs-badge-pulse::after {
    content:'';
    position:absolute; inset:0; border-radius:inherit;
    box-shadow: 0 0 0 0 rgba(99,102,241,.6);
    animation: pulse-ring 2.5s ease-out infinite;
  }

  /* ── Premium jobs list ── */
  .jobs-list-panel {
    border-radius: 24px;
    padding: 0;
    overflow: hidden;
    background: var(--jobs-surface);
    border: 1px solid var(--jobs-surface-border);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.6) inset,
      0 20px 50px -24px rgba(15,23,42,0.12);
  }
  .dark .jobs-list-panel {
    box-shadow: 0 24px 64px -32px rgba(0,0,0,0.55);
  }

  .jobs-list-header {
    padding: 2rem 2rem 1.5rem;
    border-bottom: 1px solid var(--jobs-row-border);
  }

  .jobs-list-header-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .jobs-trending-header {
    border-bottom: none;
    padding-bottom: 0.75rem;
  }

  .jobs-unified-divider {
    height: 1px;
    margin: 0.25rem 2rem 0;
    background: linear-gradient(90deg, transparent, var(--jobs-row-border), transparent);
  }

  .jobs-category-block {
    padding: 0 0.75rem 0.25rem;
  }

  .jobs-category-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.65rem 1.25rem 0.35rem;
  }

  .jobs-category-name {
    font-family: 'Outfit', sans-serif;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6366f1;
  }
  .dark .jobs-category-name { color: #a5b4fc; }

  .jobs-category-count {
    font-family: 'Outfit', sans-serif;
    font-size: 0.6875rem;
    font-weight: 500;
    color: #94a3b8;
  }

  .jobs-trending-list {
    padding-top: 0;
    padding-bottom: 0.25rem;
  }

  .job-list-row-ranked {
    gap: 0.75rem;
  }

  .job-list-rank {
    width: 2rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Sora', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #94a3b8;
    font-variant-numeric: tabular-nums;
  }

  .job-list-rank-top {
    color: #6366f1;
  }
  .dark .job-list-rank-top { color: #a5b4fc; }

  .jobs-list-eyebrow {
    font-family: 'Outfit', sans-serif;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }
  .dark .jobs-list-eyebrow { color: #64748b; }

  .jobs-list-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.375rem, 2.8vw, 1.75rem);
    font-weight: 600;
    letter-spacing: -0.03em;
    color: #0f172a;
    line-height: 1.15;
  }
  .dark .jobs-list-title { color: #f8fafc; }

  .jobs-list-meta {
    font-family: 'Outfit', sans-serif;
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 0.5rem;
    font-weight: 400;
    line-height: 1.5;
  }
  .dark .jobs-list-meta { color: #94a3b8; }

  .jobs-premium-list {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.75rem 0.75rem;
  }

  .job-list-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 16px;
    cursor: pointer;
    transition: background 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid transparent;
  }
  .job-list-row:hover {
    background: var(--jobs-row-hover);
    border-color: var(--jobs-row-border);
    box-shadow: 0 4px 20px -12px rgba(15,23,42,0.08);
  }
  .dark .job-list-row:hover {
    box-shadow: 0 8px 28px -16px rgba(0,0,0,0.4);
  }

  .job-list-avatar {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Sora', sans-serif;
    font-size: 0.8125rem;
    font-weight: 700;
    flex-shrink: 0;
    letter-spacing: -0.02em;
  }

  .job-list-body {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }

  .job-list-copy { min-width: 0; flex: 1; }

  .job-list-title {
    font-family: 'Sora', sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #0f172a;
    line-height: 1.35;
    transition: color 0.15s ease;
  }
  .dark .job-list-title { color: #f1f5f9; }
  .job-list-row:hover .job-list-title { color: #312e81; }
  .dark .job-list-row:hover .job-list-title { color: #e0e7ff; }

  .job-list-sub {
    margin-top: 0.25rem;
    font-family: 'Outfit', sans-serif;
    font-size: 0.8125rem;
    line-height: 1.45;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 0.5rem;
  }

  .job-list-company {
    font-weight: 500;
    color: #475569;
  }
  .dark .job-list-company { color: #cbd5e1; }

  .job-list-sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #cbd5e1;
    flex-shrink: 0;
  }
  .dark .job-list-sep { background: #475569; }

  .job-list-meta {
    color: #94a3b8;
    font-weight: 400;
  }
  .dark .job-list-meta { color: #64748b; }

  .job-list-actions {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-shrink: 0;
  }

  .job-list-time {
    font-family: 'Outfit', sans-serif;
    font-size: 0.75rem;
    color: #94a3b8;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .dark .job-list-time { color: #64748b; }

  .job-list-apply {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.45rem 0.95rem;
    border-radius: 999px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: #334155;
    background: transparent;
    border: 1px solid rgba(15, 23, 42, 0.1);
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .job-list-row:hover .job-list-apply,
  .job-list-apply:hover,
  .job-list-apply:focus-visible {
    color: #fff;
    background: #0f172a;
    border-color: #0f172a;
    box-shadow: 0 4px 14px -4px rgba(15, 23, 42, 0.35);
  }
  .dark .job-list-apply {
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, 0.12);
  }
  .dark .job-list-row:hover .job-list-apply,
  .dark .job-list-apply:hover {
    background: #f8fafc;
    color: #0f172a;
    border-color: #f8fafc;
    box-shadow: 0 4px 14px -4px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 768px) {
    .job-list-body { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .job-list-actions { width: 100%; justify-content: space-between; }
    .jobs-list-header { padding: 1.5rem 1.25rem 1.25rem; }
    .jobs-premium-list { padding: 0.25rem 0.5rem 0.5rem; }
    .job-list-row { padding: 0.875rem 1rem; }
  }

  .job-card-surface {
    background: var(--jobs-surface);
    border: 1px solid var(--jobs-surface-border);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .job-card-surface:hover {
    border-color: rgba(15,23,42,0.12);
    box-shadow: 0 12px 32px -20px rgba(15,23,42,0.12);
  }

  .jobs-pagination {
    margin: 0;
    padding: 1.25rem 2rem 1.75rem;
    border-top: 1px solid var(--jobs-row-border);
    background: linear-gradient(180deg, transparent, rgba(248,250,252,0.5));
  }
  .dark .jobs-pagination {
    background: linear-gradient(180deg, transparent, rgba(255,255,255,0.02));
  }

  .jobs-page-btn {
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    font-size: 0.8125rem;
    border-radius: 999px;
    min-width: 2.25rem;
    height: 2.25rem;
    padding: 0 0.65rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
    color: #64748b;
    background: transparent;
  }
  .jobs-page-btn:hover:not(.is-active) {
    background: #f1f5f9;
    color: #334155;
  }
  .jobs-page-btn.is-active {
    background: #0f172a;
    color: #fff;
  }
  .dark .jobs-page-btn { color: #94a3b8; }
  .dark .jobs-page-btn:hover:not(.is-active) {
    background: rgba(255,255,255,0.06);
    color: #e2e8f0;
  }
  .dark .jobs-page-btn.is-active {
    background: #f8fafc;
    color: #0f172a;
  }

  .obs-root-light .obs-divider {
    background: transparent;
    margin: 3rem 0;
    height: 0;
  }

  /* ── Featured guest card ── */
  .obs-feat-card {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 16px;
    transition: all .3s ease;
  }
  .obs-feat-card:hover {
    background: rgba(255,255,255,.08);
    border-color: rgba(139,92,246,.45);
    box-shadow: 0 0 0 1px rgba(139,92,246,.2), 0 16px 40px -12px rgba(139,92,246,.25);
    transform: translateY(-3px);
  }

  /* ── Ticker ── */
  .obs-ticker-track { animation: ticker-scroll 22s linear infinite; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,.02); }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,.45); border-radius:3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,.7); }

  /* ── Dot grid hero decoration ── */
  .obs-dot-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image: radial-gradient(rgba(99,102,241,.18) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 80%);
  }

  /* ── Glowing divider ── */
  .obs-divider {
    height:1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,.4) 40%, rgba(167,139,250,.3) 60%, transparent);
    margin: 3rem 0;
  }

  /* ── Section badge ── */
  .obs-section-badge {
    display:inline-flex; align-items:center; gap:.5rem;
    padding: .35rem 1rem; border-radius:999px;
    font-size:.75rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
    border: 1px solid rgba(245,158,11,.35);
    background: rgba(245,158,11,.1);
    color: #fbbf24;
  }
  .obs-section-badge-violet {
    border-color: rgba(139,92,246,.35);
    background: rgba(139,92,246,.1);
    color: #c084fc;
  }

  /* ── Empty state ── */
  .obs-empty {
    background: rgba(255,255,255,.03);
    border: 2px dashed rgba(255,255,255,.08);
    border-radius:24px;
    text-align:center; padding:5rem 2rem;
  }

  /* ── Light theme refinements ── */
  .obs-root-light .obs-glass {
    background: rgba(255,255,255,.95);
    border: 1px solid rgba(226,232,240,1);
    box-shadow:
      0 18px 40px -24px rgba(15,23,42,.25),
      0 0 0 1px rgba(148,163,184,.18);
  }
  .obs-root-light .obs-glass:hover {
    background: #ffffff;
    border-color: rgba(129,140,248,.6);
    box-shadow:
      0 22px 50px -26px rgba(129,140,248,.45),
      0 0 0 1px rgba(129,140,248,.35);
  }

  .obs-root-light .obs-stat {
    background: rgba(255,255,255,.96);
    border: 1px solid rgba(226,232,240,1);
    box-shadow:
      0 18px 40px -24px rgba(15,23,42,.20),
      0 0 0 1px rgba(148,163,184,.12);
  }

  .obs-root-light .obs-feat-card {
    background: rgba(255,255,255,.98);
    border: 1px solid rgba(226,232,240,1);
    box-shadow:
      0 16px 40px -24px rgba(15,23,42,.15);
  }
  .obs-root-light .obs-feat-card:hover {
    background: #ffffff;
    border-color: rgba(129,140,248,.55);
    box-shadow:
      0 22px 50px -24px rgba(129,140,248,.35);
  }

  .obs-root-light .obs-empty {
    background: rgba(248,250,252,1);
    border-color: rgba(203,213,225,1);
  }

  .obs-root-light .obs-text-violet {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .obs-root-light .obs-text-amber {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .obs-root-light .obs-text-blue {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .obs-root-light .obs-section-badge {
    border-color: rgba(245,158,11,0.4);
    background: rgba(245,158,11,0.08);
    color: #b45309;
  }
  .obs-root-light .obs-section-badge-violet {
    border-color: rgba(99,102,241,0.4);
    background: rgba(99,102,241,0.08);
    color: #4f46e5;
  }

  /* Light mode performance pass:
     disable non-essential infinite animations that can hurt scroll smoothness */
  .obs-root-light .obs-badge-pulse::after,
  .obs-root-light .obs-ticker-track {
    animation: none !important;
  }
`;

/* ─── Animated Counter ─────────────────────────────────────────── */
const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView || value === 0) { setCount(0); return; }
    let cur = 0;
    const inc = Math.max(1, Math.ceil(value / (duration / 16)));
    const id = setInterval(() => {
      cur = Math.min(cur + inc, value);
      setCount(cur);
      if (cur >= value) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [inView, value, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

/* ─── Ticker labels ────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Full-Time", "Remote", "Internship", "Part-Time", "Contract",
  "Engineering", "Design", "Product", "Data Science", "DevOps", "AI/ML",
  "Full-Time", "Remote", "Internship", "Part-Time", "Contract",
  "Engineering", "Design", "Product", "Data Science", "DevOps", "AI/ML",
];

function jobCategoryLabel(jobType?: string): string {
  if (!jobType?.trim()) return "Other Roles";
  const normalized = jobType.toLowerCase().replace(/[-_]/g, " ");
  if (normalized.includes("remote")) return "Remote";
  if (normalized.includes("full")) return "Full-time";
  if (normalized.includes("part")) return "Part-time";
  if (normalized.includes("contract")) return "Contract";
  if (normalized.includes("intern")) return "Internship";
  return jobType
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function Jobs() {
  const { user } = useAuth();
  const { t } = useLanguage();
   const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [filters, setFilters] = useState({ location: "", skills: [] as string[], jobType: "", search: "" });
  const [filterResetToken, setFilterResetToken] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<Job | null>(null);
  const [companyProfileId, setCompanyProfileId] = useState<string | null>(null);
  const [companyProfileName, setCompanyProfileName] = useState("");
  const [headlineIndex, setHeadlineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const itemsPerPage = 12;
  const statsRef = useRef<HTMLDivElement>(null);
  const jobsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: "-40px" });
  const isJobsInView = useInView(jobsRef, { once: true, margin: "-80px" });

  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (jobsRef.current) {
      const y = jobsRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [page]);

  /* ── inject CSS ── */
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = OBSIDIAN_CSS;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  // Ensure page scroll is never locked on this route.
  // Some modal libraries can temporarily set overflow hidden on body/html.
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  /* ── helpers ── */
  const buildQS = (f: typeof filters, p: number, n: number) => {
    const params = new URLSearchParams();
    if (f.location) params.append("location", f.location);
    if (f.jobType) params.append("jobType", normalizeJobTypeFilter(f.jobType));
    if (f.search) params.append("search", f.search);
    f.skills.forEach((s) => params.append("skills", s));
    params.append("page", String(p));
    params.append("itemsPerPage", String(n));
    return params.toString();
  };

  /* ── queries ── */
  const isProfessional = user?.userType === "Professional" || user?.userType === "job_seeker";
  const { data: recommendedData } = useQuery({
    queryKey: ["/api/jobs/recommended"],
    queryFn: () => api.jobs.getRecommended(),
    staleTime: 300_000,
    enabled: !!isProfessional,
  });
  const recommendedJobs = (recommendedData?.jobs ?? []) as Job[];

  const isGuest = !user;
  const TRENDING_PREVIEW = 10;

  const { data: trendingData } = useQuery<JobsApiResponse>({
    queryKey: ["/api/jobs/trending", TRENDING_PREVIEW],
    queryFn: async () => {
      const r = await apiFetch(`/api/jobs?page=1&itemsPerPage=${TRENDING_PREVIEW}`);
      if (!r.ok) throw new Error("trending fetch failed");
      const d = await r.json();
      return { jobs: d.jobs ?? [], totalCount: d.totalCount ?? 0 };
    },
    staleTime: 300_000,
  });
  const trendingJobs = (trendingData?.jobs ?? []) as Job[];
  const catalogTotal = trendingData?.totalCount ?? 0;

  const { data: marketSnapshot } = useQuery({
    queryKey: ["/api/jobs/market-snapshot"],
    queryFn: async () => {
      const r = await apiFetch("/api/jobs?page=1&itemsPerPage=100");
      if (!r.ok) throw new Error("snapshot fetch failed");
      const d = await r.json();
      const sample = (d.jobs ?? []) as Job[];
      return {
        totalCount: d.totalCount ?? 0,
        totalLocations: new Set(sample.map((j) => j.location)).size,
        totalJobTypes: new Set(sample.map((j) => j.jobType)).size,
        avgSalary: sample.length > 0
          ? Math.round(sample.reduce((a, j) => a + (j.salaryMin + j.salaryMax) / 2, 0) / sample.length / 1000)
          : 0,
      };
    },
    staleTime: 120_000,
  });

  const { data, isLoading, isError, refetch } = useQuery<JobsApiResponse>({
    queryKey: ["/api/jobs", { ...filters, page, itemsPerPage }],
    queryFn: async () => {
      const r = await apiFetch(`/api/jobs?${buildQS(filters, page, itemsPerPage)}`);
      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        throw new Error(
          typeof errBody?.message === "string" ? errBody.message : "jobs fetch failed"
        );
      }
      const d = await r.json();
      return { jobs: d.jobs ?? [], totalCount: d.totalCount ?? 0 };
    },
    staleTime: 30_000,
  });

  const jobs = data?.jobs ?? [];
  const totalJobs = data?.totalCount ?? 0;
  const filtersActive = hasActiveJobFilters(filters);
  const totalPages = Math.max(1, Math.ceil(totalJobs / itemsPerPage));
  const showTrendingPreview = !filtersActive && trendingJobs.length > 0;

  const trendingByCategory = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of trendingJobs) {
      const cat = jobCategoryLabel(job.jobType);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(job);
    }
    return Array.from(map.entries()).sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
    );
  }, [trendingJobs]);

  const trendingIds = useMemo(
    () => new Set(trendingJobs.map((j) => j.id)),
    [trendingJobs]
  );

  const listJobs = useMemo(() => {
    if (filtersActive || page > 1) return jobs;
    return jobs.filter((j) => !trendingIds.has(j.id));
  }, [jobs, filtersActive, page, trendingIds]);

  const scrollToJobResults = () => {
    if (jobsRef.current) {
      const y = jobsRef.current.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const scrollToAvailableJobs = () => {
    const el = document.getElementById("available-jobs");
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const snapshot = marketSnapshot ?? {
    totalCount: catalogTotal || totalJobs,
    totalLocations: 0,
    totalJobTypes: 0,
    avgSalary: 0,
  };

  /* ── stat cards config ── */
  const statCards = [
    { icon: Briefcase, label: t("jobs.totalJobs"), value: snapshot.totalCount, suffix: "", gradient: "from-indigo-500 to-violet-600", textCls: "obs-text-violet", delay: 0 },
    { icon: MapPin, label: t("jobs.locations"), value: snapshot.totalLocations, suffix: "+", gradient: "from-blue-500 to-cyan-500", textCls: "obs-text-blue", delay: 0.07 },
    { icon: Clock, label: t("jobs.jobTypes"), value: snapshot.totalJobTypes, suffix: "+", gradient: "from-purple-500 to-pink-500", textCls: "obs-text-violet", delay: 0.14 },
    { icon: IndianRupee, label: t("jobs.avgSalary"), value: snapshot.avgSalary, suffix: "k+", gradient: "from-amber-400 to-orange-500", textCls: "obs-text-amber", delay: 0.21, isCurrency: true },
  ];

   /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div
      className={`obs-root min-h-screen relative overflow-x-clip ${isDark ? "obs-root-dark" : "obs-root-light"}`}
    >
      {/* ── Grain (kept only for dark theme so light stays crisp) ── */}
      {isDark && <div className="obs-grain" />}



      {/* ════ CONTENT ════ */}
      <div className="relative py-10" style={{ zIndex: 2 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>

          {/* ── HERO ── */}
          <div className="text-center mb-16 relative">
            {/* Dot grid decoration */}
            <div className="obs-dot-grid" style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: "100%", height: 320, pointerEvents: "none" }} />

            {/* Eyebrow */}
             <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .1 }} className="inline-block mb-6">
              <div
                className="obs-badge-pulse inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
                style={{
                  background: "var(--obs-badge-bg)",
                  border: "1px solid var(--obs-badge-border)",
                  backdropFilter: "blur(14px)",
                  boxShadow: isDark ? "0 0 20px rgba(99,102,241,.15)" : "none"
                }}
              >
                <motion.div animate={{ rotate: [0, 18, 0], scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <Zap className="w-4 h-4" style={{ color: "var(--obs-badge-icon)", fill: "var(--obs-badge-icon)", opacity: 0.9 }} />
                </motion.div>
                <span style={{ fontSize: ".875rem", fontWeight: 700, color: "var(--obs-badge-text)", letterSpacing: ".02em" }}>
                  <AnimatedCounter value={snapshot.totalCount || catalogTotal} duration={1800} /> live opportunities
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 44 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .85, delay: 0.2, type: "spring", stiffness: 75 }}
              className="obs-display"
              style={{
                fontSize: "clamp(1.8rem, 6.5vw, 3.8rem)",
                fontWeight: 800,
                lineHeight: 1.3,
                letterSpacing: "-.04em",
                marginBottom: "1.5rem",
                maxWidth: "950px",
                margin: "0 auto 1.5rem"
              }}
            >
              <div style={{ position: "relative", minHeight: "1.3em" }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={headlineIndex}
                    initial={{ y: 40, opacity: 0, rotateX: -90 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    exit={{ y: -40, opacity: 0, rotateX: 90 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                     style={{
                      display: "block",
                      background: "var(--obs-headline-grad)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      perspective: "1000px"
                    }}
                  >
                    {[
                      "Careers That Move You Forward",
                      "Opportunities That Define Your Future",
                      "Connections That Spark Innovation",
                      "Excellence That Drives Success"
                    ][headlineIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .7, delay: .4 }}
              style={{
                fontSize: "1.15rem",
                color: "var(--obs-sub-text)",
                maxWidth: 520,
                margin: "0 auto 2.5rem",
                lineHeight: 1.75,
              }}
            >
              {t("jobs.discoverLine")}
            </motion.p>

            {/* Removed CTA pills as requested */}
          </div>

          {/* ── TICKER ── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .7 }}
             style={{
              overflow: "hidden",
              margin: "0 -1.5rem 3rem",
               padding: "1.25rem 0",
              borderTop: "1px solid rgba(255,255,255,.06)",
              borderBottom: "1px solid rgba(255,255,255,.06)",
              background: "var(--obs-ticker-bg)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.02), inset 0 -1px 0 rgba(255,255,255,.02)",
              pointerEvents: "none", // Prevent ticker from catching swipe/scroll intent
              userSelect: "none"
            }}
          >
            <div className="obs-ticker-track" style={{ display: "flex", gap: "3rem", width: "max-content" }}>
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".75rem",
                  whiteSpace: "nowrap",
                  fontSize: ".85rem",
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--obs-ticker-text)",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #c084fc)", boxShadow: "0 0 12px rgba(99,102,241,.5)" }} />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ── AI RECOMMENDATIONS ── */}
          {isProfessional && recommendedJobs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .3 }} className="mb-14">
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1.5rem" }}>
                <span className="obs-section-badge">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("jobs.jobsForYou")}
                </span>
                <span style={{ fontSize: ".875rem", color: "#64748b" }}>{t("jobs.personalizedProfile")}</span>
              </div>
              <div className="space-y-4">
                {recommendedJobs.map((job: Job, i: number) => (
                  <motion.div key={job.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .4, delay: i * .05 }} className="obs-job-wrap">
                    <JobCard
                      job={job}
                      variant="card"
                      setSelectedJob={(j) => { setSelectedJob(j); setShowQuickApply(true); }}
                      setShowQuickApply={setShowQuickApply}
                      onCardClick={() => setSelectedJobForDetail(job)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── SEARCH ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: .5 }} style={{ marginBottom: "2rem", position: "relative", zIndex: 20 }}>
            <JobSearch
              resetToken={filterResetToken}
              onSearch={(sf) => {
                setFilters(c => ({ ...c, location: sf.location, jobType: sf.jobType, search: sf.search }));
                setPage(1);
              }}
              onAfterSearch={scrollToJobResults}
            />
          </motion.div>

          {/* ── STATS BENTO ── */}
          <div ref={statsRef}>
            {!isLoading && snapshot.totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: .65, ease: [.22, 1, .36, 1] }}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "3.5rem" }}
              >
                {statCards.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 24 }}
                    animate={isStatsInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: .55, delay: stat.delay, ease: [.22, 1, .36, 1] }}
                    className="obs-stat"
                    style={{ padding: "1.75rem 1.5rem" }}
                  >
                    {/* Icon */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${stat.gradient.replace("from-", "").replace(" to-", ", ").split(" ").map(c => `var(--tw-${c.replace("-", "/")})`).join(", ")})`, backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`, boxShadow: `0 8px 24px -8px rgba(99,102,241,.4)` }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: idx === 3 ? "linear-gradient(135deg,#f59e0b,#d97706)" : idx === 1 ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : idx === 2 ? "linear-gradient(135deg,#a855f7,#ec4899)" : "linear-gradient(135deg,#6366f1,#7c3aed)", boxShadow: "0 6px 20px -6px rgba(99,102,241,.5)" }}>
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ opacity: .35 }}>
                        <BarChart3 className="w-4 h-4" style={{ color: "#6366f1" }} />
                      </motion.div>
                    </div>
                    {/* Value */}
                    <div style={{ marginBottom: ".375rem" }}>
                      <span
                        className={`obs-display ${stat.textCls}`}
                        style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1 }}
                      >
                        <AnimatedCounter value={stat.value} duration={2200} />
                        {stat.suffix}
                      </span>
                    </div>
                    <p style={{ fontSize: ".8rem", fontWeight: 500, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* ── UNIFIED JOBS LIST (Trending + Available) ── */}
          <div ref={jobsRef}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isJobsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: .5, ease: [.22, 1, .36, 1] }}
              className="jobs-list-panel"
            >
              {showTrendingPreview && (
                <>
                  <div className="jobs-list-header jobs-trending-header">
                    <div className="jobs-list-header-row" style={{ width: "100%" }}>
                      <div>
                        <p className="jobs-list-eyebrow">{t("jobs.topPicks")}</p>
                        <h2 className="jobs-list-title">{t("jobs.bestRecommended")}</h2>
                        <p className="jobs-list-meta">
                          {trendingJobs.length} highlighted · {catalogTotal.toLocaleString()} total on SkillConnect
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={scrollToAvailableJobs}
                        className="job-list-apply"
                        style={{ opacity: 1, transform: "none" }}
                      >
                        Browse all
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {trendingByCategory.map(([category, categoryJobs]) => (
                    <div key={category} className="jobs-category-block">
                      <div className="jobs-category-head">
                        <span className="jobs-category-name">{category}</span>
                        <span className="jobs-category-count">{categoryJobs.length} roles</span>
                      </div>
                      <div className="jobs-premium-list jobs-trending-list">
                        {categoryJobs.map((job, index) => (
                          <JobCard
                            key={`trend-${job.id}`}
                            job={job}
                            variant="list"
                            rank={index + 1}
                            setSelectedJob={(j) => { setSelectedJob(j); setShowQuickApply(true); }}
                            setShowQuickApply={setShowQuickApply}
                            onCardClick={() => setSelectedJobForDetail(job)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="jobs-unified-divider" />
                </>
              )}

              <div id="available-jobs" className="jobs-list-header">
                <div>
                  {totalJobs > 0 && (
                    <p className="jobs-list-eyebrow">
                      {totalJobs.toLocaleString()} open roles
                    </p>
                  )}
                  <h2 className="jobs-list-title">{t("jobs.availableOpportunities")}</h2>
                  <p className="jobs-list-meta">
                    {isError
                      ? t("jobs.loadJobsError")
                      : totalJobs > 0
                        ? `${t("jobs.showingCount", { count: listJobs.length, total: totalJobs })} · ${t("jobs.sortedByRelevance")}`
                        : filtersActive
                          ? t("jobs.noJobsMatching")
                          : t("jobs.noJobsAvailable")}
                  </p>
                </div>
              </div>

              <div className="jobs-premium-list">
                <AnimatePresence>
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * .04 }} className="job-list-row">
                        <Skeleton className="w-11 h-11 rounded-[14px] shrink-0" style={{ background: theme === "dark" ? "rgba(255,255,255,.06)" : "#f1f5f9" }} />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48 max-w-full rounded-md" style={{ background: theme === "dark" ? "rgba(255,255,255,.07)" : "#e2e8f0" }} />
                          <Skeleton className="h-3 w-72 max-w-full rounded-md" style={{ background: theme === "dark" ? "rgba(255,255,255,.05)" : "#f1f5f9" }} />
                        </div>
                      </motion.div>
                    ))
                    : isError
                      ? (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, scale: .95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{ gridColumn: "1 / -1" }}
                        >
                          <div className="obs-empty">
                            <h3 className="obs-display" style={{ fontSize: "1.5rem", fontWeight: 700, color: theme === "dark" ? "#f1f5f9" : "#0f172a", marginBottom: ".75rem" }}>
                              {t("jobs.loadJobsError")}
                            </h3>
                            <button
                              type="button"
                              onClick={() => refetch()}
                              className="obs-btn-shimmer"
                              style={{ padding: ".7rem 1.75rem", borderRadius: 12, fontWeight: 700, color: "#fff", fontSize: ".9rem", cursor: "pointer" }}
                            >
                              Retry
                            </button>
                          </div>
                        </motion.div>
                      )
                      : listJobs.length > 0
                      ? listJobs.map((job: Job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            variant="list"
                            setSelectedJob={(j) => { setSelectedJob(j); setShowQuickApply(true); }}
                            setShowQuickApply={setShowQuickApply}
                            onCardClick={() => setSelectedJobForDetail(job)}
                          />
                      ))
                      : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0, scale: .95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{ gridColumn: "1 / -1" }}
                        >
                          <div className="obs-empty">
                            <div style={{ width: 72, height: 72, borderRadius: "50%", background: theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                              <Briefcase className="w-9 h-9" style={{ color: theme === "dark" ? "#334155" : "#94a3b8" }} />
                            </div>
                            <h3 className="obs-display" style={{ fontSize: "1.5rem", fontWeight: 700, color: theme === "dark" ? "#f1f5f9" : "#0f172a", marginBottom: ".75rem" }}>
                              {filtersActive ? t("jobs.noJobsMatching") : t("jobs.noJobsAvailable")}
                            </h3>
                            <p style={{ color: theme === "dark" ? "#64748b" : "#475569", fontSize: ".9rem", marginBottom: "1.75rem", maxWidth: 380, margin: "0 auto 1.75rem" }}>
                              {t("jobs.broadenSearch")}
                            </p>
                            {filtersActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setFilters({ location: "", skills: [], jobType: "", search: "" });
                                setFilterResetToken((n) => n + 1);
                                setPage(1);
                              }}
                              className="obs-btn-shimmer"
                              style={{ padding: ".7rem 1.75rem", borderRadius: 12, fontWeight: 700, color: "#fff", fontSize: ".9rem", cursor: "pointer", boxShadow: "0 8px 24px -8px rgba(99,102,241,.5)" }}
                            >
                              {t("jobs.viewAllJobs")}
                            </button>
                            )}
                          </div>
                        </motion.div>
                      )
                  }
                </AnimatePresence>
              </div>

              {/* ── PAGINATION ── */}
              {totalPages > 1 && (
                <div className="jobs-pagination">
                  <Pagination>
                    <PaginationContent style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(Math.max(1, page - 1))}
                          style={{
                            color: page === 1 ? (isDark ? "#334155" : "#cbd5e1") : (isDark ? "#a5b4fc" : "#4f46e5"),
                            pointerEvents: page === 1 ? "none" : "auto",
                            opacity: page === 1 ? 0.45 : 1,
                            fontWeight: 600,
                            fontSize: "0.875rem",
                          }}
                        />
                      </PaginationItem>

                      <div className="hidden md:flex" style={{ alignItems: "center", gap: "0.35rem" }}>
                        {(function() {
                          const total = totalPages;
                          const current = page;
                          if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
                          if (current <= 3) return [1, 2, 3, '...', total];
                          if (current >= total - 2) return [1, '...', total - 2, total - 1, total];
                          return [1, '...', current, '...', total];
                        })().map((pn, idx) => {
                          if (pn === '...') {
                            return <span key={`ell-${idx}`} className="jobs-list-meta" style={{ padding: "0 6px" }}>...</span>;
                          }
                          return (
                            <PaginationItem key={pn}>
                              <PaginationLink
                                onClick={() => setPage(pn as number)}
                                isActive={pn === page}
                                className={`jobs-page-btn${pn === page ? " is-active" : ""}`}
                              >
                                {pn}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                      </div>

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          style={{
                            color: page === totalPages ? (isDark ? "#334155" : "#cbd5e1") : (isDark ? "#a5b4fc" : "#4f46e5"),
                            pointerEvents: page === totalPages ? "none" : "auto",
                            opacity: page === totalPages ? 0.45 : 1,
                            fontWeight: 600,
                            fontSize: "0.875rem",
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>

                  <p className="jobs-list-meta" style={{ textAlign: "center", marginTop: "0.75rem" }}>
                    Page {page} of {totalPages} · {totalJobs.toLocaleString()} total opportunities
                  </p>
                </div>
              )}

              {isGuest && !filtersActive && (
                <div style={{ padding: "1rem 1.5rem 1.25rem", borderTop: "1px solid var(--jobs-row-border)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>{t("jobs.createAccountToApply")}</p>
                  <div style={{ display: "flex", gap: "0.65rem" }}>
                    <Link to="/login" className="job-list-apply" style={{ opacity: 1, transform: "none", background: "transparent", color: "#334155", border: "1px solid rgba(15,23,42,0.12)" }}>
                      {t("nav.signIn")}
                    </Link>
                    <Link to="/signup" className="job-list-apply" style={{ opacity: 1, transform: "none", textDecoration: "none" }}>
                      {t("jobs.signUpFree")}
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div >
      </div >

      {/* ── JOB DETAIL MODAL ── */}
      <Dialog open={!!selectedJobForDetail} onOpenChange={(o) => !o && setSelectedJobForDetail(null)}>
        <DialogContent
          style={{
            maxWidth: 720,
            maxHeight: "90vh",
            padding: 0,
            overflow: "hidden",
            background: isDark ? "#0f172a" : "#ffffff",
            border: isDark ? "1px solid rgba(99,102,241,.2)" : "1px solid rgba(99,102,241,.15)",
            borderRadius: 24,
            boxShadow: isDark
              ? "0 0 0 1px rgba(99,102,241,.12), 0 40px 80px -20px rgba(0,0,0,.85), 0 0 100px -40px rgba(99,102,241,.25)"
              : "0 0 0 1px rgba(99,102,241,.1), 0 20px 50px -12px rgba(15,23,42,.15)",
          }}
        >
          {selectedJobForDetail && (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
              {/* Premium Gradient Banner */}
              <div
                style={{
                  height: 140,
                  flexShrink: 0,
                  position: "relative",
                  background: isDark
                    ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)"
                    : "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)",
                  overflow: "hidden"
                }}
              >
                <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.15) 0%, transparent 70%)", filter: "blur(20px)" }} />
                <div style={{ position: "absolute", bottom: -50, left: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.2) 0%, transparent 70%)", filter: "blur(20px)" }} />
                {/* Floating Icon */}
                <div style={{ position: "absolute", bottom: -24, left: 32, width: 72, height: 72, borderRadius: 20, background: isDark ? "#0f172a" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", border: isDark ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(0,0,0,.08)", boxShadow: "0 12px 24px -8px rgba(0,0,0,.15)" }}>
                  <Briefcase className="w-8 h-8" style={{ color: "#6366f1" }} />
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div style={{ overflowY: "auto", padding: "3rem 2rem 2rem 2rem", flex: 1 }} className="obs-scroll">
                <DialogHeader style={{ marginBottom: "1.5rem", paddingRight: "2rem" }}>
                  <DialogTitle className="obs-display" style={{ fontSize: "1.8rem", fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: "-.03em", lineHeight: 1.2, textAlign: "left" }}>
                    {selectedJobForDetail.title}
                  </DialogTitle>
                </DialogHeader>

                {/* Meta row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", fontSize: ".85rem", fontWeight: 600, color: "#64748b", marginBottom: "2rem" }}>
                  {[
                    { icon: Building, text: selectedJobForDetail.company?.name || t("common.company"), color: isDark ? "#e2e8f0" : "#475569" },
                    { icon: MapPin, text: selectedJobForDetail.location, color: isDark ? "#e2e8f0" : "#475569" },
                    { icon: Clock, text: selectedJobForDetail.jobType?.replace("-", " "), color: isDark ? "#e2e8f0" : "#475569" },
                    { icon: IndianRupee, text: selectedJobForDetail.salaryMin != null ? `₹${(selectedJobForDetail.salaryMin / 1000).toFixed(0)}k – ₹${(selectedJobForDetail.salaryMax / 1000).toFixed(0)}k` : t("jobCard.salaryNotSpecified"), color: "#10b981" },
                  ].map(({ icon: Icon, text, color }, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: ".4rem", padding: ".4rem 1rem", borderRadius: 999, background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,.08)" : "1px solid rgba(0,0,0,0.06)", textTransform: i === 2 ? "capitalize" : "none", color }}>
                      <Icon className="w-4 h-4" style={{ color: "#6366f1" }} /> {text}
                    </span>
                  ))}
                </div>

                {/* Skills */}
                {selectedJobForDetail.skills?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginBottom: "2rem" }}>
                    {selectedJobForDetail.skills.map((s: string, i: number) => (
                      <span key={i} style={{ padding: ".35rem 1rem", borderRadius: 999, fontSize: ".8rem", fontWeight: 700, background: isDark ? "rgba(99,102,241,.15)" : "rgba(99,102,241,.1)", border: isDark ? "1px solid rgba(99,102,241,.3)" : "1px solid rgba(99,102,241,.2)", color: isDark ? "#a5b4fc" : "#4338ca", display: "flex", alignItems: "center", gap: ".3rem" }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} /> {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="obs-divider" style={{ margin: "2rem 0" }} />

                {/* Description */}
                <div style={{ marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: isDark ? "rgba(99,102,241,.15)" : "rgba(99,102,241,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Briefcase className="w-4 h-4" style={{ color: "#6366f1" }} />
                    </div>
                    <h4 style={{ fontSize: ".95rem", fontWeight: 700, color: isDark ? "#f1f5f9" : "#1e293b", letterSpacing: ".02em" }}>
                      {t("jobs.description")}
                    </h4>
                  </div>
                  <div style={{ padding: "1.5rem", borderRadius: 16, background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.01)", border: isDark ? "1px solid rgba(255,255,255,.05)" : "1px solid rgba(0,0,0,.04)" }}>
                    <p style={{ color: isDark ? "#cbd5e1" : "#334155", fontSize: ".95rem", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                      {selectedJobForDetail.description}
                    </p>
                  </div>
                </div>

                {selectedJobForDetail.requirements && (
                  <div style={{ marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: isDark ? "rgba(245,158,11,.15)" : "rgba(245,158,11,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Zap className="w-4 h-4" style={{ color: "#f59e0b" }} />
                      </div>
                      <h4 style={{ fontSize: ".95rem", fontWeight: 700, color: isDark ? "#f1f5f9" : "#1e293b", letterSpacing: ".02em" }}>
                        {t("jobs.requirements")}
                      </h4>
                    </div>
                    <div style={{ padding: "1.5rem", borderRadius: 16, background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.01)", border: isDark ? "1px solid rgba(255,255,255,.05)" : "1px solid rgba(0,0,0,.04)" }}>
                      <p style={{ color: isDark ? "#cbd5e1" : "#334155", fontSize: ".95rem", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {selectedJobForDetail.requirements}
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: ".75rem", paddingTop: "1.5rem", borderTop: isDark ? "1px solid rgba(255,255,255,.06)" : "1px solid rgba(0,0,0,.06)" }}>
                  {(selectedJobForDetail.company?.id || selectedJobForDetail.companyId) && (
                    <button
                      type="button"
                      style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".85rem 1.5rem", borderRadius: 14, fontWeight: 700, fontSize: ".95rem", cursor: "pointer", border: isDark ? "1px solid rgba(99,102,241,.35)" : "1px solid rgba(99,102,241,.25)", background: isDark ? "rgba(99,102,241,.12)" : "rgba(99,102,241,.08)", color: isDark ? "#c7d2fe" : "#4338ca" }}
                      onClick={() => {
                        const cid = selectedJobForDetail.company?.id || selectedJobForDetail.companyId;
                        setCompanyProfileId(String(cid));
                        setCompanyProfileName(selectedJobForDetail.company?.name || "");
                      }}
                    >
                      <Building className="w-4 h-4" />
                      View company
                    </button>
                  )}
                  <button
                    type="button"
                    className="obs-btn-shimmer"
                    style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".85rem 2.25rem", borderRadius: 14, fontWeight: 700, color: "#fff", fontSize: "1rem", cursor: "pointer", border: "none", boxShadow: "0 12px 30px -10px rgba(99,102,241,.6)", transition: "transform .2s ease" }}
                    onClick={() => { setSelectedJob(selectedJobForDetail); setShowQuickApply(true); setSelectedJobForDetail(null); }}
                  >
                    {t("jobs.quickApply")} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── QUICK APPLY MODAL ── */}
      {
        showQuickApply && selectedJob && (
          <QuickApplyModal
            isOpen={showQuickApply}
            onClose={() => setShowQuickApply(false)}
            jobId={selectedJob.id}
            jobTitle={selectedJob.title}
            companyName={selectedJob.company?.name || ""}
            companyId={selectedJob.company?.id || selectedJob.companyId}
            matchPercentage={selectedJob.matchScore ?? 0}
          />
        )
      }

      <CompanyProfileModal
        companyId={companyProfileId}
        companyName={companyProfileName}
        isOpen={Boolean(companyProfileId)}
        onClose={() => setCompanyProfileId(null)}
      />
    </div >
  );
}