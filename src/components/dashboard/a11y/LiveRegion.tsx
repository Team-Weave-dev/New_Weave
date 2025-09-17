'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LiveRegionProps {
  message: string | null
  politeness?: 'polite' | 'assertive' | 'off'
  clearAfter?: number // milliseconds
  className?: string
}

/**
 * 스크린리더를 위한 라이브 리전 컴포넌트
 * 동적 콘텐츠 변경사항을 스크린리더에게 알림
 */
export function LiveRegion({ 
  message, 
  politeness = 'polite',
  clearAfter = 5000,
  className 
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState<string | null>(null)

  useEffect(() => {
    if (message) {
      setCurrentMessage(message)

      // 일정 시간 후 메시지 제거 (스크린리더가 읽은 후)
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage(null)
        }, clearAfter)

        return () => clearTimeout(timer)
      }
    }
  }, [message, clearAfter])

  if (!currentMessage) return null

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={cn(
        'sr-only', // 시각적으로 숨김, 스크린리더만 읽음
        className
      )}
    >
      {currentMessage}
    </div>
  )
}

/**
 * 대시보드 전용 라이브 리전
 * 위젯 상태 변경 알림
 */
interface DashboardLiveRegionProps {
  announcements: string[]
}

export function DashboardLiveRegion({ announcements }: DashboardLiveRegionProps) {
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    if (announcements.length > 0) {
      setMessages(announcements)
      
      // 10초 후 메시지 제거
      const timer = setTimeout(() => {
        setMessages([])
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [announcements])

  return (
    <>
      {/* 일반 알림용 (polite) */}
      <div
        role="status"
        aria-live="polite"
        aria-relevant="additions"
        className="sr-only"
      >
        {messages
          .filter(msg => !msg.includes('오류') && !msg.includes('경고'))
          .map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
      </div>

      {/* 중요 알림용 (assertive) */}
      <div
        role="alert"
        aria-live="assertive"
        aria-relevant="additions"
        className="sr-only"
      >
        {messages
          .filter(msg => msg.includes('오류') || msg.includes('경고'))
          .map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
      </div>
    </>
  )
}