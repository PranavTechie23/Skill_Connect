import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useEffect } from "react";
import { useTheme } from "../theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Ensure document class matches the stored theme on mount
    if (!theme || theme === "system") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}