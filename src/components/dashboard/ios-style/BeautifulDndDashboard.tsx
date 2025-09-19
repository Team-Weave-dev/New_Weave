'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided
} from 'react-beautiful-dnd';
import { IOSStyleWidget } from '@/types/ios-dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Settings, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';
import { useIOSFeatureFlags } from '@/hooks/useFeatureFlag';

export function BeautifulDndDashboard() {
  console.log('[BeautifulDndDashboard] 컴포넌트 렌더링');
  
  // Feature Flags 가져오기
  const { features: iosFeatures } = useIOSFeatureFlags();
  
  const { showToast } = useToast();
  const [widgets, setWidgets] = useState<IOSStyleWidget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  
  // Feature Flags 로깅 (개발 환경)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BeautifulDndDashboard] iOS Features:', {
        longPress: iosFeatures.longPress,
        wiggleAnimation: iosFeatures.wiggleAnimation,
        autoReflow: iosFeatures.autoReflow,
        smartPlacement: iosFeatures.smartPlacement,
        keyboardShortcuts: iosFeatures.keyboardShortcuts,
        hapticFeedback: iosFeatures.hapticFeedback,
      });
    }
  }, [iosFeatures]);

  // 초기 테스트 위젯 생성
  useEffect(() => {
    console.log('[BeautifulDndDashboard] 초기 위젯 생성');
    const testWidgets: IOSStyleWidget[] = [
      {
        id: 'widget-1',
        type: 'stats',
        title: '통계 대시보드',
        position: { gridColumn: '1', gridRow: '1' },
        size: { width: 2, height: 2 },
        data: {},
        style: {},
        isLocked: false,
      },
      {
        id: 'widget-2',
        type: 'chart',
        title: '주간 트렌드 차트',
        position: { gridColumn: '3', gridRow: '1' },
        size: { width: 3, height: 2 },
        data: {},
        style: {},
        isLocked: false,
      },
      {
        id: 'widget-3',
        type: 'quick-action',
        title: '빠른 작업',
        position: { gridColumn: '1', gridRow: '3' },
        size: { width: 2, height: 1 },
        data: {},
        style: {},
        isLocked: false,
      },
      {
        id: 'widget-4',
        type: 'timeline',
        title: '타임라인',
        position: { gridColumn: '3', gridRow: '3' },
        size: { width: 3, height: 1 },
        data: {},
        style: {},
        isLocked: false,
      },
      {
        id: 'widget-5',
        type: 'indicator',
        title: '상태',
        position: { gridColumn: '6', gridRow: '1' },
        size: { width: 1, height: 1 },
        data: {},
        style: {},
        isLocked: false,
      },
    ];
    
    setWidgets(testWidgets);
  }, []);

  // Long Press 타이머
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Long Press 시작
  const handleLongPressStart = useCallback(() => {
    console.log('[BeautifulDndDashboard] Long press 시작');
    longPressTimer.current = setTimeout(() => {
      console.log('[BeautifulDndDashboard] 편집 모드 활성화');
      setIsEditing(true);
      setIsWiggling(true);
      showToast({
        title: '편집 모드',
        description: '위젯을 드래그하여 재배치할 수 있습니다',
        type: 'info',
      });
    }, 1000);
  }, [showToast]);

  // Long Press 종료
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      console.log('[BeautifulDndDashboard] Long press 취소');
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // 드래그 종료 핸들러
  const handleDragEnd = (result: DropResult) => {
    console.log('[BeautifulDndDashboard] 드래그 종료:', result);
    
    if (!result.destination) {
      console.log('[BeautifulDndDashboard] 드롭 위치 없음');
      return;
    }

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    console.log('[BeautifulDndDashboard] 위젯 재배치 완료');
    setWidgets(items);
    
    showToast({
      title: '위젯 이동',
      description: '위젯이 새로운 위치로 이동했습니다',
      type: 'success',
    });
  };

  // 편집 모드 종료
  const handleExitEditMode = () => {
    setIsEditing(false);
    setIsWiggling(false);
    showToast({
      title: '편집 완료',
      description: '레이아웃이 저장되었습니다',
      type: 'success',
    });
  };

  // 위젯 삭제
  const handleDeleteWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    showToast({
      title: '위젯 삭제',
      description: '위젯이 삭제되었습니다',
      type: 'info',
    });
  };

  // 위젯 추가
  const handleAddWidget = () => {
    const newWidget: IOSStyleWidget = {
      id: `widget-${Date.now()}`,
      type: 'stats',
      title: '새 위젯',
      position: { gridColumn: '1', gridRow: '1' },
      size: { width: 2, height: 2 },
      data: {},
      style: {},
      isLocked: false,
    };
    
    setWidgets(prev => [...prev, newWidget]);
    showToast({
      title: '위젯 추가',
      description: '새 위젯이 추가되었습니다',
      type: 'success',
    });
  };

  // 위젯 렌더링
  const renderWidget = (widget: IOSStyleWidget, provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        style={{
          ...provided.draggableProps.style,
          opacity: snapshot.isDragging ? 0.5 : 1,
        }}
        className={cn(
          'relative',
          'transition-all duration-200',
          'w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(16.666%-0.833rem)]',
          snapshot.isDragging && 'z-50 scale-105',
          isEditing && 'cursor-move'
        )}
      >
        <motion.div
          animate={isWiggling && isEditing && !snapshot.isDragging ? {
            rotate: [0, -1, 1, -1, 1, 0],
            transition: {
              duration: 0.25,
              repeat: Infinity,
              repeatType: "reverse" as const,
              ease: "easeInOut",
            }
          } : {}}
        >
          <Card className="w-full h-full p-4 min-h-[100px]">
            <div className="flex flex-col h-full">
              <h3 className="text-lg font-semibold mb-2">{widget.title}</h3>
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {widget.type}
              </div>
            </div>
          </Card>

          {/* 편집 모드 버튼들 */}
          {isEditing && !snapshot.isDragging && (
            <>
              <motion.button
                className="absolute -top-2 -left-2 z-20 rounded-full w-7 h-7 bg-red-600 text-white flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteWidget(widget.id);
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <X className="h-4 w-4" />
              </motion.button>

              <motion.button
                className="absolute -top-2 -right-2 z-20 rounded-full w-7 h-7 bg-white border text-gray-600 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Settings className="h-3 w-3" />
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-background p-4">
      {/* 편집 모드 툴바 */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            className="fixed top-16 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
          >
            <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
              <button
                onClick={handleAddWidget}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                <Plus className="h-4 w-4" />
                위젯 추가
              </button>
              
              <button
                onClick={handleExitEditMode}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                완료
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 드래그 앤 드롭 컨텍스트 */}
      <div 
        className={cn(
          "transition-all duration-300",
          isEditing && "mt-20"
        )}
      >
        <DragDropContext 
          onDragStart={() => console.log('[BeautifulDndDashboard] 드래그 시작')}
          onDragEnd={handleDragEnd}
        >
          <Droppable droppableId="dashboard">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-wrap gap-4 min-h-[400px]"
                onMouseDown={!isEditing ? handleLongPressStart : undefined}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={!isEditing ? handleLongPressStart : undefined}
                onTouchEnd={handleLongPressEnd}
              >
                {widgets.map((widget, index) => (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={index}
                    isDragDisabled={!isEditing}
                  >
                    {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => 
                      renderWidget(widget, provided, snapshot)
                    }
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* 빈 상태 */}
      {widgets.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">위젯이 없습니다</p>
            <p className="text-sm">화면을 길게 눌러 편집 모드로 들어가세요</p>
          </div>
        </div>
      )}
    </div>
  );
}