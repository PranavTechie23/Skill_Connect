
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        to="/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Home
      </Link>
      <Link
        to="/jobs"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Jobs
      </Link>
      <Link
        to="/professionals"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Professionals
      </Link>
      <Link
        to="/stories"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Stories
      </Link>
      <Link
        to="/about"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        About
      </Link>
    </nav>
  );
}
