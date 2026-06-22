import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
const DEFAULT_LOCALE = "en";
const STORAGE_KEY = "skillconnect_locale";

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
    bestRecommended: "Trending Jobs",
    joinSkillConnect: "Join SkillConnect",
    getRecommendations: "Get tailored job recommendations",
    signUpFree: "Sign up free",
    totalJobs: "Total Jobs",
    locations: "Locations",
    jobTypes: "Job Types",
    avgSalary: "Avg Salary",
    availableOpportunities: "Available Opportunities",
    allPositions: "All Positions",
    showingCount: "Showing {{count}} of {{total}} jobs",
    noJobsMatching: "No jobs match your filters",
    noJobsAvailable: "No jobs available right now",
    broadenSearch: "Try clearing filters or check back later for new openings.",
    viewAllJobs: "View All Jobs",
    loadJobsError: "Could not load jobs. Please refresh the page.",
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
    skillsBasedTitle: "🎯 Skills-Based Matching That Actually Works",
    skillsBasedDesc: "Our intelligent matching algorithm connects you with opportunities based on your actual skills, not just keywords. Build a comprehensive skills profile and let employers find you.",
    skillAssessment: "Skill Assessment Tools",
    skillAssessmentDesc: "Take quick assessments to validate your skills and stand out to employers.",
    intelligentRec: "Intelligent Recommendations",
    intelligentRecDesc: "Get personalized job recommendations based on your skill profile and preferences.",
    skillDev: "Skill Development Paths",
    skillDevDesc: "Discover what skills to learn next to advance your career in your chosen field.",
    servicesTitle: "Services for Every Need",
    servicesDesc: "From skilled trades to creative work — discover opportunities tailored to your skills.",
    communityStories: "💬 Stories from Our Community",
    communityDesc: "Real results from local employers and talent.",
    buildFuture: "Build Your Future Now",
    buildFutureDesc: "Join a growing network of local talent and employers. Post jobs, apply with confidence, and get matched by skills — not just keywords.",
    trustedPros: "Trusted Skilled Professionals",
    trustedProsDesc: "Book top-rated, verified workers in your area",
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
      "Real experiences.",
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

const HINDI_MESSAGES: Record<string, unknown> = {
  common: FALLBACK_MESSAGES.common,
  language: FALLBACK_MESSAGES.language,
  nav: {
    home: "होम",
    jobs: "नौकरियां",
    professionals: "पेशेवर",
    aboutUs: "हमारे बारे में",
    ourStories: "हमारी कहानियाँ",
    dashboards: "डैशबोर्ड",
    signIn: "साइन इन",
    signUp: "साइन अप",
    logout: "लॉगआउट",
    dashboard: "डैशबोर्ड",
    applications: "आवेदन",
    postJobs: "नौकरी पोस्ट करें",
  },
  home: {
    heroTitle: "प्रतिभा और अवसर के बीच की खाई को पाटें",
    heroSubtitle: "स्किलकनेक्ट नौकरी चाहने वालों को सही भूमिकाएं खोजने में मदद करता है और नियोक्ताओं को कुशल प्रतिभा खोजने में मदद करता है - सभी एक ही स्थान पर।",
    headline: "प्रतिभा को सही अवसरों से जोड़ें",
    subheadLine1: "कौशल-आधारित मिलान जो नौकरी चाहने वालों और नियोक्ताओं को एक साथ लाता है।",
    subheadLine2: "अपना पेशेवर नेटवर्क बनाएं और अपने समुदाय में अवसर खोजें।",
    findNextRole: "अपनी अगली भूमिका खोजें",
    postJobButton: "नौकरी पोस्ट करें",
    getStarted: "शुरू करें",
    browseJobs: "नौकरियां ब्राउज़ करें",
    forJobSeekers: "नौकरी चाहने वालों के लिए",
    forEmployers: "नियोक्ताओं के लिए",
    learnMore: "और जानें",
    featureLocal: "100% स्थानीय फोकस",
    featureMatching: "कौशल-आधारित मिलान",
    featureFree: "मुफ्त में शामिल हों",
    skillsBasedTitle: "🎯 कौशल-आधारित मिलान जो वास्तव में काम करता है",
    skillsBasedDesc: "हमारा बुद्धिमान मिलान एल्गोरिदम आपको केवल कीवर्ड के आधार पर नहीं, बल्कि आपके वास्तविक कौशल के आधार पर अवसरों से जोड़ता है। एक व्यापक कौशल प्रोफ़ाइल बनाएं और नियोक्ताओं को आपको खोजने दें।",
    skillAssessment: "कौशल मूल्यांकन उपकरण",
    skillAssessmentDesc: "अपने कौशल को मान्य करने और नियोक्ताओं के बीच अलग दिखने के लिए त्वरित मूल्यांकन लें।",
    intelligentRec: "बुद्धिमान सिफारिशें",
    intelligentRecDesc: "अपने कौशल प्रोफ़ाइल और प्राथमिकताओं के आधार पर व्यक्तिगत नौकरी की सिफारिशें प्राप्त करें।",
    skillDev: "कौशल विकास पथ",
    skillDevDesc: "जानें कि अपने चुने हुए क्षेत्र में अपने करियर को आगे बढ़ाने के लिए आगे कौन सा कौशल सीखना है।",
    servicesTitle: "हर जरूरत के लिए सेवाएं",
    servicesDesc: "कुशल ट्रेडों से लेकर रचनात्मक काम तक — अपने कौशल के अनुरूप अवसर खोजें।",
    communityStories: "💬 हमारे समुदाय की कहानियाँ",
    communityDesc: "स्थानीय नियोक्ताओं और प्रतिभाओं से वास्तविक परिणाम।",
    buildFuture: "अपना भविष्य अभी बनाएं",
    buildFutureDesc: "स्थानीय प्रतिभाओं और नियोक्ताओं के बढ़ते नेटवर्क से जुड़ें। नौकरियां पोस्ट करें, विश्वास के साथ आवेदन करें, और कौशल द्वारा मिलान करें — केवल कीवर्ड से नहीं।",
    trustedPros: "विश्वसनीय कुशल पेशेवर",
    trustedProsDesc: "अपने क्षेत्र में शीर्ष-रेटेड, सत्यापित श्रमिकों को बुक करें",
  },
  about: FALLBACK_MESSAGES.about,
  jobs: FALLBACK_MESSAGES.jobs,
  login: FALLBACK_MESSAGES.login,
  signup: FALLBACK_MESSAGES.signup,
  stories: FALLBACK_MESSAGES.stories,
  employee: FALLBACK_MESSAGES.employee,
  employer: FALLBACK_MESSAGES.employer,
  admin: FALLBACK_MESSAGES.admin,
};

const TRANSLATIONS: Record<string, Record<string, unknown>> = {
  en: FALLBACK_MESSAGES,
  hi: HINDI_MESSAGES,
  mr: FALLBACK_MESSAGES,
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && typeof stored === "string") return stored;
    } catch {}
    return DEFAULT_LOCALE;
  });

  const messages = TRANSLATIONS[locale] || FALLBACK_MESSAGES;
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
