import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/home";
import ProfileRedirect from "./pages/profile-redirect";
import NotFound from "./pages/not-found";
import Navbar from "./components/navbar";
import EmployeeLayout from "./components/layouts/EmployeeLayout";
import OurStories from "./pages/our-stories";
import ProfessionalsPage from "./pages/professionals";
import Jobs from "./pages/jobs";
import About from "./pages/about";
import AdminRoutes from "./pages/admin"; // use admin route index for nested admin routes
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboards from "./pages/dashboards";
import EmployeeDashboard from "./pages/employee/dashboard";
import EmployerDashboard from "./pages/employer/dashboard";
import Applications from "./pages/applications";
import { AuthProvider } from "./contexts/AuthContext";
import SubmitStory from "./pages/submit-story";
import { ProtectedRoute } from "./components/ProtectedRoute"; // ensure this exists

export default function App() {
  // `useLocation` must be used inside a Router. Create a child component
  // that consumes it and renders the rest of the app.
  function AppContent() {
    const location = useLocation();
    const isEmployeeRoute = location.pathname.startsWith("/employee");
    const isAdminRoute = /^\/admin(\/|$)/.test(location.pathname);

    return (
      <div className="min-h-screen w-screen flex flex-col overflow-x-hidden">
        {/* Hide global Navbar on employee and admin dashboard routes to show specialized layouts */}
        {!(isEmployeeRoute || isAdminRoute) && <Navbar />}
  {/* only add top padding when the global Navbar is shown */}
  <main className={"flex-1 " + (isEmployeeRoute || isAdminRoute ? "p-0" : "pt-20")}>
          <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<ProfileRedirect />} />
              <Route path="/our-stories" element={<OurStories />} />
              <Route path="/professionals" element={<ProfessionalsPage />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/dashboards" element={<Dashboards />} />
              <Route path="/submit-story" element={<SubmitStory />} />

              {/* Employee & Employer - protected dashboard routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedUserTypes={["admin"]}>
                    <AdminRoutes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/dashboard"
                element={
                  <ProtectedRoute allowedUserTypes={["Professional"]}>
                    <EmployeeLayout>
                      <EmployeeDashboard />
                    </EmployeeLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/dashboard"
                element={
                  <ProtectedRoute allowedUserTypes={["Employer"]}>
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Helpful redirects so shallow paths don't 404 */}
              <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="/employer" element={<Navigate to="/employer/dashboard" replace />} />

              {/* 404 */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
