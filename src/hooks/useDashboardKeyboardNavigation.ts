import { useEffect, useCallback } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'

export function useDashboardKeyboardNavigation() {
  const {
    isEditMode,
    selectedWidgetId,
    selectWidget,
    currentLayout,
    moveWidget,
    removeWidget,
    reflowWidgets,
    setEditMode,
    saveToLocalStorage,
    lockWidget,
    resizeWidget,
  } = useDashboardStore()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 전역 단축키 (편집 모드와 관계없이 동작)
    if ((event.ctrlKey || event.metaKey)) {
      switch (event.key) {
        case 'e':
          // Cmd/Ctrl + E: 편집 모드 토글
          event.preventDefault()
          setEditMode(!isEditMode)
          if (!isEditMode) {
            selectWidget(null)
          }
          return
          
        case 's':
          // Cmd/Ctrl + S: 레이아웃 저장
          event.preventDefault()
          saveToLocalStorage()
          console.log('레이아웃 저장됨')
          return
          
        case 'z':
          // Cmd/Ctrl + Z: 실행 취소 (향후 구현)
          if (event.shiftKey) {
            // Cmd/Ctrl + Shift + Z: 다시 실행
            event.preventDefault()
            console.log('다시 실행 (미구현)')
          } else {
            event.preventDefault()
            console.log('실행 취소 (미구현)')
          }
          return
      }
    }
    
    // 편집 모드 전용 단축키
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
          removeWidget(selectedWidget.id)
          selectWidget(null)
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
          // 위젯 설정 모달 열기 (이벤트 발생)
          const configEvent = new CustomEvent('openWidgetConfig', { 
            detail: { widgetId: selectedWidget.id } 
          })
          window.dispatchEvent(configEvent)
        }
        break

      case 'l':
        // L키로 위젯 잠금/잠금 해제
        if (selectedWidget && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          lockWidget(selectedWidget.id, !selectedWidget.locked)
        }
        break

      case 'r':
        // R키로 리플로우
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          reflowWidgets()
        }
        break

      case '+':
      case '=':
        // +/= 키로 위젯 크기 증가
        if (selectedWidget && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          const newSize = {
            width: Math.min(selectedWidget.position.width + 1, 4),
            height: Math.min(selectedWidget.position.height + 1, 4)
          }
          resizeWidget(selectedWidget.id, newSize)
        }
        break

      case '-':
      case '_':
        // - 키로 위젯 크기 감소
        if (selectedWidget && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          const newSize = {
            width: Math.max(selectedWidget.position.width - 1, 1),
            height: Math.max(selectedWidget.position.height - 1, 1)
          }
          resizeWidget(selectedWidget.id, newSize)
        }
        break

      case 'a':
        // Cmd/Ctrl + A: 모든 위젯 선택 (향후 다중 선택 구현 시)
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          console.log('모든 위젯 선택 (미구현)')
        }
        break

      case 'd':
        // Cmd/Ctrl + D: 위젯 복제
        if (selectedWidget && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          console.log('위젯 복제 (미구현)')
        }
        break
    }
  }, [
    isEditMode,
    selectedWidgetId,
    selectWidget,
    currentLayout,
    moveWidget,
    removeWidget,
    reflowWidgets,
    setEditMode,
    saveToLocalStorage,
    lockWidget,
    resizeWidget,
  ])

  useEffect(() => {
    // 항상 키보드 이벤트 리스너 등록 (전역 단축키를 위해)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    selectedWidgetId,
    selectWidget,
  }
}