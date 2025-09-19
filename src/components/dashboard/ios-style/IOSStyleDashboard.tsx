'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent, 
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useIOSAnimations } from '@/lib/dashboard/ios-animations/useIOSAnimations';
import { AnimationController } from '@/lib/dashboard/ios-animations/AnimationController';
import { FlexibleGridEngine } from '@/lib/dashboard/flexible-grid/FlexibleGridEngine';
import { IOSStyleWidget, EditModeState, LayoutTemplate } from '@/types/ios-dashboard';
import { useDashboardStore } from '@/lib/stores/dashboardStore';
import { SortableGridContainer } from './SortableGridContainer';
import { SortableWidget } from './SortableWidget';
import { EditModeToolbar } from './EditModeToolbar';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { useIOSTouchInteraction } from '@/hooks/useIOSTouchInteraction';

interface IOSStyleDashboardProps {
  widgets?: IOSStyleWidget[];
  onLayoutChange?: (widgets: IOSStyleWidget[]) => void;
  enableFeatureFlag?: boolean;
}

export function IOSStyleDashboard({
  widgets: initialWidgets = [],
  onLayoutChange,
  enableFeatureFlag = true,
}: IOSStyleDashboardProps) {
  const { showToast } = useToast();
  const animationController = useRef(new AnimationController());
  // 고정 그리드 크기 제거 - 위젯별 개별 크기 지원
  const [gridColumns, setGridColumns] = useState(12); // 12컬럼 그리드로 유연한 배치
  const [gridEngine] = useState(() => new FlexibleGridEngine({
    columns: 12, // 12 컬럼 그리드 (더 유연한 배치)
    rowHeight: 100,
    gap: 16,
    padding: 16,
    containerWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
    breakpoints: {
      sm: { columns: 4, maxWidth: 640 },  // 모바일
      md: { columns: 8, maxWidth: 768 },  // 태블릿
      lg: { columns: 12, maxWidth: 1280 }, // 데스크탑
    },
  }));
  
  // 편집 모드 상태
  const [editMode, setEditMode] = useState<EditModeState>({
    isEditing: false,
    selectedWidget: null,
    isDragging: false,
    draggedWidget: null,
  });
  
  // 반응형 그리드 컬럼 설정
  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setGridColumns(4); // 모바일
      } else if (width < 1024) {
        setGridColumns(8); // 태블릿
      } else {
        setGridColumns(12); // 데스크탑
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);
  
  // 위젯 상태 (테스트용 샘플 위젯 - 반응형 크기)
  const [widgets, setWidgets] = useState<IOSStyleWidget[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // DnD sensors 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  useEffect(() => {
    if (initialWidgets.length > 0) {
      // initialWidgets이 있으면 그대로 사용 (개별 크기 유지)
      setWidgets(initialWidgets);
    } else {
      // 테스트 위젯 - 다양한 크기로 생성
      const testWidgets: IOSStyleWidget[] = [];
      
      // 다양한 크기의 위젯들
      // 2x2 크기 위젯
      testWidgets.push({
        id: `test-widget-1`,
        type: 'stats',
        title: `통계 대시보드`,
        position: {
          gridColumn: `1 / span 2`,
          gridRow: `1 / span 2`,
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
      });
      
      // 4x2 크기 차트
      testWidgets.push({
        id: `test-widget-2`,
        type: 'chart',
        title: `주간 트렌드 차트`,
        position: {
          gridColumn: `3 / span 4`,
          gridRow: `1 / span 2`,
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
      });
      
      // 2x1 크기 위젯들
      testWidgets.push({
        id: `test-widget-3`,
        type: 'quick-action',
        title: `빠른 작업`,
        position: {
          gridColumn: `7 / span 2`,
          gridRow: `1 / span 1`,
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
      });
      
      // 4x1 크기 타임라인
      testWidgets.push({
        id: `test-widget-4`,
        type: 'timeline',
        title: `타임라인`,
        position: {
          gridColumn: `1 / span 4`,
          gridRow: `3 / span 1`,
          gridColumnStart: 1,
          gridColumnEnd: 5,
          gridRowStart: 3,
          gridRowEnd: 4,
          width: 4,
          height: 1,
        },
        size: { width: 4, height: 1 },
        data: {},
        style: {},
        isLocked: false,
      });
      
      // 1x1 크기 미니 위젯
      testWidgets.push({
        id: `test-widget-5`,
        type: 'indicator',
        title: `상태`,
        position: {
          gridColumn: `9 / span 1`,
          gridRow: `1 / span 1`,
          gridColumnStart: 9,
          gridColumnEnd: 10,
          gridRowStart: 1,
          gridRowEnd: 2,
          width: 1,
          height: 1,
        },
        size: { width: 1, height: 1 },
        data: {},
        style: {},
        isLocked: false,
      });
      
      console.log('[Widget Setup] Test widgets created with various sizes:', testWidgets.length);
      setWidgets(testWidgets);
    }
  }, [initialWidgets]);
  
  // 애니메이션 훅 사용
  const [animationState, animationActions, animationControls] = useIOSAnimations();
  const { isWiggling } = animationState;
  const { startWiggle, stopWiggle } = animationActions;
  
  // Long Press 감지를 위한 타이머
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  // GridEngine과 위젯 동기화
  useEffect(() => {
    gridEngine.setWidgets(widgets);
  }, [widgets, gridEngine]);
  
  // Feature Flag 체크
  console.log('[IOSStyleDashboard] Component rendered with enableFeatureFlag:', enableFeatureFlag);
  console.log('[IOSStyleDashboard] Initial widgets:', initialWidgets);
  console.log('[IOSStyleDashboard] Current widgets:', widgets);
  
  if (!enableFeatureFlag) {
    console.log('[IOSStyleDashboard] Feature flag is false, returning null');
    // 기존 대시보드로 폴백
    return null;
  }

  // 편집 모드 진입 (Long Press)
  const handleLongPressStart = useCallback((widgetId: string) => {
    setIsPressing(true);
    longPressTimer.current = setTimeout(() => {
      // 편집 모드 진입 애니메이션 - 전체 대시보드에 pulse 효과
      animationController.current.pulse('dashboard-container', 1.02);
      
      setEditMode(prev => ({
        ...prev,
        isEditing: true,
        selectedWidget: widgetId,
      }));
      
      // Wiggle 애니메이션 시작
      startWiggle();
      
      // 햅틱 피드백 시뮬레이션
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      showToast({
        title: '편집 모드',
        description: '위젯을 드래그하여 재배치할 수 있습니다',
        type: 'info',
      });
    }, 1000); // 1초 Long Press
  }, [startWiggle, showToast]);

  const handleLongPressEnd = useCallback(() => {
    setIsPressing(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // 편집 모드 종료
  const handleExitEditMode = useCallback(async () => {
    // Phase 3: 편집 모드 종료 시 스마트 자동 정렬
    console.log('[Phase 3] 편집 모드 종료 - 스마트 자동 정렬 실행');
    
    // 위젯들을 정렬된 그리드로 재배치 (빈 공간 최소화)
    const sortedWidgets = [...widgets].sort((a, b) => {
      // 위에서부터 아래로, 왼쪽에서 오른쪽으로 정렬
      const aRow = a.position.gridRowStart || 1;
      const bRow = b.position.gridRowStart || 1;
      const aCol = a.position.gridColumnStart || 1;
      const bCol = b.position.gridColumnStart || 1;
      
      if (aRow !== bRow) {
        return aRow - bRow;
      }
      return aCol - bCol;
    });
    
    let currentRow = 1;
    let currentCol = 1;
    let maxRowHeight = 0;
    const rowHeights: number[] = [0]; // 각 행의 높이 추적
    
    const alignedWidgets = sortedWidgets.map(widget => {
      const width = widget.size?.width || 2;
      const height = widget.size?.height || 2;
      
      // 현재 행에 위젯이 들어갈 공간이 없으면 다음 행으로
      if (currentCol + width > 13) {
        currentRow += maxRowHeight;
        currentCol = 1;
        maxRowHeight = 0;
      }
      
      // 위치 설정
      const position = {
        gridColumn: `${currentCol} / span ${width}`,
        gridRow: `${currentRow} / span ${height}`,
        gridColumnStart: currentCol,
        gridColumnEnd: currentCol + width,
        gridRowStart: currentRow,
        gridRowEnd: currentRow + height,
        width: width,
        height: height,
      };
      
      // 다음 위젯을 위한 위치 업데이트
      currentCol += width;
      maxRowHeight = Math.max(maxRowHeight, height);
      
      return {
        ...widget,
        position,
      };
    });
    
    setWidgets(alignedWidgets);
    gridEngine.setWidgets(alignedWidgets);
    
    // 편집 모드 종료 애니메이션 - scale 효과로 정리 느낌
    animationController.current.scale('dashboard-container', 1.0);
    
    setEditMode({
      isEditing: false,
      selectedWidget: null,
      isDragging: false,
      draggedWidget: null,
    });
    
    stopWiggle();
    
    // 레이아웃 저장
    if (onLayoutChange) {
      onLayoutChange(alignedWidgets);
    }
    
    showToast({
      title: '편집 완료',
      description: '레이아웃이 저장되었습니다',
      type: 'success',
    });
  }, [stopWiggle, widgets, onLayoutChange, showToast, gridEngine]);

  // 편집 모드 취소
  const handleCancelEditMode = useCallback(() => {
    // 원래 레이아웃으로 복원
    setWidgets(initialWidgets);
    handleExitEditMode();
  }, [initialWidgets, handleExitEditMode]);

  // 드래그 시작
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setEditMode(prev => ({
      ...prev,
      isDragging: true,
      draggedWidget: event.active.id as string,
    }));
    
    console.log('[DnD] 드래그 시작:', event.active.id);
  }, []);
  

  // 드래그 종료 - arrayMove로 순서 변경 및 위치 재계산
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // 위젯 순서 변경
        const reorderedWidgets = arrayMove(widgets, oldIndex, newIndex);
        
        // 그리드 위치 재계산
        const updatedWidgets = reorderedWidgets.map((widget, index) => {
          // 간단한 그리드 레이아웃 계산 (3열 또는 4열)
          const columns = window.innerWidth >= 768 ? 4 : 3;
          const row = Math.floor(index / columns);
          const col = index % columns;
          
          return {
            ...widget,
            position: {
              gridColumn: `${col + 1} / span ${widget.size?.width || 1}`,
              gridRow: `${row + 1} / span ${widget.size?.height || 1}`,
              gridColumnStart: col + 1,
              gridColumnEnd: col + 1 + (widget.size?.width || 1),
              gridRowStart: row + 1,
              gridRowEnd: row + 1 + (widget.size?.height || 1),
              width: widget.size?.width || 1,
              height: widget.size?.height || 1,
            },
          };
        });
        
        setWidgets(updatedWidgets);
        
        console.log('[DnD] 위젯 순서 변경 및 위치 재계산:', oldIndex, '->', newIndex);
        
        showToast({
          title: '위젯 이동',
          description: '위젯이 새로운 위치로 이동했습니다',
          type: 'success',
        });
      }
    }
    
    setActiveId(null);
    setEditMode(prev => ({
      ...prev,
      isDragging: false,
      draggedWidget: null,
    }));
  }, [widgets, showToast]);

  // 위젯 삭제
  const handleDeleteWidget = useCallback(async (widgetId: string) => {
    // 위젯 삭제 애니메이션 - 축소하며 페이드아웃
    animationController.current.scale(`widget-${widgetId}`, 0.1);
    animationController.current.fadeOut(`widget-${widgetId}`, 0.2);
    
    // 위젯 제거
    const filtered = widgets.filter(w => w.id !== widgetId);
    
    // Phase 3: 삭제 후 스마트 재배치
    console.log('[Phase 3] 위젯 삭제 후 스마트 재배치 실행');
    gridEngine.setWidgets(filtered);
    const reflowResult = await gridEngine.executeSmartReflow();
    
    if (reflowResult.success && reflowResult.widgets) {
      setWidgets(reflowResult.widgets);
    } else {
      // 스마트 재배치 실패 시 그냥 필터링된 위젯 사용
      setWidgets(filtered);
    }
    
    showToast({
      title: '위젯 삭제',
      description: '위젯이 삭제되었습니다',
      type: 'info',
    });
  }, [showToast, widgets, gridEngine]);

  // 위젯 설정
  const handleConfigWidget = useCallback((widgetId: string) => {
    // 위젯 설정 패널 열기
    showToast({
      title: '위젯 설정',
      description: '설정 패널이 곧 추가됩니다',
      type: 'info',
    });
  }, [showToast]);

  // 위젯 추가 (위젯 타입별 기본 크기 지원)
  const handleAddWidget = useCallback(async (widgetType: string) => {
    // Phase 3: 스마트 배치 시스템으로 최적 위치 찾기
    console.log('[Phase 3] 스마트 배치로 위젯 추가');
    
    // 위젯 타입별 기본 크기 설정
    const defaultSizes: Record<string, { width: number; height: number }> = {
      'stats': { width: 2, height: 2 },
      'chart': { width: 4, height: 2 },
      'timeline': { width: 4, height: 1 },
      'quick-action': { width: 2, height: 1 },
      'indicator': { width: 1, height: 1 },
      'default': { width: 2, height: 2 },
    };
    
    const widgetSize = defaultSizes[widgetType] || defaultSizes.default;
    
    const placementSuggestions = gridEngine.generateSmartPlacementSuggestions(
      widgetSize,
      5 // 최대 5개의 추천 위치
    );
    
    const bestPosition = placementSuggestions[0]?.position || 
                        gridEngine.findBestAvailablePosition(widgetSize.width, widgetSize.height);
    
    if (bestPosition) {
      const newWidget: IOSStyleWidget = {
        id: `widget-${Date.now()}`,
        type: widgetType,
        title: `새 ${widgetType} 위젯`,
        position: {
          ...bestPosition,
          gridColumn: `${bestPosition.gridColumnStart || 1} / span ${widgetSize.width}`,
          gridRow: `${bestPosition.gridRowStart || 1} / span ${widgetSize.height}`,
          width: widgetSize.width,
          height: widgetSize.height,
        },
        size: widgetSize,
        data: {},
        style: {},
        isLocked: false,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      
      // 위젯을 엔진에 추가하고 스마트 재배치 실행
      const updatedWidgets = [...widgets, newWidget];
      gridEngine.setWidgets(updatedWidgets);
      const reflowResult = await gridEngine.executeSmartReflow();
      
      if (reflowResult.success && reflowResult.widgets) {
        console.log('[Phase 3] 위젯 추가 후 스마트 재배치 성공');
        setWidgets(reflowResult.widgets);
      } else {
        setWidgets(updatedWidgets);
      }
      
      // 위젯 추가 애니메이션 - 나타날 때 scale up + fade in
      animationController.current.scale(`widget-${newWidget.id}`, 1.0);
      animationController.current.fadeIn(`widget-${newWidget.id}`, 0.3);
      
      showToast({
        title: '위젯 추가',
        description: '새 위젯이 추가되었습니다',
        type: 'success',
      });
    } else {
      showToast({
        title: '공간 부족',
        description: '위젯을 추가할 공간이 없습니다',
        type: 'error',
      });
    }
  }, [showToast, widgets, gridEngine]);

  // 레이아웃 템플릿 적용
  const handleApplyTemplate = useCallback((template: LayoutTemplate) => {
    const newLayout = template.widgets.map((w, index) => ({
      ...w,
      id: `widget-template-${index}-${Date.now()}`,
    }));
    
    setWidgets(newLayout);
    // 템플릿 적용 애니메이션 - 전체 대시보드 pulse 효과
    animationController.current.pulse('dashboard-container', 1.05);
    
    showToast({
      title: '템플릿 적용',
      description: `${template.name} 템플릿이 적용되었습니다`,
      type: 'success',
    });
  }, [showToast]);

  // ESC 키로 편집 모드 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editMode.isEditing) {
        handleExitEditMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode.isEditing, handleExitEditMode]);

  // AnimationController에 dashboard-container 등록
  useEffect(() => {
    const dashboardElement = document.getElementById('dashboard-container');
    if (dashboardElement && animationControls) {
      animationController.current.register('dashboard-container', animationControls);
    }
    
    return () => {
      animationController.current.unregister('dashboard-container');
    };
  }, [animationControls]);

  return (
    <div 
      id="dashboard-container"
      className="relative w-full h-full min-h-screen bg-background"
    >
      {/* 편집 모드 툴바 */}
      <AnimatePresence>
        {editMode.isEditing && (
          <EditModeToolbar
            onDone={handleExitEditMode}
            onCancel={handleCancelEditMode}
            onAddWidget={handleAddWidget}
            onApplyTemplate={handleApplyTemplate}
            isVisible={editMode.isEditing}
          />
        )}
      </AnimatePresence>

      {/* DnD Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          {/* 그리드 컨테이너 */}
          <SortableGridContainer
            widgets={widgets}
            isEditMode={editMode.isEditing}
            onLongPressStart={handleLongPressStart}
            onLongPressEnd={handleLongPressEnd}
          >
            {widgets.map(widget => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                isEditing={editMode.isEditing}
                isWiggling={isWiggling}
                onDelete={() => handleDeleteWidget(widget.id)}
                onConfig={() => handleConfigWidget(widget.id)}
              />
            ))}
          </SortableGridContainer>
        </SortableContext>

        {/* 드래그 오버레이 */}
        <DragOverlay>
          {activeId ? (
            <div className="opacity-80">
              <SortableWidget
                widget={widgets.find(w => w.id === activeId)!}
                isEditing={true}
                isWiggling={false}
                onDelete={() => {}}
                onConfig={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>


      {/* Long Press 인디케이터 */}
      <AnimatePresence>
        {isPressing && !editMode.isEditing && (
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