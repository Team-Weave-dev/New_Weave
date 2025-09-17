import React, { useEffect, useState } from 'react';

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackAnimationProps {
  type?: FeedbackType;
  show: boolean;
  message?: string;
  duration?: number;
  onComplete?: () => void;
  position?: 'center' | 'top' | 'bottom' | 'overlay';
}

export const FeedbackAnimation = React.memo(({
  type = 'success',
  show,
  message,
  duration = 2000,
  onComplete,
  position = 'center'
}: FeedbackAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);

      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, duration - 300);

      const completeTimer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  const icons = {
    success: (
      <svg className="feedback-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    error: (
      <svg className="feedback-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    warning: (
      <svg className="feedback-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 20h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    info: (
      <svg className="feedback-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  };

  const colors = {
    success: 'var(--color-status-success)',
    error: 'var(--color-status-error)',
    warning: 'var(--color-status-warning)',
    info: 'var(--color-status-info)'
  };

  const positionStyles = {
    center: {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    },
    top: {
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    bottom: {
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    overlay: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }
  };

  return (
    <div
      className={`feedback-animation ${isExiting ? 'exiting' : ''}`}
      style={{
        position: position === 'overlay' ? 'fixed' : 'absolute',
        ...positionStyles[position],
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <div
        className="feedback-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          animation: isExiting ? 'fadeOut 0.3s ease-out' : 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          color: colors[type]
        }}
      >
        <div style={{ width: 60, height: 60 }}>
          {icons[type]}
        </div>
        {message && (
          <p style={{
            marginTop: '12px',
            fontSize: '14px',
            color: 'var(--color-text-primary)',
            textAlign: 'center',
            maxWidth: '200px'
          }}>
            {message}
          </p>
        )}
      </div>
      <style jsx>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.8);
          }
        }

        .feedback-icon {
          width: 100%;
          height: 100%;
          animation: drawIcon 0.8s ease-out forwards;
        }

        @keyframes drawIcon {
          from {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            opacity: 0;
          }
          to {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
});

FeedbackAnimation.displayName = 'FeedbackAnimation';