import { useEffect, useRef, useCallback, useMemo } from 'react'

export interface SpringConfig {
  stiffness?: number
  damping?: number
  mass?: number
  velocity?: number
  precision?: number
  restDelta?: number
  clamp?: boolean
}

interface SpringValue {
  value: number
  velocity: number
  target: number
  isAnimating: boolean
}

const defaultConfig: Required<SpringConfig> = {
  stiffness: 300,
  damping: 30,
  mass: 1,
  velocity: 0,
  precision: 0.01,
  restDelta: 0.001,
  clamp: false,
}

// 글로벌 애니메이션 매니저 - 모든 Spring 애니메이션을 중앙에서 관리
class AnimationManager {
  private animations = new Map<string, SpringValue>()
  private callbacks = new Map<string, (value: number) => void>()
  private configs = new Map<string, Required<SpringConfig>>()
  private rafId: number | null = null
  private lastTime = 0

  register(id: string, target: number, config: Required<SpringConfig>, callback: (value: number) => void) {
    if (!this.animations.has(id)) {
      this.animations.set(id, {
        value: target,
        velocity: config.velocity,
        target,
        isAnimating: false,
      })
    } else {
      const animation = this.animations.get(id)!
      animation.target = target
      animation.isAnimating = true
    }
    
    this.callbacks.set(id, callback)
    this.configs.set(id, config)
    
    this.startAnimation()
  }

  unregister(id: string) {
    this.animations.delete(id)
    this.callbacks.delete(id)
    this.configs.delete(id)
    
    if (this.animations.size === 0 && this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private startAnimation = () => {
    if (this.rafId === null) {
      this.lastTime = performance.now()
      this.rafId = requestAnimationFrame(this.animate)
    }
  }

  private animate = (currentTime: number) => {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.064) // Cap at ~15fps minimum
    this.lastTime = currentTime

    let hasActiveAnimations = false

    // 배치 업데이트 - 모든 애니메이션을 한 번에 처리
    this.animations.forEach((animation, id) => {
      if (!animation.isAnimating) return

      const config = this.configs.get(id)!
      const callback = this.callbacks.get(id)!

      // Spring physics calculations
      const displacement = animation.value - animation.target
      const springForce = -config.stiffness * displacement
      const dampingForce = -config.damping * animation.velocity
      const acceleration = (springForce + dampingForce) / config.mass

      // Update velocity and position
      animation.velocity += acceleration * deltaTime
      animation.value += animation.velocity * deltaTime

      // Clamp if needed
      if (config.clamp) {
        animation.value = Math.max(0, Math.min(1, animation.value))
      }

      // Check if animation should stop
      const isMoving = Math.abs(animation.velocity) > config.restDelta
      const isDisplaced = Math.abs(animation.value - animation.target) > config.precision

      if (!isMoving && !isDisplaced) {
        animation.value = animation.target
        animation.velocity = 0
        animation.isAnimating = false
      } else {
        hasActiveAnimations = true
      }

      // Invoke callback with new value
      callback(animation.value)
    })

    // Continue animation if needed
    if (hasActiveAnimations) {
      this.rafId = requestAnimationFrame(this.animate)
    } else {
      this.rafId = null
    }
  }
}

// 싱글톤 인스턴스
const animationManager = new AnimationManager()

// 최적화된 Spring 애니메이션 훅
export function useOptimizedSpringAnimation(
  target: number,
  config: SpringConfig = {},
  onUpdate?: (value: number) => void
) {
  const animationId = useRef<string>()
  const valueRef = useRef(target)
  
  // 설정 병합 및 메모이제이션
  const springConfig = useMemo(
    () => ({ ...defaultConfig, ...config }),
    [config.stiffness, config.damping, config.mass, config.velocity, config.precision, config.restDelta, config.clamp]
  )
  
  // 애니메이션 ID 생성
  useEffect(() => {
    if (!animationId.current) {
      animationId.current = `spring-${Math.random().toString(36).substr(2, 9)}`
    }
  }, [])

  // 콜백 래핑
  const handleUpdate = useCallback((value: number) => {
    valueRef.current = value
    onUpdate?.(value)
  }, [onUpdate])

  // 타겟 변경 시 애니메이션 등록
  useEffect(() => {
    if (animationId.current) {
      animationManager.register(animationId.current, target, springConfig, handleUpdate)
    }

    return () => {
      if (animationId.current) {
        animationManager.unregister(animationId.current)
      }
    }
  }, [target, springConfig, handleUpdate])

  // 현재 값 반환
  const getValue = useCallback(() => valueRef.current, [])
  
  // 애니메이션 중지
  const stop = useCallback(() => {
    if (animationId.current) {
      animationManager.unregister(animationId.current)
    }
  }, [])

  // 즉시 설정
  const set = useCallback((value: number) => {
    valueRef.current = value
    if (animationId.current) {
      const animation = animationManager['animations'].get(animationId.current)
      if (animation) {
        animation.value = value
        animation.velocity = 0
        animation.isAnimating = false
      }
    }
    onUpdate?.(value)
  }, [onUpdate])

  return {
    value: valueRef.current,
    getValue,
    stop,
    set,
  }
}

// Spring 프리셋
export const springPresets = {
  gentle: { stiffness: 120, damping: 14, mass: 1 },
  wobbly: { stiffness: 180, damping: 12, mass: 1 },
  stiff: { stiffness: 400, damping: 40, mass: 1 },
  slow: { stiffness: 280, damping: 60, mass: 1 },
  molasses: { stiffness: 280, damping: 120, mass: 1 },
} as const

// 배치 Spring 애니메이션 훅 - 여러 값을 동시에 애니메이션
export function useBatchSpringAnimation(
  targets: Record<string, number>,
  config: SpringConfig = {},
  onUpdate?: (values: Record<string, number>) => void
) {
  const valuesRef = useRef<Record<string, number>>({})
  const animationIds = useRef<Record<string, string>>({})

  // 설정 병합
  const springConfig = useMemo(
    () => ({ ...defaultConfig, ...config }),
    [config.stiffness, config.damping, config.mass, config.velocity, config.precision, config.restDelta]
  )

  // 애니메이션 ID 생성
  useEffect(() => {
    Object.keys(targets).forEach(key => {
      if (!animationIds.current[key]) {
        animationIds.current[key] = `batch-${key}-${Math.random().toString(36).substr(2, 9)}`
      }
    })
  }, [targets])

  // 업데이트 핸들러
  const handleUpdate = useCallback((key: string) => (value: number) => {
    valuesRef.current[key] = value
    onUpdate?.(valuesRef.current)
  }, [onUpdate])

  // 타겟 변경 시 애니메이션 등록
  useEffect(() => {
    Object.entries(targets).forEach(([key, target]) => {
      const id = animationIds.current[key]
      if (id) {
        animationManager.register(id, target, springConfig, handleUpdate(key))
      }
    })

    return () => {
      Object.values(animationIds.current).forEach(id => {
        animationManager.unregister(id)
      })
    }
  }, [targets, springConfig, handleUpdate])

  return valuesRef.current
}