'use client'

import React, { useState, useEffect } from 'react'
import { 
  Package, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  Share2,
  Check,
  X 
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Typography from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import { widgetConfigManager } from '@/lib/dashboard/widget-config-manager'
import { widgetEventBus, WidgetEventTypes } from '@/lib/dashboard/widget-event-bus'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import type { PresetData } from '@/lib/dashboard/widget-config-types'

interface WidgetPresetManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function WidgetPresetManager({ isOpen, onClose }: WidgetPresetManagerProps) {
  const { currentLayout } = useDashboardStore()
  const [presets, setPresets] = useState<PresetData[]>([])
  const [selectedPreset, setSelectedPreset] = useState<PresetData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [showNewPresetForm, setShowNewPresetForm] = useState(false)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [copiedPresetId, setCopiedPresetId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadPresets()
    }
  }, [isOpen])

  const loadPresets = async () => {
    setIsLoading(true)
    try {
      const loadedPresets = await widgetConfigManager.loadAllPresets()
      setPresets(loadedPresets)
    } catch (error) {
      console.error('Failed to load presets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePreset = async () => {
    if (!newPresetName.trim() || !currentLayout) return

    setIsLoading(true)
    try {
      const widgetIds = currentLayout.widgets.map(w => w.id)
      const preset = await widgetConfigManager.exportPreset(
        newPresetName,
        widgetIds,
        { includeLayout: true }
      )
      
      await widgetConfigManager.savePreset(preset)
      await loadPresets()
      
      setShowNewPresetForm(false)
      setNewPresetName('')
      
      // 성공 알림
      widgetEventBus.emit({
        type: WidgetEventTypes.MESSAGE,
        source: 'PresetManager',
        data: {
          from: 'PresetManager',
          to: 'Dashboard',
          message: `프리셋 "${newPresetName}"이(가) 생성되었습니다`
        }
      })
    } catch (error) {
      console.error('Failed to create preset:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyPreset = async (preset: PresetData) => {
    setIsLoading(true)
    try {
      await widgetConfigManager.applyPreset(preset.id)
      
      // 대시보드 새로고침
      widgetEventBus.emit({
        type: WidgetEventTypes.BROADCAST,
        source: 'PresetManager',
        data: {
          action: 'refresh',
          presetId: preset.id
        }
      })
      
      onClose()
    } catch (error) {
      console.error('Failed to apply preset:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm('이 프리셋을 삭제하시겠습니까?')) return

    setIsLoading(true)
    try {
      await widgetConfigManager.deletePreset(presetId)
      await loadPresets()
    } catch (error) {
      console.error('Failed to delete preset:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPreset = async (preset: PresetData) => {
    try {
      const dataStr = JSON.stringify(preset, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `preset_${preset.name.replace(/\s+/g, '_')}_${Date.now()}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    } catch (error) {
      console.error('Failed to export preset:', error)
    }
  }

  const handleImportPreset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const text = await file.text()
      await widgetConfigManager.importPreset(text, {
        validateBeforeImport: true,
        preserveIds: false,
        overwrite: false
      })
      
      await loadPresets()
    } catch (error) {
      console.error('Failed to import preset:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSharePreset = async (preset: PresetData) => {
    // 공유 코드 생성 (간단한 예시)
    const code = btoa(preset.id).substring(0, 8).toUpperCase()
    setShareCode(code)
    
    // 클립보드에 복사
    try {
      await navigator.clipboard.writeText(code)
      setCopiedPresetId(preset.id)
      setTimeout(() => setCopiedPresetId(null), 2000)
    } catch (error) {
      console.error('Failed to copy share code:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[var(--color-brand-primary-start)]" />
            <Typography variant="h2" className="text-lg font-semibold text-[var(--color-gray-900)]">
              프리셋 관리
            </Typography>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-gray-100)] rounded-md transition-colors h-auto"
          >
            <X className="h-5 w-5 text-[var(--color-gray-500)]" />
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          {/* 새 프리셋 생성 */}
          <Card className="p-4">
            {showNewPresetForm ? (
              <div className="space-y-3">
                <Typography variant="body2" className="font-medium">
                  새 프리셋 만들기
                </Typography>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="프리셋 이름 입력"
                    className="flex-1 px-3 py-2 border border-[var(--color-gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-500)]"
                    autoFocus
                  />
                  <Button
                    onClick={handleCreatePreset}
                    disabled={!newPresetName.trim() || isLoading}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    저장
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewPresetForm(false)
                      setNewPresetName('')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    취소
                  </Button>
                </div>
                <Typography variant="caption" className="text-[var(--color-gray-600)]">
                  현재 대시보드 레이아웃과 위젯 설정이 프리셋으로 저장됩니다
                </Typography>
              </div>
            ) : (
              <Button
                onClick={() => setShowNewPresetForm(true)}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                현재 레이아웃을 프리셋으로 저장
              </Button>
            )}
          </Card>

          {/* 프리셋 가져오기 */}
          <Card className="p-4">
            <label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportPreset}
                className="hidden"
                id="import-preset"
              />
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                onClick={() => document.getElementById('import-preset')?.click()}
                disabled={isLoading}
                type="button"
              >
                <Upload className="h-4 w-4 mr-2" />
                프리셋 파일 가져오기
              </Button>
            </label>
          </Card>

          {/* 프리셋 목록 */}
          <div className="space-y-3">
            <Typography variant="body2" className="font-medium text-[var(--color-gray-700)]">
              저장된 프리셋 ({presets.length})
            </Typography>
            
            {isLoading && !presets.length ? (
              <div className="text-center py-8">
                <span className="animate-spin h-8 w-8 border-2 border-[var(--color-brand-primary-start)] border-t-transparent rounded-full inline-block" />
              </div>
            ) : presets.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 text-[var(--color-gray-400)] mx-auto mb-3" />
                <Typography variant="body2" className="text-[var(--color-gray-600)]">
                  저장된 프리셋이 없습니다
                </Typography>
                <Typography variant="caption" className="text-[var(--color-gray-500)] mt-1">
                  현재 레이아웃을 프리셋으로 저장해보세요
                </Typography>
              </Card>
            ) : (
              <div className="grid gap-3">
                {presets.map((preset) => (
                  <Card
                    key={preset.id}
                    className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
                      selectedPreset?.id === preset.id ? 'ring-2 ring-[var(--color-brand-primary-start)]' : ''
                    }`}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Typography variant="body1" className="font-medium">
                            {preset.name}
                          </Typography>
                          {preset.metadata.category && (
                            <span className="px-2 py-0.5 text-xs bg-[var(--color-gray-100)] text-[var(--color-gray-600)] rounded">
                              {preset.metadata.category}
                            </span>
                          )}
                        </div>
                        {preset.description && (
                          <Typography variant="caption" className="text-[var(--color-gray-600)] mt-1">
                            {preset.description}
                          </Typography>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <Typography variant="caption" className="text-[var(--color-gray-500)]">
                            위젯: {preset.widgets.length}개
                          </Typography>
                          <Typography variant="caption" className="text-[var(--color-gray-500)]">
                            생성: {new Date(preset.metadata.createdAt).toLocaleDateString()}
                          </Typography>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApplyPreset(preset)
                          }}
                          disabled={isLoading}
                          title="적용"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSharePreset(preset)
                          }}
                          disabled={isLoading}
                          title="공유"
                        >
                          {copiedPresetId === preset.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Share2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExportPreset(preset)
                          }}
                          disabled={isLoading}
                          title="내보내기"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePreset(preset.id)
                          }}
                          disabled={isLoading}
                          className="hover:text-red-600"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            닫기
          </Button>
          {selectedPreset && (
            <Button
              onClick={() => handleApplyPreset(selectedPreset)}
              className="flex-1"
              disabled={isLoading}
            >
              선택한 프리셋 적용
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}