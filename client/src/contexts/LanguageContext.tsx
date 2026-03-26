import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
const DEFAULT_LOCALE = "en";const STORAGE_KEY = "skillconnect_locale";

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
  error: Error | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

function getNested(
  obj: Record<string, unknown>,
  path: string
): string | undefined {
  const value = path.split(".").reduce((acc: unknown, part) => {
    if (acc != null && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
  return typeof value === "string" ? value : undefined;
}

function interpolate(
  str: string,
  params: Record<string, string | number>
): string {
  return Object.entries(params).reduce(
    (acc, [k, v]) =>
      acc.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), String(v)),
    str
  );
}

/** Minimal fallback so we don't show raw keys (e.g. nav.home) before first fetch or when load fails. */
const FALLBACK_MESSAGES: Record<string, unknown> = {
  common: {
    loading: "Loading...",
    close: "Close",
    back: "Back",
    signIn: "Sign In",
    company: "Company",
    signedOut: "Signed out",
    signedOutDescription: "You have been signed out successfully.",
  },
  language: { label: "Language" },
  nav: {
    home: "Home",
    jobs: "Jobs",
    professionals: "Professionals",
    aboutUs: "About Us",
    ourStories: "Our Stories",
    dashboards: "Dashboards",
    signIn: "Sign In",
    signUp: "Sign Up",
    logout: "Logout",
    dashboard: "Dashboard",
    applications: "Applications",
    postJobs: "Post Jobs",
  },
  admin: {
    controlPanel: "Admin Control Panel",
  },
  jobCard: {
    salaryNotSpecified: "Salary not specified",
  },
  jobs: {
    title: "Find Your Next Job",
    discoverLine:
      "Explore roles tailored to your skills. Get smart recommendations and apply faster with confidence.",
    jobsForYou: "Recommended For You",
    personalizedProfile: "Based on your skills and preferences",
    curatedForYou: "Curated for you",
    topPicks: "Top Picks",
    bestRecommended: "Best Recommended Jobs",
    createAccountToApply:
      "Create an account to apply and unlock personalized recommendations.",
    joinSkillConnect: "Join SkillConnect",
    getRecommendations: "Get tailored job recommendations",
    signUpFree: "Sign up free",
    totalJobs: "Total Jobs",
    locations: "Locations",
    jobTypes: "Job Types",
    avgSalary: "Avg Salary",
    availableOpportunities: "Available Opportunities",
    showingCount: "Showing {{count}} of {{total}} jobs",
    noJobsMatching: "No jobs match your filters",
    sortedByRelevance: "Sorted by relevance",
    description: "Job Description",
    requirements: "Requirements",
    quickApply: "Quick Apply",
  },
  home: {
    heroTitle: "Bridge the Gap Between Talent and Opportunity",
    heroSubtitle: "SkillConnect helps job seekers find the right roles and employers discover skilled talent—all in one place.",
    heroHeadline: "Connect Talent with Perfect Opportunities",
    heroSubtext: "Skills-based matching that brings together job seekers and employers. Build your professional network and discover opportunities in your community.",
    findNextRole: "Find Your Next Role",
    postJobButton: "Post a Job",
    getStarted: "Get Started",
    browseJobs: "Browse Jobs",
    forJobSeekers: "For Job Seekers",
    forEmployers: "For Employers",
    learnMore: "Learn More",
    featureLocal: "100% Local Focus",
    featureMatching: "Skills-Based Matching",
    featureFree: "Free to Join",
    headline: "Connect Talent with Perfect Opportunities",
    subheadLine1: "Skills-based matching that brings together job seekers and employers.",
    subheadLine2:
      "Build your professional network and discover opportunities in your community.",
  },
  login: {
    welcomeBack: "Welcome back",
    welcomeBackSub:
      "Sign in to access your SkillConnect dashboard and manage your professional journey.",
    title: "Sign in to SkillConnect",
    signingIn: "Signing in...",
    signIn: "Sign In",
    createAccount: "Create one",
  },
  signup: {
    reviewCta: 'If everything looks good, click "Create account" to finish.',
    join: "Join SkillConnect",
    subhead: "Create your account in 4 quick steps — we'll guide you.",
    title: "Create your account",
    continue: "Continue",
    creating: "Creating...",
    createAccount: "Create account",
    alreadyHaveAccount: "Already have an account?",
  },
  stories: {
    title: "Our Success Stories",
    heroLine:
      "Real experiences from people who found success through our platform.",
  },
  employee: {
    browseJobs: {
      title: "Browse Jobs",
      subhead: "Discover opportunities that match your skills",
    },
    dashboard: {
      welcomeBack: "Welcome back",
    },
    settings: {
      title: "Settings",
    },
  },
  employer: {
    dashboard: {
      overview: "Dashboard Overview",
    },
  },
  about: {
    title: "About SkillConnect",
    subtitle: "Bridging the gap between talent and opportunity through skills-based matching.",
    globalFocus: "Global Focus",
    globalFocusDesc: "Connecting talent across borders with opportunities worldwide.",
    skillsBased: "Skills-Based Matching",
    skillsBasedDesc: "Our AI-powered platform matches candidates based on real skills, not just resumes.",
    communityBuilding: "Community Building",
    communityBuildingDesc: "Building a network of professionals and employers who grow together.",
    inclusivePlatform: "Inclusive Platform",
    inclusivePlatformDesc: "Equal opportunities for everyone regardless of background or location.",
    ourMission: "Our Mission",
    missionPara1: "SkillConnect was built with a simple but powerful vision: to democratize access to employment opportunities by focusing on what truly matters — skills.",
    missionPara2: "We believe that every person deserves a fair chance to showcase their abilities and find meaningful work that aligns with their talents.",
    joinCommunity: "Join Our Community",
    joinCommunityDesc: "Be part of a growing network of professionals and employers making hiring fairer and smarter.",
    getStarted: "Get Started",
    chooseYourPath: "Choose Your Path",
    choosePathDesc: "Select how you want to use SkillConnect",
    imProfessional: "I'm a Professional",
    professionalDesc: "Find jobs that match your skills, build your profile, and get discovered by top employers.",
    continueAsProfessional: "Continue as Professional",
    imEmployer: "I'm an Employer",
    employerDesc: "Post jobs, discover skilled talent, and build your dream team with smart matching.",
    continueAsEmployer: "Continue as Employer",
    contactUs: "Contact Us",
    email: "Email",
    phone: "Phone",
    hours: "Mon-Fri, 9am - 6pm IST",
    address: "Address",
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && typeof stored === "string") return stored;
    } catch {}
    return DEFAULT_LOCALE;
  });

  const messages = FALLBACK_MESSAGES;
  const isLoading = false;
  const error = null;

  useEffect(() => {
    document.documentElement.lang =
      locale === "hi" ? "hi" : locale === "mr" ? "mr" : locale;
  }, [locale]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {}
  }, [locale]);

  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNested(messages as Record<string, unknown>, key);
      const str = value ?? key;
      return params ? interpolate(str, params) : str;
    },
    [messages]
  );

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t, isLoading, error }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
