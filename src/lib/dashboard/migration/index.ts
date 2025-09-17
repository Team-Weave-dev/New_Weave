/**
 * 대시보드 위젯 마이그레이션 유틸리티
 * 
 * 위젯 레이아웃 데이터의 정규화, 검증, 마이그레이션을 위한 도구 모음
 */

export {
  migrateWidgetPositions,
  migrateGridSize,
  batchMigrateLayouts,
  restoreMigration,
  type MigrationOptions,
  type MigrationResult,
} from './normalizeWidgetPositions'

export { WidgetNormalizer } from '../widgetNormalizer'
export type {
  NormalizationReport,
  ValidationResult,
} from '../widgetNormalizer'