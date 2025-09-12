'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import type { WidgetType } from '@/types/dashboard'

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

  useEffect(() => {
    if (!currentLayout || !widgetId) return

    const widget = currentLayout.widgets.find(w => w.id === widgetId)
    if (!widget) return

    setWidgetType(widget.type as WidgetType)
    setConfig(widget.config || {})
  }, [currentLayout, widgetId])

  if (!isOpen || !widgetType) return null

  const schema = widgetConfigSchemas[widgetType]
  if (!schema) return null

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = () => {
    updateWidgetConfig(widgetId, config)
    onClose()
  }

  const handleCancel = () => {
    const widget = currentLayout?.widgets.find(w => w.id === widgetId)
    if (widget) {
      setConfig(widget.config || {})
    }
    onClose()
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        )
      
      case 'select':
        return (
          <select
            value={value || field.defaultValue}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        )
      
      case 'color':
        return (
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            className="h-10 w-full border border-gray-300 rounded-md cursor-pointer"
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            위젯 설정
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {Object.entries(schema).map(([key, field]) => (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
              </label>
              {renderField(key, field)}
            </div>
          ))}
        </div>

        <div className="flex gap-2 p-4 border-t dark:border-gray-700">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  )
}