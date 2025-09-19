'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { useIOSAnimations } from '@/lib/dashboard/ios-animations/useIOSAnimations';
import { AnimationController } from '@/lib/dashboard/ios-animations/AnimationController';
import { FlexibleGridEngine } from '@/lib/dashboard/flexible-grid/FlexibleGridEngine';
import { IOSStyleWidget, EditModeState, LayoutTemplate } from '@/types/ios-dashboard';
import { useDashboardStore } from '@/lib/stores/dashboardStore';
import { FlexibleGridContainer } from './FlexibleGridContainer';
import { WiggleWidget } from './WiggleWidget';
import { EditModeToolbar } from './EditModeToolbar';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

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
  const gridEngine = useRef(new FlexibleGridEngine());
  
  // 편집 모드 상태
  const [editMode, setEditMode] = useState<EditModeState>({
    isEditing: false,
    selectedWidget: null,
    isDragging: false,
    draggedWidget: null,
  });
  
  // 위젯 상태
  const [widgets, setWidgets] = useState<IOSStyleWidget[]>(initialWidgets);
  const [activeWidget, setActiveWidget] = useState<IOSStyleWidget | null>(null);
  
  // 애니메이션 훅 사용
  const { isWiggling, startWiggle, stopWiggle } = useIOSAnimations();
  
  // Long Press 감지를 위한 타이머
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  // Feature Flag 체크
  if (!enableFeatureFlag) {
    // 기존 대시보드로 폴백
    return null;
  }

  // 편집 모드 진입 (Long Press)
  const handleLongPressStart = useCallback((widgetId: string) => {
    setIsPressing(true);
    longPressTimer.current = setTimeout(() => {
      // 편집 모드 진입 애니메이션
      animationController.current.playAnimation('editModeEnter');
      
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
  const handleExitEditMode = useCallback(() => {
    animationController.current.playAnimation('editModeExit');
    
    setEditMode({
      isEditing: false,
      selectedWidget: null,
      isDragging: false,
      draggedWidget: null,
    });
    
    stopWiggle();
    
    // 레이아웃 저장
    if (onLayoutChange) {
      onLayoutChange(widgets);
    }
    
    showToast({
      title: '편집 완료',
      description: '레이아웃이 저장되었습니다',
      type: 'success',
    });
  }, [stopWiggle, widgets, onLayoutChange, showToast]);

  // 편집 모드 취소
  const handleCancelEditMode = useCallback(() => {
    // 원래 레이아웃으로 복원
    setWidgets(initialWidgets);
    handleExitEditMode();
  }, [initialWidgets, handleExitEditMode]);

  // 드래그 시작
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const widget = widgets.find(w => w.id === event.active.id);
    if (widget) {
      setActiveWidget(widget);
      setEditMode(prev => ({
        ...prev,
        isDragging: true,
        draggedWidget: widget.id,
      }));
      
      animationController.current.playAnimation('dragStart');
    }
  }, [widgets]);

  // 드래그 종료
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const sourceWidget = widgets.find(w => w.id === active.id);
      
      if (sourceWidget && over) {
        // FlexibleGridEngine을 사용한 재배치
        const newPosition = gridEngine.current.moveWidget(
          sourceWidget,
          { row: Math.floor(Number(over.id) / 8), col: Number(over.id) % 8 }
        );
        
        if (newPosition) {
          // 충돌 감지 및 자동 재배치
          const updatedLayout = gridEngine.current.applyGravity(widgets);
          
          setWidgets(updatedLayout);
          animationController.current.playAnimation('reflow');
        }
      }
    }
    
    setActiveWidget(null);
    setEditMode(prev => ({
      ...prev,
      isDragging: false,
      draggedWidget: null,
    }));
    
    animationController.current.playAnimation('dragEnd');
  }, [widgets]);

  // 위젯 삭제
  const handleDeleteWidget = useCallback((widgetId: string) => {
    animationController.current.playAnimation('widgetDelete');
    
    setWidgets(prev => {
      const filtered = prev.filter(w => w.id !== widgetId);
      // 삭제 후 자동 재배치
      return gridEngine.current.applyGravity(filtered);
    });
    
    showToast({
      title: '위젯 삭제',
      description: '위젯이 삭제되었습니다',
      type: 'info',
    });
  }, [showToast]);

  // 위젯 설정
  const handleConfigWidget = useCallback((widgetId: string) => {
    // 위젯 설정 패널 열기
    showToast({
      title: '위젯 설정',
      description: '설정 패널이 곧 추가됩니다',
      type: 'info',
    });
  }, [showToast]);

  // 위젯 추가
  const handleAddWidget = useCallback((widgetType: string) => {
    // 최적 위치 찾기
    const bestPosition = gridEngine.current.findBestAvailablePosition(2, 2);
    
    if (bestPosition) {
      const newWidget: IOSStyleWidget = {
        id: `widget-${Date.now()}`,
        type: widgetType,
        title: widgetType,
        position: bestPosition,
        size: { width: 2, height: 2 },
        data: {},
        style: {},
        isLocked: false,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      
      setWidgets(prev => [...prev, newWidget]);
      animationController.current.playAnimation('widgetAdd');
      
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
  }, [showToast]);

  // 레이아웃 템플릿 적용
  const handleApplyTemplate = useCallback((template: LayoutTemplate) => {
    const newLayout = template.widgets.map((w, index) => ({
      ...w,
      id: `widget-template-${index}-${Date.now()}`,
    }));
    
    setWidgets(newLayout);
    animationController.current.playAnimation('templateApply');
    
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

  return (
    <div className="relative w-full h-full min-h-screen bg-background">
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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* 그리드 컨테이너 */}
        <FlexibleGridContainer
          widgets={widgets}
          isEditMode={editMode.isEditing}
          onLongPressStart={handleLongPressStart}
          onLongPressEnd={handleLongPressEnd}
        >
          {widgets.map(widget => (
            <WiggleWidget
              key={widget.id}
              widget={widget}
              isEditing={editMode.isEditing}
              isWiggling={isWiggling}
              isDragging={editMode.draggedWidget === widget.id}
              onDelete={() => handleDeleteWidget(widget.id)}
              onConfig={() => handleConfigWidget(widget.id)}
            />
          ))}
        </FlexibleGridContainer>

        {/* 드래그 오버레이 */}
        <DragOverlay>
          {activeWidget && (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.05 }}
              className="opacity-80"
            >
              <WiggleWidget
                widget={activeWidget}
                isEditing={true}
                isWiggling={false}
                isDragging={true}
                onDelete={() => {}}
                onConfig={() => {}}
              />
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>

      {/* 편집 모드 인디케이터 */}
      <AnimatePresence>
        {editMode.isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg">
              <span className="text-sm font-medium">편집 모드</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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