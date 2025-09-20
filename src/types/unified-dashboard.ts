/**
 * Unified Dashboard Types
 * 
 * 레거시와 iOS 스타일 대시보드 시스템 간의 통합 인터페이스
 * 양방향 변환 및 호환성 보장
 */

import { IOSStyleWidget, FlexibleWidgetPosition } from './ios-dashboard';
import { Widget, WidgetPosition } from './dashboard';

// WidgetDefinition 타입 별칭 (호환성을 위해)
export type WidgetDefinition = Widget;

/**
 * 통합 위젯 인터페이스
 * 두 시스템 모두를 지원하는 공통 데이터 구조
 */
export interface UnifiedWidget {
  // 공통 필드
  id: string;
  type: string;
  title: string;
  
  // 위치 정보 (두 시스템 호환)
  position: {
    // 레거시 시스템 위치
    legacy?: WidgetPosition;
    
    // iOS 스타일 시스템 위치
    ios?: FlexibleWidgetPosition;
    
    // 통합된 위치 정보
    unified: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  
  // 크기 정보
  size: {
    width: number;
    height: number;
  };
  
  // 설정 데이터
  config: Record<string, any>;
  
  // 위젯 데이터
  data?: any;
  
  // 메타데이터
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    version?: string;
  };
  
  // 상태 정보
  state?: {
    isLocked?: boolean;
    isVisible?: boolean;
    isLoading?: boolean;
    hasError?: boolean;
  };
}

/**
 * 통합 레이아웃 인터페이스
 */
export interface UnifiedLayout {
  id: string;
  name: string;
  description?: string;
  
  // 위젯 목록
  widgets: UnifiedWidget[];
  
  // 그리드 설정
  grid: {
    columns: number;
    rowHeight: number;
    gap: number;
    padding: number;
    breakpoints?: {
      sm?: { columns: number; maxWidth: number };
      md?: { columns: number; maxWidth: number };
      lg?: { columns: number; maxWidth: number };
      xl?: { columns: number; maxWidth: number };
    };
  };
  
  // 레이아웃 상태
  state?: {
    isLocked?: boolean;
    isDefault?: boolean;
    isTemplate?: boolean;
  };
  
  // 메타데이터
  metadata?: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    version?: string;
  };
}

/**
 * 통합 위젯 변환 유틸리티 클래스
 */
export class UnifiedWidgetConverter {
  /**
   * 레거시 위젯을 통합 위젯으로 변환
   */
  static fromLegacy(widget: Widget): UnifiedWidget {
    return {
      id: widget.id,
      type: widget.type,
      title: widget.config?.title || widget.type,
      position: {
        legacy: widget.position,
        unified: {
          x: widget.position?.x || 0,
          y: widget.position?.y || 0,
          width: widget.position?.width || 2,
          height: widget.position?.height || 2,
        },
      },
      size: {
        width: widget.position?.width || 2,
        height: widget.position?.height || 2,
      },
      config: widget.config || {},
      data: widget.config?.data,
      metadata: {
        createdAt: undefined,
        updatedAt: undefined,
      },
    };
  }
  
  /**
   * iOS 위젯을 통합 위젯으로 변환
   */
  static fromIOS(widget: IOSStyleWidget): UnifiedWidget {
    return {
      id: widget.id,
      type: widget.type,
      title: widget.title || widget.type,
      position: {
        ios: widget.position,
        unified: {
          x: widget.position?.x || widget.position?.gridColumnStart - 1 || 0,
          y: widget.position?.y || widget.position?.gridRowStart - 1 || 0,
          width: widget.size?.width || widget.position?.width || 2,
          height: widget.size?.height || widget.position?.height || 2,
        },
      },
      size: {
        width: widget.size?.width || widget.position?.width || 2,
        height: widget.size?.height || widget.position?.height || 2,
      },
      config: widget.config || {},
      data: widget.data,
      state: {
        isLocked: widget.isLocked || widget.locked,
        isVisible: widget.isVisible,
      },
    };
  }
  
  /**
   * 통합 위젯을 레거시 위젯으로 변환
   */
  static toLegacy(widget: UnifiedWidget): Widget {
    return {
      id: widget.id,
      type: widget.type,
      position: widget.position.legacy || {
        x: widget.position.unified.x,
        y: widget.position.unified.y,
        width: widget.position.unified.width,
        height: widget.position.unified.height,
      },
      config: {
        ...widget.config,
        title: widget.title,
        data: widget.data,
      },
      locked: widget.state?.isLocked,
    };
  }
  
  /**
   * 통합 위젯을 iOS 위젯으로 변환
   */
  static toIOS(widget: UnifiedWidget): IOSStyleWidget {
    const unified = widget.position.unified;
    
    const position = widget.position.ios || {
      x: unified.x,
      y: unified.y,
      gridColumn: `${unified.x + 1} / span ${unified.width}`,
      gridRow: `${unified.y + 1} / span ${unified.height}`,
      gridColumnStart: unified.x + 1,
      gridColumnEnd: unified.x + unified.width + 1,
      gridRowStart: unified.y + 1,
      gridRowEnd: unified.y + unified.height + 1,
      width: unified.width,
      height: unified.height,
    };
    
    return {
      id: widget.id,
      type: widget.type,
      title: widget.title,
      position: position as FlexibleWidgetPosition & { x?: number; y?: number; gridColumn?: string; gridRow?: string },
      size: widget.size,
      config: widget.config,
      data: widget.data,
      isLocked: widget.state?.isLocked || false,
      isVisible: widget.state?.isVisible !== false,
    };
  }
  
  /**
   * 배치 변환: 레거시 → 통합
   */
  static batchFromLegacy(widgets: Widget[]): UnifiedWidget[] {
    return widgets.map(widget => UnifiedWidgetConverter.fromLegacy(widget));
  }
  
  /**
   * 배치 변환: iOS → 통합
   */
  static batchFromIOS(widgets: IOSStyleWidget[]): UnifiedWidget[] {
    return widgets.map(widget => UnifiedWidgetConverter.fromIOS(widget));
  }
  
  /**
   * 배치 변환: 통합 → 레거시
   */
  static batchToLegacy(widgets: UnifiedWidget[]): Widget[] {
    return widgets.map(widget => UnifiedWidgetConverter.toLegacy(widget));
  }
  
  /**
   * 배치 변환: 통합 → iOS
   */
  static batchToIOS(widgets: UnifiedWidget[]): IOSStyleWidget[] {
    return widgets.map(widget => UnifiedWidgetConverter.toIOS(widget));
  }
}

/**
 * 위치 정규화 유틸리티
 */
export class PositionNormalizer {
  /**
   * 위치 정보 정규화
   */
  static normalize(position: any): { x: number; y: number; width: number; height: number } {
    if (!position) {
      return { x: 0, y: 0, width: 2, height: 2 };
    }
    
    // iOS 스타일 위치
    if (position.gridColumnStart && position.gridRowStart) {
      return {
        x: position.gridColumnStart - 1,
        y: position.gridRowStart - 1,
        width: (position.gridColumnEnd - position.gridColumnStart) || position.width || 2,
        height: (position.gridRowEnd - position.gridRowStart) || position.height || 2,
      };
    }
    
    // 레거시 스타일 위치
    if (typeof position.x === 'number' && typeof position.y === 'number') {
      return {
        x: position.x,
        y: position.y,
        width: position.width || 2,
        height: position.height || 2,
      };
    }
    
    // 기본값
    return { x: 0, y: 0, width: 2, height: 2 };
  }
  
  /**
   * 충돌 감지
   */
  static hasCollision(
    pos1: { x: number; y: number; width: number; height: number },
    pos2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      pos1.x + pos1.width <= pos2.x ||
      pos2.x + pos2.width <= pos1.x ||
      pos1.y + pos1.height <= pos2.y ||
      pos2.y + pos2.height <= pos1.y
    );
  }
  
  /**
   * 충돌 해결
   */
  static resolveCollisions(widgets: UnifiedWidget[]): UnifiedWidget[] {
    const resolved: UnifiedWidget[] = [];
    
    for (const widget of widgets) {
      const normalized = PositionNormalizer.normalize(widget.position.unified);
      let finalPos = { ...normalized };
      
      // 기존 위젯들과 충돌 체크
      let hasConflict = true;
      let attempts = 0;
      
      while (hasConflict && attempts < 100) {
        hasConflict = false;
        
        for (const existing of resolved) {
          const existingPos = PositionNormalizer.normalize(existing.position.unified);
          
          if (PositionNormalizer.hasCollision(finalPos, existingPos)) {
            hasConflict = true;
            // 오른쪽으로 이동
            finalPos.x = existingPos.x + existingPos.width;
            
            // 화면 밖으로 나가면 다음 줄로
            if (finalPos.x + finalPos.width > 12) {
              finalPos.x = 0;
              finalPos.y = existingPos.y + existingPos.height;
            }
            break;
          }
        }
        
        attempts++;
      }
      
      // 위치 업데이트
      widget.position.unified = finalPos;
      resolved.push(widget);
    }
    
    return resolved;
  }
}

// 헬퍼 함수들
export const convertToUnified = (widget: Widget | IOSStyleWidget): UnifiedWidget => {
  if ('position' in widget && 'gridColumn' in (widget.position as any)) {
    return UnifiedWidgetConverter.fromIOS(widget as IOSStyleWidget);
  } else {
    return UnifiedWidgetConverter.fromLegacy(widget as Widget);
  }
};

export const normalizePosition = (position: any) => {
  return PositionNormalizer.normalize(position);
};

export const resolveCollisions = (widgets: UnifiedWidget[]) => {
  return PositionNormalizer.resolveCollisions(widgets);
};