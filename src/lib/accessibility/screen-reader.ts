/**
 * 스크린 리더 지원을 위한 유틸리티
 */

/**
 * ARIA 레이블 생성 유틸리티
 */
export const ariaLabels = {
  /**
   * 위젯용 ARIA 레이블 생성
   */
  widget: (type: string, title?: string) => ({
    'aria-label': `${title || type} 위젯`,
    'aria-describedby': `${type}-widget-description`,
    role: 'region',
  }),

  /**
   * 버튼용 ARIA 레이블 생성
   */
  button: (action: string, context?: string) => ({
    'aria-label': context ? `${context} ${action}` : action,
    role: 'button',
    tabIndex: 0,
  }),

  /**
   * 입력 필드용 ARIA 레이블 생성
   */
  input: (label: string, required?: boolean, error?: string) => ({
    'aria-label': label,
    'aria-required': required,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${label}-error` : undefined,
  }),

  /**
   * 리스트용 ARIA 레이블 생성
   */
  list: (label: string, count?: number) => ({
    'aria-label': `${label} 목록${count !== undefined ? `, ${count}개 항목` : ''}`,
    role: 'list',
  }),

  /**
   * 리스트 아이템용 ARIA 레이블 생성
   */
  listItem: (position: number, total: number) => ({
    'aria-setsize': total,
    'aria-posinset': position,
    role: 'listitem',
  }),

  /**
   * 모달/다이얼로그용 ARIA 레이블 생성
   */
  dialog: (title: string, description?: string) => ({
    'aria-label': title,
    'aria-describedby': description ? `${title}-description` : undefined,
    'aria-modal': true,
    role: 'dialog',
  }),

  /**
   * 진행률 표시용 ARIA 레이블 생성
   */
  progress: (label: string, value: number, max: number = 100) => ({
    'aria-label': label,
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-valuetext': `${Math.round((value / max) * 100)}% 완료`,
    role: 'progressbar',
  }),

  /**
   * 탭 네비게이션용 ARIA 레이블 생성
   */
  tabs: {
    tablist: (label: string) => ({
      'aria-label': label,
      role: 'tablist',
    }),
    tab: (label: string, selected: boolean, index: number) => ({
      'aria-label': label,
      'aria-selected': selected,
      'aria-controls': `tabpanel-${index}`,
      id: `tab-${index}`,
      role: 'tab',
      tabIndex: selected ? 0 : -1,
    }),
    tabpanel: (index: number, hidden: boolean) => ({
      'aria-labelledby': `tab-${index}`,
      id: `tabpanel-${index}`,
      role: 'tabpanel',
      hidden,
      tabIndex: 0,
    }),
  },

  /**
   * 상태 표시용 ARIA 레이블 생성
   */
  status: (status: 'success' | 'error' | 'warning' | 'info', message: string) => ({
    'aria-live': status === 'error' ? 'assertive' : 'polite',
    'aria-atomic': true,
    role: status === 'error' ? 'alert' : 'status',
    'aria-label': message,
  }),
};

/**
 * Live Region 관리 클래스
 */
export class LiveRegionManager {
  private static instance: LiveRegionManager;
  private container: HTMLElement | null = null;
  private regions: Map<string, HTMLElement> = new Map();

  private constructor() {
    if (typeof document !== 'undefined') {
      this.initContainer();
    }
  }

  static getInstance(): LiveRegionManager {
    if (!LiveRegionManager.instance) {
      LiveRegionManager.instance = new LiveRegionManager();
    }
    return LiveRegionManager.instance;
  }

  private initContainer() {
    this.container = document.getElementById('live-regions');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'live-regions';
      this.container.className = 'sr-only';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    }
  }

  /**
   * Live region 생성
   */
  createRegion(
    id: string,
    politeness: 'polite' | 'assertive' = 'polite',
    atomic: boolean = true
  ): HTMLElement {
    if (!this.container) {
      this.initContainer();
    }

    let region = this.regions.get(id);
    if (!region) {
      region = document.createElement('div');
      region.id = `live-region-${id}`;
      region.setAttribute('aria-live', politeness);
      region.setAttribute('aria-atomic', String(atomic));
      region.className = 'sr-only';
      this.container!.appendChild(region);
      this.regions.set(id, region);
    }
    return region;
  }

  /**
   * Live region 메시지 업데이트
   */
  announce(
    message: string,
    politeness: 'polite' | 'assertive' = 'polite',
    regionId: string = 'default'
  ) {
    const region = this.createRegion(regionId, politeness);
    
    // 스크린 리더가 변경을 감지할 수 있도록 잠시 비운 후 설정
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);

    // 일정 시간 후 메시지 제거
    setTimeout(() => {
      region.textContent = '';
    }, 5000);
  }

  /**
   * 알림 메시지 발송 (assertive)
   */
  alert(message: string) {
    this.announce(message, 'assertive', 'alerts');
  }

  /**
   * 상태 메시지 발송 (polite)
   */
  status(message: string) {
    this.announce(message, 'polite', 'status');
  }

  /**
   * Live region 제거
   */
  removeRegion(id: string) {
    const region = this.regions.get(id);
    if (region) {
      region.remove();
      this.regions.delete(id);
    }
  }

  /**
   * 모든 Live region 제거
   */
  clearAll() {
    this.regions.forEach(region => region.remove());
    this.regions.clear();
  }
}

/**
 * 스크린 리더 전용 텍스트 클래스명
 */
export const screenReaderOnly = 'sr-only';

/**
 * 스크린 리더 전용 스타일
 */
export const screenReaderOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .sr-only-focusable:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`;

/**
 * 상태 변경 알림 헬퍼
 */
export class StateAnnouncer {
  private liveRegion: LiveRegionManager;

  constructor() {
    this.liveRegion = LiveRegionManager.getInstance();
  }

  /**
   * 위젯 상태 변경 알림
   */
  announceWidgetState(widgetName: string, state: string) {
    this.liveRegion.status(`${widgetName} 위젯이 ${state} 상태로 변경되었습니다.`);
  }

  /**
   * 데이터 로딩 상태 알림
   */
  announceLoading(context: string, isLoading: boolean) {
    const message = isLoading
      ? `${context} 데이터를 불러오는 중입니다.`
      : `${context} 데이터 로딩이 완료되었습니다.`;
    this.liveRegion.status(message);
  }

  /**
   * 작업 완료 알림
   */
  announceCompletion(action: string, success: boolean, error?: string) {
    if (success) {
      this.liveRegion.status(`${action}이(가) 성공적으로 완료되었습니다.`);
    } else {
      this.liveRegion.alert(
        `${action} 실패: ${error || '알 수 없는 오류가 발생했습니다.'}`
      );
    }
  }

  /**
   * 카운트 변경 알림
   */
  announceCount(context: string, count: number, total?: number) {
    const message = total
      ? `${context}: ${count}개 / 전체 ${total}개`
      : `${context}: ${count}개`;
    this.liveRegion.status(message);
  }

  /**
   * 선택 변경 알림
   */
  announceSelection(item: string, selected: boolean) {
    const message = selected
      ? `${item}이(가) 선택되었습니다.`
      : `${item} 선택이 해제되었습니다.`;
    this.liveRegion.status(message);
  }

  /**
   * 페이지 변경 알림
   */
  announcePage(current: number, total: number) {
    this.liveRegion.status(`페이지 ${current} / ${total}`);
  }

  /**
   * 검색 결과 알림
   */
  announceSearchResults(query: string, count: number) {
    const message =
      count > 0
        ? `"${query}" 검색 결과: ${count}개 항목을 찾았습니다.`
        : `"${query}" 검색 결과가 없습니다.`;
    this.liveRegion.status(message);
  }

  /**
   * 정렬 변경 알림
   */
  announceSort(field: string, direction: 'asc' | 'desc') {
    const dirText = direction === 'asc' ? '오름차순' : '내림차순';
    this.liveRegion.status(`${field}로 ${dirText} 정렬되었습니다.`);
  }

  /**
   * 필터 적용 알림
   */
  announceFilter(filterName: string, active: boolean) {
    const message = active
      ? `${filterName} 필터가 적용되었습니다.`
      : `${filterName} 필터가 제거되었습니다.`;
    this.liveRegion.status(message);
  }
}

/**
 * 스크린 리더 훅 및 컴포넌트에서 사용할 수 있는 인스턴스
 */
export const announcer = new StateAnnouncer();
export const liveRegion = LiveRegionManager.getInstance();