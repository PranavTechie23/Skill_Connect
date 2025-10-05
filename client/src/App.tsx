import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Profile from "./pages/profile";
import NotFound from "./pages/not-found";
import Navbar from "./components/navbar";
import OurStories from "./pages/our-stories";
import ProfessionalsPage from "./pages/professionals";
import Jobs from "./pages/jobs";
import About from "./pages/about";
import Admin from "./pages/admin";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboards from "./pages/dashboards";
import EmployeeDashboard from "./pages/employee-dashboard";
import EmployerDashboard from "./pages/employer-dashboard";
import Applications from "./pages/applications"; 
import { AuthProvider } from "./contexts/AuthContext"; 

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/our-stories" element={<OurStories />} />
              <Route path="/professionals" element={<ProfessionalsPage />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/about" element={<About />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/employee" element={<EmployeeDashboard />} />
              <Route path="/employer" element={<EmployerDashboard />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/dashboards" element={<Dashboards />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}