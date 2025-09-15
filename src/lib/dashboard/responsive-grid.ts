/**
 * Responsive Grid System for Dashboard Widget System
 * Manages grid layout adaptation based on screen size
 */

import { useState, useEffect, useCallback } from 'react';
// WidgetPosition 타입 정의
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Breakpoint 정의
 */
export const BREAKPOINTS = {
  mobile: 640,    // < 640px: 모바일
  tablet: 1024,   // 640px - 1024px: 태블릿
  desktop: 1280,  // 1024px - 1280px: 데스크톱
  wide: 1920      // > 1280px: 와이드 스크린
} as const;

/**
 * 디바이스 타입
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * 그리드 크기 매핑
 */
export const GRID_SIZE_BY_DEVICE: Record<DeviceType, '2x2' | '3x3' | '4x4'> = {
  mobile: '2x2',
  tablet: '3x3',
  desktop: '3x3',
  wide: '4x4'
} as const;

/**
 * 현재 디바이스 타입 감지
 */
export const getDeviceType = (width: number): DeviceType => {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'desktop';
  return 'wide';
};

/**
 * 반응형 그리드 훅
 */
export const useResponsiveGrid = (
  defaultGridSize: '2x2' | '3x3' | '4x4' | '5x5' = '3x3'
) => {
  const [screenSize, setScreenSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [gridSize, setGridSize] = useState<'2x2' | '3x3' | '4x4' | '5x5'>(defaultGridSize);
  const [isResponsiveMode, setIsResponsiveMode] = useState(false);

  // 화면 크기 업데이트
  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setScreenSize({ width, height });
    
    const newDeviceType = getDeviceType(width);
    setDeviceType(newDeviceType);
    
    // 반응형 모드일 때만 그리드 크기 자동 조정
    if (isResponsiveMode) {
      setGridSize(GRID_SIZE_BY_DEVICE[newDeviceType]);
    }
  }, [isResponsiveMode]);

  useEffect(() => {
    // 초기 화면 크기 설정
    updateScreenSize();

    // 리사이즈 이벤트 리스너
    const handleResize = debounce(updateScreenSize, 250);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScreenSize]);

  // 반응형 모드 토글
  const toggleResponsiveMode = useCallback((enabled: boolean) => {
    setIsResponsiveMode(enabled);
    
    if (enabled) {
      // 반응형 모드 활성화 시 현재 디바이스에 맞는 그리드 크기로 변경
      const currentDevice = getDeviceType(window.innerWidth);
      setGridSize(GRID_SIZE_BY_DEVICE[currentDevice]);
    } else {
      // 반응형 모드 비활성화 시 기본 그리드 크기로 복원
      setGridSize(defaultGridSize);
    }
  }, [defaultGridSize]);

  // 수동 그리드 크기 설정 (반응형 모드 비활성화)
  const setManualGridSize = useCallback((size: '2x2' | '3x3' | '4x4' | '5x5') => {
    setIsResponsiveMode(false);
    setGridSize(size);
  }, []);

  return {
    screenSize,
    deviceType,
    gridSize,
    isResponsiveMode,
    toggleResponsiveMode,
    setManualGridSize
  };
};

/**
 * 위젯 위치 반응형 변환
 */
export const transformWidgetPosition = (
  position: WidgetPosition,
  fromGrid: '2x2' | '3x3' | '4x4',
  toGrid: '2x2' | '3x3' | '4x4'
): WidgetPosition => {
  if (fromGrid === toGrid) return position;

  const fromSize = parseInt(fromGrid[0]);
  const toSize = parseInt(toGrid[0]);

  // 비율 계산
  const scale = toSize / fromSize;

  // 새 위치 계산
  let newX = Math.floor(position.x * scale);
  let newY = Math.floor(position.y * scale);
  let newWidth = Math.max(1, Math.round(position.width * scale));
  let newHeight = Math.max(1, Math.round(position.height * scale));

  // 경계 체크
  if (newX + newWidth > toSize) {
    newWidth = toSize - newX;
  }
  if (newY + newHeight > toSize) {
    newHeight = toSize - newY;
  }

  // 최소 크기 보장
  if (newWidth < 1) newWidth = 1;
  if (newHeight < 1) newHeight = 1;

  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight
  };
};

/**
 * 위젯 배열 반응형 변환
 */
export const transformWidgetLayout = (
  widgets: Array<{ id: string; position: WidgetPosition }>,
  fromGrid: '2x2' | '3x3' | '4x4',
  toGrid: '2x2' | '3x3' | '4x4'
): Array<{ id: string; position: WidgetPosition }> => {
  if (fromGrid === toGrid) return widgets;

  const toSize = parseInt(toGrid[0]);
  const transformedWidgets = widgets.map(widget => ({
    id: widget.id,
    position: transformWidgetPosition(widget.position, fromGrid, toGrid)
  }));

  // 충돌 해결
  return resolveCollisions(transformedWidgets, toSize);
};

/**
 * 위젯 충돌 해결
 */
const resolveCollisions = (
  widgets: Array<{ id: string; position: WidgetPosition }>,
  gridSize: number
): Array<{ id: string; position: WidgetPosition }> => {
  const grid: string[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
  const resolvedWidgets = [...widgets];

  // 각 위젯을 배치하면서 충돌 체크
  for (let i = 0; i < resolvedWidgets.length; i++) {
    const widget = resolvedWidgets[i];
    const { x, y, width, height } = widget.position;
    
    // 충돌 체크
    let hasCollision = false;
    for (let row = y; row < Math.min(y + height, gridSize); row++) {
      for (let col = x; col < Math.min(x + width, gridSize); col++) {
        if (grid[row][col] !== '') {
          hasCollision = true;
          break;
        }
      }
      if (hasCollision) break;
    }

    if (hasCollision) {
      // 새로운 위치 찾기
      const newPosition = findAvailablePosition(grid, width, height, gridSize);
      if (newPosition) {
        widget.position = newPosition;
      } else {
        // 위치를 찾을 수 없으면 크기 축소
        widget.position = {
          x: 0,
          y: findFirstEmptyRow(grid, gridSize),
          width: Math.min(width, gridSize),
          height: 1
        };
      }
    }

    // 그리드에 위젯 마킹
    const finalPos = widget.position;
    for (let row = finalPos.y; row < Math.min(finalPos.y + finalPos.height, gridSize); row++) {
      for (let col = finalPos.x; col < Math.min(finalPos.x + finalPos.width, gridSize); col++) {
        grid[row][col] = widget.id;
      }
    }
  }

  return resolvedWidgets;
};

/**
 * 사용 가능한 위치 찾기
 */
const findAvailablePosition = (
  grid: string[][],
  width: number,
  height: number,
  gridSize: number
): WidgetPosition | null => {
  for (let y = 0; y <= gridSize - height; y++) {
    for (let x = 0; x <= gridSize - width; x++) {
      let available = true;
      
      for (let row = y; row < y + height; row++) {
        for (let col = x; col < x + width; col++) {
          if (grid[row][col] !== '') {
            available = false;
            break;
          }
        }
        if (!available) break;
      }
      
      if (available) {
        return { x, y, width, height };
      }
    }
  }
  
  return null;
};

/**
 * 첫 번째 빈 행 찾기
 */
const findFirstEmptyRow = (grid: string[][], gridSize: number): number => {
  for (let row = 0; row < gridSize; row++) {
    let isEmpty = true;
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] !== '') {
        isEmpty = false;
        break;
      }
    }
    if (isEmpty) return row;
  }
  return 0;
};

/**
 * 반응형 CSS 클래스 생성
 */
export const getResponsiveClasses = (deviceType: DeviceType): string => {
  const baseClasses = 'transition-all duration-300 ease-in-out';
  
  switch (deviceType) {
    case 'mobile':
      return `${baseClasses} gap-2 p-2`;
    case 'tablet':
      return `${baseClasses} gap-3 p-3`;
    case 'desktop':
      return `${baseClasses} gap-4 p-4`;
    case 'wide':
      return `${baseClasses} gap-4 p-6`;
    default:
      return baseClasses;
  }
};

/**
 * 컨테이너 최대 너비 계산
 */
export const getMaxContainerWidth = (deviceType: DeviceType): string => {
  switch (deviceType) {
    case 'mobile':
      return 'max-w-full';
    case 'tablet':
      return 'max-w-4xl';
    case 'desktop':
      return 'max-w-6xl';
    case 'wide':
      return 'max-w-7xl';
    default:
      return 'max-w-6xl';
  }
};

/**
 * 위젯 최소 크기 정의
 */
export const MIN_WIDGET_SIZE: Record<DeviceType, { width: number; height: number }> = {
  mobile: { width: 1, height: 1 },
  tablet: { width: 1, height: 1 },
  desktop: { width: 1, height: 1 },
  wide: { width: 1, height: 1 }
};

/**
 * 디바운스 유틸리티
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 터치 디바이스 감지
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * 모바일 디바이스 감지
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  return (
    /android/i.test(userAgent) ||
    /iPad|iPhone|iPod/.test(userAgent) ||
    /windows phone/i.test(userAgent)
  );
};

/**
 * 반응형 폰트 크기
 */
export const getResponsiveFontSize = (deviceType: DeviceType, baseSize: 'sm' | 'md' | 'lg'): string => {
  const sizeMap: Record<typeof baseSize, Record<DeviceType, string>> = {
    sm: {
      mobile: 'text-xs',
      tablet: 'text-sm',
      desktop: 'text-sm',
      wide: 'text-base'
    },
    md: {
      mobile: 'text-sm',
      tablet: 'text-base',
      desktop: 'text-base',
      wide: 'text-lg'
    },
    lg: {
      mobile: 'text-base',
      tablet: 'text-lg',
      desktop: 'text-xl',
      wide: 'text-2xl'
    }
  };
  
  return sizeMap[baseSize][deviceType];
};