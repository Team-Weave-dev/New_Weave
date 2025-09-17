'use client'

import { useEffect, useCallback } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'

interface UseKeyboardNavigationProps {
  widgetId: string
  isLocked?: boolean
  isSelected?: boolean
  onRemove?: () => void
  onConfigure?: () => void
  onFullscreen?: () => void
}

export function useKeyboardNavigation({
  widgetId,
  isLocked = false,
  isSelected = false,
  onRemove,
  onConfigure,
  onFullscreen,
}: UseKeyboardNavigationProps) {
  const {
    isEditMode,
    selectWidget,
    moveWidget,
    resizeWidget,
    currentLayout,
    focusedWidgetId,
    setFocusedWidget,
    lockWidget,
  } = useDashboardStore()

  // 현재 위젯 정보
  const currentWidget = currentLayout?.widgets.find(w => w.id === widgetId)
  const isFocused = focusedWidgetId === widgetId

  // 그리드 컬럼 수 계산
  const gridColumns = currentLayout?.gridSize === '2x2' ? 2 :
                     currentLayout?.gridSize === '3x3' ? 3 :
                     currentLayout?.gridSize === '4x4' ? 4 : 5

  // 위젯 이동 (화살표 키)
  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentWidget || isLocked || !isEditMode || !isSelected) return

    const { x, y, width, height } = currentWidget.position
    let newX = x
    let newY = y

    switch (direction) {
      case 'up':
        newY = Math.max(0, y - 1)
        break
      case 'down':
        newY = Math.min(gridColumns - height, y + 1)
        break
      case 'left':
        newX = Math.max(0, x - 1)
        break
      case 'right':
        newX = Math.min(gridColumns - width, x + 1)
        break
    }

    if (newX !== x || newY !== y) {
      moveWidget(widgetId, { x: newX, y: newY, width, height })
    }
  }, [currentWidget, isLocked, isEditMode, isSelected, gridColumns, moveWidget, widgetId])

  // 위젯 크기 조정 (Shift + 화살표 키)
  const handleResize = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentWidget || isLocked || !isEditMode || !isSelected) return

    const { width, height, x, y } = currentWidget.position
    let newWidth = width
    let newHeight = height

    switch (direction) {
      case 'right':
        newWidth = Math.min(4, Math.min(gridColumns - x, width + 1))
        break
      case 'left':
        newWidth = Math.max(1, width - 1)
        break
      case 'down':
        newHeight = Math.min(4, Math.min(gridColumns - y, height + 1))
        break
      case 'up':
        newHeight = Math.max(1, height - 1)
        break
    }

    if (newWidth !== width || newHeight !== height) {
      resizeWidget(widgetId, { width: newWidth, height: newHeight })
    }
  }, [currentWidget, isLocked, isEditMode, isSelected, gridColumns, resizeWidget, widgetId])

  // Tab 키로 다음 위젯으로 포커스 이동
  const handleTabNavigation = useCallback((shiftKey: boolean) => {
    if (!currentLayout || !isEditMode) return

    const widgets = currentLayout.widgets
    if (widgets.length === 0) return

    // 위젯을 y 좌표 기준으로 정렬, 같은 y면 x 좌표 기준
    const sortedWidgets = [...widgets].sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y
      }
      return a.position.x - b.position.x
    })

    const currentIndex = sortedWidgets.findIndex(w => w.id === widgetId)
    
    let nextIndex: number
    if (shiftKey) {
      // Shift+Tab: 이전 위젯
      nextIndex = currentIndex > 0 ? currentIndex - 1 : sortedWidgets.length - 1
    } else {
      // Tab: 다음 위젯
      nextIndex = currentIndex < sortedWidgets.length - 1 ? currentIndex + 1 : 0
    }

    const nextWidget = sortedWidgets[nextIndex]
    if (nextWidget) {
      setFocusedWidget(nextWidget.id)
      selectWidget(nextWidget.id)
    }
  }, [currentLayout, isEditMode, widgetId, setFocusedWidget, selectWidget])

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isEditMode || !isFocused) return

    // 모달이나 입력 필드에 포커스가 있으면 무시
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true') {
      return
    }

    const key = e.key
    const shiftKey = e.shiftKey
    const ctrlKey = e.ctrlKey || e.metaKey

    // Tab 네비게이션
    if (key === 'Tab') {
      e.preventDefault()
      handleTabNavigation(shiftKey)
      return
    }

    // 선택된 위젯만 키보드 조작 가능
    if (!isSelected) return

    switch (key) {
      // 위젯 이동 (화살표 키)
      case 'ArrowUp':
        if (shiftKey) {
          e.preventDefault()
          handleResize('up')
        } else if (!ctrlKey) {
          e.preventDefault()
          handleMove('up')
        }
        break
      case 'ArrowDown':
        if (shiftKey) {
          e.preventDefault()
          handleResize('down')
        } else if (!ctrlKey) {
          e.preventDefault()
          handleMove('down')
        }
        break
      case 'ArrowLeft':
        if (shiftKey) {
          e.preventDefault()
          handleResize('left')
        } else if (!ctrlKey) {
          e.preventDefault()
          handleMove('left')
        }
        break
      case 'ArrowRight':
        if (shiftKey) {
          e.preventDefault()
          handleResize('right')
        } else if (!ctrlKey) {
          e.preventDefault()
          handleMove('right')
        }
        break

      // Enter: 선택/선택 해제
      case 'Enter':
        e.preventDefault()
        if (!isSelected) {
          selectWidget(widgetId)
        }
        break

      // Space: 전체화면 토글
      case ' ':
        if (!shiftKey && !ctrlKey) {
          e.preventDefault()
          onFullscreen?.()
        }
        break

      // L: 잠금 토글
      case 'l':
      case 'L':
        if (ctrlKey) {
          e.preventDefault()
          lockWidget(widgetId, !isLocked)
        }
        break

      // Delete/Backspace: 위젯 삭제
      case 'Delete':
      case 'Backspace':
        if (!isLocked && isSelected) {
          e.preventDefault()
          if (window.confirm('이 위젯을 삭제하시겠습니까?')) {
            onRemove?.()
          }
        }
        break

      // S: 설정 열기
      case 's':
      case 'S':
        if (ctrlKey && onConfigure) {
          e.preventDefault()
          onConfigure()
        }
        break

      // Escape: 선택 해제
      case 'Escape':
        e.preventDefault()
        selectWidget(null)
        setFocusedWidget(null)
        break
    }
  }, [
    isEditMode,
    isFocused,
    isSelected,
    isLocked,
    handleMove,
    handleResize,
    handleTabNavigation,
    selectWidget,
    lockWidget,
    setFocusedWidget,
    widgetId,
    onRemove,
    onConfigure,
    onFullscreen,
  ])

  // 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    isFocused,
    handleTabNavigation,
  }
}