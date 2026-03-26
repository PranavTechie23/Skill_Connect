
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { t } = useLanguage();
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        to="/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        {t("nav.home")}
      </Link>
      <Link
        to="/jobs"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        {t("nav.jobs")}
      </Link>
      <Link
        to="/professionals"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        {t("nav.professionals")}
      </Link>
      <Link
        to="/stories"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        {t("nav.ourStories")}
      </Link>
      <Link
        to="/about"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        {t("nav.aboutUs")}
      </Link>
    </nav>
  );
}
