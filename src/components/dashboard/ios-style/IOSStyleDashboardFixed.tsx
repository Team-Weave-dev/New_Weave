'use client';

import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DragStart,
  resetServerContext,
} from '@hello-pangea/dnd';
import { IOSStyleWidget } from '@/types/ios-dashboard';
import { 
  useIOSDashboardStore,
  selectWidgets,
  selectEditMode,
  selectWiggling,
  shallow
} from '@/lib/stores/useIOSDashboardStore';
import { SortableWidget } from './SortableWidget';
import { EditModeToolbar } from './EditModeToolbar';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { initializeIOSWidgets } from '@/lib/dashboard/ios-widget-initializer';

interface IOSStyleDashboardFixedProps {
  widgets?: IOSStyleWidget[];
  onLayoutChange?: (widgets: IOSStyleWidget[]) => void;
}

export function IOSStyleDashboardFixed({
  widgets: initialWidgets = [],
  onLayoutChange,
}: IOSStyleDashboardFixedProps) {
  const { showToast } = useToast();
  const isInitializedRef = useRef(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // 스토어 구독 - 최적화된 선택자 사용
  const widgets = useIOSDashboardStore(selectWidgets);
  const isEditMode = useIOSDashboardStore(selectEditMode);
  const isWiggling = useIOSDashboardStore(selectWiggling);
  
  // 스토어 액션들 - 메모이제이션
  const storeActions = useMemo(() => ({
    setWidgets: useIOSDashboardStore.getState().setWidgets,
    updateWidget: useIOSDashboardStore.getState().updateWidget,
    removeWidget: useIOSDashboardStore.getState().removeWidget,
    addWidget: useIOSDashboardStore.getState().addWidget,
    enterEditMode: useIOSDashboardStore.getState().enterEditMode,
    exitEditMode: useIOSDashboardStore.getState().exitEditMode,
    moveWidget: useIOSDashboardStore.getState().moveWidget,
    setDraggedWidget: useIOSDashboardStore.getState().setDraggedWidget,
    selectWidget: useIOSDashboardStore.getState().selectWidget,
  }), []);
  
  // 로컬 상태
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [columns] = useState(4); // 기본 컬럼 수
  const [cellSize] = useState(120); // 기본 셀 크기
  
  // 초기 위젯 설정 - useRef를 사용하여 한 번만 실행
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    console.log('[IOSStyleDashboardFixed] Initializing widgets...');
    
    // react-beautiful-dnd SSR 초기화
    resetServerContext();
    
    // iOS 위젯 레지스트리 초기화
    initializeIOSWidgets().catch(console.error);
    
    if (initialWidgets.length > 0) {
      storeActions.setWidgets(initialWidgets);
    } else if (widgets.length === 0) {
      // 테스트 위젯 생성 (실제 데이터 타입 사용) - ID에 하이픈 대신 언더스코어 사용
      const testWidgets: IOSStyleWidget[] = [
        {
          id: 'widget_stats_1',
          type: 'stats',
          title: '통계 대시보드',
          position: {
            gridColumn: '1 / span 2',
            gridRow: '1 / span 2',
            gridColumnStart: 1,
            gridColumnEnd: 3,
            gridRowStart: 1,
            gridRowEnd: 3,
            width: 2,
            height: 2,
          },
          size: { width: 2, height: 2 },
          data: {},
          style: {},
          isLocked: false,
        },
        {
          id: 'widget_chart_1',
          type: 'chart',
          title: '주간 트렌드 차트',
          position: {
            gridColumn: '3 / span 4',
            gridRow: '1 / span 2',
            gridColumnStart: 3,
            gridColumnEnd: 7,
            gridRowStart: 1,
            gridRowEnd: 3,
            width: 4,
            height: 2,
          },
          size: { width: 4, height: 2 },
          data: {},
          style: {},
          isLocked: false,
        },
        {
          id: 'widget_quick_action_1',
          type: 'quick-action',
          title: '빠른 작업',
          position: {
            gridColumn: '7 / span 2',
            gridRow: '1 / span 1',
            gridColumnStart: 7,
            gridColumnEnd: 9,
            gridRowStart: 1,
            gridRowEnd: 2,
            width: 2,
            height: 1,
          },
          size: { width: 2, height: 1 },
          data: {},
          style: {},
          isLocked: false,
        },
      ];
      
      console.log('[IOSStyleDashboardFixed] Creating test widgets:', testWidgets.length);
      storeActions.setWidgets(testWidgets);
    }
    
    isInitializedRef.current = true;
  }, []); // 빈 의존성 배열 - 한 번만 실행
  
  // Long Press 감지 (편집 모드 진입)
  const handleLongPressStart = useCallback((widgetId: string) => {
    console.log('[IOSStyleDashboardFixed] Long press start:', widgetId);
    setIsPressing(true);
    
    longPressTimerRef.current = setTimeout(() => {
      storeActions.selectWidget(widgetId);
      storeActions.enterEditMode();
      
      // 햅틱 피드백
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      showToast({
        title: '편집 모드',
        description: '위젯을 드래그하여 재배치할 수 있습니다',
        type: 'info',
      });
    }, 1000); // 1초 Long Press
  }, [storeActions, showToast]);

  const handleLongPressEnd = useCallback(() => {
    console.log('[IOSStyleDashboardFixed] Long press end');
    setIsPressing(false);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // 편집 모드 종료
  const handleExitEditMode = useCallback(() => {
    console.log('[IOSStyleDashboardFixed] Exiting edit mode');
    storeActions.exitEditMode(true);
    
    // 레이아웃 저장
    if (onLayoutChange) {
      onLayoutChange(widgets);
    }
    
    showToast({
      title: '편집 완료',
      description: '레이아웃이 저장되었습니다',
      type: 'success',
    });
  }, [widgets, onLayoutChange, storeActions, showToast]);

  // 편집 모드 취소
  const handleCancelEditMode = useCallback(() => {
    console.log('[IOSStyleDashboardFixed] Canceling edit mode');
    storeActions.exitEditMode(false);
  }, [storeActions]);

  // 드래그 시작
  const handleDragStart = useCallback((start: DragStart) => {
    console.log('[IOSStyleDashboardFixed] Drag start:', start.draggableId);
    setActiveId(start.draggableId);
    storeActions.setDraggedWidget(start.draggableId);
  }, [storeActions]);

  // 드래그 종료
  const handleDragEnd = useCallback((result: DropResult) => {
    console.log('[IOSStyleDashboardFixed] Drag end:', result);
    
    if (!result.destination) {
      setActiveId(null);
      storeActions.setDraggedWidget(null);
      return;
    }
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex !== destinationIndex) {
      // 위젯 순서 변경
      const reorderedWidgets = Array.from(widgets);
      const [removed] = reorderedWidgets.splice(sourceIndex, 1);
      reorderedWidgets.splice(destinationIndex, 0, removed);
      
      // 위치 재계산 (간단한 그리드 배치)
      const updatedWidgets = reorderedWidgets.map((widget, index) => {
        const columns = 3;
        const row = Math.floor(index / columns) + 1;
        const col = (index % columns) + 1;
        
        return {
          ...widget,
          position: {
            ...widget.position,
            gridColumn: `${col} / span ${widget.size?.width || 1}`,
            gridRow: `${row} / span ${widget.size?.height || 1}`,
            gridColumnStart: col,
            gridColumnEnd: col + (widget.size?.width || 1),
            gridRowStart: row,
            gridRowEnd: row + (widget.size?.height || 1),
          },
        };
      });
      
      storeActions.setWidgets(updatedWidgets);
      
      showToast({
        title: '위젯 이동',
        description: '위젯이 새로운 위치로 이동했습니다',
        type: 'success',
      });
    }
    
    setActiveId(null);
    storeActions.setDraggedWidget(null);
  }, [widgets, storeActions, showToast]);

  // 위젯 삭제
  const handleDeleteWidget = useCallback((widgetId: string) => {
    console.log('[IOSStyleDashboardFixed] Deleting widget:', widgetId);
    storeActions.removeWidget(widgetId);
    
    showToast({
      title: '위젯 삭제',
      description: '위젯이 삭제되었습니다',
      type: 'info',
    });
  }, [storeActions, showToast]);

  // 위젯 설정
  const handleConfigWidget = useCallback((widgetId: string) => {
    console.log('[IOSStyleDashboardFixed] Config widget:', widgetId);
    showToast({
      title: '위젯 설정',
      description: '설정 패널이 곧 추가됩니다',
      type: 'info',
    });
  }, [showToast]);

  // 위젯 추가
  const handleAddWidget = useCallback((widgetType: string) => {
    console.log('[IOSStyleDashboardFixed] Adding widget:', widgetType);
    
    const newWidget: IOSStyleWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: `새 ${widgetType} 위젯`,
      position: {
        gridColumn: '1 / span 2',
        gridRow: '1 / span 2',
        gridColumnStart: 1,
        gridColumnEnd: 3,
        gridRowStart: 1,
        gridRowEnd: 3,
        width: 2,
        height: 2,
      },
      size: { width: 2, height: 2 },
      data: {},
      style: {},
      isLocked: false,
    };
    
    storeActions.addWidget(newWidget);
    
    showToast({
      title: '위젯 추가',
      description: '새 위젯이 추가되었습니다',
      type: 'success',
    });
  }, [storeActions, showToast]);

  // 템플릿 적용
  const handleApplyTemplate = useCallback((template: any) => {
    console.log('[IOSStyleDashboardFixed] Applying template:', template.name);
    
    const newLayout = template.widgets.map((w: any, index: number) => ({
      ...w,
      id: `widget-template-${index}-${Date.now()}`,
    }));
    
    storeActions.setWidgets(newLayout);
    
    showToast({
      title: '템플릿 적용',
      description: `${template.name} 템플릿이 적용되었습니다`,
      type: 'success',
    });
  }, [storeActions, showToast]);

  // 클라이언트 사이드 마운트 확인
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ESC 키로 편집 모드 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditMode) {
        handleExitEditMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, handleExitEditMode]);

  return (
    <div className="relative w-full h-full min-h-screen bg-background">
      {/* 편집 모드 툴바 */}
      <AnimatePresence>
        {isEditMode && (
          <EditModeToolbar
            onDone={handleExitEditMode}
            onCancel={handleCancelEditMode}
            onAddWidget={handleAddWidget}
            onApplyTemplate={handleApplyTemplate}
            isVisible={isEditMode}
          />
        )}
      </AnimatePresence>

      {/* 위젯 그리드 - 클라이언트 사이드에서만 DnD 렌더링 */}
      {isMounted ? (
        <DragDropContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Droppable droppableId="dashboard_grid" type="WIDGET">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'p-4 min-h-screen',
                snapshot.isDraggingOver && 'bg-muted/50'
              )}
            >
              {/* 그리드 컨테이너 - Draggable들의 직접 부모 */}
              <div 
                className="flex flex-wrap gap-4 justify-center"
                style={{
                  maxWidth: `${columns * cellSize + (columns - 1) * 16}px`,
                  margin: '0 auto',
                }}
              >
                {widgets.map((widget, index) => {
                  // 위젯 크기 계산
                  const widgetWidth = (widget.size?.width || 1) * cellSize + ((widget.size?.width || 1) - 1) * 16;
                  const widgetHeight = (widget.size?.height || 1) * cellSize + ((widget.size?.height || 1) - 1) * 16;
                  
                  return (
                    <Draggable
                      key={widget.id}
                      draggableId={widget.id}
                      index={index}
                      isDragDisabled={!isEditMode}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="widget-wrapper"
                          style={{
                            ...provided.draggableProps.style,
                            width: `${widgetWidth}px`,
                            height: `${widgetHeight}px`,
                            flexShrink: 0,
                            opacity: snapshot.isDragging ? 0.8 : 1,
                          }}
                          onPointerDown={(e) => {
                            if (!isEditMode) {
                              e.preventDefault();
                              handleLongPressStart(widget.id);
                            }
                          }}
                          onPointerUp={handleLongPressEnd}
                        >
                          <SortableWidget
                            widget={widget}
                            isEditing={isEditMode}
                            isWiggling={isWiggling}
                            isDragging={snapshot.isDragging}
                            onDelete={() => handleDeleteWidget(widget.id)}
                            onConfig={() => handleConfigWidget(widget.id)}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>

              {/* 편집 모드 그리드 가이드 */}
              {isEditMode && (
                <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
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
                <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur p-2 rounded text-xs text-muted-foreground z-50">
                  <div>Columns: {columns}</div>
                  <div>Cell Size: {cellSize}px</div>
                  <div>Widgets: {widgets.length}</div>
                  <div>Edit Mode: {isEditMode ? 'ON' : 'OFF'}</div>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      ) : (
        // 서버 사이드 렌더링 시 정적 컨텐츠
        <div className="p-4 min-h-screen">
          <div 
            className="flex flex-wrap gap-4 justify-center"
            style={{
              maxWidth: `${columns * cellSize + (columns - 1) * 16}px`,
              margin: '0 auto',
            }}
          >
            {widgets.map((widget) => {
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
                >
                  <SortableWidget
                    widget={widget}
                    isEditing={false}
                    isWiggling={false}
                    isDragging={false}
                    onDelete={() => {}}
                    onConfig={() => {}}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Long Press 인디케이터 */}
      <AnimatePresence>
        {isPressing && !isEditMode && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="w-16 h-16 rounded-full border-4 border-primary animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}