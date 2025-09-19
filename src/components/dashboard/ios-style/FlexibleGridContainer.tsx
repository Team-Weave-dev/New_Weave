'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { IOSStyleWidget } from '@/types/ios-dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlexibleGridContainerProps {
  widgets: IOSStyleWidget[];
  isEditMode: boolean;
  onLongPressStart?: (widgetId: string) => void;
  onLongPressEnd?: () => void;
  children: ReactNode;
  className?: string;
}

export function FlexibleGridContainer({
  widgets,
  isEditMode,
  onLongPressStart,
  onLongPressEnd,
  children,
  className,
}: FlexibleGridContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4); // 기본 4컬럼
  const [cellSize, setCellSize] = useState(0);
  
  // Droppable 영역 설정
  const { setNodeRef, isOver } = useDroppable({
    id: 'grid-container',
  });

  // 반응형 컬럼 조정
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.offsetWidth;
      let newColumns = 2; // 모바일 기본값
      
      if (width >= 1536) {
        newColumns = 8; // 2xl 화면
      } else if (width >= 1280) {
        newColumns = 6; // xl 화면
      } else if (width >= 768) {
        newColumns = 4; // 태블릿
      }
      
      setColumns(newColumns);
      
      // 셀 크기 계산 (gap 고려)
      const gap = 16; // 1rem
      const totalGaps = (newColumns - 1) * gap;
      const availableWidth = width - totalGaps - 32; // padding 고려
      setCellSize(Math.floor(availableWidth / newColumns));
    };
    
    updateColumns();
    
    // ResizeObserver로 동적 크기 조정
    const resizeObserver = new ResizeObserver(updateColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  // CSS Grid 스타일 계산
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridAutoRows: `${cellSize}px`,
    gap: '1rem',
    padding: '1rem',
    position: 'relative',
    minHeight: '100vh',
    transition: 'all 0.3s ease',
  };

  // 드롭 영역 하이라이트
  const dropZoneStyle = isOver && isEditMode ? {
    backgroundColor: 'rgba(var(--color-primary), 0.05)',
    borderRadius: '0.5rem',
    transition: 'background-color 0.2s ease',
  } : {};

  // 위젯 위치 계산 (CSS Grid 속성)
  const getWidgetGridStyle = (widget: IOSStyleWidget): React.CSSProperties => {
    const { position, size } = widget;
    
    // FlexibleWidgetPosition을 CSS Grid 속성으로 변환
    if ('gridColumn' in position && 'gridRow' in position) {
      return {
        gridColumn: position.gridColumn,
        gridRow: position.gridRow,
        minWidth: 0,
        minHeight: 0,
      };
    }
    
    // 레거시 row/col 포지션 처리
    if ('row' in position && 'col' in position) {
      const col = position.col + 1; // CSS Grid는 1부터 시작
      const row = position.row + 1;
      const colSpan = size?.width || 2;
      const rowSpan = size?.height || 2;
      
      return {
        gridColumn: `${col} / span ${colSpan}`,
        gridRow: `${row} / span ${rowSpan}`,
        minWidth: 0,
        minHeight: 0,
      };
    }
    
    return {};
  };

  // 터치/마우스 이벤트 처리
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

  const handlePointerCancel = () => {
    if (onLongPressEnd) {
      onLongPressEnd();
    }
  };

  return (
    <div
      ref={(node) => {
        containerRef.current = node as HTMLDivElement;
        setNodeRef(node);
      }}
      className={cn(
        'flexible-grid-container',
        'w-full',
        'bg-background',
        isEditMode && 'edit-mode',
        className
      )}
      style={{ ...gridStyle, ...dropZoneStyle }}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* 그리드 가이드라인 (편집 모드에서만 표시) */}
      {isEditMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="grid h-full opacity-10"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gridAutoRows: `${cellSize}px`,
              gap: '1rem',
              padding: '1rem',
            }}
          >
            {Array.from({ length: columns * Math.ceil(800 / cellSize) }).map((_, index) => (
              <div
                key={index}
                className="border border-dashed border-primary rounded"
              />
            ))}
          </div>
        </div>
      )}

      {/* 위젯 렌더링 */}
      <AnimatePresence>
        {React.Children.map(children, (child, index) => {
          const widget = widgets[index];
          if (!widget || !React.isValidElement(child)) return null;
          
          return (
            <motion.div
              key={widget.id}
              style={getWidgetGridStyle(widget)}
              initial={false}
              animate={{
                x: 0,
                y: 0,
                scale: 1,
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
              }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
              }}
              className={cn(
                'widget-grid-item',
                'relative',
                'touch-none', // 터치 스크롤 방지
                isEditMode && 'z-10'
              )}
              onPointerDown={(e) => handlePointerDown(e, widget.id)}
            >
              {React.cloneElement(child as React.ReactElement)}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* 빈 공간 표시 (편집 모드) */}
      {isEditMode && widgets.length === 0 && (
        <div className="col-span-full row-span-2 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">위젯이 없습니다</p>
            <p className="text-sm">+ 버튼을 눌러 위젯을 추가하세요</p>
          </div>
        </div>
      )}

      {/* 드롭 존 인디케이터 */}
      {isOver && isEditMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="h-full w-full rounded-lg border-2 border-dashed border-primary opacity-30" />
        </motion.div>
      )}

      {/* 디버그 정보 (개발 모드) */}
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