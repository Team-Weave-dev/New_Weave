'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { IOSStyleWidget } from '@/types/ios-dashboard';
import { cn } from '@/lib/utils';
import { X, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { iosWidgetRegistry } from '@/lib/dashboard/ios-widget-registry';
import { WidgetSkeleton } from '@/components/dashboard/WidgetSkeleton';

interface SortableWidgetProps {
  widget: IOSStyleWidget;
  isEditing: boolean;
  isWiggling: boolean;
  isDragging?: boolean;
  onDelete: () => void;
  onConfig: () => void;
  className?: string;
}

export function SortableWidget({
  widget,
  isEditing,
  isWiggling,
  isDragging = false,
  onDelete,
  onConfig,
  className,
}: SortableWidgetProps) {
  // 위젯 컨텐츠 렌더링
  const renderWidgetContent = () => {
    // iOS 위젯 레지스트리에서 실제 컴포넌트 가져오기
    const WidgetComponent = iosWidgetRegistry.getWidget(widget.type);
    
    if (!WidgetComponent) {
      // 임시 기본 위젯 렌더링
      return (
        <Card className="w-full h-full p-4 bg-card border shadow-sm">
          <div className="flex flex-col h-full">
            <h3 className="font-semibold text-lg mb-2">{widget.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">타입: {widget.type}</p>
            <div className="flex-1 bg-muted/20 rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">
                {widget.type === 'stats' && '📊 통계 데이터'}
                {widget.type === 'chart' && '📈 차트 데이터'}
                {widget.type === 'quick-action' && '⚡ 빠른 작업'}
                {widget.type === 'timeline' && '📅 타임라인'}
                {widget.type === 'indicator' && '🔔 상태 표시기'}
                {!['stats', 'chart', 'quick-action', 'timeline', 'indicator'].includes(widget.type) && '위젯 콘텐츠'}
              </span>
            </div>
            {widget.size && (
              <div className="mt-2 text-xs text-muted-foreground">
                크기: {widget.size.width}x{widget.size.height}
              </div>
            )}
          </div>
        </Card>
      );
    }

    // iOS 위젯 props 준비
    const widgetProps = {
      id: widget.id,
      type: widget.type,
      title: widget.title,
      config: widget.config,
      data: widget.data,
      isEditMode: isEditing,
      size: { 
        width: widget.size?.width || 2, 
        height: widget.size?.height || 2 
      },
      position: {
        x: widget.position?.x || 0,
        y: widget.position?.y || 0
      }
    };

    return (
      <Suspense fallback={<WidgetSkeleton />}>
        <WidgetComponent {...widgetProps} />
      </Suspense>
    );
  };

  return (
    <div
      className={cn(
        'sortable-widget',
        'relative',
        'w-full h-full',
        isEditing && 'cursor-grab',
        className
      )}
    >
      <motion.div
        className="w-full h-full"
        animate={isWiggling ? {
          rotate: [0, -1, 1, -1, 1, 0],
          transition: {
            duration: 0.25,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: Math.random() * 0.2,
          }
        } : {
          rotate: 0,
          transition: {
            duration: 0.2,
            ease: "easeOut"
          }
        }}
      >
        {/* 위젯 컨텐츠 */}
        <div className={cn(
          'widget-content',
          'w-full h-full',
          isDragging && 'scale-105'
        )}>
          {renderWidgetContent()}
        </div>

        {/* 편집 모드 버튼들 */}
        {isEditing && !isDragging && (
          <>
            {/* 삭제 버튼 */}
            <motion.div
              className="absolute -top-2 -left-2 z-20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete();
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
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>

            {/* 설정 버튼 */}
            <motion.div
              className="absolute -top-2 -right-2 z-20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onConfig();
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
              >
                <Settings className="h-3 w-3" />
              </button>
            </motion.div>
          </>
        )}

        {/* 편집 모드 테두리 */}
        {isEditing && !isDragging && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={cn(
              'w-full h-full',
              'rounded-lg',
              'border-2 border-dashed',
              'border-primary/30'
            )} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}