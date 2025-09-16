'use client'

import React, { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface SortableWidgetProps {
  id: string
  children: ReactNode
  disabled?: boolean
  className?: string
}

export function SortableWidget({ 
  id, 
  children, 
  disabled = false,
  className 
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
    isOver,
  } = useSortable({
    id,
    disabled,
    animateLayoutChanges: () => true,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition, // 드래그 중에는 트랜지션 제거
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing' : disabled ? 'default' : 'grab',
  }

  // ARIA 속성 추가
  const ariaProps = {
    'role': 'button',
    'aria-roledescription': '드래그 가능한 위젯',
    'aria-describedby': `${id}-description`,
    'aria-disabled': disabled,
    'aria-grabbed': isDragging ? true : false,
    'tabIndex': disabled ? -1 : 0,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative h-full w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
        {
          'scale-105 shadow-2xl': isDragging,
          'ring-2 ring-green-500 ring-offset-2 bg-green-50': isOver && !isDragging,
          'hover:shadow-lg': !disabled && !isDragging,
          'transition-transform': isSorting,
        },
        className
      )}
      {...ariaProps}
      {...(disabled ? {} : { ...attributes, ...listeners })}
    >
      {/* 드래그 시작 시 시각적 피드백 */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none animate-pulse" />
      )}
      
      {/* 드롭 영역 표시 */}
      {isOver && !isDragging && (
        <div className="absolute inset-0 bg-green-400 bg-opacity-10 rounded-lg pointer-events-none">
          <div className="absolute inset-0 border-2 border-green-500 border-dashed rounded-lg" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
              여기에 놓기
            </div>
          </div>
        </div>
      )}
      
      {children}
      {/* 스크린 리더용 설명 */}
      <span 
        id={`${id}-description`}
        className="sr-only"
      >
        위젯을 이동하려면 스페이스바를 누른 후 화살표 키를 사용하세요. 
        스페이스바를 다시 눌러 배치를 완료하세요.
      </span>
    </div>
  )
}