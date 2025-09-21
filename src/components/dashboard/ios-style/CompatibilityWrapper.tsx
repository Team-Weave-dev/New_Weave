'use client'

import React, { useMemo, ReactElement, CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WidgetPosition, Widget } from '@/types/dashboard'
import { IOSStyleWidget, FlexibleWidgetPosition } from '@/types/ios-dashboard'
import { cn } from '@/lib/utils'

interface CompatibilityWrapperProps {
  widget: Widget
  position?: WidgetPosition | FlexibleWidgetPosition
  isEditing?: boolean
  isDragging?: boolean
  children: ReactElement
  className?: string
  style?: CSSProperties
}

/**
 * CompatibilityWrapper - iOS 스타일 시스템과 기존 위젯을 연결하는 호환성 레이어
 * 
 * 주요 기능:
 * - 기존 GridSize 시스템과 새로운 Columns 시스템 간 변환
 * - 위젯 Props 자동 변환 및 매핑
 * - 편집 모드 이벤트 핸들러 통합
 * - 스타일 시스템 호환성 제공
 */
export function CompatibilityWrapper({
  widget,
  position,
  isEditing = false,
  isDragging = false,
  children,
  className,
  style
}: CompatibilityWrapperProps) {
  // Position 변환: 기존 시스템과 iOS 시스템 간 변환
  const convertedPosition = useMemo(() => {
    if (!position) return null

    // FlexibleWidgetPosition인 경우 (iOS 시스템)
    if ('gridColumnStart' in position) {
      const flexPosition = position as FlexibleWidgetPosition
      return {
        gridColumn: `${flexPosition.gridColumnStart} / ${flexPosition.gridColumnEnd}`,
        gridRow: `${flexPosition.gridRowStart} / ${flexPosition.gridRowEnd}`,
        zIndex: 'auto'
      }
    }

    // WidgetPosition인 경우 (기존 시스템)
    if ('x' in position && 'y' in position && 'width' in position && 'height' in position) {
      const widgetPosition = position as WidgetPosition

      return {
        gridColumn: `${widgetPosition.x} / span ${widgetPosition.width}`,
        gridRow: `${widgetPosition.y} / span ${widgetPosition.height}`,
        zIndex: 'auto'
      }
    }

    return null
  }, [position])

  // 위젯 크기 정보 추출 (내부용)
  const widgetSize = useMemo(() => {
    let columns = 2
    let rows = 2
    
    if (position) {
      if ('gridColumnStart' in position) {
        const flexPosition = position as FlexibleWidgetPosition
        columns = flexPosition.width
        rows = flexPosition.height
      } else if ('width' in position && 'height' in position) {
        const widgetPosition = position as WidgetPosition
        columns = widgetPosition.width
        rows = widgetPosition.height
      }
    }
    
    return { columns, rows }
  }, [position])

  // 이벤트 핸들러 Props 변환
  const enhancedChildren = useMemo(() => {
    if (!React.isValidElement(children)) return children

    const additionalProps: any = {
      'data-widget-id': widget.id,
      'data-widget-type': widget.type,
      'data-is-editing': isEditing,
      'data-is-dragging': isDragging
    }

    // iOS 스타일 관련 props 추가
    if (isEditing) {
      additionalProps['data-editable'] = true
      additionalProps['data-deletable'] = true
      additionalProps['aria-label'] = `${widget.type} widget, ${widgetSize.columns}x${widgetSize.rows} size`
      additionalProps['role'] = 'application'
    }

    // 기존 children에 props 추가
    const childProps = (children.props || {}) as Record<string, any>
    
    return React.cloneElement(children, {
      ...childProps,
      ...additionalProps,
      className: cn(
        childProps.className,
        'compatibility-wrapped-widget',
        isEditing && 'editing-mode',
        isDragging && 'dragging-mode'
      ),
      style: {
        ...(childProps.style || {}),
        width: '100%',
        height: '100%'
      }
    })
  }, [children, widget, isEditing, isDragging, widgetSize])

  // 래퍼 스타일 계산
  const wrapperStyle = useMemo(() => {
    const baseStyle: CSSProperties = {
      ...convertedPosition,
      ...style,
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: 0,
      minWidth: 0
    }

    // 편집 모드 스타일
    if (isEditing) {
      baseStyle.cursor = 'move'
      baseStyle.userSelect = 'none'
    }

    // 드래그 중 스타일
    if (isDragging) {
      baseStyle.opacity = 0.5
      baseStyle.pointerEvents = 'none'
    }

    return baseStyle
  }, [convertedPosition, style, isEditing, isDragging])

  // 애니메이션 variants
  const variants = {
    initial: { 
      opacity: 0, 
      scale: 0.8 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    },
    dragging: {
      scale: 1.05,
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      zIndex: 9999
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={widget.id}
        className={cn(
          'compatibility-wrapper',
          'overflow-hidden',
          'rounded-lg',
          className
        )}
        style={wrapperStyle}
        variants={variants}
        initial="initial"
        animate={isDragging ? 'dragging' : 'animate'}
        exit="exit"
        layout
        layoutId={`widget-${widget.id}`}
        drag={isEditing}
        dragElastic={0.1}
        dragMomentum={false}
        whileTap={isEditing ? { scale: 0.98 } : undefined}
      >
        {/* 호환성 레이어 인디케이터 (개발 모드) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-0 right-0 z-50 bg-purple-500/20 text-purple-700 text-[10px] px-1 rounded-bl">
            Compat
          </div>
        )}

        {/* 위젯 크기 표시 (편집 모드) */}
        {isEditing && (
          <div className="absolute bottom-0 right-0 z-50 bg-black/50 text-white text-xs px-2 py-1 rounded-tl">
            {widgetSize.columns}×{widgetSize.rows}
          </div>
        )}

        {/* 실제 위젯 콘텐츠 */}
        <div className="w-full h-full relative">
          {enhancedChildren}
        </div>

        {/* 리사이즈 핸들 (편집 모드) */}
        {isEditing && (
          <>
            {/* Top-Left */}
            <div 
              className="absolute top-0 left-0 w-3 h-3 bg-blue-500/50 rounded-br cursor-nw-resize"
              data-resize-handle="tl"
            />
            {/* Top-Right */}
            <div 
              className="absolute top-0 right-0 w-3 h-3 bg-blue-500/50 rounded-bl cursor-ne-resize"
              data-resize-handle="tr"
            />
            {/* Bottom-Left */}
            <div 
              className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500/50 rounded-tr cursor-sw-resize"
              data-resize-handle="bl"
            />
            {/* Bottom-Right */}
            <div 
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500/50 rounded-tl cursor-se-resize"
              data-resize-handle="br"
            />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * useCompatibilityMode Hook
 * 호환성 모드 상태와 유틸리티 함수 제공
 */
export function useCompatibilityMode() {
  // Position 변환 유틸리티
  const convertPosition = (
    oldPosition: WidgetPosition | FlexibleWidgetPosition
  ): FlexibleWidgetPosition => {
    if ('gridColumnStart' in oldPosition) {
      // 이미 FlexibleWidgetPosition
      return oldPosition as FlexibleWidgetPosition
    }

    // WidgetPosition -> FlexibleWidgetPosition 변환
    const widgetPos = oldPosition as WidgetPosition
    
    return {
      gridColumnStart: widgetPos.x,
      gridColumnEnd: widgetPos.x + widgetPos.width,
      gridRowStart: widgetPos.y,
      gridRowEnd: widgetPos.y + widgetPos.height,
      width: widgetPos.width,
      height: widgetPos.height
    }
  }

  // 역변환: FlexibleWidgetPosition -> WidgetPosition
  const convertToLegacyPosition = (
    position: FlexibleWidgetPosition
  ): WidgetPosition => {
    return {
      x: position.gridColumnStart,
      y: position.gridRowStart,
      width: position.width,
      height: position.height
    }
  }

  return {
    convertPosition,
    convertToLegacyPosition
  }
}

export default CompatibilityWrapper