'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
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

  // 반응형 컬럼 조정 
  // 데스크탑: 더 작은 위젯들을 많이 배치 가능
  // 태블릿/모바일: 적절한 크기로 조정
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.offsetWidth;
      let newColumns = 4; // 모바일 기본값
      
      if (width >= 1280) {
        newColumns = 12; // 데스크탑: 더 유연한 배치 가능
      } else if (width >= 768) {
        newColumns = 8; // 태블릿: 중간 크기
      }
      
      setColumns(newColumns);
      
      // 셀 크기 계산 (gap 고려) - 정사각형 유지
      const gap = 16; // 1rem
      const totalGaps = (newColumns - 1) * gap;
      const availableWidth = width - totalGaps - 32; // padding 고려
      const calculatedCellSize = Math.floor(availableWidth / newColumns);
      
      // 최대/최소 크기 제한
      const minCellSize = 60; // 최소 60px
      const maxCellSize = 120; // 최대 120px
      setCellSize(Math.min(maxCellSize, Math.max(minCellSize, calculatedCellSize)));
    };
    
    updateColumns();
    
    // ResizeObserver로 동적 크기 조정
    const resizeObserver = new ResizeObserver(updateColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  // CSS Grid 스타일 계산 - 정사각형 셀 유지
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
    gridAutoRows: `${cellSize}px`,
    gap: '1rem',
    padding: '1rem',
    position: 'relative',
    minHeight: '100vh',
    transition: 'all 0.3s ease',
    justifyContent: 'center', // 중앙 정렬
  };

  // 드롭 영역 하이라이트 (제거)
  const dropZoneStyle = {};

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

  // 마우스 Long Press 지원
  const handleMouseDown = (e: React.MouseEvent, widgetId: string) => {
    if (!isEditMode && onLongPressStart) {
      e.preventDefault();
      onLongPressStart(widgetId);
    }
  };

  const handleMouseUp = () => {
    if (onLongPressEnd) {
      onLongPressEnd();
    }
  };

  const handleMouseLeave = () => {
    if (onLongPressEnd) {
      onLongPressEnd();
    }
  };

  return (
    <div
      ref={containerRef}
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
              gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
              gridAutoRows: `${cellSize}px`,
              gap: '1rem',
              padding: '1rem',
              justifyContent: 'center',
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
            <div
              key={widget.id}
              style={getWidgetGridStyle(widget)}
              className={cn(
                'widget-grid-item',
                'relative',
                'touch-none', // 터치 스크롤 방지
                isEditMode && 'z-10'
              )}
              onPointerDown={(e) => handlePointerDown(e, widget.id)}
              onMouseDown={(e) => handleMouseDown(e, widget.id)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {React.cloneElement(child as React.ReactElement)}
            </div>
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