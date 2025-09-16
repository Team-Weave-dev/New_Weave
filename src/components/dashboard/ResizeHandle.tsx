'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ResizeHandleProps {
  position: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  onMouseDown?: (e: React.MouseEvent) => void
  onResize?: (deltaX: number, deltaY: number) => void
  onResizeEnd?: () => void
  disabled?: boolean
  className?: string
}

export function ResizeHandle({ 
  position, 
  onMouseDown,
  onResize, 
  onResizeEnd,
  disabled = false,
  className 
}: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // 외부에서 전달받은 onMouseDown이 있으면 사용
    if (onMouseDown) {
      onMouseDown(e)
      return
    }
    
    // 기존 로직 사용
    setIsResizing(true)
    setStartPos({ x: e.clientX, y: e.clientY })
  }, [disabled, onMouseDown])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y

    // 위치에 따라 리사이즈 방향 결정
    let actualDeltaX = 0
    let actualDeltaY = 0

    switch (position) {
      case 'right':
        actualDeltaX = deltaX
        break
      case 'left':
        actualDeltaX = -deltaX
        break
      case 'bottom':
        actualDeltaY = deltaY
        break
      case 'top':
        actualDeltaY = -deltaY
        break
      case 'bottom-right':
        actualDeltaX = deltaX
        actualDeltaY = deltaY
        break
      case 'bottom-left':
        actualDeltaX = -deltaX
        actualDeltaY = deltaY
        break
      case 'top-right':
        actualDeltaX = deltaX
        actualDeltaY = -deltaY
        break
      case 'top-left':
        actualDeltaX = -deltaX
        actualDeltaY = -deltaY
        break
    }

    if (onResize) {
      onResize(actualDeltaX, actualDeltaY)
    }
    setStartPos({ x: e.clientX, y: e.clientY })
  }, [isResizing, startPos, position, onResize])

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return
    
    setIsResizing(false)
    if (onResizeEnd) {
      onResizeEnd()
    }
  }, [isResizing, onResizeEnd])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = getCursor()
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const getCursor = () => {
    switch (position) {
      case 'top':
      case 'bottom':
        return 'ns-resize'
      case 'left':
      case 'right':
        return 'ew-resize'
      case 'top-left':
      case 'bottom-right':
        return 'nwse-resize'
      case 'top-right':
      case 'bottom-left':
        return 'nesw-resize'
      default:
        return 'pointer'
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-0 left-4 right-4 h-3 cursor-ns-resize'
      case 'right':
        return 'top-4 right-0 bottom-4 w-3 cursor-ew-resize'
      case 'bottom':
        return 'bottom-0 left-4 right-4 h-3 cursor-ns-resize'
      case 'left':
        return 'left-0 top-4 bottom-4 w-3 cursor-ew-resize'
      case 'top-left':
        return 'top-0 left-0 w-6 h-6 cursor-nwse-resize'
      case 'top-right':
        return 'top-0 right-0 w-6 h-6 cursor-nesw-resize'
      case 'bottom-left':
        return 'bottom-0 left-0 w-6 h-6 cursor-nesw-resize'
      case 'bottom-right':
        return 'bottom-0 right-0 w-6 h-6 cursor-nwse-resize'
      default:
        return ''
    }
  }

  if (disabled) return null

  return (
    <>
      <div
        className={cn(
          'absolute z-30 transition-all duration-200 group',
          getPositionClasses(),
          {
            'bg-blue-500': isResizing,
            'bg-blue-400 hover:bg-blue-500': !isResizing && !position.includes('-'),
            'bg-transparent': !isResizing && position.includes('-'),
            'opacity-100': isResizing,
            'opacity-60 hover:opacity-100': !isResizing,
          },
          className
        )}
        onMouseDown={handleMouseDown}
      >
        {/* 코너 핸들에 시각적 인디케이터 추가 */}
        {position.includes('-') && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              'w-3 h-3 rounded-full border-2 transition-all duration-200',
              isResizing ? 'bg-blue-600 border-white scale-125' : 'bg-white border-blue-400 group-hover:scale-110 group-hover:bg-blue-500 group-hover:border-white'
            )} />
          </div>
        )}
      </div>
      
      {/* 호버 영역 확장 (사용성 개선) */}
      <div
        className={cn(
          'absolute z-29',
          position === 'top' && 'top-[-6px] left-2 right-2 h-[18px] cursor-ns-resize',
          position === 'right' && 'top-2 right-[-6px] bottom-2 w-[18px] cursor-ew-resize',
          position === 'bottom' && 'bottom-[-6px] left-2 right-2 h-[18px] cursor-ns-resize',
          position === 'left' && 'left-[-6px] top-2 bottom-2 w-[18px] cursor-ew-resize',
          position === 'top-left' && 'top-[-8px] left-[-8px] w-[24px] h-[24px] cursor-nwse-resize',
          position === 'top-right' && 'top-[-8px] right-[-8px] w-[24px] h-[24px] cursor-nesw-resize',
          position === 'bottom-left' && 'bottom-[-8px] left-[-8px] w-[24px] h-[24px] cursor-nesw-resize',
          position === 'bottom-right' && 'bottom-[-8px] right-[-8px] w-[24px] h-[24px] cursor-nwse-resize'
        )}
        onMouseDown={handleMouseDown}
      />
    </>
  )
}