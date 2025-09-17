/**
 * 스크린 리더 지원을 위한 React Hook
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  ariaLabels,
  LiveRegionManager,
  StateAnnouncer,
  announcer,
  liveRegion,
} from '../screen-reader';

/**
 * 스크린 리더 지원을 위한 메인 훅
 */
export function useScreenReader() {
  const announcerRef = useRef<StateAnnouncer>(announcer);
  const liveRegionRef = useRef<LiveRegionManager>(liveRegion);

  /**
   * 메시지 알림
   */
  const announce = useCallback(
    (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
      liveRegionRef.current.announce(message, politeness);
    },
    []
  );

  /**
   * 알림 (assertive)
   */
  const alert = useCallback((message: string) => {
    liveRegionRef.current.alert(message);
  }, []);

  /**
   * 상태 메시지 (polite)
   */
  const status = useCallback((message: string) => {
    liveRegionRef.current.status(message);
  }, []);

  /**
   * 위젯 상태 변경 알림
   */
  const announceWidgetState = useCallback(
    (widgetName: string, state: string) => {
      announcerRef.current.announceWidgetState(widgetName, state);
    },
    []
  );

  /**
   * 로딩 상태 알림
   */
  const announceLoading = useCallback(
    (context: string, isLoading: boolean) => {
      announcerRef.current.announceLoading(context, isLoading);
    },
    []
  );

  /**
   * 작업 완료 알림
   */
  const announceCompletion = useCallback(
    (action: string, success: boolean, error?: string) => {
      announcerRef.current.announceCompletion(action, success, error);
    },
    []
  );

  /**
   * 카운트 변경 알림
   */
  const announceCount = useCallback(
    (context: string, count: number, total?: number) => {
      announcerRef.current.announceCount(context, count, total);
    },
    []
  );

  /**
   * 선택 변경 알림
   */
  const announceSelection = useCallback(
    (item: string, selected: boolean) => {
      announcerRef.current.announceSelection(item, selected);
    },
    []
  );

  /**
   * 검색 결과 알림
   */
  const announceSearchResults = useCallback(
    (query: string, count: number) => {
      announcerRef.current.announceSearchResults(query, count);
    },
    []
  );

  return {
    announce,
    alert,
    status,
    announceWidgetState,
    announceLoading,
    announceCompletion,
    announceCount,
    announceSelection,
    announceSearchResults,
    ariaLabels,
  };
}

/**
 * Live Region을 사용하는 훅
 */
export function useLiveRegion(
  regionId: string,
  politeness: 'polite' | 'assertive' = 'polite'
) {
  const regionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const manager = LiveRegionManager.getInstance();
    regionRef.current = manager.createRegion(regionId, politeness);

    return () => {
      manager.removeRegion(regionId);
    };
  }, [regionId, politeness]);

  const announce = useCallback((message: string) => {
    if (regionRef.current) {
      regionRef.current.textContent = '';
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);
    }
  }, []);

  return { announce };
}

/**
 * ARIA 속성을 동적으로 생성하는 훅
 */
export function useAriaProps(
  type: 'widget' | 'button' | 'input' | 'list' | 'dialog' | 'progress',
  props: any
) {
  const getAriaProps = useCallback(() => {
    switch (type) {
      case 'widget':
        return ariaLabels.widget(props.type, props.title);
      case 'button':
        return ariaLabels.button(props.action, props.context);
      case 'input':
        return ariaLabels.input(props.label, props.required, props.error);
      case 'list':
        return ariaLabels.list(props.label, props.count);
      case 'dialog':
        return ariaLabels.dialog(props.title, props.description);
      case 'progress':
        return ariaLabels.progress(props.label, props.value, props.max);
      default:
        return {};
    }
  }, [type, props]);

  return getAriaProps();
}

/**
 * 포커스 알림 훅
 */
export function useFocusAnnouncement(elementRef: React.RefObject<HTMLElement>) {
  const { announce } = useScreenReader();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleFocus = () => {
      const label = element.getAttribute('aria-label');
      const description = element.getAttribute('aria-describedby');
      
      if (label) {
        let message = label;
        if (description) {
          const descElement = document.getElementById(description);
          if (descElement) {
            message += `. ${descElement.textContent}`;
          }
        }
        announce(message);
      }
    };

    element.addEventListener('focus', handleFocus);
    return () => {
      element.removeEventListener('focus', handleFocus);
    };
  }, [announce, elementRef]);
}

/**
 * 리스트 네비게이션 알림 훅
 */
export function useListNavigation(
  items: any[],
  currentIndex: number,
  itemLabel: (item: any) => string
) {
  const { announce } = useScreenReader();
  const previousIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (previousIndexRef.current !== currentIndex && items[currentIndex]) {
      const item = items[currentIndex];
      const label = itemLabel(item);
      announce(`${currentIndex + 1} / ${items.length}. ${label}`);
    }
    previousIndexRef.current = currentIndex;
  }, [currentIndex, items, itemLabel, announce]);
}

/**
 * 폼 검증 알림 훅
 */
export function useFormValidation(errors: Record<string, string>) {
  const { alert } = useScreenReader();
  const previousErrorsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const newErrors = Object.entries(errors).filter(
      ([field, message]) => !previousErrorsRef.current[field] && message
    );

    if (newErrors.length > 0) {
      const errorMessages = newErrors
        .map(([field, message]) => `${field}: ${message}`)
        .join('. ');
      alert(`폼 검증 오류: ${errorMessages}`);
    }

    previousErrorsRef.current = { ...errors };
  }, [errors, alert]);
}

/**
 * 드래그 앤 드롭 알림 훅
 */
export function useDragAndDropAnnouncements() {
  const { announce } = useScreenReader();

  const announceDragStart = useCallback(
    (item: string) => {
      announce(`${item}을(를) 드래그하기 시작했습니다. 화살표 키로 이동하고 Enter로 놓으세요.`);
    },
    [announce]
  );

  const announceDragOver = useCallback(
    (target: string) => {
      announce(`${target} 위에 있습니다.`);
    },
    [announce]
  );

  const announceDrop = useCallback(
    (item: string, target: string) => {
      announce(`${item}을(를) ${target}에 놓았습니다.`);
    },
    [announce]
  );

  const announceDragCancel = useCallback(() => {
    announce('드래그가 취소되었습니다.');
  }, [announce]);

  return {
    announceDragStart,
    announceDragOver,
    announceDrop,
    announceDragCancel,
  };
}

/**
 * 페이지네이션 알림 훅
 */
export function usePaginationAnnouncements(
  currentPage: number,
  totalPages: number,
  itemsPerPage: number,
  totalItems: number
) {
  const { announce } = useScreenReader();
  const previousPageRef = useRef(currentPage);

  useEffect(() => {
    if (previousPageRef.current !== currentPage) {
      const startItem = (currentPage - 1) * itemsPerPage + 1;
      const endItem = Math.min(currentPage * itemsPerPage, totalItems);
      announce(
        `페이지 ${currentPage} / ${totalPages}. ${startItem}번째부터 ${endItem}번째 항목을 표시 중입니다. 전체 ${totalItems}개 항목.`
      );
    }
    previousPageRef.current = currentPage;
  }, [currentPage, totalPages, itemsPerPage, totalItems, announce]);
}