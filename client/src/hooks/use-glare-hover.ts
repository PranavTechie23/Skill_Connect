interface GlareHoverProps {
  isActive?: boolean;
  variant?: 'default' | 'secondary' | 'ghost';
}

export const useGlareHover = ({ isActive, variant = 'ghost' }: GlareHoverProps = {}) => {
  const getGlareConfig = () => {
    if (variant === 'default') {
      return {
        glareColor: isActive ? "#ffffff" : "#ff69b4",
        glareOpacity: 1,
        glareSize: 400,
        transitionDuration: 1500,
        intensity: 1.4,
        shadowColor: "rgba(255, 105, 180, 0.4)",
      };
    }
    if (variant === 'secondary') {
      return {
        glareColor: isActive ? "#ffffff" : "#7c3aed",
        glareOpacity: 0.9,
        glareSize: 400,
        transitionDuration: 1500,
        intensity: 1.3,
        shadowColor: "rgba(124, 58, 237, 0.4)",
      };
    }
    // ghost variant
    return {
      glareColor: isActive ? "#ffffff" : "#e879f9",
      glareOpacity: 0.8,
      glareSize: 400,
      transitionDuration: 1500,
      intensity: 1.2,
      shadowColor: "rgba(232, 121, 249, 0.3)",
    };
  };

  return {
    className: "cursor-pointer overflow-visible",
    ...getGlareConfig(),
    enableScale: true,
    scaleAmount: 1.05,
    enableShadow: true,
    enableBlur: true,
    blurAmount: 0.5,
  };
};