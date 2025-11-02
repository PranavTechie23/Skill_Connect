import React, { useRef, useCallback, useMemo, useState } from 'react';

interface GlareHoverProps {
  width?: string;
  height?: string;
  background?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
  children?: React.ReactNode;
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  glareSize?: number;
  transitionDuration?: number;
  playOnce?: boolean;
  className?: string;
  style?: React.CSSProperties;
  intensity?: number;
  enableBlur?: boolean;
  blurAmount?: number;
  enableScale?: boolean;
  scaleAmount?: number;
  enableShadow?: boolean;
  shadowColor?: string;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

const GlareHover: React.FC<GlareHoverProps> = ({
  width = '100%',
  height = '100%',
  background = 'transparent',
  borderRadius = '10px',
  borderColor = 'transparent',
  borderWidth = '1px',
  children,
  glareColor = '#e879f9',
  glareOpacity = 0.7,
  glareAngle = -30,
  glareSize = 300,
  transitionDuration = 2500,
  playOnce = false,
  className = '',
  style = {},
  intensity = 1,
  enableBlur = false,
  blurAmount = 2,
  enableScale = false,
  scaleAmount = 1.02,
  enableShadow = false,
  shadowColor = 'rgba(0,0,0,0.1)',
  onHoverStart,
  onHoverEnd
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [isHovering, setIsHovering] = useState(false);

  // Memoize the gradient color calculation
  const gradientColor = useMemo(() => {
    const hex = glareColor.replace('#', '');
    if (/^[\dA-Fa-f]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${glareOpacity * intensity})`;
    } else if (/^[\dA-Fa-f]{3}$/.test(hex)) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${glareOpacity * intensity})`;
    }
    return glareColor;
  }, [glareColor, glareOpacity, intensity]);

  // Memoize the gradient background properties separately
  const gradientProperties = useMemo(() => ({
    image: `linear-gradient(${glareAngle}deg,
      transparent 25%,
      ${gradientColor} 45%,
      ${gradientColor} 65%,
      transparent 75%)`,
    size: `${glareSize}% ${glareSize}%, 100% 100%`,
    position: '-100% -100%, 0 0',
    repeat: 'no-repeat'
  }), [glareAngle, gradientColor, glareSize]);

  const animateIn = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const el = overlayRef.current;
    const container = containerRef.current;
    if (!el) return;

    setIsHovering(true);
    onHoverStart?.();

    // Reset and prepare for animation
    el.style.transition = 'none';
    el.style.backgroundPosition = '-100% -100%, 0 0';
    el.style.backgroundSize = gradientProperties.size;
    el.style.backgroundRepeat = gradientProperties.repeat;
    el.style.backgroundImage = gradientProperties.image;
    el.style.opacity = '0';

    // Force reflow
    el.getBoundingClientRect();

    // Start animation
    el.style.transition = `
      background-position ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1),
      opacity 300ms ease-out
    `;
    el.style.backgroundPosition = '300% 300%, 0 0';
    el.style.opacity = '1';

    // Apply container effects
    if (container) {
      const transitions = [];
      if (enableBlur) transitions.push(`filter ${transitionDuration}ms ease-out`);
      if (enableScale) transitions.push(`transform ${transitionDuration}ms ease-out`);
      if (enableShadow) transitions.push(`box-shadow ${transitionDuration}ms ease-out`);
      
      container.style.transition = transitions.join(', ');
      
      if (enableBlur) container.style.filter = `blur(${blurAmount}px)`;
      if (enableScale) container.style.transform = `scale(${scaleAmount})`;
      if (enableShadow) container.style.boxShadow = `0 10px 30px ${shadowColor}`;
    }

    // Auto reset if playOnce is enabled
    if (playOnce) {
      setTimeout(() => {
        animateOut();
      }, transitionDuration + 100);
    }
  }, [
    transitionDuration,
    playOnce,
    enableBlur,
    blurAmount,
    enableScale,
    scaleAmount,
    enableShadow,
    shadowColor,
    onHoverStart,
    gradientProperties
  ]);

  const animateOut = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const el = overlayRef.current;
    const container = containerRef.current;
    if (!el) return;

    setIsHovering(false);
    onHoverEnd?.();

    if (playOnce) {
      el.style.transition = 'none';
      el.style.backgroundPosition = '-100% -100%, 0 0';
      el.style.opacity = '0';
    } else {
      el.style.transition = `
        background-position ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1),
        opacity 500ms ease-in
      `;
      el.style.backgroundPosition = '-300% -300%, 0 0';
      el.style.opacity = '0';
    }

    // Reset container effects
    if (container) {
      const transitions = [];
      if (enableBlur) transitions.push(`filter ${transitionDuration}ms ease-in`);
      if (enableScale) transitions.push(`transform ${transitionDuration}ms ease-in`);
      if (enableShadow) transitions.push(`box-shadow ${transitionDuration}ms ease-in`);
      
      container.style.transition = transitions.join(', ') || 'none';
      container.style.filter = 'none';
      container.style.transform = 'none';
      container.style.boxShadow = 'none';
    }
  }, [transitionDuration, playOnce, onHoverEnd, enableBlur, enableScale, enableShadow]);

  // Clean up animation on unmount
  React.useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Initialize overlay styles properly
  React.useEffect(() => {
    const el = overlayRef.current;
    if (el) {
      // Set all background properties individually to avoid conflicts
      el.style.backgroundImage = gradientProperties.image;
      el.style.backgroundSize = gradientProperties.size;
      el.style.backgroundRepeat = gradientProperties.repeat;
      el.style.backgroundPosition = gradientProperties.position;
    }
  }, [gradientProperties]);

  const overlayStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    inset: 0,
    // Don't use shorthand background property
    backgroundImage: gradientProperties.image,
    backgroundSize: gradientProperties.size,
    backgroundRepeat: gradientProperties.repeat,
    backgroundPosition: gradientProperties.position,
    pointerEvents: 'none',
    opacity: 0,
    zIndex: 1,
    mixBlendMode: 'overlay'
  }), [gradientProperties]);

  const containerStyle: React.CSSProperties = useMemo(() => ({
    position: 'relative',
    width,
    height,
    background,
    borderRadius,
    border: `${borderWidth} solid ${borderColor}`,
    overflow: 'hidden',
    transition: `all ${transitionDuration}ms ease-out`,
    ...style
  }), [width, height, background, borderRadius, borderColor, borderWidth, transitionDuration, style]);

  return (
    <div
      ref={containerRef}
      className={`glare-hover-container ${className}`}
      style={containerStyle}
      onMouseEnter={animateIn}
      onMouseLeave={animateOut}
      onFocus={animateIn}
      onBlur={animateOut}
    >
      <div 
        ref={overlayRef} 
        style={overlayStyle}
        aria-hidden="true"
      />
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
};

export default GlareHover;