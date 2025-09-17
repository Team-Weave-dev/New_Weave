/**
 * WCAG 2.1 AA 준수를 위한 접근성 유틸리티
 * Web Content Accessibility Guidelines Level AA
 */

/**
 * 색상 대비 계산 (WCAG 2.1 기준)
 */
export const wcagColorContrast = {
  /**
   * RGB 색상을 상대 휘도로 변환
   */
  getLuminance(rgb: { r: number; g: number; b: number }): number {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * HEX 색상을 RGB로 변환
   */
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  /**
   * 두 색상 간의 대비 비율 계산
   */
  getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      throw new Error('Invalid color format');
    }

    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * WCAG AA 기준 충족 여부 확인
   */
  meetsWCAG_AA(
    foreground: string,
    background: string,
    isLargeText = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    // 큰 텍스트: 3:1, 일반 텍스트: 4.5:1
    const requiredRatio = isLargeText ? 3 : 4.5;
    return ratio >= requiredRatio;
  },

  /**
   * WCAG AAA 기준 충족 여부 확인
   */
  meetsWCAG_AAA(
    foreground: string,
    background: string,
    isLargeText = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    // 큰 텍스트: 4.5:1, 일반 텍스트: 7:1
    const requiredRatio = isLargeText ? 4.5 : 7;
    return ratio >= requiredRatio;
  },

  /**
   * 색상 대비 개선 제안
   */
  suggestBetterColor(
    foreground: string,
    background: string,
    targetRatio = 4.5
  ): string {
    const currentRatio = this.getContrastRatio(foreground, background);
    
    if (currentRatio >= targetRatio) {
      return foreground; // 이미 충족
    }

    const bgRgb = this.hexToRgb(background);
    const fgRgb = this.hexToRgb(foreground);
    
    if (!bgRgb || !fgRgb) {
      return foreground;
    }

    const bgLuminance = this.getLuminance(bgRgb);
    
    // 배경이 어두우면 전경을 밝게, 배경이 밝으면 전경을 어둡게
    const shouldLighten = bgLuminance < 0.5;

    // 단계적으로 색상 조정
    let adjustedRgb = { ...fgRgb };
    let step = shouldLighten ? 10 : -10;
    let iterations = 0;
    const maxIterations = 25;

    while (iterations < maxIterations) {
      adjustedRgb.r = Math.max(0, Math.min(255, adjustedRgb.r + step));
      adjustedRgb.g = Math.max(0, Math.min(255, adjustedRgb.g + step));
      adjustedRgb.b = Math.max(0, Math.min(255, adjustedRgb.b + step));

      const newRatio = (this.getLuminance(adjustedRgb) + 0.05) / (bgLuminance + 0.05);
      
      if (newRatio >= targetRatio) {
        break;
      }

      iterations++;
    }

    return `#${adjustedRgb.r.toString(16).padStart(2, '0')}${adjustedRgb.g
      .toString(16)
      .padStart(2, '0')}${adjustedRgb.b.toString(16).padStart(2, '0')}`;
  },
};

/**
 * 포커스 관리 유틸리티
 */
export const wcagFocusManagement = {
  /**
   * 포커스 가능한 요소 선택자
   */
  focusableSelectors: [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', '),

  /**
   * 컨테이너 내의 포커스 가능한 요소 가져오기
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = container.querySelectorAll<HTMLElement>(
      this.focusableSelectors
    );
    return Array.from(elements).filter(
      (el) => el.offsetWidth > 0 && el.offsetHeight > 0
    );
  },

  /**
   * 포커스 트랩 설정
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // 첫 요소에 포커스
    firstElement.focus();

    // 클린업 함수 반환
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * 포커스 복원
   */
  saveFocusRestore(): () => void {
    const previouslyFocused = document.activeElement as HTMLElement;
    
    return () => {
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  },
};

/**
 * 스킵 링크 유틸리티
 */
export const wcagSkipLinks = {
  /**
   * 스킵 링크 생성
   */
  createSkipLink(targetId: string, text: string): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.className = 'skip-link';
    link.textContent = text;
    
    // 스킵 링크 스타일 (CSS로 처리되어야 함)
    link.setAttribute('style', `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `);
    
    // 포커스 시 표시
    link.addEventListener('focus', () => {
      link.setAttribute('style', `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
        padding: 0.5rem 1rem;
        background: var(--color-background-primary);
        color: var(--color-text-primary);
        text-decoration: underline;
        border: 2px solid var(--color-brand-primary-start);
      `);
    });
    
    link.addEventListener('blur', () => {
      link.setAttribute('style', `
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `);
    });
    
    // 클릭 시 대상으로 이동 및 포커스
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView();
        target.focus();
        target.setAttribute('tabindex', '-1');
      }
    });
    
    return link;
  },

  /**
   * 스킵 링크 컨테이너 생성
   */
  createSkipLinksContainer(): HTMLElement {
    const container = document.createElement('nav');
    container.setAttribute('aria-label', '스킵 네비게이션');
    container.className = 'skip-links-container';
    
    const links = [
      { id: 'main-content', text: '주요 콘텐츠로 건너뛰기' },
      { id: 'main-navigation', text: '주 메뉴로 건너뛰기' },
      { id: 'search', text: '검색으로 건너뛰기' },
      { id: 'footer', text: '푸터로 건너뛰기' },
    ];
    
    links.forEach(({ id, text }) => {
      const link = this.createSkipLink(id, text);
      container.appendChild(link);
    });
    
    return container;
  },
};

/**
 * WCAG 텍스트 대체 유틸리티
 */
export const wcagTextAlternatives = {
  /**
   * 이미지에 대체 텍스트 추가
   */
  addImageAlt(img: HTMLImageElement, altText: string): void {
    img.alt = altText;
    img.setAttribute('role', 'img');
  },

  /**
   * 장식용 이미지 마크업
   */
  markDecorativeImage(img: HTMLImageElement): void {
    img.alt = '';
    img.setAttribute('role', 'presentation');
    img.setAttribute('aria-hidden', 'true');
  },

  /**
   * 복잡한 이미지에 긴 설명 추가
   */
  addLongDescription(
    img: HTMLImageElement,
    descriptionId: string
  ): void {
    img.setAttribute('aria-describedby', descriptionId);
  },

  /**
   * 아이콘 버튼에 레이블 추가
   */
  addIconButtonLabel(
    button: HTMLButtonElement,
    label: string
  ): void {
    button.setAttribute('aria-label', label);
  },
};

/**
 * WCAG 시간 제한 유틸리티
 */
export const wcagTimeManagement = {
  /**
   * 세션 타임아웃 경고
   */
  createTimeoutWarning(
    remainingMinutes: number,
    onExtend: () => void,
    onEnd: () => void
  ): HTMLElement {
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-labelledby', 'timeout-title');
    dialog.setAttribute('aria-describedby', 'timeout-desc');
    
    dialog.innerHTML = `
      <h2 id="timeout-title">세션 종료 경고</h2>
      <p id="timeout-desc">
        ${remainingMinutes}분 후 세션이 종료됩니다. 
        계속하시려면 연장 버튼을 클릭하세요.
      </p>
      <button id="extend-session">세션 연장</button>
      <button id="end-session">종료</button>
    `;
    
    dialog.querySelector('#extend-session')?.addEventListener('click', onExtend);
    dialog.querySelector('#end-session')?.addEventListener('click', onEnd);
    
    return dialog;
  },

  /**
   * 자동 새로고침 제어
   */
  pauseAutoRefresh(): { resume: () => void; stop: () => void } {
    let isPaused = true;
    let refreshTimer: NodeJS.Timeout | null = null;
    
    return {
      resume: () => {
        isPaused = false;
        // 새로고침 로직
      },
      stop: () => {
        isPaused = true;
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }
      },
    };
  },
};

/**
 * WCAG 에러 처리 유틸리티
 */
export const wcagErrorHandling = {
  /**
   * 폼 에러 메시지 생성
   */
  createErrorMessage(
    fieldId: string,
    message: string
  ): HTMLElement {
    const error = document.createElement('span');
    error.id = `${fieldId}-error`;
    error.className = 'error-message';
    error.setAttribute('role', 'alert');
    error.setAttribute('aria-live', 'polite');
    error.textContent = message;
    
    // 필드와 에러 메시지 연결
    const field = document.getElementById(fieldId);
    if (field) {
      field.setAttribute('aria-describedby', error.id);
      field.setAttribute('aria-invalid', 'true');
    }
    
    return error;
  },

  /**
   * 에러 요약 생성
   */
  createErrorSummary(errors: { fieldId: string; message: string }[]): HTMLElement {
    const summary = document.createElement('div');
    summary.setAttribute('role', 'alert');
    summary.setAttribute('aria-live', 'assertive');
    summary.className = 'error-summary';
    
    const heading = document.createElement('h2');
    heading.textContent = '입력 오류가 있습니다';
    summary.appendChild(heading);
    
    const list = document.createElement('ul');
    errors.forEach(({ fieldId, message }) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${fieldId}`;
      link.textContent = message;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const field = document.getElementById(fieldId);
        if (field) {
          field.focus();
          field.scrollIntoView({ behavior: 'smooth' });
        }
      });
      item.appendChild(link);
      list.appendChild(item);
    });
    
    summary.appendChild(list);
    return summary;
  },
};

/**
 * WCAG 준수 검사 도구
 */
export const wcagCompliance = {
  /**
   * 페이지 접근성 검사
   */
  auditPage(): {
    passed: string[];
    failed: string[];
    warnings: string[];
  } {
    const results = {
      passed: [] as string[],
      failed: [] as string[],
      warnings: [] as string[],
    };

    // 이미지 대체 텍스트 검사
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.alt && !img.getAttribute('role')) {
        results.failed.push(`Image missing alt text: ${img.src}`);
      } else if (img.alt) {
        results.passed.push(`Image has alt text: ${img.src}`);
      }
    });

    // 폼 레이블 검사
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const id = input.id;
      const label = document.querySelector(`label[for="${id}"]`);
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      if (!label && !ariaLabel && !ariaLabelledby) {
        results.failed.push(`Form element missing label: ${id || (input as HTMLInputElement).name}`);
      } else {
        results.passed.push(`Form element has label: ${id || (input as HTMLInputElement).name}`);
      }
    });

    // 색상 대비 검사 (샘플)
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    textElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;
      
      if (color !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
        // 실제 대비 검사는 RGB 값 변환 필요
        results.warnings.push('Color contrast check needed for text elements');
      }
    });

    // 헤딩 계층 검사
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.substring(1));
      if (level - previousLevel > 1) {
        results.warnings.push(`Heading level skipped: ${heading.tagName} after H${previousLevel}`);
      }
      previousLevel = level;
    });

    // 키보드 접근성 검사
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    interactiveElements.forEach((el) => {
      const tabindex = el.getAttribute('tabindex');
      if (tabindex && parseInt(tabindex) > 0) {
        results.warnings.push('Positive tabindex found - consider using 0 or -1');
      }
    });

    return results;
  },

  /**
   * 접근성 보고서 생성
   */
  generateReport(): string {
    const audit = this.auditPage();
    
    return `
WCAG 2.1 AA Compliance Report
==============================
Passed: ${audit.passed.length} checks
Failed: ${audit.failed.length} checks
Warnings: ${audit.warnings.length} checks

Failed Checks:
${audit.failed.map((f) => `- ${f}`).join('\n')}

Warnings:
${audit.warnings.map((w) => `- ${w}`).join('\n')}

Recommendations:
1. Fix all failed checks immediately
2. Review and address warnings
3. Test with screen readers
4. Verify keyboard navigation
5. Check color contrast ratios
    `;
  },
};