/**
 * TransitionController - iOS/Legacy 스타일 전환 애니메이션 관리
 * 
 * Phase 3.2: UX 개선의 일부로 구현
 * - 부드러운 전환 애니메이션
 * - 상태 보존 전환
 * - 사용자 설정 가능한 애니메이션
 */

import { IOSStyleWidget } from '@/types/ios-dashboard';
import { WidgetDefinition } from '@/types/dashboard';

export interface TransitionConfig {
  duration: number;           // 애니메이션 지속 시간 (초)
  animation: 'crossfade' | 'slide' | 'scale' | 'flip' | 'none';
  preserveState: boolean;      // 상태 유지 여부
  easing?: string;            // 이징 함수
  stagger?: number;           // 위젯별 지연 시간
}

export interface TransitionState {
  isTransitioning: boolean;
  fromStyle: 'ios' | 'legacy';
  toStyle: 'ios' | 'legacy';
  progress: number;           // 0 ~ 1
  startTime: number;
  endTime: number;
  widgets: Map<string, WidgetTransitionData>;
}

interface WidgetTransitionData {
  widgetId: string;
  fromPosition: { x: number; y: number; width: number; height: number };
  toPosition: { x: number; y: number; width: number; height: number };
  opacity: number;
  scale: number;
  rotation: number;
}

export class TransitionController {
  private static instance: TransitionController;
  private state: TransitionState | null = null;
  private config: Map<string, TransitionConfig>;
  private animationFrame: number | null = null;
  private callbacks: Set<(state: TransitionState) => void>;
  
  // 기본 전환 설정 (계획서에 따라 설정)
  private readonly DEFAULT_CONFIGS: Record<string, TransitionConfig> = {
    legacyToIOS: {
      duration: 0.5,
      animation: 'crossfade',
      preserveState: true,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      stagger: 0.05,
    },
    iosToLegacy: {
      duration: 0.3,
      animation: 'slide',
      preserveState: true,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      stagger: 0.03,
    },
    quickSwitch: {
      duration: 0.2,
      animation: 'scale',
      preserveState: true,
      easing: 'ease-out',
    },
    instant: {
      duration: 0,
      animation: 'none',
      preserveState: true,
    },
  };
  
  private constructor() {
    this.config = new Map(Object.entries(this.DEFAULT_CONFIGS));
    this.callbacks = new Set();
  }
  
  static getInstance(): TransitionController {
    if (!TransitionController.instance) {
      TransitionController.instance = new TransitionController();
    }
    return TransitionController.instance;
  }
  
  /**
   * 전환 시작
   */
  startTransition(
    fromStyle: 'ios' | 'legacy',
    toStyle: 'ios' | 'legacy',
    widgets: IOSStyleWidget[] | WidgetDefinition[],
    configKey?: string
  ): Promise<void> {
    return new Promise((resolve) => {
      // 이미 전환 중이면 취소
      if (this.state?.isTransitioning) {
        this.cancelTransition();
      }
      
      // 전환 설정 가져오기
      const transitionKey = configKey || `${fromStyle}To${toStyle.charAt(0).toUpperCase() + toStyle.slice(1)}`;
      const config = this.config.get(transitionKey) || this.DEFAULT_CONFIGS.legacyToIOS;
      
      // 즉시 전환
      if (config.duration === 0 || config.animation === 'none') {
        resolve();
        return;
      }
      
      // 전환 상태 초기화
      const now = performance.now();
      this.state = {
        isTransitioning: true,
        fromStyle,
        toStyle,
        progress: 0,
        startTime: now,
        endTime: now + (config.duration * 1000),
        widgets: new Map(),
      };
      
      // 위젯별 전환 데이터 생성
      widgets.forEach((widget, index) => {
        const widgetId = 'id' in widget ? widget.id : widget.instanceId;
        const staggerDelay = (config.stagger || 0) * index * 1000;
        
        this.state!.widgets.set(widgetId, {
          widgetId,
          fromPosition: this.getWidgetPosition(widget, fromStyle),
          toPosition: this.getWidgetPosition(widget, toStyle),
          opacity: 1,
          scale: 1,
          rotation: 0,
        });
      });
      
      // 애니메이션 시작
      this.animate(config, resolve);
    });
  }
  
  /**
   * 전환 취소
   */
  cancelTransition(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.state = null;
  }
  
  /**
   * 애니메이션 실행
   */
  private animate(config: TransitionConfig, onComplete: () => void): void {
    const update = () => {
      if (!this.state) {
        onComplete();
        return;
      }
      
      const now = performance.now();
      const elapsed = now - this.state.startTime;
      const duration = config.duration * 1000;
      
      if (elapsed >= duration) {
        // 전환 완료
        this.state.progress = 1;
        this.state.isTransitioning = false;
        this.notifyCallbacks();
        onComplete();
        return;
      }
      
      // 진행률 계산
      this.state.progress = Math.min(elapsed / duration, 1);
      
      // 이징 적용
      const easedProgress = this.applyEasing(this.state.progress, config.easing);
      
      // 위젯별 애니메이션 업데이트
      this.state.widgets.forEach((widget, widgetId) => {
        const staggerIndex = Array.from(this.state!.widgets.keys()).indexOf(widgetId);
        const staggerDelay = (config.stagger || 0) * staggerIndex * 1000;
        const widgetProgress = Math.max(0, Math.min(1, (elapsed - staggerDelay) / duration));
        const easedWidgetProgress = this.applyEasing(widgetProgress, config.easing);
        
        // 애니메이션 타입별 처리
        switch (config.animation) {
          case 'crossfade':
            widget.opacity = this.state!.fromStyle === 'ios' 
              ? 1 - easedWidgetProgress 
              : easedWidgetProgress;
            break;
            
          case 'slide':
            const slideDistance = 100; // px
            const slideDirection = this.state!.toStyle === 'ios' ? -1 : 1;
            const translateX = slideDistance * slideDirection * (1 - easedWidgetProgress);
            widget.fromPosition.x += translateX;
            break;
            
          case 'scale':
            widget.scale = this.state!.fromStyle === 'ios'
              ? 1 - (easedWidgetProgress * 0.2)  // 80% 크기로 축소
              : 0.8 + (easedWidgetProgress * 0.2); // 80%에서 100%로 확대
            break;
            
          case 'flip':
            widget.rotation = easedWidgetProgress * 180;
            break;
        }
        
        // 위치 보간
        const fromPos = widget.fromPosition;
        const toPos = widget.toPosition;
        const currentPos = {
          x: fromPos.x + (toPos.x - fromPos.x) * easedWidgetProgress,
          y: fromPos.y + (toPos.y - fromPos.y) * easedWidgetProgress,
          width: fromPos.width + (toPos.width - fromPos.width) * easedWidgetProgress,
          height: fromPos.height + (toPos.height - fromPos.height) * easedWidgetProgress,
        };
        
        widget.fromPosition = currentPos;
      });
      
      // 콜백 호출
      this.notifyCallbacks();
      
      // 다음 프레임
      this.animationFrame = requestAnimationFrame(update);
    };
    
    this.animationFrame = requestAnimationFrame(update);
  }
  
  /**
   * 이징 함수 적용
   */
  private applyEasing(progress: number, easing?: string): number {
    if (!easing) return progress;
    
    // 간단한 이징 함수들
    switch (easing) {
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return progress * (2 - progress);
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : -1 + (4 - 2 * progress) * progress;
      default:
        // cubic-bezier는 근사값 사용
        if (easing.includes('cubic-bezier')) {
          // 기본 ease-out 곡선 근사
          return progress * (2 - progress);
        }
        return progress;
    }
  }
  
  /**
   * 위젯 위치 가져오기
   */
  private getWidgetPosition(
    widget: IOSStyleWidget | WidgetDefinition, 
    style: 'ios' | 'legacy'
  ): { x: number; y: number; width: number; height: number } {
    if (style === 'ios') {
      // iOS 스타일 위치
      const iosWidget = widget as IOSStyleWidget;
      return {
        x: (iosWidget.position?.gridColumnStart || 1) * 100,
        y: (iosWidget.position?.gridRowStart || 1) * 100,
        width: (iosWidget.size?.width || 2) * 100,
        height: (iosWidget.size?.height || 2) * 100,
      };
    } else {
      // Legacy 스타일 위치
      const legacyWidget = widget as WidgetDefinition;
      return {
        x: legacyWidget.gridProps?.x || 0,
        y: legacyWidget.gridProps?.y || 0,
        width: legacyWidget.gridProps?.w || 2,
        height: legacyWidget.gridProps?.h || 2,
      };
    }
  }
  
  /**
   * 콜백 등록
   */
  onTransition(callback: (state: TransitionState) => void): () => void {
    this.callbacks.add(callback);
    
    // 언마운트 시 제거할 수 있도록 함수 반환
    return () => {
      this.callbacks.delete(callback);
    };
  }
  
  /**
   * 콜백 알림
   */
  private notifyCallbacks(): void {
    if (!this.state) return;
    
    this.callbacks.forEach(callback => {
      callback(this.state!);
    });
  }
  
  /**
   * 전환 설정 업데이트
   */
  updateConfig(key: string, config: TransitionConfig): void {
    this.config.set(key, config);
  }
  
  /**
   * 현재 전환 상태
   */
  getCurrentState(): TransitionState | null {
    return this.state;
  }
  
  /**
   * 전환 중인지 확인
   */
  isTransitioning(): boolean {
    return this.state?.isTransitioning || false;
  }
  
  /**
   * 전환 진행률
   */
  getProgress(): number {
    return this.state?.progress || 0;
  }
  
  /**
   * 위젯별 스타일 가져오기
   */
  getWidgetStyles(widgetId: string): React.CSSProperties | null {
    if (!this.state || !this.state.widgets.has(widgetId)) {
      return null;
    }
    
    const widget = this.state.widgets.get(widgetId)!;
    
    return {
      opacity: widget.opacity,
      transform: `
        translateX(${widget.fromPosition.x}px)
        translateY(${widget.fromPosition.y}px)
        scale(${widget.scale})
        rotateY(${widget.rotation}deg)
      `,
      width: `${widget.fromPosition.width}px`,
      height: `${widget.fromPosition.height}px`,
      transition: 'none', // 수동 애니메이션 사용
      willChange: 'transform, opacity',
    };
  }
}

// 싱글톤 인스턴스 export
export const transitionController = TransitionController.getInstance();