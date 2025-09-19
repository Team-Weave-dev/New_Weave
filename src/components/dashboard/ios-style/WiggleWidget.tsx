'use client';

import React, { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSStyleWidget } from '@/types/ios-dashboard';
import { wiggleAnimation, deleteButtonAnimation, settingsButtonAnimation } from '@/lib/dashboard/ios-animations/animations';
import { cn } from '@/lib/utils';
import { X, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

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
  // Draggable 설정
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isLocalDragging,
  } = useDraggable({
    id: widget.id,
    disabled: !isEditing,
  });

  // 드래그 트랜스폼 스타일
  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Wiggle 애니메이션 variants
  const wiggleVariants = useMemo(() => {
    if (isWiggling && isEditing && !isDragging) {
      // 위젯마다 약간 다른 애니메이션 타이밍 적용
      const delay = Math.random() * 0.2;
      return {
        ...wiggleAnimation,
        wiggle: {
          ...wiggleAnimation.wiggle,
          transition: {
            ...wiggleAnimation.wiggle.transition,
            delay,
          },
        },
      };
    }
    return {};
  }, [isWiggling, isEditing, isDragging]);

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

  return (
    <motion.div
      ref={setNodeRef}
      style={dragStyle}
      className={cn(
        'wiggle-widget',
        'relative',
        'w-full h-full',
        isDragging && 'z-50',
        isLocalDragging && 'opacity-50',
        className
      )}
      variants={wiggleVariants}
      initial="initial"
      animate={isWiggling && !isDragging ? "wiggle" : "initial"}
      exit="exit"
      {...(isEditing ? { ...attributes, ...listeners } : {})}
    >
      {/* 위젯 컨텐츠 */}
      <div className={cn(
        'widget-content',
        'w-full h-full',
        'transition-transform duration-200',
        isEditing && 'cursor-move',
        isDragging && 'scale-105'
      )}>
        {renderWidgetContent()}
      </div>

      {/* 편집 모드 오버레이 */}
      <AnimatePresence>
        {isEditing && !isDragging && (
          <>
            {/* 삭제 버튼 */}
            <motion.div
              className="absolute -top-2 -left-2 z-20"
              variants={deleteButtonAnimation}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete();
                }}
                variant="destructive"
                size="sm"
                className={cn(
                  'rounded-full',
                  'w-7 h-7',
                  'p-0',
                  'shadow-lg',
                  'hover:scale-110',
                  'transition-transform'
                )}
                aria-label="위젯 삭제"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* 설정 버튼 */}
            <motion.div
              className="absolute -top-2 -right-2 z-20"
              variants={settingsButtonAnimation}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onConfig();
                }}
                variant="outline"
                size="sm"
                className={cn(
                  'rounded-full',
                  'w-7 h-7',
                  'p-0',
                  'shadow-lg',
                  'hover:scale-110',
                  'transition-transform',
                  'bg-background'
                )}
                aria-label="위젯 설정"
              >
                <Settings className="h-3 w-3" />
              </Button>
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
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded text-xs font-medium">
            잠김
          </div>
        </div>
      )}
    </motion.div>
  );
}