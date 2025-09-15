/**
 * 위젯 색상 시스템 정의
 * 프로젝트 브랜드 컬러 기반 통일된 색상 체계
 */

export const widgetColors = {
  // Primary 색상 (Blue 그라데이션 기반)
  primary: {
    text: 'text-blue-600 dark:text-blue-400',
    textHover: 'hover:text-blue-700 dark:hover:text-blue-300',
    bg: 'bg-blue-600 dark:bg-blue-500',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    bgGradient: 'bg-gradient-to-r from-blue-600 to-blue-400',
    border: 'border-blue-600 dark:border-blue-400',
    borderLight: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
  },
  
  // Secondary 색상 (Teal 그라데이션 기반)
  secondary: {
    text: 'text-teal-600 dark:text-teal-400',
    textHover: 'hover:text-teal-700 dark:hover:text-teal-300',
    bg: 'bg-teal-600 dark:bg-teal-500',
    bgLight: 'bg-teal-50 dark:bg-teal-900/20',
    bgGradient: 'bg-gradient-to-r from-teal-500 to-cyan-400',
    border: 'border-teal-600 dark:border-teal-400',
    borderLight: 'border-teal-200 dark:border-teal-800',
    icon: 'text-teal-500 dark:text-teal-400',
  },
  
  // 상태 색상
  status: {
    success: {
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-600 dark:bg-green-500',
      bgLight: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-500 dark:text-green-400',
    },
    warning: {
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-600 dark:bg-amber-500',
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-500 dark:text-amber-400',
    },
    error: {
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-600 dark:bg-red-500',
      bgLight: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-500 dark:text-red-400',
    },
    info: {
      text: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-600 dark:bg-cyan-500',
      bgLight: 'bg-cyan-50 dark:bg-cyan-900/20',
      icon: 'text-cyan-500 dark:text-cyan-400',
    },
  },
  
  // 텍스트 색상
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    tertiary: 'text-gray-500 dark:text-gray-500',
    muted: 'text-gray-400 dark:text-gray-600',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  
  // 배경 색상
  bg: {
    primary: 'bg-white dark:bg-gray-900',
    surface: 'bg-white dark:bg-gray-800',
    surfaceSecondary: 'bg-gray-50 dark:bg-gray-800',
    hover: 'bg-gray-100 dark:bg-gray-700',
    pressed: 'bg-gray-200 dark:bg-gray-600',
  },
  
  // 테두리 색상
  border: {
    primary: 'border-gray-200 dark:border-gray-700',
    secondary: 'border-gray-100 dark:border-gray-800',
  },
  
  // 아이콘 색상
  icon: {
    default: 'text-gray-500 dark:text-gray-400',
    primary: 'text-blue-500 dark:text-blue-400',
    secondary: 'text-teal-500 dark:text-teal-400',
    muted: 'text-gray-400 dark:text-gray-600',
  },
}

/**
 * 위젯 카테고리별 색상 매핑
 */
export const widgetCategoryColors = {
  project: widgetColors.primary,
  tax: widgetColors.secondary,
  analytics: {
    ...widgetColors.primary,
    accent: widgetColors.secondary.text,
  },
  productivity: widgetColors.secondary,
  custom: widgetColors.primary,
}

/**
 * 차트 색상 팔레트
 */
export const chartColors = {
  primary: [
    '#3b82f6',  // blue-500
    '#60a5fa',  // blue-400
  ],
  secondary: [
    '#14b8a6',  // teal-500
    '#06b6d4',  // cyan-500
  ],
  extended: [
    '#3b82f6',  // blue-500
    '#14b8a6',  // teal-500
    '#60a5fa',  // blue-400
    '#06b6d4',  // cyan-500
    '#10b981',  // green-500
    '#f59e0b',  // amber-500
  ],
}

/**
 * 그라데이션 클래스
 */
export const gradients = {
  primary: 'bg-gradient-to-r from-blue-600 to-blue-400',
  secondary: 'bg-gradient-to-r from-teal-500 to-cyan-400',
  primaryHover: 'hover:bg-gradient-to-r hover:from-blue-700 hover:to-blue-500',
  secondaryHover: 'hover:bg-gradient-to-r hover:from-teal-600 hover:to-cyan-500',
  text: {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent',
    secondary: 'bg-gradient-to-r from-teal-500 to-cyan-400 bg-clip-text text-transparent',
  },
}