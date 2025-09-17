import React, { useState, useCallback } from 'react';

interface HoverEffectProps {
  children: React.ReactNode;
  className?: string;
  scaleAmount?: number;
  shadowIntensity?: 'light' | 'medium' | 'strong';
  disabled?: boolean;
}

export const HoverEffect = React.memo(({
  children,
  className = '',
  scaleAmount = 1.02,
  shadowIntensity = 'medium',
  disabled = false
}: HoverEffectProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const shadowStyles = {
    light: 'var(--shadow-hover-light)',
    medium: 'var(--shadow-hover-medium)', 
    strong: 'var(--shadow-hover-strong)'
  };

  const hoverStyles: React.CSSProperties = {
    transform: isHovered && !disabled ? `scale(${scaleAmount}) translateZ(0)` : 'scale(1) translateZ(0)',
    boxShadow: isHovered && !disabled ? shadowStyles[shadowIntensity] : 'none',
    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform, box-shadow',
    cursor: disabled ? 'default' : 'pointer'
  };

  return (
    <div 
      className={`hover-effect-wrapper ${className}`}
      style={hoverStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
    >
      {children}
      {isHovered && !disabled && (
        <div 
          className="hover-glow"
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            background: 'linear-gradient(45deg, var(--color-brand-primary-start), var(--color-brand-primary-end))',
            borderRadius: 'inherit',
            opacity: 0.1,
            pointerEvents: 'none',
            animation: 'pulse 2s infinite',
            zIndex: -1
          }}
        />
      )}
    </div>
  );
});

HoverEffect.displayName = 'HoverEffect';