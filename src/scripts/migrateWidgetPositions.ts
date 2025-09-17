/**
 * 위젯 위치 마이그레이션 스크립트
 * 기존 대시보드 데이터의 위젯 위치를 정규화합니다.
 * 
 * 사용법:
 * 1. npm run dev 실행 중인 상태에서
 * 2. 브라우저 콘솔에서 실행: await window.migrateWidgetPositions()
 */

import { WidgetNormalizer } from '@/lib/dashboard/widgetNormalizer'
import { DashboardLayout } from '@/types/dashboard'

export interface MigrationReport {
  success: boolean
  layoutsProcessed: number
  widgetsProcessed: number
  positionsNormalized: number
  duplicatesResolved: number
  collisionsFixed: number
  errors: string[]
  timestamp: Date
}

export async function migrateWidgetPositions(): Promise<MigrationReport> {
  const report: MigrationReport = {
    success: false,
    layoutsProcessed: 0,
    widgetsProcessed: 0,
    positionsNormalized: 0,
    duplicatesResolved: 0,
    collisionsFixed: 0,
    errors: [],
    timestamp: new Date(),
  }
  
  try {
    // localStorage에서 대시보드 데이터 가져오기
    const storageKey = 'dashboard-store'
    const rawData = localStorage.getItem(storageKey)
    
    if (!rawData) {
      report.errors.push('대시보드 데이터가 없습니다')
      return report
    }
    
    const storeData = JSON.parse(rawData)
    const { state } = storeData
    
    if (!state) {
      report.errors.push('유효한 상태 데이터가 없습니다')
      return report
    }
    
    // 백업 생성
    const backupKey = `${storageKey}-backup-${Date.now()}`
    localStorage.setItem(backupKey, rawData)
    console.log(`백업 생성됨: ${backupKey}`)
    
    // 현재 레이아웃 처리
    if (state.currentLayout && state.currentLayout.widgets) {
      const result = processLayout(state.currentLayout)
      state.currentLayout = result.layout
      updateReport(report, result.report)
    }
    
    // 모든 레이아웃 처리
    if (state.layouts && Array.isArray(state.layouts)) {
      state.layouts = state.layouts.map(layout => {
        if (!layout.widgets) return layout
        
        const result = processLayout(layout)
        updateReport(report, result.report)
        return result.layout
      })
      
      report.layoutsProcessed = state.layouts.length
    }
    
    // 업데이트된 데이터 저장
    const updatedData = {
      ...storeData,
      state: {
        ...state,
        _migrated: true,
        _migrationDate: new Date().toISOString(),
      },
    }
    
    localStorage.setItem(storageKey, JSON.stringify(updatedData))
    
    report.success = true
    
    // 결과 로깅
    console.log('===== 위젯 위치 마이그레이션 완료 =====')
    console.log(`✅ 처리된 레이아웃: ${report.layoutsProcessed}개`)
    console.log(`✅ 처리된 위젯: ${report.widgetsProcessed}개`)
    console.log(`✅ 정규화된 위치: ${report.positionsNormalized}개`)
    console.log(`✅ 해결된 중복: ${report.duplicatesResolved}개`)
    console.log(`✅ 수정된 충돌: ${report.collisionsFixed}개`)
    
    if (report.errors.length > 0) {
      console.warn('⚠️ 경고:', report.errors)
    }
    
    console.log('💾 백업 파일:', backupKey)
    console.log('🔄 페이지를 새로고침하여 변경사항을 적용하세요')
    
  } catch (error) {
    report.errors.push(`마이그레이션 실패: ${error}`)
    console.error('마이그레이션 오류:', error)
  }
  
  return report
}

function processLayout(layout: DashboardLayout): {
  layout: DashboardLayout
  report: {
    widgetsProcessed: number
    positionsNormalized: number
    duplicatesResolved: number
    collisionsFixed: number
  }
} {
  const normalizer = new WidgetNormalizer(layout.gridSize || '3x3')
  const { widgets, report: normReport } = normalizer.normalizeWidgets(layout.widgets)
  
  const processedLayout = {
    ...layout,
    widgets,
    updatedAt: new Date(),
  }
  
  return {
    layout: processedLayout,
    report: {
      widgetsProcessed: normReport.totalWidgets,
      positionsNormalized: normReport.invalidPositions,
      duplicatesResolved: normReport.duplicates,
      collisionsFixed: normReport.collisions,
    },
  }
}

function updateReport(
  mainReport: MigrationReport,
  subReport: {
    widgetsProcessed: number
    positionsNormalized: number
    duplicatesResolved: number
    collisionsFixed: number
  }
) {
  mainReport.widgetsProcessed += subReport.widgetsProcessed
  mainReport.positionsNormalized += subReport.positionsNormalized
  mainReport.duplicatesResolved += subReport.duplicatesResolved
  mainReport.collisionsFixed += subReport.collisionsFixed
}

// 브라우저 환경에서 실행 가능하도록 전역 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).migrateWidgetPositions = migrateWidgetPositions
  
  // 자동 실행 옵션 (주석 해제하여 사용)
  // if (!localStorage.getItem('widget-migration-completed')) {
  //   migrateWidgetPositions().then(report => {
  //     if (report.success) {
  //       localStorage.setItem('widget-migration-completed', new Date().toISOString())
  //     }
  //   })
  // }
}

export default migrateWidgetPositions