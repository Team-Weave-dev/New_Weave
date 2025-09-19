'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { IOSStyleWidget } from '@/types/ios-dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SortableGridContainerProps {
  widgets: IOSStyleWidget[];
  isEditMode: boolean;
  onLongPressStart?: (widgetId: string) => void;
  onLongPressEnd?: () => void;
  children: ReactNode;
  className?: string;
}

export function SortableGridContainer({
  widgets,
  isEditMode,
  onLongPressStart,
  onLongPressEnd,
  children,
  className,
}: SortableGridContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  const [cellSize, setCellSize] = useState(100);

  // 반응형 컬럼 조정
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.offsetWidth;
      let newColumns = 4; // 모바일 기본값
      
      if (width >= 1280) {
        newColumns = 6; // 데스크탑
      } else if (width >= 768) {
        newColumns = 4; // 태블릿
      } else {
        newColumns = 3; // 모바일
      }
      
      setColumns(newColumns);
      
      // 셀 크기 계산
      const gap = 16;
      const padding = 32;
      const totalGaps = (newColumns - 1) * gap;
      const availableWidth = width - totalGaps - padding;
      const calculatedCellSize = Math.floor(availableWidth / newColumns);
      
      // 크기 제한
      const minCellSize = 80;
      const maxCellSize = 150;
      setCellSize(Math.min(maxCellSize, Math.max(minCellSize, calculatedCellSize)));
    };
    
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Long Press 핸들러
  const handlePointerDown = (e: React.PointerEvent, widgetId: string) => {
    if (!isEditMode && onLongPressStart) {
      e.preventDefault();
      onLongPressStart(widgetId);
    }
  };

  const handlePointerUp = () => {
    if (onLongPressEnd) {
      onLongPressEnd();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'sortable-grid-container',
        'w-full min-h-screen',
        'bg-background',
        'p-4',
        isEditMode && 'edit-mode',
        className
      )}
      onPointerUp={handlePointerUp}
    >
      {/* Flexbox 그리드 레이아웃 */}
      <div 
        className="flex flex-wrap gap-4 justify-center"
        style={{
          maxWidth: `${columns * cellSize + (columns - 1) * 16}px`,
          margin: '0 auto',
        }}
      >
        {React.Children.map(children, (child, index) => {
          const widget = widgets[index];
          if (!widget || !React.isValidElement(child)) return null;
          
          // 위젯 크기 계산
          const widgetWidth = (widget.size?.width || 1) * cellSize + ((widget.size?.width || 1) - 1) * 16;
          const widgetHeight = (widget.size?.height || 1) * cellSize + ((widget.size?.height || 1) - 1) * 16;
          
          return (
            <div
              key={widget.id}
              className="widget-wrapper"
              style={{
                width: `${widgetWidth}px`,
                height: `${widgetHeight}px`,
                flexShrink: 0,
              }}
              onPointerDown={(e) => handlePointerDown(e, widget.id)}
            >
              {React.cloneElement(child as React.ReactElement)}
            </div>
          );
        })}
      </div>

      {/* 편집 모드 그리드 가이드 */}
      {isEditMode && (
        <div className="fixed inset-0 pointer-events-none opacity-5">
          <div 
            className="grid h-full"
            style={{
              gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
              gridAutoRows: `${cellSize}px`,
              gap: '1rem',
              padding: '1rem',
              justifyContent: 'center',
            }}
          >
            {Array.from({ length: columns * 10 }).map((_, index) => (
              <div
                key={index}
                className="border border-dashed border-primary rounded"
              />
            ))}
          </div>
        </div>
      )}

      {/* 빈 공간 표시 (편집 모드) */}
      {isEditMode && widgets.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">위젯이 없습니다</p>
            <p className="text-sm">+ 버튼을 눌러 위젯을 추가하세요</p>
          </div>
        </div>
      )}

      {/* 디버그 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur p-2 rounded text-xs text-muted-foreground">
          <div>Columns: {columns}</div>
          <div>Cell Size: {cellSize}px</div>
          <div>Widgets: {widgets.length}</div>
          <div>Edit Mode: {isEditMode ? 'ON' : 'OFF'}</div>
        </div>
      )}
    </div>
  );
}