"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Globe, Search, Check, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Popular languages with native names and flag emojis
const LANGUAGES = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰" },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "中文 (简体)", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "中文 (繁體)", flag: "🇹🇼" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", native: "ภาษาไทย", flag: "🇹🇭" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
];

// Trigger Google Translate to switch language
function doTranslate(langCode: string) {
  // Google Translate injects UI artifacts (banner/options/x) into the DOM.
  // We immediately remove them to avoid user irritation after each translate.
  const removeGoogleTranslateArtifacts = () => {
    try {
      // Google sometimes shifts body top; reset.
      if (document.body?.style) document.body.style.top = "0px";

      const selectors = [
        "#goog-gt-tt", // "Translated into ..." bar + Options
        ".goog-te-banner-frame",
        ".goog-te-balloon-frame",
        ".goog-te-menu-frame",
        ".goog-te-menu2",
      ];

      for (const sel of selectors) {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => el.remove());
      }

      // Extra safety for other translate containers with predictable ids.
      document
        .querySelectorAll<HTMLElement>('[id^="goog-gt-"]')
        .forEach((el) => el.remove());
    } catch {
      // Best-effort cleanup only.
    }
  };

  if (langCode === "en") {
    // Reset to English by clearing the cookie and reloading
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    window.location.reload();
    return;
  }

  // Set the googtrans cookie
  const cookieVal = `/en/${langCode}`;
  document.cookie = `googtrans=${cookieVal}; path=/`;
  document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname}`;

  // Try to trigger via the hidden select element first
  const select = document.querySelector<HTMLSelectElement>("#google_translate_element select");
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    // Cleanup after Google has a chance to inject its banner.
    removeGoogleTranslateArtifacts();
    // Run repeatedly because Google may inject/refresh the banner after a delay.
    for (const ms of [60, 150, 300, 700, 1200, 1800]) {
      setTimeout(removeGoogleTranslateArtifacts, ms);
    }
    return;
  }

  // Fallback: reload to apply cookie
  removeGoogleTranslateArtifacts();
  window.location.reload();
}

// Get current language from cookie
function getCurrentLang(): string {
  const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
  return match ? match[1] : "en";
}

export function LanguageSwitcher() {
  const isLoaded = useRef(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentLang, setCurrentLang] = useState("en");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load hidden Google Translate widget
  useEffect(() => {
    setCurrentLang(getCurrentLang());

    if (isLoaded.current) return;

    (window as any).googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", layout: (window.google.translate.TranslateElement as any).InlineLayout.SIMPLE },
        "google_translate_element_hidden"
      );
    };

    const removeGoogleTranslateArtifacts = () => {
      try {
        if (document.body?.style) document.body.style.top = "0px";

        const selectors = [
          "#goog-gt-tt",
          ".goog-te-banner-frame",
          ".goog-te-balloon-frame",
          ".goog-te-menu-frame",
          ".goog-te-menu2",
        ];

        for (const sel of selectors) {
          document.querySelectorAll<HTMLElement>(sel).forEach((el) => el.remove());
        }

        document
          .querySelectorAll<HTMLElement>('[id^="goog-gt-"]')
          .forEach((el) => el.remove());
      } catch {
        // Best-effort cleanup only.
      }
    };

    // Watch for Google Translate injecting body offset / banner and remove it.
    const observer = new MutationObserver(() => {
      removeGoogleTranslateArtifacts();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
      childList: true,
      subtree: true,
    });

    // Initial cleanup in case the banner was already injected.
    removeGoogleTranslateArtifacts();

    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
    isLoaded.current = true;

    return () => observer.disconnect();
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 100);
  }, [open]);

  const handleSelect = useCallback((langCode: string) => {
    setCurrentLang(langCode);
    setOpen(false);
    setSearch("");
    doTranslate(langCode);
  }, []);

  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.native.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  const activeLang = LANGUAGES.find((l) => l.code === currentLang) ?? LANGUAGES[0];

  return (
    <>
      {/* Hidden Google Translate widget container */}
      <div
        id="google_translate_element_hidden"
        style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none" }}
        aria-hidden="true"
      />

      <div ref={containerRef} className="relative" style={{ zIndex: 9999 }}>
        {/* Trigger button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 dark:border-purple-400/40 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 backdrop-blur transition-all duration-200 text-sm font-semibold text-foreground group hover:shadow-[0_0_14px_2px_rgba(168,85,247,0.3)]"
          aria-label="Change language"
          aria-expanded={open}
        >
          <Globe className="h-4 w-4 text-purple-500 group-hover:rotate-12 transition-transform duration-300" />
          <span className="hidden sm:inline max-w-[80px] truncate">{activeLang.flag} {activeLang.native}</span>
          <ChevronDown className={`h-3 w-3 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/20 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
              style={{ zIndex: 9999 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <span className="text-[0.82rem] font-semibold text-foreground">Select Language</span>
                </div>
                <button
                  onClick={() => { setOpen(false); setSearch(""); }}
                  className="rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="h-3.5 w-3.5 opacity-60" />
                </button>
              </div>

              {/* Search bar */}
              <div className="px-3 pt-2.5 pb-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus-within:border-purple-500/50 transition-colors">
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search language..."
                    className="flex-1 bg-transparent text-[0.82rem] text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="shrink-0">
                      <X className="h-3 w-3 opacity-50" />
                    </button>
                  )}
                </div>
              </div>

              {/* Language list */}
              <div className="max-h-60 overflow-y-auto px-2 pb-2 space-y-0.5 scrollbar-thin">
                {filtered.length === 0 ? (
                  <div className="text-center py-6 text-[0.8rem] text-muted-foreground">
                    No language found for "<span className="font-medium">{search}</span>"
                  </div>
                ) : (
                  filtered.map((lang) => {
                    const isActive = lang.code === currentLang;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleSelect(lang.code)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150 group ${
                          isActive
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            : "hover:bg-black/5 dark:hover:bg-white/10 text-foreground"
                        }`}
                      >
                        <span className="text-lg leading-none">{lang.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.82rem] font-medium truncate">{lang.native}</div>
                          <div className="text-[0.7rem] opacity-50 truncate">{lang.name}</div>
                        </div>
                        {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-purple-500" />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-black/5 dark:border-white/10 text-[0.68rem] text-muted-foreground text-center">
                Powered by Google Translate
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// TypeScript declarations
declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: any;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}
