'use client'

import React, { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from './Button'
import { motion, AnimatePresence } from 'framer-motion'

interface UpdateNotificationProps {
  className?: string
}

/**
 * PWA 업데이트 알림 컴포넌트
 * Service Worker 업데이트가 감지되면 사용자에게 알림을 표시합니다.
 */
export function UpdateNotification({ className }: UpdateNotificationProps) {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Service Worker 등록 상태 확인
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)

        // 업데이트 감지
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 새 버전이 설치되었지만 아직 활성화되지 않음
                setShowUpdate(true)
              }
            })
          }
        })
      })

      // 페이지 포커스 시 업데이트 체크
      const checkForUpdate = () => {
        if (registration) {
          registration.update()
        }
      }

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          checkForUpdate()
        }
      })

      // 주기적 업데이트 체크 (1시간마다)
      const interval = setInterval(checkForUpdate, 60 * 60 * 1000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [registration])

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Service Worker에 SKIP_WAITING 메시지 전송
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // 페이지 새로고침
      window.location.reload()
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)
    // 24시간 동안 다시 표시하지 않음
    localStorage.setItem('updateDismissed', Date.now().toString())
  }

  // 이전에 무시한 경우 체크
  useEffect(() => {
    const dismissed = localStorage.getItem('updateDismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const now = Date.now()
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60)
      
      if (hoursSinceDismissed < 24) {
        setShowUpdate(false)
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn(
            'fixed bottom-4 left-4 right-4 z-50',
            'lg:left-auto lg:right-4 lg:max-w-md',
            className
          )}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  새 버전이 있습니다
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  앱의 새로운 버전이 준비되었습니다. 지금 업데이트하시겠습니까?
                </p>
                
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleUpdate}
                    variant="primary"
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    업데이트
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    나중에
                  </Button>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * 오프라인 상태 표시 컴포넌트
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine)
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-50">
      <p className="text-sm font-medium">
        오프라인 모드 - 인터넷 연결을 확인해주세요
      </p>
    </div>
  )
}