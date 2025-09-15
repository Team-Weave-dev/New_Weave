/**
 * 위젯 색상 시스템 정의
 * 프로젝트 브랜드 컬러 기반 통일된 색상 체계
 * CSS 변수를 활용하여 테마 전환 지원
 */

export const widgetColors = {
  // Primary 색상 (Blue 그라데이션 기반) - CSS 변수 활용
  primary: {
    text: 'text-[var(--color-brand-primary-start)] dark:text-[var(--color-brand-primary-end)]',
    textHover: 'hover:text-[var(--color-brand-primary-start)] dark:hover:text-[var(--color-brand-primary-end)]',
    bg: 'bg-[var(--color-brand-primary-start)] dark:bg-[var(--color-brand-primary-end)]',
    bgLight: 'bg-[var(--color-brand-primary-start)]/10 dark:bg-[var(--color-brand-primary-end)]/20',
    bgGradient: 'bg-gradient-to-r from-[var(--color-brand-primary-start)] to-[var(--color-brand-primary-end)]',
    border: 'border-[var(--color-brand-primary-start)] dark:border-[var(--color-brand-primary-end)]',
    borderLight: 'border-[var(--color-brand-primary-start)]/20 dark:border-[var(--color-brand-primary-end)]/20',
    icon: 'text-[var(--color-brand-primary-end)]',
  },
  
  // Secondary 색상 (Teal 그라데이션 기반) - CSS 변수 활용
  secondary: {
    text: 'text-[var(--color-brand-secondary-start)] dark:text-[var(--color-brand-secondary-end)]',
    textHover: 'hover:text-[var(--color-brand-secondary-start)] dark:hover:text-[var(--color-brand-secondary-end)]',
    bg: 'bg-[var(--color-brand-secondary-start)] dark:bg-[var(--color-brand-secondary-end)]',
    bgLight: 'bg-[var(--color-brand-secondary-start)]/10 dark:bg-[var(--color-brand-secondary-end)]/20',
    bgGradient: 'bg-gradient-to-r from-[var(--color-brand-secondary-start)] to-[var(--color-brand-secondary-end)]',
    border: 'border-[var(--color-brand-secondary-start)] dark:border-[var(--color-brand-secondary-end)]',
    borderLight: 'border-[var(--color-brand-secondary-start)]/20 dark:border-[var(--color-brand-secondary-end)]/20',
    icon: 'text-[var(--color-brand-secondary-end)]',
  },
  
  // 상태 색상 - globals.css의 CSS 변수 참조
  status: {
    success: {
      text: 'text-[var(--color-status-success)]',
      bg: 'bg-[var(--color-status-success)]',
      bgLight: 'bg-[var(--color-status-success)]/10',
      icon: 'text-[var(--color-status-success)]',
    },
    warning: {
      text: 'text-[var(--color-status-warning)]',
      bg: 'bg-[var(--color-status-warning)]',
      bgLight: 'bg-[var(--color-status-warning)]/10',
      icon: 'text-[var(--color-status-warning)]',
    },
    error: {
      text: 'text-[var(--color-status-error)]',
      bg: 'bg-[var(--color-status-error)]',
      bgLight: 'bg-[var(--color-status-error)]/10',
      icon: 'text-[var(--color-status-error)]',
    },
    info: {
      text: 'text-[var(--color-status-info)]',
      bg: 'bg-[var(--color-status-info)]',
      bgLight: 'bg-[var(--color-status-info)]/10',
      icon: 'text-[var(--color-status-info)]',
    },
  },
  
  // 텍스트 색상 - globals.css의 CSS 변수 참조
  text: {
    primary: 'text-[var(--color-text-primary)]',
    secondary: 'text-[var(--color-text-secondary)]',
    tertiary: 'text-[var(--color-text-tertiary)]',
    muted: 'text-[var(--color-text-muted)]',
    accent: 'text-[var(--color-text-accent)]',
  },
  
  // 배경 색상 - globals.css의 CSS 변수 참조
  bg: {
    primary: 'bg-[var(--color-primary-background)]',
    surface: 'bg-[var(--color-primary-surface)]',
    surfaceSecondary: 'bg-[var(--color-primary-surfaceSecondary)]',
    hover: 'bg-[var(--color-primary-surfaceHover)]',
    pressed: 'bg-[var(--color-primary-surfacePressed)]',
  },
  
  // 테두리 색상 - globals.css의 CSS 변수 참조
  border: {
    primary: 'border-[var(--color-primary-border)]',
    secondary: 'border-[var(--color-primary-borderSecondary)]',
  },
  
  // 아이콘 색상
  icon: {
    default: 'text-[var(--color-text-secondary)]',
    primary: 'text-[var(--color-brand-primary-end)]',
    secondary: 'text-[var(--color-brand-secondary-end)]',
    muted: 'text-[var(--color-text-muted)]',
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