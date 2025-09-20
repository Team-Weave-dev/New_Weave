'use client'

import React, { useState } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { 
  Layout, 
  Plus, 
  Check, 
  X, 
  Settings,
  Copy,
  Trash2,
  Star,
  StarOff
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { DashboardLayout, GridSize } from '@/types/dashboard'

interface LayoutManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function LayoutManager({ isOpen, onClose }: LayoutManagerProps) {
  const { 
    layouts, 
    currentLayout,
    setCurrentLayout,
    createLayout,
    updateLayout,
    deleteLayout,
    saveToLocalStorage
  } = useDashboardStore()

  const [isCreating, setIsCreating] = useState(false)
  const [newLayoutName, setNewLayoutName] = useState('')
  const [newLayoutGridSize, setNewLayoutGridSize] = useState<GridSize>('3x3')
  const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const { addToast } = useToast()

  const handleCreateLayout = () => {
    if (newLayoutName.trim()) {
      const layout = createLayout(newLayoutName.trim(), newLayoutGridSize)
      setCurrentLayout(layout)
      saveToLocalStorage()
      setIsCreating(false)
      setNewLayoutName('')
      setNewLayoutGridSize('3x3')
    }
  }

  const handleSelectLayout = (layout: DashboardLayout) => {
    setCurrentLayout(layout)
    saveToLocalStorage()
  }

  const handleDeleteLayout = (layoutId: string) => {
    if (layouts.length > 1) {
      if (confirm('이 레이아웃을 삭제하시겠습니까?')) {
        deleteLayout(layoutId)
        saveToLocalStorage()
      }
    } else {
      addToast('최소 하나의 레이아웃은 유지되어야 합니다.', 'warning')
    }
  }

  const handleDuplicateLayout = (layout: DashboardLayout) => {
    const duplicatedLayout = createLayout(
      `${layout.name} (복사본)`,
      layout.gridSize
    )
    
    // 위젯도 복사
    updateLayout(duplicatedLayout.id, {
      widgets: layout.widgets.map(widget => ({
        ...widget,
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    })
    
    setCurrentLayout(duplicatedLayout)
    saveToLocalStorage()
  }

  const handleRenameLayout = (layoutId: string, newName: string) => {
    if (newName.trim()) {
      updateLayout(layoutId, { name: newName.trim() })
      saveToLocalStorage()
      setEditingLayoutId(null)
      setEditingName('')
    }
  }

  const handleSetDefaultLayout = (layoutId: string) => {
    // localStorage에 기본 레이아웃 ID 저장
    localStorage.setItem('defaultLayoutId', layoutId)
    addToast('기본 레이아웃으로 설정되었습니다.', 'success')
  }

  if (!isOpen) return null

  const defaultLayoutId = localStorage.getItem('defaultLayoutId')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">레이아웃 관리</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* 새 레이아웃 생성 */}
          {isCreating ? (
            <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h3 className="text-sm font-semibold mb-3">새 레이아웃 만들기</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    레이아웃 이름
                  </label>
                  <input
                    type="text"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 프로젝트 대시보드"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    그리드 크기
                  </label>
                  <select
                    value={newLayoutGridSize}
                    onChange={(e) => setNewLayoutGridSize(e.target.value as GridSize)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2x2">2x2</option>
                    <option value="3x3">3x3</option>
                    <option value="4x4">4x4</option>
                    <option value="5x5">5x5</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateLayout}
                    disabled={!newLayoutName.trim()}
                    className="flex-1"
                  >
                    만들기
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsCreating(false)
                      setNewLayoutName('')
                      setNewLayoutGridSize('3x3')
                    }}
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <Button
                onClick={() => setIsCreating(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 레이아웃 만들기
              </Button>
            </div>
          )}

          {/* 레이아웃 목록 */}
          <div className="space-y-2">
            {layouts.map((layout) => (
              <div
                key={layout.id}
                className={cn(
                  "p-4 border rounded-lg transition-all",
                  currentLayout?.id === layout.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentLayout?.id === layout.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                    
                    {editingLayoutId === layout.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleRenameLayout(layout.id, editingName)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameLayout(layout.id, editingName)
                          }
                          if (e.key === 'Escape') {
                            setEditingLayoutId(null)
                            setEditingName('')
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {layout.name}
                          {defaultLayoutId === layout.id && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {layout.gridSize} • {layout.widgets.length}개 위젯
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {currentLayout?.id !== layout.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectLayout(layout)}
                      >
                        선택
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingLayoutId(layout.id)
                        setEditingName(layout.name)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateLayout(layout)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefaultLayout(layout.id)}
                      className="h-8 w-8 p-0"
                    >
                      {defaultLayoutId === layout.id ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>

                    {layouts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLayout(layout.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 도움말 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 <strong>팁:</strong> 레이아웃을 복사하여 기존 구성을 유지하면서 새로운 변형을 만들 수 있습니다.
              별표 아이콘을 클릭하면 기본 레이아웃으로 설정됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}