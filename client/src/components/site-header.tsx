import { ModeToggle } from "./ui/dark-mode-toggle";
import { buttonVariants } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { MainNav } from "./main-nav";
import { Link } from "react-router-dom";

export function SiteHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
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
        </div>
      </div>
    </header>
  );
}
