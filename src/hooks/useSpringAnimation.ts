import { useEffect, useRef, useCallback } from 'react'

export interface SpringConfig {
  stiffness?: number
  damping?: number
  mass?: number
  velocity?: number
  precision?: number
  restDelta?: number
}

interface SpringValue {
  value: number
  velocity: number
}

const defaultConfig: Required<SpringConfig> = {
  stiffness: 300,
  damping: 30,
  mass: 1,
  velocity: 0,
  precision: 0.01,
  restDelta: 0.001,
}

export function useSpringAnimation(
  target: number,
  config: SpringConfig = {},
  onUpdate?: (value: number) => void
) {
  const springConfig = { ...defaultConfig, ...config }
  const animationRef = useRef<number | null>(null)
  const springValueRef = useRef<SpringValue>({
    value: target,
    velocity: springConfig.velocity,
  })

  const animate = useCallback(() => {
    const current = springValueRef.current
    const { stiffness, damping, mass } = springConfig

    // Spring physics calculations
    const spring = -stiffness * (current.value - target)
    const damper = -damping * current.velocity
    const acceleration = (spring + damper) / mass

    const newVelocity = current.velocity + acceleration * 0.016 // ~60fps
    const newValue = current.value + newVelocity * 0.016

    // Check if animation should stop
    const isMoving = Math.abs(newVelocity) > springConfig.restDelta
    const isAway = Math.abs(target - newValue) > springConfig.precision

    if (isMoving || isAway) {
      springValueRef.current = {
        value: newValue,
        velocity: newVelocity,
      }

      if (onUpdate) {
        onUpdate(newValue)
      }

      animationRef.current = requestAnimationFrame(animate)
    } else {
      // Snap to target when close enough
      springValueRef.current = {
        value: target,
        velocity: 0,
      }

      if (onUpdate) {
        onUpdate(target)
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [target, springConfig, onUpdate])

  useEffect(() => {
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    // Start new animation
    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [animate])

  return springValueRef.current.value
}

// Spring animation for 2D coordinates
export function useSpring2D(
  targetX: number,
  targetY: number,
  config: SpringConfig = {},
  onUpdate?: (x: number, y: number) => void
) {
  const xRef = useRef(targetX)
  const yRef = useRef(targetY)

  const handleXUpdate = useCallback((x: number) => {
    xRef.current = x
    if (onUpdate) {
      onUpdate(x, yRef.current)
    }
  }, [onUpdate])

  const handleYUpdate = useCallback((y: number) => {
    yRef.current = y
    if (onUpdate) {
      onUpdate(xRef.current, y)
    }
  }, [onUpdate])

  const x = useSpringAnimation(targetX, config, handleXUpdate)
  const y = useSpringAnimation(targetY, config, handleYUpdate)

  return { x, y }
}

// Predefined spring presets
export const springPresets = {
  default: {
    stiffness: 300,
    damping: 30,
  },
  gentle: {
    stiffness: 120,
    damping: 14,
  },
  wobbly: {
    stiffness: 180,
    damping: 12,
  },
  stiff: {
    stiffness: 400,
    damping: 40,
  },
  slow: {
    stiffness: 280,
    damping: 60,
  },
  molasses: {
    stiffness: 280,
    damping: 120,
  },
  bouncy: {
    stiffness: 500,
    damping: 15,
  },
  quick: {
    stiffness: 400,
    damping: 28,
  },
}