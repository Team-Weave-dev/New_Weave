'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, RotateCcw, Download, Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import Typography from '@/components/ui/Typography'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { widgetConfigManager } from '@/lib/dashboard/widget-config-manager'
import { widgetEventBus, WidgetEventTypes } from '@/lib/dashboard/widget-event-bus'
import type { WidgetType } from '@/types/dashboard'
import type { WidgetConfig, WidgetSettings } from '@/lib/dashboard/widget-config-types'

interface WidgetConfigPanelProps {
  widgetId: string
  isOpen: boolean
  onClose: () => void
}

interface WidgetConfigSchema {
  [key: string]: {
    type: 'text' | 'number' | 'select' | 'checkbox' | 'color'
    label: string
    options?: string[]
    min?: number
    max?: number
    defaultValue: any
  }
}

const widgetConfigSchemas: Partial<Record<WidgetType, WidgetConfigSchema>> = {
  'project-summary': {
    title: {
      type: 'text',
      label: '제목',
      defaultValue: '프로젝트 요약'
    },
    maxProjects: {
      type: 'number',
      label: '표시할 프로젝트 수',
      min: 1,
      max: 10,
      defaultValue: 5
    },
    showChart: {
      type: 'checkbox',
      label: '차트 표시',
      defaultValue: true
    }
  },
  'revenue-chart': {
    title: {
      type: 'text',
      label: '차트 제목',
      defaultValue: '매출 현황'
    },
    chartType: {
      type: 'select',
      label: '차트 유형',
      options: ['bar', 'line', 'area'],
      defaultValue: 'bar'
    },
    period: {
      type: 'select',
      label: '기간',
      options: ['monthly', 'quarterly', 'yearly'],
      defaultValue: 'monthly'
    },
    showLegend: {
      type: 'checkbox',
      label: '범례 표시',
      defaultValue: true
    }
  },
  'task-tracker': {
    title: {
      type: 'text',
      label: '제목',
      defaultValue: '작업 추적기'
    },
    defaultPriority: {
      type: 'select',
      label: '기본 우선순위',
      options: ['urgent', 'high', 'medium', 'low'],
      defaultValue: 'medium'
    },
    maxTasks: {
      type: 'number',
      label: '최대 작업 수',
      min: 5,
      max: 50,
      defaultValue: 20
    },
    showCompleted: {
      type: 'checkbox',
      label: '완료된 작업 표시',
      defaultValue: false
    }
  },
  'kpi-metrics': {
    title: {
      type: 'text',
      label: '제목',
      defaultValue: 'KPI 지표'
    },
    refreshInterval: {
      type: 'number',
      label: '새로고침 간격(초)',
      min: 30,
      max: 300,
      defaultValue: 60
    },
    showTrend: {
      type: 'checkbox',
      label: '추세 표시',
      defaultValue: true
    },
    theme: {
      type: 'select',
      label: '테마',
      options: ['default', 'success', 'warning', 'danger'],
      defaultValue: 'default'
    }
  },
  'tax-deadline': {
    title: {
      type: 'text',
      label: '제목',
      defaultValue: '세무 일정'
    },
    view: {
      type: 'select',
      label: '보기 형식',
      options: ['calendar', 'list'],
      defaultValue: 'calendar'
    },
    daysAhead: {
      type: 'number',
      label: '미리 알림 일수',
      min: 1,
      max: 30,
      defaultValue: 7
    },
    showWeekends: {
      type: 'checkbox',
      label: '주말 표시',
      defaultValue: true
    }
  },
  'tax-calculator': {
    title: {
      type: 'text',
      label: '제목',
      defaultValue: '세금 계산기'
    },
    defaultTaxType: {
      type: 'select',
      label: '기본 세금 유형',
      options: ['vat', 'income', 'corporate', 'capital'],
      defaultValue: 'vat'
    },
    precision: {
      type: 'number',
      label: '소수점 자리수',
      min: 0,
      max: 4,
      defaultValue: 0
    },
    showHistory: {
      type: 'checkbox',
      label: '계산 기록 표시',
      defaultValue: false
    }
  }
}

export function WidgetConfigPanel({ widgetId, isOpen, onClose }: WidgetConfigPanelProps) {
  const { currentLayout, updateWidgetConfig } = useDashboardStore()
  const [config, setConfig] = useState<Record<string, any>>({})
  const [widgetType, setWidgetType] = useState<WidgetType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (!currentLayout || !widgetId) return

    const loadWidgetConfig = async () => {
      setIsLoading(true)
      
      const widget = currentLayout.widgets.find(w => w.id === widgetId)
      if (!widget) {
        setIsLoading(false)
        return
      }

      setWidgetType(widget.type as WidgetType)
      
      // 저장된 설정 로드 시도
      const savedConfig = await widgetConfigManager.loadConfig(widgetId)
      if (savedConfig) {
        setConfig(savedConfig.settings.customSettings || {})
      } else {
        setConfig(widget.config || {})
      }
      
      setIsLoading(false)
      setHasChanges(false)
    }

    loadWidgetConfig()
  }, [currentLayout, widgetId])

  if (!isOpen || !widgetType) return null

  const schema = widgetConfigSchemas[widgetType]
  if (!schema) return null

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
    setValidationErrors([])
  }

  const handleSave = async () => {
    if (!widgetType) return
    
    setIsLoading(true)
    
    try {
      // WidgetConfig 형식으로 변환
      const widgetConfig: WidgetConfig = {
        id: widgetId,
        type: widgetType,
        settings: {
          showHeader: true,
          showFooter: false,
          theme: 'default',
          customSettings: config
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      }
      
      // 유효성 검증
      const validation = await widgetConfigManager.validateConfig(widgetConfig)
      if (!validation.isValid) {
        setValidationErrors(validation.errors?.map(e => e.message) || [])
        setIsLoading(false)
        return
      }
      
      // 설정 저장
      await widgetConfigManager.saveConfig(widgetId, widgetConfig)
      
      // Store 업데이트
      updateWidgetConfig(widgetId, config)
      
      // 이벤트 발행
      widgetEventBus.emit({
        type: WidgetEventTypes.STATE_CHANGE,
        source: 'ConfigPanel',
        data: { widgetId, config }
      })
      
      setHasChanges(false)
      onClose()
    } catch (error) {
      console.error('Failed to save config:', error)
      setValidationErrors(['설정 저장에 실패했습니다'])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    const widget = currentLayout?.widgets.find(w => w.id === widgetId)
    if (widget) {
      setConfig(widget.config || {})
    }
    setHasChanges(false)
    setValidationErrors([])
    onClose()
  }
  
  const handleReset = async () => {
    if (!widgetType) return
    
    setIsLoading(true)
    
    try {
      await widgetConfigManager.resetToDefault(widgetId)
      const schema = widgetConfigSchemas[widgetType]
      if (schema) {
        const defaultConfig: Record<string, any> = {}
        Object.entries(schema).forEach(([key, field]) => {
          defaultConfig[key] = field.defaultValue
        })
        setConfig(defaultConfig)
        setHasChanges(true)
      }
    } catch (error) {
      console.error('Failed to reset config:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleExport = async () => {
    try {
      const preset = await widgetConfigManager.exportPreset(
        `${widgetType}_config`,
        [widgetId],
        { includeLayout: false }
      )
      
      const dataStr = JSON.stringify(preset, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `widget_config_${widgetId}_${Date.now()}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    } catch (error) {
      console.error('Failed to export config:', error)
    }
  }
  
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsLoading(true)
    
    try {
      const text = await file.text()
      await widgetConfigManager.importPreset(text, {
        validateBeforeImport: true,
        preserveIds: true,
        overwrite: true
      })
      
      // 설정 다시 로드
      const savedConfig = await widgetConfigManager.loadConfig(widgetId)
      if (savedConfig) {
        setConfig(savedConfig.settings.customSettings || {})
        setHasChanges(true)
      }
    } catch (error) {
      console.error('Failed to import config:', error)
      setValidationErrors(['설정 가져오기에 실패했습니다'])
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = (key: string, field: typeof schema[string]) => {
    const value = config[key] ?? field.defaultValue

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-500)] dark:bg-[var(--color-gray-700)] dark:border-[var(--color-gray-600)] dark:text-white"
          />
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            min={field.min}
            max={field.max}
            onChange={(e) => handleConfigChange(key, parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-500)] dark:bg-[var(--color-gray-700)] dark:border-[var(--color-gray-600)] dark:text-white"
          />
        )
      
      case 'select':
        return (
          <select
            value={value || field.defaultValue}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-500)] dark:bg-[var(--color-gray-700)] dark:border-[var(--color-gray-600)] dark:text-white"
          >
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option === 'monthly' ? '월간' :
                 option === 'quarterly' ? '분기별' :
                 option === 'yearly' ? '연간' :
                 option === 'bar' ? '막대' :
                 option === 'line' ? '선' :
                 option === 'area' ? '영역' :
                 option === 'urgent' ? '긴급' :
                 option === 'high' ? '높음' :
                 option === 'medium' ? '보통' :
                 option === 'low' ? '낮음' :
                 option === 'calendar' ? '캘린더' :
                 option === 'list' ? '목록' :
                 option === 'vat' ? '부가세' :
                 option === 'income' ? '소득세' :
                 option === 'corporate' ? '법인세' :
                 option === 'capital' ? '양도소득세' :
                 option === 'month' ? '월' :
                 option === 'week' ? '주' :
                 option === 'day' ? '일' :
                 option === 'default' ? '기본' :
                 option === 'success' ? '성공' :
                 option === 'warning' ? '경고' :
                 option === 'danger' ? '위험' :
                 option}
              </option>
            ))}
          </select>
        )
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleConfigChange(key, e.target.checked)}
            className="h-4 w-4 text-[var(--color-blue-600)] border-[var(--color-gray-300)] rounded focus:ring-2 focus:ring-[var(--color-blue-500)]"
          />
        )
      
      case 'color':
        return (
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            className="h-10 w-full border border-[var(--color-gray-300)] rounded-md cursor-pointer"
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[var(--color-gray-800)] rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b dark:border-[var(--color-gray-700)]">
          <Typography variant="h2" className="text-lg font-semibold text-[var(--color-gray-900)] dark:text-white">
            위젯 설정
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-gray-100)] dark:hover:bg-[var(--color-gray-700)] rounded-md transition-colors h-auto"
          >
            <X className="h-5 w-5 text-[var(--color-gray-500)] dark:text-[var(--color-gray-400)]" />
          </Button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* 유효성 검증 오류 표시 */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <Typography variant="body2" className="text-red-700">
                {validationErrors.join(', ')}
              </Typography>
            </div>
          )}
          
          {/* 설정 도구 */}
          <div className="flex justify-between items-center pb-2 border-b">
            <div className="flex gap-2">
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                초기화
              </Button>
              <Button
                onClick={handleExport}
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                내보내기
              </Button>
              <label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-config"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="text-xs cursor-pointer"
                  onClick={() => document.getElementById('import-config')?.click()}
                  type="button"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  가져오기
                </Button>
              </label>
            </div>
            {hasChanges && (
              <span className="text-xs text-[var(--color-status-warning)]">
                변경사항 있음
              </span>
            )}
          </div>
          {Object.entries(schema).map(([key, field]) => (
            <div key={key} className="space-y-2">
              <Typography variant="body2" className="block text-sm font-medium text-[var(--color-gray-700)] dark:text-[var(--color-gray-300)]">
                {field.label}
              </Typography>
              {renderField(key, field)}
            </div>
          ))}
        </div>

        <div className="flex gap-2 p-4 border-t dark:border-[var(--color-gray-700)]">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                처리 중...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}