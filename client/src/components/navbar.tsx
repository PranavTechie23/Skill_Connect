import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, Menu, X, Info, BookOpen, LayoutDashboard } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, setUser } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location === path;

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
            <Link href="/" className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <img
                  src="/images/logo.png"
                  alt="SkillConnect"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                <span className="text-purple-600">Skill</span>
                <span className="text-pink-600">Connect</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className="rounded-full px-6 py-2 text-lg"
              >
                Home
              </Button>
            </Link>
            <Link href="/jobs">
              <Button
                variant={isActive("/jobs") ? "default" : "ghost"}
                className="rounded-full px-6 py-2 text-lg"
              >
                Jobs
              </Button>
            </Link>
            {user?.userType === "job_seeker" && (
              <Link href="/applications">
                <Button
                  variant={isActive("/applications") ? "default" : "ghost"}
                  className="rounded-full px-6 py-2 text-lg"
                >
                  Applications
                </Button>
              </Link>
            )}
            {user?.userType === "employer" && (
              <Link href="/employers">
                <Button
                  variant={isActive("/employers") ? "default" : "ghost"}
                  className="rounded-full px-6 py-2 text-lg"
                >
                  Post Jobs
                </Button>
              </Link>
            )}
            {user?.userType === "admin" && (
              <Link href="/admin">
                <Button
                  variant={isActive("/admin") ? "default" : "ghost"}
                  className="rounded-full px-6 py-2 text-lg"
                >
                  Admin
                </Button>
              </Link>
            )}
            <Link href="/about">
              <Button
                variant={isActive("/about") ? "default" : "ghost"}
                className="rounded-full px-6 py-2 text-lg"
              >
                About Us
              </Button>
            </Link>
            <Link href="/stories">
              <Button
                variant={isActive("/stories") ? "default" : "ghost"}
                className="rounded-full px-6 py-2 text-lg"
              >
                Our Stories
              </Button>
            </Link>
            <Link href="/dashboards">
              <Button
                variant={isActive("/dashboards") ? "default" : "ghost"}
                className="rounded-full px-6 py-2 text-lg"
              >
                Dashboards
              </Button>
            </Link>
            <ModeToggle />
          </div>

          {/* User Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/profile">
                  <Button variant="outline" size="lg" className="rounded-full">
                    <User className="h-5 w-5 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleLogout}
                  className="rounded-full"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login">
                  <Button variant="ghost" size="lg" className="rounded-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/15 py-4">
            <div className="flex flex-col gap-2">
              <Link href="/" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  className="w-full justify-start rounded-full"
                >
                  Home
                </Button>
              </Link>
              <Link href="/jobs" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant={isActive("/jobs") ? "default" : "ghost"}
                  className="w-full justify-start rounded-full"
                >
                  Jobs
                </Button>
              </Link>
              {user?.userType === "job_seeker" && (
                <Link href="/applications" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant={isActive("/applications") ? "default" : "ghost"}
                    className="w-full justify-start rounded-full"
                  >
                    Applications
                  </Button>
                </Link>
              )}
              {user?.userType === "employer" && (
                <Link href="/employers" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant={isActive("/employers") ? "default" : "ghost"}
                    className="w-full justify-start rounded-full"
                  >
                    Post Jobs
                  </Button>
                </Link>
              )}
              {user?.userType === "admin" && (
                <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant={isActive("/admin") ? "default" : "ghost"}
                    className="w-full justify-start rounded-full"
                  >
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/about" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant={isActive("/about") ? "default" : "ghost"}
                  className="w-full justify-start rounded-full"
                >
                  <Info className="h-4 w-4 mr-2" />
                  About Us
                </Button>
              </Link>
              <Link href="/stories" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant={isActive("/stories") ? "default" : "ghost"}
                  className="w-full justify-start rounded-full"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Our Stories
                </Button>
              </Link>
              <Link href="/dashboards" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant={isActive("/dashboards") ? "default" : "ghost"}
                  className="w-full justify-start rounded-full"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboards
                </Button>
              </Link>

              {/* Mobile Actions */}
              <div className="border-t border-white/15 pt-4 mt-2">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start rounded-full">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start rounded-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full justify-start rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
                        Sign Up
                      </Button>
                    </Link>
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
