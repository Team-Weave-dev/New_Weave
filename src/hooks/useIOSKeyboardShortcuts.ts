import { useEffect, useRef, useCallback, useState } from 'react';

interface KeyboardShortcutsConfig {
  enableUndoRedo?: boolean;
  enableNavigation?: boolean;
  enableEditMode?: boolean;
  enableDelete?: boolean;
  customShortcuts?: Record<string, () => void>;
}

interface NavigationState {
  focusedWidgetId: string | null;
  focusedIndex: number;
}

interface UndoRedoAction {
  type: 'add' | 'delete' | 'move' | 'resize';
  widget: any;
  previousState?: any;
  timestamp: number;
}

/**
 * iOS 스타일 대시보드용 키보드 단축키 훅
 */
export function useIOSKeyboardShortcuts(
  config: KeyboardShortcutsConfig = {}
) {
  const {
    enableUndoRedo = true,
    enableNavigation = true,
    enableEditMode = true,
    enableDelete = true,
    customShortcuts = {},
  } = config;

  const [navigationState, setNavigationState] = useState<NavigationState>({
    focusedWidgetId: null,
    focusedIndex: -1,
  });

  const undoStack = useRef<UndoRedoAction[]>([]);
  const redoStack = useRef<UndoRedoAction[]>([]);
  const maxHistorySize = 50;

  // Undo/Redo 액션 추가
  const addToHistory = useCallback((action: UndoRedoAction) => {
    if (!enableUndoRedo) return;

    undoStack.current.push(action);
    
    // 히스토리 크기 제한
    if (undoStack.current.length > maxHistorySize) {
      undoStack.current.shift();
    }
    
    // Redo 스택 초기화 (새 액션이 추가되면 redo 불가능)
    redoStack.current = [];
  }, [enableUndoRedo]);

  // Undo 실행
  const executeUndo = useCallback(() => {
    if (!enableUndoRedo || undoStack.current.length === 0) return null;

    const action = undoStack.current.pop();
    if (action) {
      redoStack.current.push(action);
      return action;
    }
    return null;
  }, [enableUndoRedo]);

  // Redo 실행
  const executeRedo = useCallback(() => {
    if (!enableUndoRedo || redoStack.current.length === 0) return null;

    const action = redoStack.current.pop();
    if (action) {
      undoStack.current.push(action);
      return action;
    }
    return null;
  }, [enableUndoRedo]);

  // 히스토리 초기화
  const clearHistory = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
  }, []);

  return {
    navigationState,
    setNavigationState,
    addToHistory,
    executeUndo,
    executeRedo,
    clearHistory,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}

/**
 * 대시보드용 키보드 이벤트 핸들러 훅
 */
export function useKeyboardHandler(
  isEditMode: boolean,
  onExitEditMode: () => void,
  onDeleteWidget: (widgetId: string) => void,
  onMoveWidget: (widgetId: string, direction: 'up' | 'down' | 'left' | 'right') => void,
  onUndo?: () => void,
  onRedo?: () => void
) {
  const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isCmdPressed, setIsCmdPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 메타 키 상태 업데이트
      if (e.key === 'Shift') setIsShiftPressed(true);
      if (e.key === 'Control') setIsCtrlPressed(true);
      if (e.key === 'Meta') setIsCmdPressed(true);

      // ESC - 편집 모드 종료
      if (e.key === 'Escape' && isEditMode) {
        e.preventDefault();
        onExitEditMode();
        return;
      }

      // 편집 모드일 때만 동작하는 단축키
      if (isEditMode) {
        // Delete 또는 Backspace - 선택된 위젯 삭제
        if ((e.key === 'Delete' || e.key === 'Backspace') && focusedWidgetId) {
          e.preventDefault();
          onDeleteWidget(focusedWidgetId);
          setFocusedWidgetId(null);
          return;
        }

        // 방향키 - 위젯 이동 (Shift 키와 함께 누르면 빠르게 이동)
        if (focusedWidgetId) {
          const moveAmount = isShiftPressed ? 'fast' : 'normal';
          
          switch (e.key) {
            case 'ArrowUp':
              e.preventDefault();
              onMoveWidget(focusedWidgetId, 'up');
              break;
            case 'ArrowDown':
              e.preventDefault();
              onMoveWidget(focusedWidgetId, 'down');
              break;
            case 'ArrowLeft':
              e.preventDefault();
              onMoveWidget(focusedWidgetId, 'left');
              break;
            case 'ArrowRight':
              e.preventDefault();
              onMoveWidget(focusedWidgetId, 'right');
              break;
          }
        }

        // Tab - 다음 위젯으로 포커스 이동
        if (e.key === 'Tab') {
          e.preventDefault();
          // 위젯 순회 로직 구현 필요
        }

        // Cmd/Ctrl + Z - 실행 취소
        if ((e.key === 'z' || e.key === 'Z') && (isCmdPressed || isCtrlPressed)) {
          e.preventDefault();
          if (e.shiftKey && onRedo) {
            // Shift + Cmd/Ctrl + Z = Redo
            onRedo();
          } else if (onUndo) {
            onUndo();
          }
          return;
        }

        // Cmd/Ctrl + Y - 다시 실행
        if ((e.key === 'y' || e.key === 'Y') && (isCmdPressed || isCtrlPressed) && onRedo) {
          e.preventDefault();
          onRedo();
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 메타 키 상태 업데이트
      if (e.key === 'Shift') setIsShiftPressed(false);
      if (e.key === 'Control') setIsCtrlPressed(false);
      if (e.key === 'Meta') setIsCmdPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isEditMode,
    focusedWidgetId,
    isShiftPressed,
    isCtrlPressed,
    isCmdPressed,
    onExitEditMode,
    onDeleteWidget,
    onMoveWidget,
    onUndo,
    onRedo,
  ]);

  return {
    focusedWidgetId,
    setFocusedWidgetId,
    isShiftPressed,
    isCtrlPressed,
    isCmdPressed,
  };
}

/**
 * 위젯 네비게이션을 위한 키보드 훅
 */
export function useWidgetNavigation(
  widgets: any[],
  isEditMode: boolean
) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleNavigation = useCallback((direction: 'next' | 'prev' | 'up' | 'down' | 'left' | 'right') => {
    if (!isEditMode || widgets.length === 0) return;

    const currentWidget = widgets[focusedIndex];
    let nextIndex = focusedIndex;

    switch (direction) {
      case 'next':
        nextIndex = (focusedIndex + 1) % widgets.length;
        break;
      case 'prev':
        nextIndex = focusedIndex <= 0 ? widgets.length - 1 : focusedIndex - 1;
        break;
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        // 그리드 기반 네비게이션 로직
        nextIndex = findAdjacentWidget(widgets, focusedIndex, direction);
        break;
    }

    setFocusedIndex(nextIndex);
    
    // 위젯으로 스크롤
    const widgetElement = document.getElementById(`widget-${widgets[nextIndex]?.id}`);
    widgetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    widgetElement?.focus();
  }, [widgets, focusedIndex, isEditMode]);

  // 인접한 위젯 찾기
  const findAdjacentWidget = (widgets: any[], currentIndex: number, direction: string) => {
    if (currentIndex < 0 || currentIndex >= widgets.length) return 0;

    const current = widgets[currentIndex];
    const currentCol = current.position.gridColumnStart;
    const currentRow = current.position.gridRowStart;

    let bestMatch = currentIndex;
    let minDistance = Infinity;

    widgets.forEach((widget, index) => {
      if (index === currentIndex) return;

      const col = widget.position.gridColumnStart;
      const row = widget.position.gridRowStart;
      
      let isValidDirection = false;
      let distance = 0;

      switch (direction) {
        case 'up':
          isValidDirection = row < currentRow;
          distance = Math.abs(col - currentCol) + (currentRow - row) * 10;
          break;
        case 'down':
          isValidDirection = row > currentRow;
          distance = Math.abs(col - currentCol) + (row - currentRow) * 10;
          break;
        case 'left':
          isValidDirection = col < currentCol;
          distance = Math.abs(row - currentRow) + (currentCol - col) * 10;
          break;
        case 'right':
          isValidDirection = col > currentCol;
          distance = Math.abs(row - currentRow) + (col - currentCol) * 10;
          break;
      }

      if (isValidDirection && distance < minDistance) {
        minDistance = distance;
        bestMatch = index;
      }
    });

    return bestMatch;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode) return;

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          handleNavigation(e.shiftKey ? 'prev' : 'next');
          break;
        case 'ArrowUp':
          if (e.altKey) {
            e.preventDefault();
            handleNavigation('up');
          }
          break;
        case 'ArrowDown':
          if (e.altKey) {
            e.preventDefault();
            handleNavigation('down');
          }
          break;
        case 'ArrowLeft':
          if (e.altKey) {
            e.preventDefault();
            handleNavigation('left');
          }
          break;
        case 'ArrowRight':
          if (e.altKey) {
            e.preventDefault();
            handleNavigation('right');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, handleNavigation]);

  return {
    focusedIndex,
    setFocusedIndex,
    focusedWidgetId: widgets[focusedIndex]?.id || null,
  };
}

/**
 * 클립보드 단축키 지원 훅
 */
export function useClipboardShortcuts(
  onCopy: (widgetId: string) => void,
  onCut: (widgetId: string) => void,
  onPaste: () => void,
  isEditMode: boolean,
  focusedWidgetId: string | null
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode || !focusedWidgetId) return;

      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier) {
        switch (e.key) {
          case 'c':
          case 'C':
            e.preventDefault();
            onCopy(focusedWidgetId);
            break;
          case 'x':
          case 'X':
            e.preventDefault();
            onCut(focusedWidgetId);
            break;
          case 'v':
          case 'V':
            e.preventDefault();
            onPaste();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, focusedWidgetId, onCopy, onCut, onPaste]);
}

/**
 * 단축키 도움말 표시 훅
 */
export function useShortcutHelp() {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? 키로 도움말 토글
      if (e.key === '?' && (e.shiftKey || e.key === '/')) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcuts = [
    { keys: 'ESC', description: '편집 모드 종료' },
    { keys: 'Delete/Backspace', description: '선택된 위젯 삭제' },
    { keys: '↑↓←→', description: '위젯 이동' },
    { keys: 'Shift + ↑↓←→', description: '위젯 빠르게 이동' },
    { keys: 'Tab', description: '다음 위젯으로 이동' },
    { keys: 'Shift + Tab', description: '이전 위젯으로 이동' },
    { keys: 'Cmd/Ctrl + Z', description: '실행 취소' },
    { keys: 'Cmd/Ctrl + Shift + Z', description: '다시 실행' },
    { keys: 'Cmd/Ctrl + C', description: '위젯 복사' },
    { keys: 'Cmd/Ctrl + X', description: '위젯 잘라내기' },
    { keys: 'Cmd/Ctrl + V', description: '위젯 붙여넣기' },
    { keys: 'Alt + ↑↓←→', description: '그리드 기반 네비게이션' },
    { keys: '?', description: '단축키 도움말' },
  ];

  return {
    showHelp,
    setShowHelp,
    shortcuts,
  };
}