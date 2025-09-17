import { WidgetNormalizer } from '../widgetNormalizer'
import { Widget, GridSize } from '@/types/dashboard'

/**
 * 위젯 위치 정규화 마이그레이션 스크립트
 * 
 * 이 스크립트는 기존 위젯 레이아웃 데이터를 정규화하여
 * 위치 데이터의 일관성을 보장하고 충돌을 해결합니다.
 * 
 * @example
 * // 사용 예시
 * const result = await migrateWidgetPositions(widgets, '3x3')
 * console.log(result.report)
 */

export interface MigrationOptions {
  gridSize?: GridSize
  autoFix?: boolean
  preserveLayout?: boolean
  compactMode?: 'none' | 'vertical' | 'horizontal' | 'both'
  strictMode?: boolean
  dryRun?: boolean
}

export interface MigrationResult {
  success: boolean
  widgets: Widget[]
  report: {
    totalProcessed: number
    totalFixed: number
    errors: number
    warnings: number
    changes: Array<{
      widgetId: string
      field: string
      oldValue: any
      newValue: any
    }>
    issues: string[]
    recommendations: string[]
  }
  backupData?: Widget[]
}

/**
 * 위젯 위치 정규화 마이그레이션 실행
 */
export async function migrateWidgetPositions(
  widgets: Widget[],
  gridSize: GridSize = '3x3',
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const {
    autoFix = true,
    preserveLayout = true,
    compactMode = 'vertical',
    strictMode = false,
    dryRun = false,
  } = options

  console.log('[Migration] 위젯 위치 정규화 시작...')
  console.log(`[Migration] 총 ${widgets.length}개 위젯 처리`)
  
  // 백업 데이터 생성
  const backupData = widgets.map(w => ({ ...w, position: { ...w.position } }))
  
  try {
    // Normalizer 인스턴스 생성
    const normalizer = new WidgetNormalizer(gridSize, { strictMode })
    
    // 정규화 실행
    const { widgets: normalizedWidgets, report } = normalizer.normalizeWidgets(widgets, {
      autoFix,
      preserveLayout,
      compactMode,
    })
    
    // 레이아웃 검증 보고서 생성
    const layoutReport = normalizer.generateLayoutReport(normalizedWidgets)
    
    // 결과 준비
    const result: MigrationResult = {
      success: true,
      widgets: dryRun ? widgets : normalizedWidgets,
      report: {
        totalProcessed: widgets.length,
        totalFixed: report.changes.length,
        errors: layoutReport.issues.filter(i => i.type === 'error').length,
        warnings: layoutReport.issues.filter(i => i.type === 'warning').length,
        changes: report.changes,
        issues: layoutReport.issues.map(i => `[${i.type.toUpperCase()}] ${i.message}`),
        recommendations: layoutReport.recommendations,
      },
      backupData: dryRun ? undefined : backupData,
    }
    
    // 상세 로그 출력
    if (report.invalidPositions > 0) {
      console.log(`[Migration] ${report.invalidPositions}개의 잘못된 위치 수정`)
    }
    
    if (report.duplicates > 0) {
      console.log(`[Migration] ${report.duplicates}개의 중복 위치 해결`)
    }
    
    if (report.collisions > 0) {
      console.log(`[Migration] ${report.collisions}개의 충돌 해결`)
    }
    
    if (report.changes.length > 0) {
      console.log(`[Migration] 총 ${report.changes.length}개 변경 사항 적용`)
      
      // 변경 사항 요약
      const changedWidgetIds = new Set(report.changes.map(c => c.widgetId))
      console.log(`[Migration] ${changedWidgetIds.size}개 위젯이 수정됨`)
    }
    
    // 레이아웃 상태 보고
    console.log(`[Migration] 레이아웃 건강도: ${layoutReport.score}/100`)
    
    if (layoutReport.recommendations.length > 0) {
      console.log('[Migration] 권장사항:')
      layoutReport.recommendations.forEach(rec => {
        console.log(`  - ${rec}`)
      })
    }
    
    if (dryRun) {
      console.log('[Migration] DRY RUN 모드 - 실제 변경 사항은 적용되지 않았습니다')
    } else {
      console.log('[Migration] 마이그레이션 완료')
    }
    
    return result
    
  } catch (error) {
    console.error('[Migration] 오류 발생:', error)
    
    return {
      success: false,
      widgets: widgets,
      report: {
        totalProcessed: widgets.length,
        totalFixed: 0,
        errors: 1,
        warnings: 0,
        changes: [],
        issues: [`마이그레이션 실행 중 오류 발생: ${error}`],
        recommendations: ['마이그레이션을 다시 시도하거나 수동으로 위치를 조정하세요'],
      },
      backupData,
    }
  }
}

/**
 * 그리드 크기 변경 마이그레이션
 */
export async function migrateGridSize(
  widgets: Widget[],
  fromGridSize: GridSize,
  toGridSize: GridSize,
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const { strictMode = false, dryRun = false } = options
  
  console.log(`[Migration] 그리드 크기 변경: ${fromGridSize} → ${toGridSize}`)
  
  // 백업 데이터 생성
  const backupData = widgets.map(w => ({ ...w, position: { ...w.position } }))
  
  try {
    const normalizer = new WidgetNormalizer(fromGridSize, { strictMode })
    
    // 그리드 크기 변경에 따른 위치 변환
    const migratedWidgets = normalizer.migrateWidgets(widgets, fromGridSize, toGridSize)
    
    // 새 그리드 크기로 정규화
    const newNormalizer = new WidgetNormalizer(toGridSize, { strictMode })
    const { widgets: normalizedWidgets, report } = newNormalizer.normalizeWidgets(
      migratedWidgets,
      {
        autoFix: true,
        preserveLayout: true,
        compactMode: 'vertical',
      }
    )
    
    // 레이아웃 검증
    const layoutReport = newNormalizer.generateLayoutReport(normalizedWidgets)
    
    const result: MigrationResult = {
      success: true,
      widgets: dryRun ? widgets : normalizedWidgets,
      report: {
        totalProcessed: widgets.length,
        totalFixed: report.changes.length,
        errors: layoutReport.issues.filter(i => i.type === 'error').length,
        warnings: layoutReport.issues.filter(i => i.type === 'warning').length,
        changes: report.changes,
        issues: layoutReport.issues.map(i => `[${i.type.toUpperCase()}] ${i.message}`),
        recommendations: layoutReport.recommendations,
      },
      backupData: dryRun ? undefined : backupData,
    }
    
    if (!dryRun) {
      console.log(`[Migration] 그리드 크기 변경 완료`)
    }
    
    return result
    
  } catch (error) {
    console.error('[Migration] 그리드 크기 변경 중 오류:', error)
    
    return {
      success: false,
      widgets: widgets,
      report: {
        totalProcessed: widgets.length,
        totalFixed: 0,
        errors: 1,
        warnings: 0,
        changes: [],
        issues: [`그리드 크기 변경 중 오류 발생: ${error}`],
        recommendations: ['그리드 크기를 변경하지 않거나 수동으로 조정하세요'],
      },
      backupData,
    }
  }
}

/**
 * 일괄 마이그레이션 실행
 * 여러 레이아웃을 한번에 처리
 */
export async function batchMigrateLayouts(
  layouts: Array<{ id: string; widgets: Widget[]; gridSize: GridSize }>,
  options: MigrationOptions = {}
): Promise<Map<string, MigrationResult>> {
  const results = new Map<string, MigrationResult>()
  
  console.log(`[Migration] ${layouts.length}개 레이아웃 일괄 처리 시작`)
  
  for (const layout of layouts) {
    console.log(`[Migration] 레이아웃 ${layout.id} 처리 중...`)
    
    const result = await migrateWidgetPositions(
      layout.widgets,
      layout.gridSize,
      options
    )
    
    results.set(layout.id, result)
    
    // 처리 간 지연 (부하 분산)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // 전체 결과 요약
  const totalProcessed = Array.from(results.values()).reduce(
    (sum, r) => sum + r.report.totalProcessed,
    0
  )
  const totalFixed = Array.from(results.values()).reduce(
    (sum, r) => sum + r.report.totalFixed,
    0
  )
  const totalErrors = Array.from(results.values()).reduce(
    (sum, r) => sum + r.report.errors,
    0
  )
  
  console.log('[Migration] 일괄 처리 완료:')
  console.log(`  - 총 ${layouts.length}개 레이아웃 처리`)
  console.log(`  - 총 ${totalProcessed}개 위젯 처리`)
  console.log(`  - 총 ${totalFixed}개 수정됨`)
  console.log(`  - 총 ${totalErrors}개 오류`)
  
  return results
}

/**
 * 마이그레이션 복원
 * 백업 데이터를 사용하여 이전 상태로 복원
 */
export function restoreMigration(backupData: Widget[]): Widget[] {
  console.log('[Migration] 백업 데이터로 복원 중...')
  
  if (!backupData || backupData.length === 0) {
    console.warn('[Migration] 백업 데이터가 없습니다')
    return []
  }
  
  // 깊은 복사로 복원
  const restoredWidgets = backupData.map(w => ({
    ...w,
    position: { ...w.position },
  }))
  
  console.log(`[Migration] ${restoredWidgets.length}개 위젯 복원 완료`)
  
  return restoredWidgets
}