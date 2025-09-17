'use client'

import React, { useEffect, useState } from 'react'
import { DragOverlay } from '@dnd-kit/core'
import { springPresets } from '@/hooks/useSpringAnimation'
import { cn } from '@/lib/utils'

interface AnimatedDragOverlayProps {
  children: React.ReactNode
  isDragging: boolean
  isValidDrop?: boolean
}

// Custom drop animation configurations
const dropAnimationConfigs = {
  bounce: {
    duration: 600,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    keyframes: [
      { transform: 'scale(1)', offset: 0 },
      { transform: 'scale(0.98)', offset: 0.2 },
      { transform: 'scale(1.05)', offset: 0.6 },
      { transform: 'scale(0.98)', offset: 0.8 },
      { transform: 'scale(1)', offset: 1 },
    ],
  },
  smooth: {
    duration: 350,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  spring: {
    duration: 500,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  gentle: {
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

export function AnimatedDragOverlay({
  children,
  isDragging,
  isValidDrop = true,
}: AnimatedDragOverlayProps) {
  const [animationClass, setAnimationClass] = useState('')
  const [dropAnimation, setDropAnimation] = useState(dropAnimationConfigs.smooth)

  useEffect(() => {
    if (isDragging) {
      // Start drag animation
      setAnimationClass('animate-drag-start')
      setDropAnimation(dropAnimationConfigs.smooth)
    } else if (isValidDrop) {
      // Valid drop with bounce
      setAnimationClass('animate-drop-bounce')
      setDropAnimation(dropAnimationConfigs.bounce)
    } else {
      // Invalid drop with shake
      setAnimationClass('animate-drop-invalid')
      setDropAnimation(dropAnimationConfigs.gentle)
    }
  }, [isDragging, isValidDrop])

  return (
    <DragOverlay
      dropAnimation={dropAnimation}
      className={cn(
        'transition-all',
        animationClass
      )}
      style={{
        // GPU acceleration
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </DragOverlay>
  )
}

// Enhanced drag preview with spring animations
interface SpringDragPreviewProps {
  widget: any
  isValidDrop?: boolean
  showDropIndicator?: boolean
}

export function SpringDragPreview({
  widget,
  isValidDrop = true,
  showDropIndicator = true,
}: SpringDragPreviewProps) {
  const [bounceAnimation, setBounceAnimation] = useState(false)

  useEffect(() => {
    if (!isValidDrop) {
      // Trigger shake animation for invalid drop
      setBounceAnimation(true)
      const timer = setTimeout(() => setBounceAnimation(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isValidDrop])

  return (
    <div
      className={cn(
        'relative w-full h-full transition-all duration-300',
        {
          'scale-105 shadow-2xl': true,
          'opacity-90': isValidDrop,
          'opacity-60': !isValidDrop,
          'animate-shake': bounceAnimation,
        }
      )}
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        willChange: 'transform, opacity',
      }}
    >
      {/* Main widget content */}
      <div
        className={cn(
          'w-full h-full rounded-lg',
          'bg-white border-2',
          {
            'border-blue-400': isValidDrop,
            'border-red-400': !isValidDrop,
          }
        )}
      >
        {widget.content}
      </div>

      {/* Drop indicator overlay */}
      {showDropIndicator && (
        <div
          className={cn(
            'absolute inset-0 rounded-lg pointer-events-none',
            'transition-all duration-200',
            {
              'bg-green-500/10 border-2 border-green-500': isValidDrop,
              'bg-red-500/10 border-2 border-red-500': !isValidDrop,
            }
          )}
        >
          {/* Drop status message */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <div
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium shadow-lg',
                'transition-all duration-200',
                {
                  'bg-green-600 text-white': isValidDrop,
                  'bg-red-600 text-white': !isValidDrop,
                }
              )}
            >
              {isValidDrop ? '놓을 수 있음' : '놓을 수 없음'}
            </div>
          </div>
        </div>
      )}

      {/* Glow effect for valid drop */}
      {isValidDrop && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
          style={{
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
          }}
        />
      )}
    </div>
  )
}