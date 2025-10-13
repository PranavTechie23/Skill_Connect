import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SavedJobsProvider } from "./contexts/SavedJobsContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Navbar from "./components/navbar";
import EmployeeLayout from "./components/layouts/EmployeeLayout";

// Public Pages
import Home from "./pages/home";
import ProfileRedirect from "./pages/profile-redirect";
import NotFound from "./pages/not-found";
import OurStories from "./pages/our-stories";
import ProfessionalsPage from "./pages/professionals";
import Jobs from "./pages/jobs";
import About from "./pages/about";
import Login from "./pages/login";
import Signup from "./pages/signup";
import SubmitStory from "./pages/submit-story";

// Dashboard Pages
import Dashboards from "./pages/dashboards";
import EmployeeDashboard from "./pages/employee/dashboard";
import EmployerDashboard from "./pages/employer/dashboard";
import EmployeeApplications from "./pages/employee/applications";

// Employee Pages
import BrowseJobs from "./pages/employee/browse-jobs";
import SavedJobs from "./pages/employee/saved-jobs";
import EmployeeMessages from "./pages/employee/messages";
import EmployeeProfile from "./pages/employee/profile";
import EmployeeStory from "./pages/employee/story";
import EmployeeSettings from "./pages/employee/settings";

// Admin Routes
import AdminRoutes from "./pages/admin";

// Route configuration for better maintainability
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
    SUBMIT_STORY: "/submit-story",
    DASHBOARDS: "/dashboards",
    APPLICATIONS: "/applications",
    NOT_FOUND: "/404"
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
    SETTINGS: "/employee/settings"
  },
  EMPLOYER: {
    BASE: "/employer",
    DASHBOARD: "/employer/dashboard"
  },
  ADMIN: {
    BASE: "/admin/*"
  }
} as const;

// Route protection configuration
const routeConfig = {
  public: [
    { path: ROUTES.PUBLIC.HOME, element: <Home /> },
    { path: ROUTES.PUBLIC.PROFILE, element: <ProfileRedirect /> },
    { path: ROUTES.PUBLIC.STORIES, element: <OurStories /> },
    { path: ROUTES.PUBLIC.PROFESSIONALS, element: <ProfessionalsPage /> },
    { path: ROUTES.PUBLIC.JOBS, element: <Jobs /> },
    { path: ROUTES.PUBLIC.ABOUT, element: <About /> },
    { path: ROUTES.PUBLIC.LOGIN, element: <Login /> },
    { path: ROUTES.PUBLIC.SIGNUP, element: <Signup /> },
    { path: ROUTES.PUBLIC.SUBMIT_STORY, element: <SubmitStory /> },
    { path: ROUTES.PUBLIC.DASHBOARDS, element: <Dashboards /> },
    { path: ROUTES.PUBLIC.APPLICATIONS, element: <EmployeeApplications /> }
  ],
  employee: [
    { path: ROUTES.EMPLOYEE.DASHBOARD, element: <EmployeeDashboard /> },
    { path: ROUTES.EMPLOYEE.JOBS, element: <BrowseJobs /> },
    { path: ROUTES.EMPLOYEE.APPLICATIONS, element: <EmployeeApplications /> },
    { path: ROUTES.EMPLOYEE.SAVED_JOBS, element: <SavedJobs /> },
    { path: ROUTES.EMPLOYEE.MESSAGES, element: <EmployeeMessages /> },
    { path: ROUTES.EMPLOYEE.PROFILE, element: <EmployeeProfile /> },
    { path: ROUTES.EMPLOYEE.STORY, element: <EmployeeStory /> },
    { path: ROUTES.EMPLOYEE.SETTINGS, element: <EmployeeSettings /> }
  ],
  employer: [
    { path: ROUTES.EMPLOYER.DASHBOARD, element: <EmployerDashboard /> }
  ],
  admin: [
    { path: ROUTES.ADMIN.BASE, element: <AdminRoutes /> }
  ]
};

// Custom hook for route visibility logic
function useRouteVisibility() {
  const location = useLocation();
  
  const isEmployeeRoute = location.pathname.startsWith(ROUTES.EMPLOYEE.BASE);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSpecialRoute = isEmployeeRoute || isAdminRoute;
  
  return {
    isEmployeeRoute,
    isAdminRoute,
    isSpecialRoute,
    showNavbar: !isSpecialRoute,
    mainPadding: isSpecialRoute ? "p-0" : "pt-20"
  };
}

// Main app content component
function AppContent() {
  const { showNavbar, mainPadding } = useRouteVisibility();

  return (
    <div className="min-h-screen w-screen flex flex-col overflow-x-hidden">
      {showNavbar && <Navbar />}
      <main className={`flex-1 ${mainPadding}`}>
        <Routes>
          {/* Public Routes */}
          {routeConfig.public.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {/* Admin Routes */}
          <Route
            path={ROUTES.ADMIN.BASE}
            element={
              <ProtectedRoute allowedUserTypes={["admin"]}>
                {routeConfig.admin[0].element}
              </ProtectedRoute>
            }
          />

          {/* Employee Routes with Layout */}
          <Route element={<EmployeeLayout />}>
            {routeConfig.employee.map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute allowedUserTypes={["Professional"]}>
                    {element}
                  </ProtectedRoute>
                }
              />
            ))}
          </Route>

          {/* Employer Routes */}
          {routeConfig.employer.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute allowedUserTypes={["Employer"]}>
                  {element}
                </ProtectedRoute>
              }
            />
          ))}

          {/* Automatic Redirects */}
          <Route path={ROUTES.EMPLOYEE.BASE} element={<Navigate to={ROUTES.EMPLOYEE.DASHBOARD} replace />} />
          <Route path={ROUTES.EMPLOYER.BASE} element={<Navigate to={ROUTES.EMPLOYER.DASHBOARD} replace />} />

          {/* 404 Handling */}
          <Route path={ROUTES.PUBLIC.NOT_FOUND} element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

// Error Boundary Component (optional but recommended)
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <button
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

// Loading component for better UX
function AppLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main App Component with Suspense
export default function App() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<AppLoading />}>
          <Router>
            <AuthProvider>
              <SavedJobsProvider>
                <AppContent />
              </SavedJobsProvider>
            </AuthProvider>
          </Router>
      </React.Suspense>
    </ErrorBoundary>
  );
}

// Add TypeScript interfaces for better type safety
interface RouteConfig {
  path: string;
  element: React.ReactElement;
}

interface AppRouteConfig {
  public: RouteConfig[];
  employee: RouteConfig[];
  employer: RouteConfig[];
  admin: RouteConfig[];
}