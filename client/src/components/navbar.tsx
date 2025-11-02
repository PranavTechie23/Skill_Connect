import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Menu, X, Info, BookOpen, LayoutDashboard } from "lucide-react";
import { normalizeUserType } from "@/lib/utils";
import { useState } from "react";
import { NavItem } from "@/components/NavItem";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMarketingHome = location.pathname === "/";

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Logout failed:", e);
    }
    setIsMenuOpen(false);
    navigate("/", { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/15 bg-white/70 dark:bg-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo + Mobile Toggle */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="mr-2 rounded-full md:hidden"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <Link to="/" className="flex items-center gap-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <img
                  src="/images/logo.png"
                  alt="SkillConnect"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                <span className="text-purple-600">Skill</span>
                <span className="text-pink-600">Connect   </span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation & User Actions */}
          <div className="hidden md:flex items-center gap-4">
            <NavItem to="/" isActive={isActive("/")}>
              Home
            </NavItem>
            
            <NavItem to="/jobs" isActive={isActive("/jobs")}>
              Jobs
            </NavItem>

            {user?.userType === "Professional" && (
              <NavItem to="/applications" isActive={isActive("/applications")}>
                Applications
              </NavItem>
            )}

            {user?.userType === "Employer" && (
              <NavItem to="/employer/dashboard" isActive={isActive("/employer")}>
                Post Jobs
              </NavItem>
            )}

            <NavItem to="/about" isActive={isActive("/about")}>
              About Us
            </NavItem>

            <NavItem to="/our-stories" isActive={isActive("/our-stories")}>
              Our Stories
            </NavItem>

            <NavItem to="/dashboards" isActive={isActive("/dashboards")}>
              Dashboards
            </NavItem>
            <ModeToggle />
            {user && !isMarketingHome ? (
              <>
                {/* Replace Profile with a role-aware Dashboard link for marketing/front pages */}
                {(() => {
                  const normalized = normalizeUserType((user as any)?.userType);
                  const dashboardPath = normalized === "professional" ? "/employee/dashboard" : normalized === "employer" ? "/employer/dashboard" : "/";
                  return (
                    <NavItem 
                      to={dashboardPath} 
                      isActive={isActive(dashboardPath)}
                      icon={<LayoutDashboard className="h-5 w-5 mr-2" />}
                      variant="secondary"
                    >
                      Dashboard
                    </NavItem>
                  );
                })()}
                <NavItem 
                  to="#" 
                  isActive={false}
                  onClick={handleLogout}
                  icon={<LogOut className="h-5 w-5 mr-2" />}
                  variant="ghost"
                >
                  Logout
                </NavItem>
              </>
            ) : (
              <>
                <NavItem 
                  to="/login"
                  isActive={isActive("/login")}
                  className="cursor-pointer overflow-visible"
                >
                  Sign In
                </NavItem>
                <NavItem 
                  to="/signup"
                  isActive={isActive("/signup")}
                  variant="default"
                >
                  Sign Up
                </NavItem>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/15 py-4">
            <div className="flex flex-col gap-2">
              <NavItem 
                to="/" 
                isActive={isActive("/")} 
                fullWidth 
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </NavItem>

              <NavItem 
                to="/jobs" 
                isActive={isActive("/jobs")} 
                fullWidth 
                onClick={() => setIsMenuOpen(false)}
              >
                Jobs
              </NavItem>

              {user?.userType === "Professional" && (
                <NavItem 
                  to="/applications" 
                  isActive={isActive("/applications")} 
                  fullWidth 
                  onClick={() => setIsMenuOpen(false)}
                >
                  Applications
                </NavItem>
              )}

              {user?.userType === "Employer" && (
                <NavItem 
                  to="/employer/dashboard" 
                  isActive={isActive("/employer")} 
                  fullWidth 
                  onClick={() => setIsMenuOpen(false)}
                >
                  Post Jobs
                </NavItem>
              )}

              <NavItem 
                to="/about" 
                isActive={isActive("/about")} 
                fullWidth 
                onClick={() => setIsMenuOpen(false)}
                icon={<Info className="h-4 w-4 mr-2" />}
              >
                About Us
              </NavItem>

              <NavItem 
                to="/our-stories" 
                isActive={isActive("/our-stories")} 
                fullWidth 
                onClick={() => setIsMenuOpen(false)}
                icon={<BookOpen className="h-4 w-4 mr-2" />}
              >
                Our Stories
              </NavItem>

              <NavItem 
                to="/dashboards" 
                isActive={isActive("/dashboards")} 
                fullWidth 
                onClick={() => setIsMenuOpen(false)}
                icon={<LayoutDashboard className="h-4 w-4 mr-2" />}
              >
                Dashboards
              </NavItem>

              {/* Mobile Actions */}
              <div className="border-t border-white/15 pt-4 mt-2">
                {user ? (
                  <div className="flex flex-col gap-2">
                        {(() => {
                          const normalized = normalizeUserType((user as any)?.userType);
                          const dashboardPath = normalized === "professional" ? "/employee/dashboard" : normalized === "employer" ? "/employer/dashboard" : "/";
                          return (
                            <NavItem 
                              to={dashboardPath} 
                              isActive={isActive(dashboardPath)}
                              fullWidth
                              onClick={() => setIsMenuOpen(false)}
                              icon={<LayoutDashboard className="h-4 w-4 mr-2" />}
                              variant="secondary"
                            >
                              Dashboard
                            </NavItem>
                          );
                        })()}
                    <NavItem 
                      to="#" 
                      isActive={false}
                      fullWidth
                      onClick={handleLogout}
                      icon={<LogOut className="h-4 w-4 mr-2" />}
                      variant="ghost"
                    >
                      Logout
                    </NavItem>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <NavItem 
                      to="/login" 
                      isActive={isActive("/login")} 
                      fullWidth 
                      onClick={() => setIsMenuOpen(false)}
                      variant="ghost"
                    >
                      Sign In
                    </NavItem>
                    <NavItem 
                      to="/signup" 
                      isActive={isActive("/signup")} 
                      fullWidth 
                      onClick={() => setIsMenuOpen(false)}
                      variant="default"
                    >
                      Sign Up
                    </NavItem>
                  </div>
                )}
              </div>

              {/* Dark Mode Toggle */}
              <div className="mt-4">
                <ModeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}