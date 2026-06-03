import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { SavedJobsProvider } from "./contexts/SavedJobsContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Navbar from "./components/navbar";
import EmployeeLayout from "./components/layouts/EmployeeLayout";
import EmployerLayout from "./components/layouts/employer-layout";
import { SkillConnectAssistant } from "./components/skillconnect-assistant";
import { GlobalLoader } from "./components/GlobalLoader";
import { normalizeUserType } from "./lib/utils";
import { scrollDashboardToTop } from "./lib/scroll-to-top";

import Home from "./pages/home";
import ProfileRedirect from "./pages/profile-redirect";
import NotFound from "./pages/not-found";
import OurStories from "./pages/our-stories";
import ProfessionalsPage from "./pages/professionals";
import Jobs from "./pages/jobs";
import About from "./pages/about";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Onboarding from "./pages/onboarding";
import Dashboards from "./pages/dashboards";
import EmployeeDashboard from "./pages/employee/employeeDashboard";
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployeeApplications from "./pages/employee/applications";
import BrowseJobs from "./pages/employee/browse-jobs";
import SavedJobs from "./pages/employee/saved-jobs";
import EmployeeMessages from "./pages/employee/messages";
import EmployeeProfile from "./pages/employee/profile";
import EmployeeStory from "./pages/employee/story";
import EmployeeSettings from "./pages/employee/settings";
import JobManagement from "./pages/employer/job-management";
import EmployerProfile from "./pages/employer/profile";
import EmployerSettings from "./pages/employer/settings";
import EmployerAnalytics from "./pages/employer/analytics";
import EmployerStories from "./pages/employer/stories";
import EmployerMessages from "./pages/employer/messages";
import EmployerApplications from "./pages/employer/applications";
import AdminRoutes from "./pages/admin";

const ROUTES = {
  PUBLIC: {
    HOME: "/",
    PROFILE: "/profile",
    STORIES: "/our-stories",
    PROFESSIONALS: "/professionals",
    JOBS: "/jobs",
    ABOUT: "/about",
    LOGIN: "/login",
    SIGNUP: "/signup",
    DASHBOARDS: "/dashboards",
    APPLICATIONS: "/applications",
    ONBOARDING: "/onboarding",
    NOT_FOUND: "/404",
  },
  EMPLOYEE: {
    BASE: "/employee",
    DASHBOARD: "/employee/dashboard",
    JOBS: "/employee/jobs",
    APPLICATIONS: "/employee/applications",
    SAVED_JOBS: "/employee/saved-jobs",
    MESSAGES: "/employee/messages",
    PROFILE: "/employee/profile",
    STORY: "/employee/story",
    SETTINGS: "/employee/settings",
  },
  EMPLOYER: {
    BASE: "/employer",
    DASHBOARD: "/employer/dashboard",
    JOB_MANAGEMENT: "/employer/jobs",
    PROFILE: "/employer/profile",
    SETTINGS: "/employer/settings",
    MESSAGES: "/employer/messages",
    APPLICATIONS: "/employer/applications",
    ANALYTICS: "/employer/analytics",
    STORIES: "/employer/stories",
  },
  ADMIN: {
    BASE: "/admin/*",
  },
} as const;

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    scrollDashboardToTop();
  }, [pathname, search]);

  return null;
}

function JobsRouteGate() {
  const { user } = useAuth();
  if (!user) return <Jobs />;
  const normalized = normalizeUserType(
    (user as { userType?: string; user_type?: string }).userType ??
      (user as { user_type?: string }).user_type
  );
  if (normalized === "professional")
    return <Navigate to={ROUTES.EMPLOYEE.JOBS} replace />;
  if (normalized === "employer")
    return <Navigate to={ROUTES.EMPLOYER.DASHBOARD} replace />;
  if (normalized === "admin") return <Navigate to="/admin" replace />;
  return <Jobs />;
}

function HomeRouteGate() {
  const { user } = useAuth();
  if (!user) return <Home />;
  const normalized = normalizeUserType(
    (user as { userType?: string; user_type?: string }).userType ??
      (user as { user_type?: string }).user_type
  );
  if (normalized === "professional")
    return <Navigate to={ROUTES.EMPLOYEE.DASHBOARD} replace />;
  if (normalized === "employer")
    return <Navigate to={ROUTES.EMPLOYER.DASHBOARD} replace />;
  if (normalized === "admin") return <Navigate to="/admin" replace />;
  return <Home />;
}

const routeConfig = {
  public: [
    { path: ROUTES.PUBLIC.HOME, element: <HomeRouteGate /> },
    { path: ROUTES.PUBLIC.PROFILE, element: <ProfileRedirect /> },
    { path: ROUTES.PUBLIC.STORIES, element: <OurStories /> },
    { path: ROUTES.PUBLIC.PROFESSIONALS, element: <ProfessionalsPage /> },
    { path: ROUTES.PUBLIC.JOBS, element: <JobsRouteGate /> },
    { path: ROUTES.PUBLIC.ABOUT, element: <About /> },
    { path: ROUTES.PUBLIC.LOGIN, element: <Login /> },
    { path: ROUTES.PUBLIC.SIGNUP, element: <Signup /> },
    { path: "/submit-story", element: <Navigate to={ROUTES.PUBLIC.STORIES} replace /> },
    { path: "/stories", element: <Navigate to={ROUTES.PUBLIC.STORIES} replace /> },
    { path: ROUTES.PUBLIC.DASHBOARDS, element: <Dashboards /> },
    { path: ROUTES.PUBLIC.APPLICATIONS, element: <EmployeeApplications /> },
    { path: ROUTES.PUBLIC.ONBOARDING, element: <Onboarding /> },
  ],
  employee: [
    { path: ROUTES.EMPLOYEE.DASHBOARD, element: <EmployeeDashboard /> },
    { path: ROUTES.EMPLOYEE.JOBS, element: <BrowseJobs /> },
    { path: ROUTES.EMPLOYEE.APPLICATIONS, element: <EmployeeApplications /> },
    { path: ROUTES.EMPLOYEE.SAVED_JOBS, element: <SavedJobs /> },
    { path: ROUTES.EMPLOYEE.MESSAGES, element: <EmployeeMessages /> },
    { path: ROUTES.EMPLOYEE.PROFILE, element: <EmployeeProfile /> },
    { path: ROUTES.EMPLOYEE.STORY, element: <EmployeeStory /> },
    { path: ROUTES.EMPLOYEE.SETTINGS, element: <EmployeeSettings /> },
    { path: "/employee/activity", element: <Navigate to={ROUTES.EMPLOYEE.APPLICATIONS} replace /> },
  ],
  employer: [
    { path: ROUTES.EMPLOYER.DASHBOARD, element: <EmployerDashboard /> },
    { path: ROUTES.EMPLOYER.JOB_MANAGEMENT, element: <JobManagement /> },
    { path: ROUTES.EMPLOYER.PROFILE, element: <EmployerProfile /> },
    { path: ROUTES.EMPLOYER.SETTINGS, element: <EmployerSettings /> },
    { path: ROUTES.EMPLOYER.MESSAGES, element: <EmployerMessages /> },
    { path: ROUTES.EMPLOYER.APPLICATIONS, element: <EmployerApplications /> },
    { path: ROUTES.EMPLOYER.ANALYTICS, element: <EmployerAnalytics /> },
    { path: ROUTES.EMPLOYER.STORIES, element: <EmployerStories /> },
    { path: "/employer/candidates", element: <Navigate to={ROUTES.EMPLOYER.APPLICATIONS} replace /> },
  ],
  admin: [{ path: ROUTES.ADMIN.BASE, element: <AdminRoutes /> }],
};

function useRouteVisibility() {
  const location = useLocation();
  const isEmployeeRoute = location.pathname.startsWith(ROUTES.EMPLOYEE.BASE);
  const isEmployerRoute = location.pathname.startsWith(ROUTES.EMPLOYER.BASE);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isSpecialRoute = isEmployeeRoute || isEmployerRoute || isAdminRoute;

  return {
    showNavbar: !isSpecialRoute,
    mainPadding: isSpecialRoute ? "p-0" : "pt-16",
  };
}

function AppContent() {
  const { showNavbar, mainPadding } = useRouteVisibility();

  return (
    <div className="min-h-screen w-full flex flex-col overflow-x-hidden">
      {showNavbar && <Navbar />}
      <main className={`flex-1 ${mainPadding}`}>
        <Routes>
          {routeConfig.public.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          <Route
            path={ROUTES.ADMIN.BASE}
            element={
              <ProtectedRoute allowedUserTypes={["admin"]}>
                {routeConfig.admin[0].element}
              </ProtectedRoute>
            }
          />

          <Route element={<EmployeeLayout />}>
            {routeConfig.employee.map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute allowedUserTypes={["professional"]}>
                    {element}
                  </ProtectedRoute>
                }
              />
            ))}
          </Route>

          <Route element={<EmployerLayout />}>
            {routeConfig.employer.map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute allowedUserTypes={["employer"]}>
                    {element}
                  </ProtectedRoute>
                }
              />
            ))}
          </Route>

          <Route
            path={ROUTES.EMPLOYEE.BASE}
            element={<Navigate to={ROUTES.EMPLOYEE.DASHBOARD} replace />}
          />
          <Route
            path={ROUTES.EMPLOYER.BASE}
            element={<Navigate to={ROUTES.EMPLOYER.DASHBOARD} replace />}
          />

          <Route path={ROUTES.PUBLIC.NOT_FOUND} element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <SkillConnectAssistant />
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<AppLoading />}>
        <Router>
          <ScrollToTop />
          <SavedJobsProvider>
            <AppContent />
            <GlobalLoader />
          </SavedJobsProvider>
        </Router>
      </React.Suspense>
    </ErrorBoundary>
  );
}
