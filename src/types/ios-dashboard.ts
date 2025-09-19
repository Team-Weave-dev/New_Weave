/**
 * iOS 스타일 대시보드 타입 정의
 * 유연한 그리드 시스템과 iOS 스타일 편집 모드를 위한 타입 시스템
 */

/**
 * 유연한 위젯 위치 정보
 * CSS Grid 기반의 동적 위치 시스템
 */
export interface FlexibleWidgetPosition {
  /** 그리드 열 시작 위치 (1-based) */
  gridColumnStart: number;
  /** 그리드 열 끝 위치 (1-based) */
  gridColumnEnd: number;
  /** 그리드 행 시작 위치 (1-based) */
  gridRowStart: number;
  /** 그리드 행 끝 위치 (1-based) */
  gridRowEnd: number;
  /** 위젯 너비 (컬럼 수) */
  width: number;
  /** 위젯 높이 (행 수) */
  height: number;
  /** 최소 너비 제약 (컬럼 수) */
  minWidth?: number;
  /** 최대 너비 제약 (컬럼 수) */
  maxWidth?: number;
  /** 최소 높이 제약 (행 수) */
  minHeight?: number;
  /** 최대 높이 제약 (행 수) */
  maxHeight?: number;
}

/**
 * 편집 모드 상태
 */
export interface EditModeState {
  /** 편집 모드 활성화 여부 */
  isActive: boolean;
  /** 현재 선택된 위젯 ID */
  selectedWidgetId: string | null;
  /** 드래그 중인 위젯 ID */
  draggingWidgetId: string | null;
  /** 크기 조절 중인 위젯 ID */
  resizingWidgetId: string | null;
  /** 편집 모드 진입 시간 */
  enteredAt: Date | null;
  /** 변경사항 존재 여부 */
  hasChanges: boolean;
  /** 편집 모드 타입 */
  mode: 'move' | 'resize' | 'delete' | null;
  /** 실행 취소 히스토리 */
  history: LayoutSnapshot[];
  /** 히스토리 현재 인덱스 */
  historyIndex: number;
}

/**
 * iOS 스타일 위젯 인터페이스
 * 독립적인 위젯 타입 정의
 */
export interface IOSStyleWidget {
  /** 위젯 고유 ID */
  id: string;
  /** 위젯 타입 */
  type: string;
  /** 유연한 위치 정보 */
  position: FlexibleWidgetPosition;
  /** 위젯 상태 */
  state: WidgetState;
  /** 위젯 애니메이션 설정 */
  animation?: WidgetAnimation;
  /** 위젯 메타데이터 */
  metadata?: WidgetMetadata;
  /** 위젯 설정 */
  config?: Record<string, any>;
  /** 사용자 정의 설정 */
  customSettings?: Record<string, any>;
  /** 위젯 잠금 여부 */
  locked?: boolean;
}

/**
 * 위젯 상태
 */
export interface WidgetState {
  /** 위젯 잠금 여부 (편집 불가) */
  isLocked: boolean;
  /** 위젯 숨김 여부 */
  isHidden: boolean;
  /** 위젯 로딩 중 */
  isLoading: boolean;
  /** 위젯 에러 상태 */
  hasError: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 마지막 업데이트 시간 */
  lastUpdated?: Date;
}

/**
 * 위젯 애니메이션 설정
 */
export interface WidgetAnimation {
  /** Wiggle 애니메이션 활성화 */
  wiggle: boolean;
  /** 드래그 애니메이션 설정 */
  dragAnimation?: {
    scale: number;
    opacity: number;
    transition: string;
  };
  /** 리사이즈 애니메이션 설정 */
  resizeAnimation?: {
    duration: number;
    easing: string;
  };
}

/**
 * 위젯 메타데이터
 */
export interface WidgetMetadata {
  /** 위젯 생성 시간 */
  createdAt: Date;
  /** 위젯 수정 시간 */
  updatedAt: Date;
  /** 위젯 버전 */
  version: string;
  /** 위젯 카테고리 */
  category?: string;
  /** 위젯 태그 */
  tags?: string[];
  /** 위젯 설명 */
  description?: string;
  /** 위젯 아이콘 */
  icon?: string;
}

/**
 * 레이아웃 스냅샷 (실행 취소/다시 실행용)
 */
export interface LayoutSnapshot {
  /** 스냅샷 ID */
  id: string;
  /** 스냅샷 생성 시간 */
  timestamp: Date;
  /** 위젯 레이아웃 데이터 */
  widgets: IOSStyleWidget[];
  /** 스냅샷 설명 */
  description?: string;
}

/**
 * 그리드 설정
 */
export interface GridConfig {
  /** 그리드 컬럼 수 */
  columns: number;
  /** 그리드 행 높이 (픽셀) */
  rowHeight: number;
  /** 그리드 간격 (픽셀) */
  gap: number;
  /** 그리드 패딩 (픽셀) */
  padding: number;
  /** 컨테이너 너비 (픽셀) - 픽셀 좌표 변환에 사용 */
  containerWidth?: number;
  /** 반응형 중단점 설정 */
  breakpoints: {
    mobile: number;  // 2 columns
    tablet: number;  // 4 columns
    desktop: number; // 6 columns
    wide: number;    // 8 columns
  };
}

/**
 * 드래그 앤 드롭 이벤트
 */
export interface DragDropEvent {
  /** 드래그 시작 위젯 ID */
  sourceId: string;
  /** 드롭 대상 위치 */
  targetPosition: {
    gridColumnStart: number;
    gridRowStart: number;
  };
  /** 드래그 타입 */
  type: 'move' | 'resize' | 'add';
  /** 드래그 상태 */
  state: 'start' | 'drag' | 'end' | 'cancel';
  /** 마우스/터치 위치 */
  clientPosition: {
    x: number;
    y: number;
  };
}

/**
 * 충돌 감지 결과
 */
export interface CollisionResult {
  /** 충돌 발생 여부 */
  hasCollision: boolean;
  /** 충돌한 위젯 ID 목록 */
  collidingWidgets: string[];
  /** 충돌 영역 */
  collisionArea?: {
    gridColumnStart: number;
    gridColumnEnd: number;
    gridRowStart: number;
    gridRowEnd: number;
  };
  /** 추천 대체 위치 */
  suggestedPosition?: FlexibleWidgetPosition;
}

/**
 * 위젯 크기 조절 핸들 위치
 */
export type ResizeHandle = 
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * 크기 조절 이벤트
 */
export interface ResizeEvent {
  /** 위젯 ID */
  widgetId: string;
  /** 조절 핸들 위치 */
  handle: ResizeHandle;
  /** 새로운 크기 */
  newSize: {
    width: number;
    height: number;
  };
  /** 델타 값 */
  delta: {
    dx: number;
    dy: number;
  };
}

/**
 * 레이아웃 템플릿
 */
export interface LayoutTemplate {
  /** 템플릿 ID */
  id: string;
  /** 템플릿 이름 */
  name: string;
  /** 템플릿 설명 */
  description?: string;
  /** 템플릿 미리보기 이미지 */
  preview?: string;
  /** 위젯 레이아웃 구성 */
  layout: {
    widgetType: string;
    position: FlexibleWidgetPosition;
    defaultSettings?: Record<string, any>;
  }[];
  /** 템플릿 카테고리 */
  category?: string;
  /** 추천 여부 */
  isRecommended?: boolean;
}

/**
 * 터치/마우스 제스처 이벤트
 */
export interface GestureEvent {
  /** 제스처 타입 */
  type: 'tap' | 'longpress' | 'swipe' | 'pinch';
  /** 대상 위젯 ID */
  targetId?: string;
  /** 제스처 지속 시간 (밀리초) */
  duration?: number;
  /** 제스처 거리 (스와이프, 핀치) */
  distance?: number;
  /** 제스처 방향 (스와이프) */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** 제스처 스케일 (핀치) */
  scale?: number;
}

/**
 * 기존 타입과의 호환성을 위한 매핑 함수
 */
export const mapLegacyToFlexible = (legacy: any): FlexibleWidgetPosition => {
  return {
    gridColumnStart: legacy.x + 1,
    gridColumnEnd: legacy.x + legacy.width + 1,
    gridRowStart: legacy.y + 1,
    gridRowEnd: legacy.y + legacy.height + 1,
    width: legacy.width,
    height: legacy.height,
    minWidth: legacy.minWidth,
    maxWidth: legacy.maxWidth,
    minHeight: legacy.minHeight,
    maxHeight: legacy.maxHeight,
  };
};

/**
 * 유연한 위치를 기존 형식으로 변환
 */
export const mapFlexibleToLegacy = (flexible: FlexibleWidgetPosition): any => {
  return {
    x: flexible.gridColumnStart - 1,
    y: flexible.gridRowStart - 1,
    width: flexible.width,
    height: flexible.height,
    minWidth: flexible.minWidth,
    maxWidth: flexible.maxWidth,
    minHeight: flexible.minHeight,
    maxHeight: flexible.maxHeight,
  };
};