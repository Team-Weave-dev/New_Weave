import { useEffect, useCallback } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'

export function useDashboardKeyboardNavigation() {
  const {
    isEditMode,
    selectedWidgetId,
    selectWidget,
    currentLayout,
    moveWidget,
    reflowWidgets,
    setEditMode,
  } = useDashboardStore()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEditMode || !currentLayout) return

    const widgets = currentLayout.widgets
    const selectedWidget = widgets.find(w => w.id === selectedWidgetId)

    switch (event.key) {
      case 'Tab':
        // Tab으로 다음 위젯 선택
        if (widgets.length > 0) {
          event.preventDefault()
          const currentIndex = selectedWidgetId 
            ? widgets.findIndex(w => w.id === selectedWidgetId)
            : -1
          
          const nextIndex = event.shiftKey 
            ? (currentIndex - 1 + widgets.length) % widgets.length
            : (currentIndex + 1) % widgets.length
          
          selectWidget(widgets[nextIndex].id)
        }
        break

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        // 화살표 키로 위젯 이동
        if (selectedWidget && event.ctrlKey) {
          event.preventDefault()
          const newPosition = { ...selectedWidget.position }
          
          switch (event.key) {
            case 'ArrowUp':
              newPosition.y = Math.max(0, newPosition.y - 1)
              break
            case 'ArrowDown':
              newPosition.y += 1
              break
            case 'ArrowLeft':
              newPosition.x = Math.max(0, newPosition.x - 1)
              break
            case 'ArrowRight':
              newPosition.x += 1
              break
          }
          
          moveWidget(selectedWidget.id, newPosition)
        }
        break

      case 'Delete':
      case 'Backspace':
        // Delete 키로 위젯 삭제
        if (selectedWidget && !selectedWidget.locked) {
          event.preventDefault()
          // removeWidget 액션 호출
        }
        break

      case 'Escape':
        // Escape로 편집 모드 종료
        event.preventDefault()
        setEditMode(false)
        selectWidget(null)
        break

      case 'Enter':
        // Enter로 선택된 위젯 설정 열기
        if (selectedWidget) {
          event.preventDefault()
          // 위젯 설정 모달 열기
        }
        break

      case 'r':
        // R키로 리플로우
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          reflowWidgets()
        }
        break
    }
  }, [
    isEditMode,
    selectedWidgetId,
    selectWidget,
    currentLayout,
    moveWidget,
    reflowWidgets,
    setEditMode,
  ])

  useEffect(() => {
    if (isEditMode) {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isEditMode, handleKeyDown])

  return {
    selectedWidgetId,
    selectWidget,
  }
}