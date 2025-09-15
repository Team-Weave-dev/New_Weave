/**
 * 위젯 색상 시스템 정의
 * 프로젝트 브랜드 컬러 기반 통일된 색상 체계
 */

export const widgetColors = {
  // Primary 색상 (Blue 그라데이션 기반)
  primary: {
    text: 'text-[var(--color-brand-primary-start)]',
    textHover: 'hover:text-[var(--color-brand-primary-end)]',
    bg: 'bg-[var(--color-brand-primary-start)]',
    bgLight: 'bg-[var(--color-brand-primary-start)]/10',
    bgGradient: 'bg-gradient-to-r from-[var(--color-brand-primary-start)] to-[var(--color-brand-primary-end)]',
    border: 'border-[var(--color-brand-primary-start)]',
    borderLight: 'border-[var(--color-brand-primary-start)]/20',
    icon: 'text-[var(--color-brand-primary-end)]',
  },
  
  // Secondary 색상 (Teal 그라데이션 기반)
  secondary: {
    text: 'text-[var(--color-brand-secondary-start)]',
    textHover: 'hover:text-[var(--color-brand-secondary-end)]',
    bg: 'bg-[var(--color-brand-secondary-start)]',
    bgLight: 'bg-[var(--color-brand-secondary-start)]/10',
    bgGradient: 'bg-gradient-to-r from-[var(--color-brand-secondary-start)] to-[var(--color-brand-secondary-end)]',
    border: 'border-[var(--color-brand-secondary-start)]',
    borderLight: 'border-[var(--color-brand-secondary-start)]/20',
    icon: 'text-[var(--color-brand-secondary-end)]',
  },
  
  // 상태 색상
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
  
  // 텍스트 색상
  text: {
    primary: 'text-[var(--color-text-primary)]',
    secondary: 'text-[var(--color-text-secondary)]',
    tertiary: 'text-[var(--color-text-tertiary)]',
    muted: 'text-[var(--color-text-muted)]',
    accent: 'text-[var(--color-text-accent)]',
  },
  
  // 배경 색상
  bg: {
    primary: 'bg-[var(--color-primary-background)]',
    surface: 'bg-[var(--color-primary-surface)]',
    surfaceSecondary: 'bg-[var(--color-primary-surfaceSecondary)]',
    hover: 'bg-[var(--color-primary-surfaceHover)]',
    pressed: 'bg-[var(--color-primary-surfacePressed)]',
  },
  
  // 테두리 색상
  border: {
    primary: 'border-[var(--color-primary-border)]',
    secondary: 'border-[var(--color-primary-borderSecondary)]',
  },
  
  // 아이콘 색상
  icon: {
    default: 'text-[var(--color-text-tertiary)]',
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
    'var(--color-brand-primary-start)',
    'var(--color-brand-primary-end)',
  ],
  secondary: [
    'var(--color-brand-secondary-start)',
    'var(--color-brand-secondary-end)',
  ],
  extended: [
    'var(--color-brand-primary-start)',
    'var(--color-brand-secondary-start)',
    'var(--color-brand-primary-end)',
    'var(--color-brand-secondary-end)',
    'var(--color-status-success)',
    'var(--color-status-warning)',
  ],
}

/**
 * 그라데이션 클래스
 */
export const gradients = {
  primary: 'bg-gradient-to-r from-[var(--color-brand-primary-start)] to-[var(--color-brand-primary-end)]',
  secondary: 'bg-gradient-to-r from-[var(--color-brand-secondary-start)] to-[var(--color-brand-secondary-end)]',
  primaryHover: 'hover:bg-gradient-to-r hover:from-[var(--color-brand-primary-start)] hover:to-[var(--color-brand-primary-end)]',
  secondaryHover: 'hover:bg-gradient-to-r hover:from-[var(--color-brand-secondary-start)] hover:to-[var(--color-brand-secondary-end)]',
  text: {
    primary: 'bg-gradient-to-r from-[var(--color-brand-primary-start)] to-[var(--color-brand-primary-end)] bg-clip-text text-transparent',
    secondary: 'bg-gradient-to-r from-[var(--color-brand-secondary-start)] to-[var(--color-brand-secondary-end)] bg-clip-text text-transparent',
  },
}