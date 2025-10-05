
import { useState } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        onClick={toggleMenu}
        aria-label="Toggle Menu"
      >
        <Menu className={cn("h-6 w-6", isOpen ? "hidden" : "block")} />
        <X className={cn("h-6 w-6", isOpen ? "block" : "hidden")} />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 top-14 z-50 grid h-[calc(100vh-3.5rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 bg-background">
          <div className="relative z-20 grid gap-6 p-4 rounded-md bg-background">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold">Home</span>
            </Link>
            <Link href="/jobs" className="flex items-center space-x-2">
              <span className="font-medium">Jobs</span>
            </Link>
            <Link href="/professionals" className="flex items-center space-x-2">
              <span className="font-medium">Professionals</span>
            </Link>
            <Link href="/stories" className="flex items-center space-x-2">
              <span className="font-medium">Stories</span>
            </Link>
            <Link href="/about" className="flex items-center space-x-2">
              <span className="font-medium">About</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
