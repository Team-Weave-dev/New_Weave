'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { IOSStyleWidget } from '@/types/ios-dashboard';
import { cn } from '@/lib/utils';
import { X, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface SortableWidgetProps {
  widget: IOSStyleWidget;
  isEditing: boolean;
  isWiggling: boolean;
  onDelete: () => void;
  onConfig: () => void;
  className?: string;
}

export function SortableWidget({
  widget,
  isEditing,
  isWiggling,
  onDelete,
  onConfig,
  className,
}: SortableWidgetProps) {
  // 위젯 컨텐츠 렌더링
  const renderWidgetContent = () => {
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
        } : {}}
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