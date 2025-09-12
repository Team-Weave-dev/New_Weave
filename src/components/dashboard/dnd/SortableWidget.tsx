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
    transition,
    zIndex: isDragging ? 999 : undefined,
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
        'relative h-full w-full focus:outline-none focus:ring-2 focus:ring-blue-500',
        {
          'opacity-50': isDragging,
          'ring-2 ring-blue-500 ring-offset-2': isOver && !isDragging,
          'cursor-move': !disabled,
          'transition-transform': isSorting,
        },
        className
      )}
      {...ariaProps}
      {...(disabled ? {} : { ...attributes, ...listeners })}
    >
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