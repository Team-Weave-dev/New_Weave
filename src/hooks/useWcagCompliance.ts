import { useEffect, useRef, useCallback } from 'react';
import { 
  wcagColorContrast, 
  wcagFocusManagement, 
  wcagCompliance 
} from '@/lib/accessibility/wcag';

/**
 * WCAG 색상 대비 검증 Hook
 */
export function useColorContrast() {
  const checkContrast = useCallback((
    foreground: string,
    background: string,
    isLargeText = false
  ) => {
    return wcagColorContrast.meetsWCAG_AA(foreground, background, isLargeText);
  }, []);

  const suggestColor = useCallback((
    foreground: string,
    background: string,
    targetRatio = 4.5
  ) => {
    return wcagColorContrast.suggestBetterColor(foreground, background, targetRatio);
  }, []);

  return { checkContrast, suggestColor };
}

/**
 * 포커스 트랩 Hook
 */
export function useFocusTrap(isActive = false) {
  const containerRef = useRef<HTMLElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      // 이전 포커스 저장
      const restoreFocus = wcagFocusManagement.saveFocusRestore();
      
      // 포커스 트랩 활성화
      cleanupRef.current = wcagFocusManagement.trapFocus(containerRef.current);
      
      // 클린업 시 포커스 복원
      return () => {
        if (cleanupRef.current) {
          cleanupRef.current();
        }
        restoreFocus();
      };
    }
  }, [isActive]);

  return containerRef;
}

/**
 * 스킵 링크 관리 Hook
 */
export function useSkipLinks() {
  useEffect(() => {
    // body 시작 부분에 스킵 링크 컨테이너가 없으면 추가
    const existingContainer = document.querySelector('.skip-links-container');
    if (existingContainer) {
      return;
    }

    const skipLinksContainer = document.createElement('nav');
    skipLinksContainer.className = 'skip-links-container';
    skipLinksContainer.setAttribute('aria-label', '스킵 네비게이션');
    
    // 스킵 링크 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      .skip-links-container {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10000;
      }
    `;
    
    document.head.appendChild(style);
    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
    
    return () => {
      skipLinksContainer.remove();
      style.remove();
    };
  }, []);
}

/**
 * ARIA 라이브 리전 Hook
 */
export function useAriaLive() {
  const announce = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    // 메시지 발표 후 제거
    setTimeout(() => {
      liveRegion.remove();
    }, 1000);
  }, []);

  return { announce };
}

/**
 * 키보드 네비게이션 향상 Hook
 */
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    arrowNavigation?: boolean;
    homeEndKeys?: boolean;
    escapeKey?: () => void;
  } = {}
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = wcagFocusManagement.getFocusableElements(container);
      const currentIndex = focusableElements.findIndex(el => el === document.activeElement);

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          if (options.arrowNavigation && currentIndex < focusableElements.length - 1) {
            e.preventDefault();
            focusableElements[currentIndex + 1].focus();
          }
          break;
          
        case 'ArrowUp':
        case 'ArrowLeft':
          if (options.arrowNavigation && currentIndex > 0) {
            e.preventDefault();
            focusableElements[currentIndex - 1].focus();
          }
          break;
          
        case 'Home':
          if (options.homeEndKeys && focusableElements.length > 0) {
            e.preventDefault();
            focusableElements[0].focus();
          }
          break;
          
        case 'End':
          if (options.homeEndKeys && focusableElements.length > 0) {
            e.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
          }
          break;
          
        case 'Escape':
          if (options.escapeKey) {
            e.preventDefault();
            options.escapeKey();
          }
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, options]);
}

/**
 * 페이지 접근성 감사 Hook
 */
export function useAccessibilityAudit(runOnMount = false) {
  const runAudit = useCallback(() => {
    const results = wcagCompliance.auditPage();
    const report = wcagCompliance.generateReport();
    
    // 개발 모드에서만 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 WCAG 2.1 AA 접근성 감사 결과');
      console.log(`✅ 통과: ${results.passed.length}개`);
      console.log(`❌ 실패: ${results.failed.length}개`);
      console.log(`⚠️ 경고: ${results.warnings.length}개`);
      
      if (results.failed.length > 0) {
        console.group('실패 항목');
        results.failed.forEach(item => console.error(item));
        console.groupEnd();
      }
      
      if (results.warnings.length > 0) {
        console.group('경고 항목');
        results.warnings.forEach(item => console.warn(item));
        console.groupEnd();
      }
      
      console.log('\n📋 전체 보고서:\n', report);
      console.groupEnd();
    }
    
    return results;
  }, []);

  useEffect(() => {
    if (runOnMount) {
      // 페이지 로드 완료 후 감사 실행
      const timer = setTimeout(runAudit, 1000);
      return () => clearTimeout(timer);
    }
  }, [runOnMount, runAudit]);

  return { runAudit };
}

/**
 * 모션 감소 설정 감지 Hook
 */
export function useReducedMotion() {
  const getPrefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  return getPrefersReducedMotion();
}

/**
 * 고대비 모드 감지 Hook
 */
export function useHighContrast() {
  const getPrefersHighContrast = useCallback(() => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }, []);

  return getPrefersHighContrast();
}