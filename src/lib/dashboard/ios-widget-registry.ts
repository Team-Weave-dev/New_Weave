/**
 * iOS Widget Registry
 * 
 * iOS 스타일 대시보드와 기존 위젯 시스템을 연결하는 통합 레이어
 * - 레거시 위젯을 iOS 스타일로 래핑
 * - 양방향 데이터 변환 지원
 * - 호환성 보장
 */

import React from 'react';
import { WidgetRegistry } from './WidgetRegistry';
import { IOSStyleWidget } from '@/types/ios-dashboard';
import { Widget } from '@/types/dashboard';

// WidgetDefinition 타입 별칭 (호환성을 위해)
type WidgetDefinition = Widget;

export interface IOSWidgetProps {
  id: string;
  type: string;
  title?: string;
  config?: Record<string, any>;
  data?: any;
  size?: {
    width: number;
    height: number;
  };
  position?: {
    x: number;
    y: number;
  };
  isEditMode?: boolean;
}

export class IOSWidgetRegistry {
  private static instance: IOSWidgetRegistry;
  private widgetMap = new Map<string, React.ComponentType<any>>();
  private legacyRegistry: any; // 지연 초기화
  
  private constructor() {
    // legacyRegistry는 나중에 초기화
  }
  
  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): IOSWidgetRegistry {
    if (!IOSWidgetRegistry.instance) {
      IOSWidgetRegistry.instance = new IOSWidgetRegistry();
    }
    return IOSWidgetRegistry.instance;
  }
  
  /**
   * 레거시 레지스트리 가져오기 (지연 초기화)
   */
  private getLegacyRegistry() {
    if (!this.legacyRegistry) {
      this.legacyRegistry = WidgetRegistry;
    }
    return this.legacyRegistry;
  }
  
  /**
   * 기존 WidgetRegistry와 브릿지
   */
  public syncWithLegacyRegistry(): void {
    console.log('[IOSWidgetRegistry] Syncing with legacy registry...');
    
    // 레거시 레지스트리의 모든 위젯 가져오기
    const allWidgetTypes = this.getLegacyRegistry().getAllWidgetTypes();
    
    allWidgetTypes.forEach(type => {
      const component = this.getLegacyRegistry().getComponent(type);
      if (component) {
        // 레거시 위젯을 iOS 스타일로 래핑
        const wrappedComponent = this.wrapLegacyWidget(component, type);
        this.register(type, wrappedComponent);
      }
    });
    
    console.log(`[IOSWidgetRegistry] Synced ${allWidgetTypes.length} widgets`);
  }
  
  /**
   * 레거시 위젯을 iOS 스타일로 래핑
   */
  private wrapLegacyWidget(
    LegacyComponent: React.ComponentType<any>,
    widgetType: string
  ): React.ComponentType<IOSWidgetProps> {
    const WrappedComponent = React.memo((props: IOSWidgetProps) => {
      // iOS props를 레거시 props로 변환
      const legacyProps = this.convertToLegacyProps(props);
      
      // 호환성 래퍼 컴포넌트
      return React.createElement(
        'div',
        {
          className: 'ios-widget-compatibility-wrapper',
          'data-widget-type': widgetType,
          'data-widget-id': props.id,
          style: {
            width: '100%',
            height: '100%',
            position: 'relative',
          }
        },
        React.createElement(LegacyComponent, legacyProps)
      );
    });
    
    // Display name 설정
    WrappedComponent.displayName = `IOSWrapped(${widgetType})`;
    
    return WrappedComponent;
  }
  
  /**
   * iOS props를 레거시 props로 변환
   */
  private convertToLegacyProps(iosProps: IOSWidgetProps): any {
    return {
      // 기본 속성
      id: iosProps.id,
      type: iosProps.type,
      
      // 설정 데이터
      ...iosProps.config,
      
      // 위젯 데이터
      data: iosProps.data,
      
      // 크기 정보
      size: iosProps.size || { width: 2, height: 2 },
      
      // 편집 모드
      isEditMode: iosProps.isEditMode || false,
      
      // 제목
      title: iosProps.title || iosProps.config?.title || 'Widget',
      
      // 위치 정보 (레거시 시스템에서 필요한 경우)
      position: iosProps.position,
    };
  }
  
  /**
   * 레거시 위젯 정의를 iOS 위젯으로 변환
   */
  public convertLegacyToIOS(widget: WidgetDefinition): IOSStyleWidget {
    return {
      id: widget.id,
      type: widget.type,
      title: widget.config?.title || widget.type,
      position: {
        x: widget.position?.x || 0,
        y: widget.position?.y || 0,
      },
      size: {
        width: widget.size?.width || 2,
        height: widget.size?.height || 2,
      },
      config: widget.config || {},
      data: widget.data,
      isLocked: false,
      isVisible: true,
    };
  }
  
  /**
   * iOS 위젯을 레거시 위젯으로 변환
   */
  public convertIOSToLegacy(widget: IOSStyleWidget): WidgetDefinition {
    return {
      id: widget.id,
      type: widget.type,
      position: {
        x: widget.position.x,
        y: widget.position.y,
        width: widget.size.width,
        height: widget.size.height,
      },
      size: {
        width: widget.size.width,
        height: widget.size.height,
      },
      config: {
        ...widget.config,
        title: widget.title,
      },
      data: widget.data,
    };
  }
  
  /**
   * 위젯 컴포넌트 등록
   */
  public register(type: string, component: React.ComponentType<any>): void {
    this.widgetMap.set(type, component);
  }
  
  /**
   * 위젯 컴포넌트 가져오기
   */
  public getWidget(type: string): React.ComponentType<any> | undefined {
    // 먼저 iOS 레지스트리에서 찾기
    let component = this.widgetMap.get(type);
    
    // 없으면 레거시 레지스트리에서 찾아서 래핑
    if (!component) {
      const legacyComponent = this.getLegacyRegistry().getComponent(type);
      if (legacyComponent) {
        component = this.wrapLegacyWidget(legacyComponent, type);
        this.register(type, component);
      }
    }
    
    return component;
  }
  
  /**
   * 모든 위젯 타입 가져오기
   */
  public getAllWidgetTypes(): string[] {
    const iosTypes = Array.from(this.widgetMap.keys());
    const legacyTypes = this.getLegacyRegistry().getAllWidgetTypes();
    
    // 중복 제거하여 합치기
    const allTypes = new Set([...iosTypes, ...legacyTypes]);
    return Array.from(allTypes);
  }
  
  /**
   * 위젯 타입 존재 확인
   */
  public hasWidget(type: string): boolean {
    return this.widgetMap.has(type) || this.getLegacyRegistry().hasWidget(type);
  }
  
  /**
   * 레지스트리 초기화
   */
  public clear(): void {
    this.widgetMap.clear();
    // 다시 동기화
    this.syncWithLegacyRegistry();
  }
  
  /**
   * 배치 데이터 일괄 변환
   */
  public batchConvertToIOS(widgets: WidgetDefinition[]): IOSStyleWidget[] {
    return widgets.map(widget => this.convertLegacyToIOS(widget));
  }
  
  /**
   * 배치 데이터 일괄 변환 (역방향)
   */
  public batchConvertToLegacy(widgets: IOSStyleWidget[]): WidgetDefinition[] {
    return widgets.map(widget => this.convertIOSToLegacy(widget));
  }

  /**
   * 레거시 위젯으로부터 iOS 위젯 등록
   */
  public async registerFromLegacy(type: string, legacyComponent: React.ComponentType<any>): Promise<void> {
    return new Promise((resolve) => {
      try {
        const wrappedComponent = this.wrapLegacyWidget(legacyComponent, type);
        this.register(type, wrappedComponent);
        console.log(`[IOSWidgetRegistry] Successfully migrated widget: ${type}`);
        resolve();
      } catch (error) {
        console.error(`[IOSWidgetRegistry] Failed to migrate widget: ${type}`, error);
        throw error;
      }
    });
  }
}

// 싱글톤 인스턴스 export
export const iosWidgetRegistry = IOSWidgetRegistry.getInstance();

// 헬퍼 함수들
export const getIOSWidget = (type: string) => {
  return iosWidgetRegistry.getWidget(type);
};

export const convertToIOSWidget = (widget: WidgetDefinition): IOSStyleWidget => {
  return iosWidgetRegistry.convertLegacyToIOS(widget);
};

export const convertToLegacyWidget = (widget: IOSStyleWidget): WidgetDefinition => {
  return iosWidgetRegistry.convertIOSToLegacy(widget);
};