/**
 * 키보드 네비게이션 유틸리티
 * 대시보드 위젯 시스템의 접근성 향상을 위한 키보드 네비게이션 지원
 */

import { useEffect, useRef, useCallback } from 'react';

// 키보드 이벤트 타입
export type KeyboardNavigationDirection = 'up' | 'down' | 'left' | 'right';
export type KeyboardAction = 'enter' | 'space' | 'escape' | 'tab' | 'home' | 'end';

// 키보드 단축키 정의
export const KEYBOARD_SHORTCUTS = {
  // 네비게이션
  MOVE_UP: 'ArrowUp',
  MOVE_DOWN: 'ArrowDown',
  MOVE_LEFT: 'ArrowLeft',
  MOVE_RIGHT: 'ArrowRight',
  
  // 액션
  SELECT: 'Enter',
  ACTIVATE: ' ',
  CANCEL: 'Escape',
  NEXT_FOCUS: 'Tab',
  PREV_FOCUS: 'Shift+Tab',
  
  // 위치 이동
  FIRST_ITEM: 'Home',
  LAST_ITEM: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  
  // 위젯 관련
  ADD_WIDGET: 'Ctrl+N',
  DELETE_WIDGET: 'Delete',
  EDIT_WIDGET: 'F2',
  MOVE_WIDGET: 'Ctrl+M',
  
  // 대시보드
  TOGGLE_SIDEBAR: 'Ctrl+B',
  SEARCH: 'Ctrl+F',
  SAVE_LAYOUT: 'Ctrl+S',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y'
} as const;

// 포커스 가능한 요소 선택자
const FOCUSABLE_SELECTOR = 
  'button:not([disabled]), ' +
  'a[href], ' +
  'input:not([disabled]), ' +
  'select:not([disabled]), ' +
  'textarea:not([disabled]), ' +
  '[tabindex]:not([tabindex="-1"]), ' +
  '[role="button"]:not([aria-disabled="true"])';

/**
 * 포커스 트랩 훅
 * 모달이나 드롭다운 등에서 포커스가 벗어나지 않도록 관리
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // 초기 포커스 설정
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
}

/**
 * 그리드 네비게이션 훅
 * 대시보드 그리드 레이아웃에서 화살표 키로 이동
 */
export function useGridNavigation(
  itemsRef: React.RefObject<HTMLElement[]>,
  columns: number,
  options: {
    onSelect?: (index: number) => void;
    onMove?: (from: number, to: number) => void;
    circular?: boolean;
  } = {}
) {
  const currentIndexRef = useRef(0);
  
  const navigate = useCallback((direction: KeyboardNavigationDirection) => {
    if (!itemsRef.current) return;
    
    const items = itemsRef.current;
    const totalItems = items.length;
    let newIndex = currentIndexRef.current;
    
    switch (direction) {
      case 'up':
        newIndex = Math.max(0, newIndex - columns);
        break;
      case 'down':
        newIndex = Math.min(totalItems - 1, newIndex + columns);
        break;
      case 'left':
        if (newIndex % columns === 0) {
          // 첫 번째 열
          newIndex = options.circular ? newIndex + columns - 1 : newIndex;
        } else {
          newIndex = newIndex - 1;
        }
        break;
      case 'right':
        if ((newIndex + 1) % columns === 0) {
          // 마지막 열
          newIndex = options.circular ? newIndex - columns + 1 : newIndex;
        } else {
          newIndex = Math.min(totalItems - 1, newIndex + 1);
        }
        break;
    }
    
    if (newIndex !== currentIndexRef.current) {
      currentIndexRef.current = newIndex;
      items[newIndex]?.focus();
    }
  }, [itemsRef, columns, options.circular]);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, shiftKey } = event;
    
    // 화살표 키 네비게이션
    if (key === KEYBOARD_SHORTCUTS.MOVE_UP) {
      event.preventDefault();
      navigate('up');
    } else if (key === KEYBOARD_SHORTCUTS.MOVE_DOWN) {
      event.preventDefault();
      navigate('down');
    } else if (key === KEYBOARD_SHORTCUTS.MOVE_LEFT) {
      event.preventDefault();
      navigate('left');
    } else if (key === KEYBOARD_SHORTCUTS.MOVE_RIGHT) {
      event.preventDefault();
      navigate('right');
    }
    
    // 선택 액션
    else if (key === KEYBOARD_SHORTCUTS.SELECT || key === KEYBOARD_SHORTCUTS.ACTIVATE) {
      event.preventDefault();
      options.onSelect?.(currentIndexRef.current);
    }
    
    // 홈/엔드 키
    else if (key === KEYBOARD_SHORTCUTS.FIRST_ITEM) {
      event.preventDefault();
      currentIndexRef.current = 0;
      itemsRef.current?.[0]?.focus();
    } else if (key === KEYBOARD_SHORTCUTS.LAST_ITEM) {
      event.preventDefault();
      const lastIndex = (itemsRef.current?.length || 1) - 1;
      currentIndexRef.current = lastIndex;
      itemsRef.current?.[lastIndex]?.focus();
    }
    
    // 위젯 이동 (Ctrl + 화살표)
    else if (ctrlKey && options.onMove) {
      let targetIndex = currentIndexRef.current;
      
      if (key === KEYBOARD_SHORTCUTS.MOVE_UP) {
        targetIndex = Math.max(0, targetIndex - columns);
      } else if (key === KEYBOARD_SHORTCUTS.MOVE_DOWN) {
        targetIndex = Math.min((itemsRef.current?.length || 1) - 1, targetIndex + columns);
      } else if (key === KEYBOARD_SHORTCUTS.MOVE_LEFT) {
        targetIndex = Math.max(0, targetIndex - 1);
      } else if (key === KEYBOARD_SHORTCUTS.MOVE_RIGHT) {
        targetIndex = Math.min((itemsRef.current?.length || 1) - 1, targetIndex + 1);
      }
      
      if (targetIndex !== currentIndexRef.current) {
        event.preventDefault();
        options.onMove(currentIndexRef.current, targetIndex);
        currentIndexRef.current = targetIndex;
      }
    }
  }, [navigate, itemsRef, options]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return {
    currentIndex: currentIndexRef.current,
    navigate,
    setFocus: (index: number) => {
      currentIndexRef.current = index;
      itemsRef.current?.[index]?.focus();
    }
  };
}

/**
 * 키보드 단축키 훅
 * 전역 키보드 단축키 처리
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    handler: () => void;
    preventDefault?: boolean;
  }>
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchKey = event.key === shortcut.key || event.code === shortcut.key;
        const matchCtrl = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true;
        const matchShift = shortcut.shiftKey ? event.shiftKey : true;
        const matchAlt = shortcut.altKey ? event.altKey : true;
        
        if (matchKey && matchCtrl && matchShift && matchAlt) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler();
          break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * 포커스 관리 유틸리티
 */
export class FocusManager {
  private static instance: FocusManager;
  private focusHistory: HTMLElement[] = [];
  
  static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager();
    }
    return FocusManager.instance;
  }
  
  // 포커스 이력 저장
  saveFocus(element: HTMLElement) {
    this.focusHistory.push(element);
    if (this.focusHistory.length > 10) {
      this.focusHistory.shift();
    }
  }
  
  // 이전 포커스로 복원
  restoreFocus() {
    const element = this.focusHistory.pop();
    element?.focus();
  }
  
  // 다음 포커스 가능 요소로 이동
  focusNext(container?: HTMLElement) {
    const root = container || document.body;
    const focusableElements = Array.from(
      root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = focusableElements.indexOf(currentElement);
    
    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }
  
  // 이전 포커스 가능 요소로 이동
  focusPrev(container?: HTMLElement) {
    const root = container || document.body;
    const focusableElements = Array.from(
      root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = focusableElements.indexOf(currentElement);
    
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    } else if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }
  
  // 첫 번째 포커스 가능 요소로 이동
  focusFirst(container?: HTMLElement) {
    const root = container || document.body;
    const firstElement = root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstElement?.focus();
  }
  
  // 마지막 포커스 가능 요소로 이동
  focusLast(container?: HTMLElement) {
    const root = container || document.body;
    const focusableElements = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const lastElement = focusableElements[focusableElements.length - 1];
    lastElement?.focus();
  }
}

/**
 * 키보드 네비게이션 관련 ARIA 속성 설정 유틸리티
 */
export function setAriaAttributes(
  element: HTMLElement,
  attributes: {
    role?: string;
    label?: string;
    labelledBy?: string;
    describedBy?: string;
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    current?: string | boolean;
    live?: 'polite' | 'assertive' | 'off';
  }
) {
  if (attributes.role) element.setAttribute('role', attributes.role);
  if (attributes.label) element.setAttribute('aria-label', attributes.label);
  if (attributes.labelledBy) element.setAttribute('aria-labelledby', attributes.labelledBy);
  if (attributes.describedBy) element.setAttribute('aria-describedby', attributes.describedBy);
  if (attributes.expanded !== undefined) element.setAttribute('aria-expanded', String(attributes.expanded));
  if (attributes.selected !== undefined) element.setAttribute('aria-selected', String(attributes.selected));
  if (attributes.disabled !== undefined) element.setAttribute('aria-disabled', String(attributes.disabled));
  if (attributes.hidden !== undefined) element.setAttribute('aria-hidden', String(attributes.hidden));
  if (attributes.current !== undefined) element.setAttribute('aria-current', String(attributes.current));
  if (attributes.live) element.setAttribute('aria-live', attributes.live);
}

/**
 * 접근성 알림 메시지 발생
 */
export function announceMessage(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}