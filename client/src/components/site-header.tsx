
import { Link } from "react-router-dom";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { ModeToggle } from "./ui/dark-mode-toggle";

export function SiteHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav />
        <MobileNav />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center gap-2">
            <ModeToggle />
            {user ? (
              <>
                <Link
                  to="/profile"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-9 px-0"
                  )}
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-9 px-0"
                  )}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-9 px-0"
                  )}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-9 px-0"
                  )}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
