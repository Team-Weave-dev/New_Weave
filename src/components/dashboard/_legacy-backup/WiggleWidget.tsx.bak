'use client';

import React, { useMemo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSStyleWidget } from '@/types/ios-dashboard';
import { wiggleAnimation, deleteButtonAnimation, settingsButtonAnimation } from '@/lib/dashboard/ios-animations/animations';
import { cn } from '@/lib/utils';
import { X, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CompatibilityWrapper, useCompatibilityMode } from './CompatibilityWrapper';
import { useAnimationPerformance } from '@/hooks/useAnimationPerformance';
// import Button from '../../ui/Button'; // 임시 주석 처리

interface WiggleWidgetProps {
  widget: IOSStyleWidget;
  isEditing: boolean;
  isWiggling: boolean;
  isDragging: boolean;
  onDelete: () => void;
  onConfig: () => void;
  className?: string;
}

export function WiggleWidget({
  widget,
  isEditing,
  isWiggling,
  isDragging,
  onDelete,
  onConfig,
  className,
}: WiggleWidgetProps) {
  // 애니메이션 성능 최적화
  const { 
    getWidgetStyles, 
    getAnimationPreset,
    scheduleAnimation,
    performanceLevel 
  } = useAnimationPerformance({
    enabled: true,
    autoOptimize: true
  });

  // Draggable 설정
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging: isLocalDragging,
  } = useDraggable({
    id: widget.id,
    disabled: !isEditing,
    data: {
      widget,
    },
  });
  
  // Droppable 설정 (다른 위젯을 이 위젯 위로 드롭할 수 있음)
  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: widget.id,
    disabled: !isEditing,
    data: {
      widget,
    },
  });
  
  // 두 ref를 합치기
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  // 드래그 트랜스폼 스타일 - transform이 있으면 항상 적용 (드래그 중일 때)
  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isLocalDragging ? 1000 : 1,
    position: 'relative' as const,
  } : undefined;

  // Wiggle 애니메이션 variants (성능 최적화 적용)
  const wiggleVariants = useMemo(() => {
    if (isWiggling && isEditing && !isDragging) {
      // 성능 레벨에 따른 애니메이션 조정
      const preset = getAnimationPreset('wiggle');
      
      if (performanceLevel === 'low') {
        // 낮은 성능: 애니메이션 비활성화
        return {};
      }
      
      // 위젯마다 약간 다른 애니메이션 타이밍 적용
      const delay = Math.random() * 0.2;
      return {
        ...preset,
        animate: {
          ...preset.animate,
          transition: {
            ...preset.transition,
            delay,
          },
        },
      };
    }
    return {};
  }, [isWiggling, isEditing, isDragging, getAnimationPreset, performanceLevel]);

  // 위젯 컨텐츠 렌더링
  const renderWidgetContent = () => {
    // 실제 위젯 컴포넌트를 동적으로 로드하고 렌더링
    // 여기서는 임시로 기본 카드 컨텐츠를 표시
    return (
      <Card className="w-full h-full p-4">
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-2">{widget.title}</h3>
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {widget.type}
          </div>
        </div>
      </Card>
    );
  };

  // 최적화된 스타일 결합
  const optimizedStyle = useMemo(() => ({
    ...dragStyle,
    ...getWidgetStyles(isWiggling || isDragging),
  }), [dragStyle, getWidgetStyles, isWiggling, isDragging]);

  return (
    <motion.div
      ref={setNodeRef}
      style={optimizedStyle}
      className={cn(
        'wiggle-widget',
        'relative',
        'w-full h-full',
        isDragging && 'z-50',
        isLocalDragging && 'opacity-50',
        isOver && 'ring-2 ring-primary ring-opacity-50',
        className
      )}
      variants={wiggleVariants}
      initial="initial"
      animate={isWiggling && !isDragging ? "wiggle" : "initial"}
      exit="exit"
      role="article"
      aria-label={`위젯: ${widget.title}`}
      aria-describedby={`위젯 타입: ${widget.type}`}
      aria-grabbed={isDragging}
      tabIndex={isEditing ? 0 : -1}
      {...(isEditing ? { ...attributes, ...listeners } : {})}
    >
      {/* 위젯 컨텐츠 */}
      <div className={cn(
        'widget-content',
        'w-full h-full',
        'transition-transform duration-200',
        isEditing && 'cursor-move',
        isDragging && 'scale-105'
      )}
      role="region"
      aria-label={`${widget.title} 컨텐츠`}
      >
        {renderWidgetContent()}
      </div>

      {/* 편집 모드 오버레이 */}
      <AnimatePresence>
        {isEditing && !isDragging && (
          <>
            {/* 삭제 버튼 */}
            <motion.div
              className="absolute -top-2 -left-2 z-20"
              variants={performanceLevel === 'low' ? {} : deleteButtonAnimation}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  scheduleAnimation('delete-' + widget.id, onDelete);
                }}
                className={cn(
                  'rounded-full',
                  'w-7 h-7',
                  'p-0',
                  'shadow-lg',
                  'hover:scale-110',
                  'transition-transform',
                  'bg-red-600 text-white border border-red-600',
                  'flex items-center justify-center',
                  'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                )}
                aria-label={`${widget.title} 위젯 삭제`}
                role="button"
                tabIndex={0}
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>

            {/* 설정 버튼 */}
            <motion.div
              className="absolute -top-2 -right-2 z-20"
              variants={performanceLevel === 'low' ? {} : settingsButtonAnimation}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  scheduleAnimation('config-' + widget.id, onConfig);
                }}
                className={cn(
                  'rounded-full',
                  'w-7 h-7',
                  'p-0',
                  'shadow-lg',
                  'hover:scale-110',
                  'transition-transform',
                  'bg-white text-gray-600 border border-gray-300',
                  'flex items-center justify-center',
                  'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                )}
                aria-label={`${widget.title} 위젯 설정`}
                role="button"
                tabIndex={0}
              >
                <Settings className="h-3 w-3" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 드래그 중 그림자 효과 */}
      {isDragging && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          initial={{ boxShadow: '0 0 0 rgba(0,0,0,0)' }}
          animate={{ 
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)' 
          }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* 편집 모드 테두리 */}
      {isEditing && !isDragging && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className={cn(
            'w-full h-full',
            'rounded-lg',
            'border-2 border-dashed',
            'border-primary/30'
          )} />
        </motion.div>
      )}

      {/* 잠금 표시 */}
      {widget.isLocked && isEditing && (
        <div className="absolute top-2 right-2 z-10" role="status" aria-live="polite">
          <div className="bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded text-xs font-medium">
            <span aria-label="이 위젯은 잠겨있습니다">잠김</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}