
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { buttonVariants } from "./ui/button";
import { ModeToggle } from "./ui/dark-mode-toggle";

export function MainNav() {
  return (
    <div className="mr-4 hidden md:flex">
      <Link to="/" className="mr-6 flex items-center space-x-2">
        <span className="hidden font-bold sm:inline-block">GraphicGenie</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          to="/jobs"
          className={cn(
            "transition-colors hover:text-foreground/80",
            "text-foreground/60"
          )}
        >
          Jobs
        </Link>
        <Link
          to="/gigs"
          className={cn(
            "transition-colors hover:text-foreground/80",
            "text-foreground/60"
          )}
        >
          Gigs
        </Link>
        <Link
          to="/stories"
          className={cn(
            "transition-colors hover:text-foreground/80",
            "text-foreground/60"
          )}
        >
          Stories
        </Link>
      </nav>
    </div>
  );
}
