'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface SwapAnimationProps {
  sourceId: string
  targetId: string
  onSwapComplete?: () => void
  duration?: number
}

export function SwapAnimation({
  sourceId,
  targetId,
  onSwapComplete,
  duration = 400,
}: SwapAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const sourceRef = useRef<HTMLElement | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!sourceId || !targetId) return

    const source = document.getElementById(sourceId)
    const target = document.getElementById(targetId)

    if (!source || !target) return

    sourceRef.current = source
    targetRef.current = target

    // Get initial positions
    const sourceRect = source.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()

    // Calculate movement deltas
    const sourceDeltaX = targetRect.left - sourceRect.left
    const sourceDeltaY = targetRect.top - sourceRect.top
    const targetDeltaX = sourceRect.left - targetRect.left
    const targetDeltaY = sourceRect.top - targetRect.top

    // Start animation
    setIsAnimating(true)

    // Apply swap animation using Web Animations API
    const sourceAnimation = source.animate(
      [
        { transform: 'translate(0, 0) scale(1)', offset: 0 },
        { transform: `translate(${sourceDeltaX * 0.5}px, ${sourceDeltaY * 0.5}px) scale(1.05)`, offset: 0.5 },
        { transform: `translate(${sourceDeltaX}px, ${sourceDeltaY}px) scale(1)`, offset: 1 },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      }
    )

    const targetAnimation = target.animate(
      [
        { transform: 'translate(0, 0) scale(1)', offset: 0 },
        { transform: `translate(${targetDeltaX * 0.5}px, ${targetDeltaY * 0.5}px) scale(1.05)`, offset: 0.5 },
        { transform: `translate(${targetDeltaX}px, ${targetDeltaY}px) scale(1)`, offset: 1 },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      }
    )

    // Handle animation completion
    Promise.all([sourceAnimation.finished, targetAnimation.finished]).then(() => {
      setIsAnimating(false)
      if (onSwapComplete) {
        onSwapComplete()
      }
    })

    return () => {
      sourceAnimation.cancel()
      targetAnimation.cancel()
    }
  }, [sourceId, targetId, duration, onSwapComplete])

  return null
}

// Widget transition component for smooth position changes
interface WidgetTransitionProps {
  widgetId: string
  position: { x: number; y: number; width: number; height: number }
  isTransitioning?: boolean
  transitionDuration?: number
  children: React.ReactNode
}

export function WidgetTransition({
  widgetId,
  position,
  isTransitioning = false,
  transitionDuration = 300,
  children,
}: WidgetTransitionProps) {
  const [prevPosition, setPrevPosition] = useState(position)
  const [animationStyle, setAnimationStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (isTransitioning && prevPosition) {
      // Calculate position delta
      const deltaX = position.x - prevPosition.x
      const deltaY = position.y - prevPosition.y
      const hasPositionChange = deltaX !== 0 || deltaY !== 0
      const hasSizeChange = 
        position.width !== prevPosition.width || 
        position.height !== prevPosition.height

      if (hasPositionChange || hasSizeChange) {
        // Apply smooth transition
        setAnimationStyle({
          transform: 'translateZ(0)',
          transition: `all ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          willChange: 'transform',
        })
      }
    }

    setPrevPosition(position)
  }, [position, isTransitioning, prevPosition, transitionDuration])

  return (
    <div
      id={widgetId}
      className="widget-transition"
      style={animationStyle}
    >
      {children}
    </div>
  )
}

// Push animation for widget reflow
interface PushAnimationProps {
  widgets: Array<{ id: string; position: any }>
  pushedWidgetIds: string[]
  duration?: number
}

export function PushAnimation({
  widgets,
  pushedWidgetIds,
  duration = 350,
}: PushAnimationProps) {
  useEffect(() => {
    if (pushedWidgetIds.length === 0) return

    pushedWidgetIds.forEach((widgetId) => {
      const element = document.getElementById(widgetId)
      if (!element) return

      // Apply push animation with slight delay for cascade effect
      const index = pushedWidgetIds.indexOf(widgetId)
      const delay = index * 50 // Stagger animations

      element.animate(
        [
          { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0 },
          { transform: 'translateY(-5px) scale(1.02)', opacity: 0.9, offset: 0.3 },
          { transform: 'translateY(0) scale(1)', opacity: 1, offset: 1 },
        ],
        {
          duration,
          delay,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }
      )
    })
  }, [pushedWidgetIds, duration])

  return null
}