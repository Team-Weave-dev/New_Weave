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
    transition: isDragging 
      ? 'none' 
      : transition || 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 200ms ease', // 부드러운 애니메이션
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.3 : 1, // 드래그 중 원본 위젯 반투명 처리
    cursor: isDragging ? 'grabbing' : disabled ? 'default' : 'grab',
    // GPU 가속 최적화
    willChange: isDragging ? 'transform, opacity' : 'auto',
    backfaceVisibility: 'hidden' as const,
    perspective: '1000px',
    transformStyle: 'preserve-3d' as const,
  }

  // ARIA 속성 추가
  const ariaProps = {
    'role': 'button',
    'aria-roledescription': '드래그 가능한 위젯',
    'aria-describedby': `${id}-description`,
    'aria-disabled': disabled,
    'aria-grabbed': isDragging ? true : false,
    'aria-live': isDragging ? ('polite' as const) : undefined,
    'aria-label': isDragging ? '위젯 이동 중' : '드래그 가능한 위젯',
    'tabIndex': disabled ? -1 : 0,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative h-full w-full focus:outline-none focus:ring-2 focus:ring-blue-500 gpu-accelerated',
        {
          // 드래그 중 스타일
          'widget-dragging': isDragging,
          'shadow-2xl scale-105': isDragging,
          // 드롭 가능 영역 스타일  
          'widget-drop-zone': isOver && !isDragging,
          'ring-2 ring-green-500 ring-offset-2 bg-green-50 scale-102': isOver && !isDragging,
          // 호버 스타일
          'widget-hoverable': !disabled && !isDragging,
          'hover:shadow-lg hover:scale-101': !disabled && !isDragging,
          // 정렬 중 스타일
          'widget-sorting': isSorting,
          'spring-transition': isSorting && !isDragging,
        },
        className
      )}
      {...ariaProps}
      {...(disabled ? {} : { ...attributes, ...listeners })}
    >
      {/* 드래그 중 원본 위젯 표시 */}
      {isDragging && (
        <>
          {/* 점선 테두리 */}
          <div className="absolute inset-0 border-2 border-dashed border-gray-400 rounded-lg pointer-events-none animate-pulse" />
          
          {/* "이동 중" 라벨 */}
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium shadow-lg animate-bounce">
              이동 중
            </div>
          </div>
        </>
      )}
      
      {/* 드롭 영역 표시 */}
      {isOver && !isDragging && (
        <div className="absolute inset-0 bg-green-400 bg-opacity-10 rounded-lg pointer-events-none animate-pulse-glow">
          <div className="absolute inset-0 border-2 border-green-500 border-dashed rounded-lg animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg animate-drop-bounce">
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
        aria-live="polite"
      >
        {isDragging 
          ? '위젯을 이동 중입니다. 화살표 키로 위치를 선택하고 스페이스바를 눌러 놓으세요.'
          : '위젯을 이동하려면 스페이스바를 누른 후 화살표 키를 사용하세요. 스페이스바를 다시 눌러 배치를 완료하세요.'
        }
      </span>
    </div>
  )
}