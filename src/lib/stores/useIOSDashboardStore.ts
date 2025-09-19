import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { IOSStyleWidget } from '@/types/ios-dashboard';

// 상태 슬라이스 타입 정의
interface LayoutSlice {
  widgets: IOSStyleWidget[];
  columns: number;
  gap: number;
  padding: number;
  setWidgets: (widgets: IOSStyleWidget[]) => void;
  updateWidget: (id: string, widget: Partial<IOSStyleWidget>) => void;
  removeWidget: (id: string) => void;
  addWidget: (widget: IOSStyleWidget) => void;
  setLayoutConfig: (config: { columns?: number; gap?: number; padding?: number }) => void;
  reorderWidgets: (fromId: string, toId: string) => void;
}

interface EditModeSlice {
  isEditMode: boolean;
  selectedWidgetId: string | null;
  draggedWidgetId: string | null;
  hoveredWidgetId: string | null;
  isResizing: boolean;
  setEditMode: (enabled: boolean) => void;
  selectWidget: (id: string | null) => void;
  setDraggedWidget: (id: string | null) => void;
  setHoveredWidget: (id: string | null) => void;
  setResizing: (resizing: boolean) => void;
  clearEditState: () => void;
}

interface AnimationSlice {
  isWiggling: boolean;
  animatingWidgetIds: Set<string>;
  transitioningWidgetIds: Set<string>;
  setWiggling: (wiggling: boolean) => void;
  addAnimatingWidget: (id: string) => void;
  removeAnimatingWidget: (id: string) => void;
  addTransitioningWidget: (id: string) => void;
  removeTransitioningWidget: (id: string) => void;
  clearAnimationState: () => void;
}

interface HistorySlice {
  history: IOSStyleWidget[][];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: (widgets: IOSStyleWidget[]) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

interface PerformanceSlice {
  frameRate: number;
  isVirtualizationEnabled: boolean;
  visibleWidgetIds: Set<string>;
  performanceLevel: 'high' | 'medium' | 'low';
  setFrameRate: (rate: number) => void;
  setVirtualizationEnabled: (enabled: boolean) => void;
  updateVisibleWidgets: (ids: string[]) => void;
  setPerformanceLevel: (level: 'high' | 'medium' | 'low') => void;
}

// 전체 스토어 타입
export interface IOSDashboardStore 
  extends LayoutSlice, 
          EditModeSlice, 
          AnimationSlice, 
          HistorySlice, 
          PerformanceSlice {
  // 복합 액션
  enterEditMode: () => void;
  exitEditMode: (save?: boolean) => void;
  moveWidget: (widgetId: string, newPosition: { gridColumn: number; gridRow: number }) => void;
  resizeWidget: (widgetId: string, newSize: { columns: number; rows: number }) => void;
  resetStore: () => void;
}

// 초기 상태
const initialLayoutState: Pick<LayoutSlice, 'widgets' | 'columns' | 'gap' | 'padding'> = {
  widgets: [],
  columns: 4,
  gap: 16,
  padding: 16,
};

const initialEditState: Pick<EditModeSlice, 'isEditMode' | 'selectedWidgetId' | 'draggedWidgetId' | 'hoveredWidgetId' | 'isResizing'> = {
  isEditMode: false,
  selectedWidgetId: null,
  draggedWidgetId: null,
  hoveredWidgetId: null,
  isResizing: false,
};

const initialAnimationState: Pick<AnimationSlice, 'isWiggling' | 'animatingWidgetIds' | 'transitioningWidgetIds'> = {
  isWiggling: false,
  animatingWidgetIds: new Set(),
  transitioningWidgetIds: new Set(),
};

const initialHistoryState: Pick<HistorySlice, 'history' | 'historyIndex' | 'canUndo' | 'canRedo'> = {
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
};

const initialPerformanceState: Pick<PerformanceSlice, 'frameRate' | 'isVirtualizationEnabled' | 'visibleWidgetIds' | 'performanceLevel'> = {
  frameRate: 60,
  isVirtualizationEnabled: false,
  visibleWidgetIds: new Set(),
  performanceLevel: 'high',
};

// 히스토리 관리 유틸리티
const MAX_HISTORY_SIZE = 50;

// Zustand 스토어 생성 with middleware
export const useIOSDashboardStore = create<IOSDashboardStore>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        // Layout Slice
        ...initialLayoutState,
        setWidgets: (widgets) => set(
          { widgets },
          false,
          'setWidgets'
        ),
        updateWidget: (id, update) => set(
          (state) => ({
            widgets: state.widgets.map(w => 
              w.id === id ? { ...w, ...update } : w
            )
          }),
          false,
          'updateWidget'
        ),
        removeWidget: (id) => set(
          (state) => {
            const newWidgets = state.widgets.filter(w => w.id !== id);
            get().pushHistory(newWidgets);
            return { widgets: newWidgets };
          },
          false,
          'removeWidget'
        ),
        addWidget: (widget) => set(
          (state) => {
            const newWidgets = [...state.widgets, widget];
            get().pushHistory(newWidgets);
            return { widgets: newWidgets };
          },
          false,
          'addWidget'
        ),
        setLayoutConfig: (config) => set(
          (state) => ({
            columns: config.columns ?? state.columns,
            gap: config.gap ?? state.gap,
            padding: config.padding ?? state.padding,
          }),
          false,
          'setLayoutConfig'
        ),
        reorderWidgets: (fromId, toId) => set(
          (state) => {
            const fromIndex = state.widgets.findIndex(w => w.id === fromId);
            const toIndex = state.widgets.findIndex(w => w.id === toId);
            
            if (fromIndex === -1 || toIndex === -1) return {};
            
            const newWidgets = [...state.widgets];
            const [removed] = newWidgets.splice(fromIndex, 1);
            newWidgets.splice(toIndex, 0, removed);
            
            get().pushHistory(newWidgets);
            return { widgets: newWidgets };
          },
          false,
          'reorderWidgets'
        ),

        // EditMode Slice
        ...initialEditState,
        setEditMode: (enabled) => set(
          { 
            isEditMode: enabled,
            isWiggling: enabled,
          },
          false,
          'setEditMode'
        ),
        selectWidget: (id) => set(
          { selectedWidgetId: id },
          false,
          'selectWidget'
        ),
        setDraggedWidget: (id) => set(
          { draggedWidgetId: id },
          false,
          'setDraggedWidget'
        ),
        setHoveredWidget: (id) => set(
          { hoveredWidgetId: id },
          false,
          'setHoveredWidget'
        ),
        setResizing: (resizing) => set(
          { isResizing: resizing },
          false,
          'setResizing'
        ),
        clearEditState: () => set(
          {
            selectedWidgetId: null,
            draggedWidgetId: null,
            hoveredWidgetId: null,
            isResizing: false,
          },
          false,
          'clearEditState'
        ),

        // Animation Slice
        ...initialAnimationState,
        setWiggling: (wiggling) => set(
          { isWiggling: wiggling },
          false,
          'setWiggling'
        ),
        addAnimatingWidget: (id) => set(
          (state) => ({
            animatingWidgetIds: new Set(state.animatingWidgetIds).add(id)
          }),
          false,
          'addAnimatingWidget'
        ),
        removeAnimatingWidget: (id) => set(
          (state) => {
            const newSet = new Set(state.animatingWidgetIds);
            newSet.delete(id);
            return { animatingWidgetIds: newSet };
          },
          false,
          'removeAnimatingWidget'
        ),
        addTransitioningWidget: (id) => set(
          (state) => ({
            transitioningWidgetIds: new Set(state.transitioningWidgetIds).add(id)
          }),
          false,
          'addTransitioningWidget'
        ),
        removeTransitioningWidget: (id) => set(
          (state) => {
            const newSet = new Set(state.transitioningWidgetIds);
            newSet.delete(id);
            return { transitioningWidgetIds: newSet };
          },
          false,
          'removeTransitioningWidget'
        ),
        clearAnimationState: () => set(
          {
            animatingWidgetIds: new Set(),
            transitioningWidgetIds: new Set(),
          },
          false,
          'clearAnimationState'
        ),

        // History Slice
        ...initialHistoryState,
        pushHistory: (widgets) => set(
          (state) => {
            const newHistory = [
              ...state.history.slice(0, state.historyIndex + 1),
              widgets
            ].slice(-MAX_HISTORY_SIZE);
            
            return {
              history: newHistory,
              historyIndex: newHistory.length - 1,
              canUndo: newHistory.length > 1,
              canRedo: false,
            };
          },
          false,
          'pushHistory'
        ),
        undo: () => set(
          (state) => {
            if (!state.canUndo) return {};
            
            const newIndex = Math.max(0, state.historyIndex - 1);
            return {
              widgets: state.history[newIndex],
              historyIndex: newIndex,
              canUndo: newIndex > 0,
              canRedo: true,
            };
          },
          false,
          'undo'
        ),
        redo: () => set(
          (state) => {
            if (!state.canRedo) return {};
            
            const newIndex = Math.min(state.history.length - 1, state.historyIndex + 1);
            return {
              widgets: state.history[newIndex],
              historyIndex: newIndex,
              canUndo: true,
              canRedo: newIndex < state.history.length - 1,
            };
          },
          false,
          'redo'
        ),
        clearHistory: () => set(
          initialHistoryState,
          false,
          'clearHistory'
        ),

        // Performance Slice
        ...initialPerformanceState,
        setFrameRate: (rate) => set(
          { frameRate: rate },
          false,
          'setFrameRate'
        ),
        setVirtualizationEnabled: (enabled) => set(
          { isVirtualizationEnabled: enabled },
          false,
          'setVirtualizationEnabled'
        ),
        updateVisibleWidgets: (ids) => set(
          { visibleWidgetIds: new Set(ids) },
          false,
          'updateVisibleWidgets'
        ),
        setPerformanceLevel: (level) => set(
          { performanceLevel: level },
          false,
          'setPerformanceLevel'
        ),

        // 복합 액션
        enterEditMode: () => {
          const state = get();
          set(
            {
              isEditMode: true,
              isWiggling: true,
              // 편집 모드에서는 가상화 비활성화 (DnD 호환성)
              isVirtualizationEnabled: false,
            },
            false,
            'enterEditMode'
          );
          
          // 현재 상태를 히스토리에 저장
          if (state.history.length === 0) {
            get().pushHistory(state.widgets);
          }
        },

        exitEditMode: (save = true) => {
          const state = get();
          
          if (!save && state.canUndo) {
            // 변경사항 취소
            get().undo();
          }
          
          set(
            {
              isEditMode: false,
              isWiggling: false,
              selectedWidgetId: null,
              draggedWidgetId: null,
              hoveredWidgetId: null,
              isResizing: false,
              // 가상화 다시 활성화 (위젯 수에 따라)
              isVirtualizationEnabled: state.widgets.length > 100,
            },
            false,
            'exitEditMode'
          );
          
          get().clearAnimationState();
        },

        moveWidget: (widgetId, newPosition) => {
          const state = get();
          const widget = state.widgets.find(w => w.id === widgetId);
          if (!widget) return;
          
          get().updateWidget(widgetId, {
            position: newPosition
          });
          
          // 애니메이션 추가
          get().addTransitioningWidget(widgetId);
          setTimeout(() => {
            get().removeTransitioningWidget(widgetId);
          }, 300);
        },

        resizeWidget: (widgetId, newSize) => {
          const state = get();
          const widget = state.widgets.find(w => w.id === widgetId);
          if (!widget) return;
          
          get().updateWidget(widgetId, {
            columns: newSize.columns,
            rows: newSize.rows,
          });
          
          // 애니메이션 추가
          get().addTransitioningWidget(widgetId);
          setTimeout(() => {
            get().removeTransitioningWidget(widgetId);
          }, 300);
        },

        resetStore: () => set(
          {
            ...initialLayoutState,
            ...initialEditState,
            ...initialAnimationState,
            ...initialHistoryState,
            ...initialPerformanceState,
          },
          false,
          'resetStore'
        ),
      }),
      {
        name: 'ios-dashboard-store',
      }
    )
  )
);

// 선택적 구독을 위한 selector 함수들
export const selectWidgets = (state: IOSDashboardStore) => state.widgets;
export const selectEditMode = (state: IOSDashboardStore) => state.isEditMode;
export const selectSelectedWidget = (state: IOSDashboardStore) => state.selectedWidgetId;
export const selectDraggedWidget = (state: IOSDashboardStore) => state.draggedWidgetId;
export const selectWiggling = (state: IOSDashboardStore) => state.isWiggling;
export const selectLayoutConfig = (state: IOSDashboardStore) => ({
  columns: state.columns,
  gap: state.gap,
  padding: state.padding,
});

export const selectEditState = (state: IOSDashboardStore) => ({
  isEditMode: state.isEditMode,
  selectedWidgetId: state.selectedWidgetId,
  draggedWidgetId: state.draggedWidgetId,
  hoveredWidgetId: state.hoveredWidgetId,
  isResizing: state.isResizing,
});

export const selectAnimationState = (state: IOSDashboardStore) => ({
  isWiggling: state.isWiggling,
  animatingWidgetIds: state.animatingWidgetIds,
  transitioningWidgetIds: state.transitioningWidgetIds,
});

export const selectHistoryState = (state: IOSDashboardStore) => ({
  canUndo: state.canUndo,
  canRedo: state.canRedo,
  historyIndex: state.historyIndex,
});

export const selectPerformanceState = (state: IOSDashboardStore) => ({
  frameRate: state.frameRate,
  isVirtualizationEnabled: state.isVirtualizationEnabled,
  performanceLevel: state.performanceLevel,
});

// 특정 위젯 선택자 (메모이제이션을 위한)
export const selectWidgetById = (id: string) => (state: IOSDashboardStore) =>
  state.widgets.find(w => w.id === id);

export const selectIsWidgetAnimating = (id: string) => (state: IOSDashboardStore) =>
  state.animatingWidgetIds.has(id);

export const selectIsWidgetTransitioning = (id: string) => (state: IOSDashboardStore) =>
  state.transitioningWidgetIds.has(id);

export const selectIsWidgetVisible = (id: string) => (state: IOSDashboardStore) =>
  state.visibleWidgetIds.has(id);

// shallow 비교를 위한 유틸리티 export
export { shallow };