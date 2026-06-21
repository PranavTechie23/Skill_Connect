import React from 'react';

interface LogoLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function LogoLoader({ className = '', size = 'md' }: LogoLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 sm:w-10 sm:h-10',
    md: 'w-12 h-12 sm:w-16 sm:h-16',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
    xl: 'w-32 h-32 sm:w-48 sm:h-48',
  };

  const containerSizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-40 h-40 sm:w-56 sm:h-56',
  };

  return (
    <div className={`relative flex items-center justify-center ${containerSizes[size]} ${className}`}>
      {/* Subtle outer glow/ring that pulses */}
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl animate-pulse" />
      
      {/* The logo that scales up and down */}
      <img 
        src="/images/logo.png" 
        alt="" 
        className={`${sizeClasses[size]} object-contain animate-pulse-scale relative z-10 will-change-transform`} 
      />
    </div>
  );
}
