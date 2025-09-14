import type { DashboardLayout } from '@/types/dashboard'

/**
 * 레이아웃을 JSON 문자열로 직렬화
 */
export function exportLayout(layout: DashboardLayout): string {
  const exportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    layout: {
      ...layout,
      id: undefined, // ID는 가져올 때 새로 생성
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
    }
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * 레이아웃을 JSON 파일로 다운로드
 */
export function downloadLayout(layout: DashboardLayout): void {
  const json = exportLayout(layout)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = `dashboard-layout-${layout.name.replace(/\s+/g, '-')}-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * JSON 문자열에서 레이아웃 가져오기
 */
export function importLayout(jsonString: string): DashboardLayout | null {
  try {
    const data = JSON.parse(jsonString)
    
    // 버전 체크
    if (!data.version || !data.layout) {
      throw new Error('Invalid layout format')
    }
    
    // 기본 유효성 검사
    if (!data.layout.name || !data.layout.gridSize || !Array.isArray(data.layout.widgets)) {
      throw new Error('Missing required fields')
    }
    
    // 새 레이아웃 생성
    const importedLayout: DashboardLayout = {
      id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${data.layout.name} (가져옴)`,
      gridSize: data.layout.gridSize,
      widgets: data.layout.widgets.map((widget: any) => ({
        ...widget,
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // 새 ID 생성
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    return importedLayout
  } catch (error) {
    console.error('Failed to import layout:', error)
    return null
  }
}

/**
 * 파일에서 레이아웃 읽기
 */
export function readLayoutFromFile(file: File): Promise<DashboardLayout | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const content = e.target?.result as string
      const layout = importLayout(content)
      resolve(layout)
    }
    
    reader.onerror = () => {
      console.error('Failed to read file')
      resolve(null)
    }
    
    reader.readAsText(file)
  })
}

/**
 * 레이아웃 유효성 검사
 */
export function validateLayout(layout: any): boolean {
  if (!layout || typeof layout !== 'object') {
    return false
  }
  
  // 필수 필드 체크
  if (!layout.name || typeof layout.name !== 'string') {
    return false
  }
  
  if (!layout.gridSize || !['2x2', '3x3', '4x4', '5x5'].includes(layout.gridSize)) {
    return false
  }
  
  if (!Array.isArray(layout.widgets)) {
    return false
  }
  
  // 위젯 유효성 검사
  for (const widget of layout.widgets) {
    if (!widget.type || !widget.position) {
      return false
    }
    
    if (typeof widget.position.x !== 'number' || 
        typeof widget.position.y !== 'number' ||
        typeof widget.position.width !== 'number' ||
        typeof widget.position.height !== 'number') {
      return false
    }
  }
  
  return true
}

/**
 * 레이아웃 병합 (기존 레이아웃에 새 위젯 추가)
 */
export function mergeLayouts(
  currentLayout: DashboardLayout, 
  importedLayout: DashboardLayout
): DashboardLayout {
  const mergedWidgets = [
    ...currentLayout.widgets,
    ...importedLayout.widgets.map(widget => ({
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))
  ]
  
  return {
    ...currentLayout,
    widgets: mergedWidgets,
    updatedAt: new Date()
  }
}