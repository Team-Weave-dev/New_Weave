'use client'

import { useState, useCallback, useRef } from 'react'

/**
 * 접근성 알림 관리 훅
 * 스크린리더에게 상태 변경 알림
 */
export function useA11yAnnouncements() {
  const [announcements, setAnnouncements] = useState<string[]>([])
  const announcementQueueRef = useRef<string[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()

  // 알림 추가
  const announce = useCallback((message: string, delay = 100) => {
    // 큐에 메시지 추가
    announcementQueueRef.current.push(message)

    // 이미 처리 중이면 건너뜀
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 약간의 지연 후 알림 (빠른 연속 변경 시 마지막 상태만 알림)
    timeoutRef.current = setTimeout(() => {
      setAnnouncements(announcementQueueRef.current)
      announcementQueueRef.current = []
      timeoutRef.current = undefined
    }, delay)
  }, [])

  // 위젯 관련 알림
  const announceWidget = useCallback((action: string, widgetName?: string) => {
    const messages: Record<string, string> = {
      'add': `${widgetName || '위젯'}이(가) 추가되었습니다`,
      'remove': `${widgetName || '위젯'}이(가) 제거되었습니다`,
      'move': `${widgetName || '위젯'}이(가) 이동되었습니다`,
      'resize': `${widgetName || '위젯'} 크기가 변경되었습니다`,
      'lock': `${widgetName || '위젯'}이(가) 잠금되었습니다`,
      'unlock': `${widgetName || '위젯'} 잠금이 해제되었습니다`,
      'select': `${widgetName || '위젯'}이(가) 선택되었습니다`,
      'deselect': `${widgetName || '위젯'} 선택이 해제되었습니다`,
      'edit-on': '편집 모드가 활성화되었습니다',
      'edit-off': '편집 모드가 비활성화되었습니다',
      'drag-start': `${widgetName || '위젯'} 드래그를 시작합니다`,
      'drag-end': `${widgetName || '위젯'} 드래그가 완료되었습니다`,
      'drag-cancel': `${widgetName || '위젯'} 드래그가 취소되었습니다`,
      'collision': '위치에 충돌이 감지되었습니다. 다른 위치로 이동하세요',
      'fullscreen-on': `${widgetName || '위젯'}이(가) 전체화면으로 전환되었습니다`,
      'fullscreen-off': `${widgetName || '위젯'} 전체화면이 해제되었습니다`,
    }

    const message = messages[action] || `${action} 작업이 수행되었습니다`
    announce(message)
  }, [announce])

  // 오류 알림
  const announceError = useCallback((error: string) => {
    announce(`오류: ${error}`, 0) // 즉시 알림
  }, [announce])

  // 경고 알림
  const announceWarning = useCallback((warning: string) => {
    announce(`경고: ${warning}`, 0) // 즉시 알림
  }, [announce])

  // 도움말 알림
  const announceHelp = useCallback((help: string) => {
    announce(`도움말: ${help}`, 200)
  }, [announce])

  // 알림 클리어
  const clearAnnouncements = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    announcementQueueRef.current = []
    setAnnouncements([])
  }, [])

  return {
    announcements,
    announce,
    announceWidget,
    announceError,
    announceWarning,
    announceHelp,
    clearAnnouncements,
  }
}