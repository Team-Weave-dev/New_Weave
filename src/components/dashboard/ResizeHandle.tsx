'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ResizeHandleProps {
  position: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  onResize: (deltaX: number, deltaY: number) => void
  onResizeEnd?: () => void
  disabled?: boolean
  className?: string
}

export function ResizeHandle({ 
  position, 
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
    
    setIsResizing(true)
    setStartPos({ x: e.clientX, y: e.clientY })
  }, [disabled])

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

    onResize(actualDeltaX, actualDeltaY)
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
        return 'top-0 left-2 right-2 h-1 cursor-ns-resize'
      case 'right':
        return 'top-2 right-0 bottom-2 w-1 cursor-ew-resize'
      case 'bottom':
        return 'bottom-0 left-2 right-2 h-1 cursor-ns-resize'
      case 'left':
        return 'left-0 top-2 bottom-2 w-1 cursor-ew-resize'
      case 'top-left':
        return 'top-0 left-0 w-3 h-3 cursor-nwse-resize'
      case 'top-right':
        return 'top-0 right-0 w-3 h-3 cursor-nesw-resize'
      case 'bottom-left':
        return 'bottom-0 left-0 w-3 h-3 cursor-nesw-resize'
      case 'bottom-right':
        return 'bottom-0 right-0 w-3 h-3 cursor-nwse-resize'
      default:
        return ''
    }
  }

  if (disabled) return null

  return (
    <div
      className={cn(
        'absolute z-30 hover:bg-blue-500 transition-colors',
        getPositionClasses(),
        {
          'bg-blue-500': isResizing,
          'bg-transparent': !isResizing,
        },
        className
      )}
      onMouseDown={handleMouseDown}
    />
  )
}