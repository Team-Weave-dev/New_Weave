import React from 'react';

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rect' | 'circle' | 'widget';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  count?: number;
  spacing?: number;
}

export const SkeletonLoader = React.memo(({
  width = '100%',
  height = 20,
  variant = 'rect',
  animation = 'pulse',
  className = '',
  count = 1,
  spacing = 8
}: SkeletonLoaderProps) => {
  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      backgroundColor: 'var(--color-bg-secondary)',
      position: 'relative',
      overflow: 'hidden'
    };

    switch (variant) {
      case 'text':
        return {
          ...baseStyles,
          width,
          height,
          borderRadius: '4px',
          marginBottom: spacing
        };
      case 'circle':
        return {
          ...baseStyles,
          width: typeof width === 'number' ? width : parseInt(width as string),
          height: typeof height === 'number' ? height : parseInt(height as string),
          borderRadius: '50%'
        };
      case 'widget':
        return {
          ...baseStyles,
          width,
          height,
          borderRadius: '12px',
          padding: '16px'
        };
      case 'rect':
      default:
        return {
          ...baseStyles,
          width,
          height,
          borderRadius: '8px'
        };
    }
  };

  const getAnimationStyles = (): React.CSSProperties => {
    switch (animation) {
      case 'wave':
        return {
          background: `linear-gradient(
            90deg,
            var(--color-bg-secondary) 0%,
            var(--color-bg-tertiary) 20%,
            var(--color-bg-secondary) 40%,
            var(--color-bg-secondary) 100%
          )`,
          backgroundSize: '200% 100%',
          animation: 'wave 1.5s linear infinite'
        };
      case 'pulse':
        return {
          animation: 'pulse 1.5s ease-in-out infinite'
        };
      default:
        return {};
    }
  };

  const renderSkeleton = () => {
    const skeletonStyle = {
      ...getVariantStyles(),
      ...getAnimationStyles()
    };

    if (variant === 'widget') {
      return (
        <div className={`skeleton-widget ${className}`} style={skeletonStyle}>
          <div className="skeleton-widget-header" style={{ display: 'flex', marginBottom: 16 }}>
            <div 
              className="skeleton-avatar"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-tertiary)',
                marginRight: 12,
                ...getAnimationStyles()
              }}
            />
            <div style={{ flex: 1 }}>
              <div 
                className="skeleton-title"
                style={{
                  width: '60%',
                  height: 16,
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: 4,
                  marginBottom: 8,
                  ...getAnimationStyles()
                }}
              />
              <div 
                className="skeleton-subtitle"
                style={{
                  width: '40%',
                  height: 12,
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: 4,
                  ...getAnimationStyles()
                }}
              />
            </div>
          </div>
          <div className="skeleton-widget-content">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: `${85 + Math.random() * 15}%`,
                  height: 12,
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: 4,
                  marginBottom: 8,
                  ...getAnimationStyles()
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={`skeleton ${className}`} style={skeletonStyle}>
        {animation === 'wave' && (
          <div 
            className="skeleton-wave"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              transform: 'translateX(-100%)',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes wave {
          0% {
            background-position: 200% 50%;
          }
          100% {
            background-position: -200% 50%;
          }
        }

        @keyframes shimmer {
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';