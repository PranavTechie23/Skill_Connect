import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Menu, X, Info, BookOpen, LayoutDashboard, Home, Briefcase, FileText, PlusSquare, LogIn, UserPlus } from "lucide-react";
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
  const navItemClass = "text-base px-4 py-2";
  const navItemSize = "default" as const;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm backdrop-blur-sm"
      // Anchor at top:0 and use padding for the safe-area inset so the nav remains visible
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-2.5 flex-nowrap">
          {/* LEFT: Logo + Mobile Toggle */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-full lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="flex items-center gap-2 -ml-2 sm:-ml-3 hover:opacity-90 transition-opacity">
              <img src="/images/logo.png" alt="SkillConnect" className="h-10 sm:h-12 w-auto object-contain" />
              <span className="text-lg sm:text-2xl font-bold tracking-tight leading-none whitespace-nowrap hidden sm:inline">
                <span className="text-purple-600">Skill</span>
                <span className="text-pink-600">Connect</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation & User Actions */}
          <div className="hidden lg:flex items-center gap-1.5 ml-auto min-w-0 justify-end">
            <NavItem to="/" isActive={isActive("/")} className={navItemClass} size={navItemSize}>
              {t("nav.home")}
            </NavItem>

            <NavItem to="/jobs" isActive={isActive("/jobs")} className={navItemClass} size={navItemSize}>
              {t("nav.jobs")}
            </NavItem>

            {user?.userType === "Professional" && (
              <NavItem to="/applications" isActive={isActive("/applications")} className={navItemClass} size={navItemSize}>
                {t("nav.applications")}
              </NavItem>
            )}

            {user?.userType === "Employer" && (
              <NavItem
                to="/employer/dashboard"
                isActive={isActive("/employer")}
                className={navItemClass}
                size={navItemSize}
              >
                {t("nav.postJobs")}
              </NavItem>
            )}

            <NavItem to="/about" isActive={isActive("/about")} className={navItemClass} size={navItemSize}>
              {t("nav.aboutUs")}
            </NavItem>

            <NavItem to="/our-stories" isActive={isActive("/our-stories")} className={navItemClass} size={navItemSize}>
              {t("nav.ourStories")}
            </NavItem>

            <NavItem to="/dashboards" isActive={isActive("/dashboards")} className={navItemClass} size={navItemSize}>
              {t("nav.dashboards")}
            </NavItem>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-300/50 dark:bg-slate-700 mx-1" />

            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <ModeToggle />
            </div>
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
                      className={navItemClass}
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
                  className={navItemClass}
                >
                  {t("nav.logout")}
                </NavItem>
              </>
            ) : (
              <>
                <NavItem
                  to="/login"
                  isActive={isActive("/login")}
                  className={`${navItemClass} cursor-pointer overflow-visible`}
                  size={navItemSize}
                  variant="ghost"
                >
                  {t("nav.signIn")}
                </NavItem>
                <div className="w-px h-5 bg-slate-300/50 dark:bg-slate-700" />
                <NavItem
                  to="/signup"
                  isActive={isActive("/signup")}
                  variant="default"
                  className={`${navItemClass} bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold`}
                  size={navItemSize}
                >
                  {t("nav.signUp")}
                </NavItem>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/50 dark:border-slate-800 py-4 px-2 animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="flex flex-col gap-1">
              <NavItem
                to="/"
                isActive={isActive("/")}
                fullWidth
                onClick={() => setIsMenuOpen(false)}
                icon={<Home className="h-5 w-5 mr-3 opacity-80" />}
                className="justify-start py-6 text-base"
              >
                {t("nav.home")}
              </NavItem>

              <NavItem
                to="/jobs"
                isActive={isActive("/jobs")}
                fullWidth
                onClick={() => setIsMenuOpen(false)}
                icon={<Briefcase className="h-5 w-5 mr-3 opacity-80" />}
                className="justify-start py-6 text-base"
              >
                {t("nav.jobs")}
              </NavItem>

              {user?.userType === "Professional" && (
                <NavItem
                  to="/applications"
                  isActive={isActive("/applications")}
                  fullWidth
                  onClick={() => setIsMenuOpen(false)}
                  icon={<FileText className="h-5 w-5 mr-3 opacity-80" />}
                  className="justify-start py-6 text-base"
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
                  icon={<PlusSquare className="h-5 w-5 mr-3 opacity-80" />}
                  className="justify-start py-6 text-base"
                >
                  {t("nav.postJobs")}
                </NavItem>
              )}

              <NavItem
                to="/about"
                isActive={isActive("/about")}
                fullWidth
                onClick={() => setIsMenuOpen(false)}
                icon={<Info className="h-5 w-5 mr-3 opacity-80" />}
                className="justify-start py-6 text-base"
              >
                {t("nav.aboutUs")}
              </NavItem>

              <NavItem
                to="/our-stories"
                isActive={isActive("/our-stories")}
                fullWidth
                onClick={() => setIsMenuOpen(false)}
                icon={<BookOpen className="h-5 w-5 mr-3 opacity-80" />}
                className="justify-start py-6 text-base"
              >
                {t("nav.ourStories")}
              </NavItem>

              <NavItem
                to="/dashboards"
                isActive={isActive("/dashboards")}
                fullWidth
                onClick={() => setIsMenuOpen(false)}
                icon={<LayoutDashboard className="h-5 w-5 mr-3 opacity-80" />}
                className="justify-start py-6 text-base"
              >
                {t("nav.dashboards")}
              </NavItem>

              {/* Mobile Actions */}
              <div className="border-t border-slate-200/50 dark:border-slate-800 pt-4 mt-2">
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
                          icon={<LayoutDashboard className="h-5 w-5 mr-3 opacity-80" />}
                          variant="secondary"
                          className="justify-start py-6 text-base"
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
                      icon={<LogOut className="h-5 w-5 mr-3 opacity-80 text-rose-500" />}
                      variant="ghost"
                      className="justify-start py-6 text-base text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      {t("nav.logout")}
                    </NavItem>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 px-1">
                    <NavItem 
                      to="/login" 
                      isActive={isActive("/login")} 
                      fullWidth 
                      onClick={() => setIsMenuOpen(false)}
                      variant="secondary"
                      icon={<LogIn className="h-5 w-5 mr-2" />}
                      className="py-6 text-base font-medium"
                    >
                      {t("nav.signIn")}
                    </NavItem>
                    <NavItem
                      to="/signup"
                      isActive={isActive("/signup")}
                      fullWidth
                      onClick={() => setIsMenuOpen(false)}
                      variant="default"
                      icon={<UserPlus className="h-5 w-5 mr-2" />}
                      className="py-6 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-md"
                    >
                      {t("nav.signUp")}
                    </NavItem>
                  </div>
                )}
              </div>

              {/* Language & Theme */}
              <div className="mt-6 flex items-center justify-center gap-4 pb-4">
                <LanguageSwitcher />
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                <ModeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}