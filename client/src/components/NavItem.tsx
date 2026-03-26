import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGlareHover } from "@/hooks/use-glare-hover";
import GlareHover from "@/components/GlareHover";

interface NavItemProps {
  to: string;
  isActive: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'ghost';
}

export function NavItem({
  to,
  isActive,
  children,
  onClick,
  fullWidth,
  icon,
  className = '',
  variant = 'ghost'
}: NavItemProps) {
  return (
    <Link to={to} onClick={onClick} className={fullWidth ? "w-full block" : ""}>
      <GlareHover
        {...useGlareHover({ isActive, variant })}
        className={`cursor-pointer overflow-visible ${fullWidth ? "w-full" : ""} ${className}`}
      >
        <Button
          variant={isActive ? "default" : variant}
          className={`
            rounded-full px-6 py-2 text-xl relative z-10 transition-all duration-300
            ${fullWidth ? "w-full justify-start" : ""}
          `}
        >
          {icon}
          {children}
        </Button>
      </GlareHover>
    </Link>
  );
}