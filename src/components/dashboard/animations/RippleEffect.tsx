import React, { useState, useCallback, useRef } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleEffectProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  disabled?: boolean;
  className?: string;
}

export const RippleEffect = React.memo(({
  children,
  color = 'var(--color-brand-primary-start)',
  duration = 600,
  disabled = false,
  className = ''
}: RippleEffectProps) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(0);

  const createRipple = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const size = Math.max(rect.width, rect.height) * 2;
    const id = nextIdRef.current++;

    const newRipple: Ripple = { id, x, y, size };
    
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, duration);
  }, [disabled, duration]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const size = Math.max(rect.width, rect.height) * 2;
    const id = nextIdRef.current++;

    const newRipple: Ripple = { id, x, y, size };
    
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, duration);
  }, [disabled, duration]);

  return (
    <div 
      ref={containerRef}
      className={`ripple-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: disabled ? 'default' : 'pointer'
      }}
      onClick={createRipple}
      onTouchStart={handleTouchStart}
    >
      {children}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none'
        }}
      >
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            style={{
              position: 'absolute',
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: 0.3,
              transform: 'scale(0)',
              animation: `ripple ${duration}ms ease-out`,
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
});

RippleEffect.displayName = 'RippleEffect';