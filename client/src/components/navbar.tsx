import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Menu, X, Info, BookOpen, LayoutDashboard } from "lucide-react";
import { normalizeUserType } from "@/lib/utils";
import { useState } from "react";
import { NavItem } from "@/components/NavItem";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMarketingHome = location.pathname === "/";

  const navigate = useNavigate();

  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
      const toastId = toast({
        title: t("common.signedOut"),
        description: t("common.signedOutDescription"),
        variant: "success",
      });
      if (toastId?.dismiss) setTimeout(toastId.dismiss, 5000);
    } catch (e) {
      console.warn("Logout failed:", e);
    }
    setIsMenuOpen(false);
    navigate("/", { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/15 bg-white dark:bg-slate-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* LEFT: Logo + Mobile Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="mr-1 rounded-full md:hidden"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <Link to="/" className="flex items-center gap-1.5 -ml-2 sm:-ml-4">
              <img src="/images/logo.png" alt="SkillConnect" className="h-9 sm:h-14 w-auto object-contain" />
              <span className="text-xl sm:text-3xl font-extrabold tracking-tight leading-none whitespace-nowrap">
                <span className="text-purple-600">Skill</span>
                <span className="text-pink-600">Connect</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation & User Actions */}
          <div className="hidden md:flex items-center gap-2">
            <NavItem to="/" isActive={isActive("/")}>
              {t("nav.home")}
            </NavItem>

            <NavItem to="/jobs" isActive={isActive("/jobs")}>
              {t("nav.jobs")}
            </NavItem>

            {user?.userType === "Professional" && (
              <NavItem to="/applications" isActive={isActive("/applications")}>
                {t("nav.applications")}
              </NavItem>
            )}

            {user?.userType === "Employer" && (
              <NavItem to="/employer/dashboard" isActive={isActive("/employer")}>
                {t("nav.postJobs")}
              </NavItem>
            )}

            <NavItem to="/about" isActive={isActive("/about")}>
              {t("nav.aboutUs")}
            </NavItem>

            <NavItem to="/our-stories" isActive={isActive("/our-stories")}>
              {t("nav.ourStories")}
            </NavItem>

            <NavItem to="/dashboards" isActive={isActive("/dashboards")}>
              {t("nav.dashboards")}
            </NavItem>

            {/* Divider */}
            <div className="h-6 w-px bg-white/20 dark:bg-white/10 mx-2" />

            <LanguageSwitcher />
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
                      {t("nav.dashboard")}
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
                  {t("nav.logout")}
                </NavItem>
              </>
            ) : (
              <>
                <NavItem
                  to="/login"
                  isActive={isActive("/login")}
                  className="cursor-pointer overflow-visible"
                >
                  {t("nav.signIn")}
                </NavItem>
                <NavItem
                  to="/signup"
                  isActive={isActive("/signup")}
                  variant="default"
                >
                  {t("nav.signUp")}
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
                {t("nav.home")}
              </NavItem>

              <NavItem
                to="/jobs"
                isActive={isActive("/jobs")}
                fullWidth
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.jobs")}
              </NavItem>

              {user?.userType === "Professional" && (
                <NavItem
                  to="/applications"
                  isActive={isActive("/applications")}
                  fullWidth
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.applications")}
                </NavItem>
              )}

              {user?.userType === "Employer" && (
                <NavItem
                  to="/employer/dashboard"
                  isActive={isActive("/employer")}
                  fullWidth
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.postJobs")}
                </NavItem>
              )}

              <NavItem
                to="/about"
                isActive={isActive("/about")}
                fullWidth
                onClick={() => setIsMenuOpen(false)}
                icon={<Info className="h-4 w-4 mr-2" />}
              >
                {t("nav.aboutUs")}
              </NavItem>

              <NavItem
                to="/our-stories"
                isActive={isActive("/our-stories")}
                fullWidth
                onClick={() => setIsMenuOpen(false)}
                icon={<BookOpen className="h-4 w-4 mr-2" />}
              >
                {t("nav.ourStories")}
              </NavItem>

              <NavItem
                to="/dashboards"
                isActive={isActive("/dashboards")}
                fullWidth
                onClick={() => setIsMenuOpen(false)}
                icon={<LayoutDashboard className="h-4 w-4 mr-2" />}
              >
                {t("nav.dashboards")}
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
                          {t("nav.dashboard")}
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
                      {t("nav.logout")}
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
                      {t("nav.signIn")}
                    </NavItem>
                    <NavItem
                      to="/signup"
                      isActive={isActive("/signup")}
                      fullWidth
                      onClick={() => setIsMenuOpen(false)}
                      variant="default"
                    >
                      {t("nav.signUp")}
                    </NavItem>
                  </div>
                )}
              </div>

              {/* Language & Theme */}
              <div className="mt-4 flex items-center gap-2">
                <LanguageSwitcher />
                <ModeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}