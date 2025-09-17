'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  CheckSquare, Square, Plus, Clock, AlertCircle, 
  Tag, Folder, RefreshCw, Grid3x3, 
  X, ChevronDown, Calendar, Filter,
  TrendingUp, Target
} from 'lucide-react'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'
import { widgetColors } from '@/lib/dashboard/widget-colors'
import { cn } from '@/lib/utils'

interface TodoItem {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  urgency: 'urgent' | 'not-urgent'
  importance: 'important' | 'not-important'
  dueDate?: string
  category?: string
  tags?: string[]
  recurring?: {
    enabled: boolean
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'
    nextDate?: string
  }
  createdAt: string
  completedAt?: string
}

interface TodoListWidgetProps {
  className?: string
}

type ViewMode = 'list' | 'matrix' | 'categories'
type FilterMode = 'all' | 'today' | 'week' | 'overdue' | 'recurring'

const categories = ['업무', '개인', '학습', '건강', '금융', '기타']
const availableTags = ['긴급', '중요', '회의', '프로젝트', '리뷰', '문서작업', '연구', '개발']

export default function TodoListWidget({ className }: TodoListWidgetProps) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTodo, setNewTodo] = useState<Partial<TodoItem>>({
    title: '',
    priority: 'medium',
    urgency: 'not-urgent',
    importance: 'not-important',
    category: '업무',
    tags: [],
    recurring: { enabled: false, pattern: 'daily' }
  })

  // 로컬스토리지에서 데이터 로드
  useEffect(() => {
    const savedTodos = localStorage.getItem('todoListWidget_todos')
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos))
    } else {
      // 초기 샘플 데이터
      setTodos([
        {
          id: '1',
          title: '클라이언트 미팅 준비',
          description: '프레젠테이션 자료 최종 검토',
          completed: false,
          priority: 'high',
          urgency: 'urgent',
          importance: 'important',
          dueDate: new Date().toISOString().split('T')[0],
          category: '업무',
          tags: ['긴급', '회의', '중요'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: '프로젝트 제안서 검토',
          completed: true,
          priority: 'medium',
          urgency: 'not-urgent',
          importance: 'important',
          dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          category: '업무',
          tags: ['문서작업', '리뷰'],
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        },
        {
          id: '3',
          title: '월간 보고서 작성',
          completed: false,
          priority: 'medium',
          urgency: 'not-urgent',
          importance: 'important',
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          category: '업무',
          tags: ['문서작업'],
          recurring: {
            enabled: true,
            pattern: 'monthly',
            nextDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
          },
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          title: '운동하기',
          completed: false,
          priority: 'low',
          urgency: 'not-urgent',
          importance: 'not-important',
          dueDate: new Date().toISOString().split('T')[0],
          category: '건강',
          tags: [],
          recurring: {
            enabled: true,
            pattern: 'daily',
            nextDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
          },
          createdAt: new Date().toISOString()
        },
      ])
    }
  }, [])

  // 데이터 저장
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem('todoListWidget_todos', JSON.stringify(todos))
    }
  }, [todos])

  // 할일 추가
  const addTodo = () => {
    if (!newTodo.title?.trim()) return

    const todo: TodoItem = {
      id: Date.now().toString(),
      title: newTodo.title,
      description: newTodo.description,
      completed: false,
      priority: newTodo.priority || 'medium',
      urgency: newTodo.urgency || 'not-urgent',
      importance: newTodo.importance || 'not-important',
      dueDate: newTodo.dueDate,
      category: newTodo.category || '기타',
      tags: newTodo.tags || [],
      recurring: newTodo.recurring,
      createdAt: new Date().toISOString()
    }

    setTodos(prev => [todo, ...prev])
    setNewTodo({
      title: '',
      priority: 'medium',
      urgency: 'not-urgent',
      importance: 'not-important',
      category: '업무',
      tags: [],
      recurring: { enabled: false, pattern: 'daily' }
    })
    setShowAddForm(false)
  }

  // 할일 토글
  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        const completed = !todo.completed
        
        // 반복 작업 처리
        if (completed && todo.recurring?.enabled) {
          // 완료시 다음 반복 작업 생성
          const nextTodo = createRecurringTodo(todo)
          if (nextTodo) {
            setTimeout(() => setTodos(prev => [nextTodo, ...prev]), 500)
          }
        }
        
        return { 
          ...todo, 
          completed,
          completedAt: completed ? new Date().toISOString() : undefined 
        }
      }
      return todo
    }))
  }

  // 반복 작업 생성
  const createRecurringTodo = (todo: TodoItem): TodoItem | null => {
    if (!todo.recurring?.enabled) return null

    const today = new Date()
    let nextDate = new Date()

    switch (todo.recurring.pattern) {
      case 'daily':
        nextDate.setDate(today.getDate() + 1)
        break
      case 'weekly':
        nextDate.setDate(today.getDate() + 7)
        break
      case 'monthly':
        nextDate.setMonth(today.getMonth() + 1)
        break
      case 'yearly':
        nextDate.setFullYear(today.getFullYear() + 1)
        break
    }

    return {
      ...todo,
      id: Date.now().toString(),
      completed: false,
      dueDate: nextDate.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      completedAt: undefined
    }
  }

  // 할일 삭제
  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }

  // 필터링된 할일 목록
  const filteredTodos = useMemo(() => {
    let filtered = [...todos]

    // 카테고리 필터
    if (selectedCategory) {
      filtered = filtered.filter(todo => todo.category === selectedCategory)
    }

    // 태그 필터
    if (selectedTags.length > 0) {
      filtered = filtered.filter(todo => 
        selectedTags.some(tag => todo.tags?.includes(tag))
      )
    }

    // 시간 기반 필터
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    switch (filterMode) {
      case 'today':
        filtered = filtered.filter(todo => todo.dueDate === todayStr)
        break
      case 'week':
        const weekLater = new Date(today)
        weekLater.setDate(today.getDate() + 7)
        filtered = filtered.filter(todo => {
          if (!todo.dueDate) return false
          const dueDate = new Date(todo.dueDate)
          return dueDate >= today && dueDate <= weekLater
        })
        break
      case 'overdue':
        filtered = filtered.filter(todo => {
          if (!todo.dueDate || todo.completed) return false
          return new Date(todo.dueDate) < today
        })
        break
      case 'recurring':
        filtered = filtered.filter(todo => todo.recurring?.enabled)
        break
    }

    return filtered
  }, [todos, selectedCategory, selectedTags, filterMode])

  // 우선순위 매트릭스용 분류
  const matrixTodos = useMemo(() => {
    return {
      urgentImportant: filteredTodos.filter(t => 
        t.urgency === 'urgent' && t.importance === 'important' && !t.completed
      ),
      notUrgentImportant: filteredTodos.filter(t => 
        t.urgency === 'not-urgent' && t.importance === 'important' && !t.completed
      ),
      urgentNotImportant: filteredTodos.filter(t => 
        t.urgency === 'urgent' && t.importance === 'not-important' && !t.completed
      ),
      notUrgentNotImportant: filteredTodos.filter(t => 
        t.urgency === 'not-urgent' && t.importance === 'not-important' && !t.completed
      ),
    }
  }, [filteredTodos])

  // 카테고리별 분류
  const categorizedTodos = useMemo(() => {
    const grouped: Record<string, TodoItem[]> = {}
    filteredTodos.forEach(todo => {
      const category = todo.category || '기타'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(todo)
    })
    return grouped
  }, [filteredTodos])

  const getPriorityIcon = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className={cn("w-3 h-3", widgetColors.status.error.icon)} />
      case 'medium':
        return <Clock className={cn("w-3 h-3", widgetColors.status.warning.icon)} />
      default:
        return <Clock className={cn("w-3 h-3", widgetColors.text.tertiary)} />
    }
  }

  const incompleteTodos = filteredTodos.filter(todo => !todo.completed)
  const completedTodos = filteredTodos.filter(todo => todo.completed)

  return (
    <div className={cn("h-full flex flex-col p-3 sm:p-4", widgetColors.bg.surface, className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <CheckSquare className={cn("h-4 w-4 sm:h-5 sm:w-5", widgetColors.secondary.icon)} />
          <Typography variant="h3" className={cn("text-base sm:text-lg", widgetColors.text.primary)}>
            할 일
          </Typography>
        </div>
        <div className="flex items-center gap-1">
          {/* 뷰 모드 선택 */}
          <Button 
            variant={viewMode === 'list' ? 'primary' : 'ghost'} 
            size="sm" 
            className="h-7 px-2"
            onClick={() => setViewMode('list')}
          >
            <Filter className="h-3 w-3" />
          </Button>
          <Button 
            variant={viewMode === 'matrix' ? 'primary' : 'ghost'} 
            size="sm" 
            className="h-7 px-2"
            onClick={() => setViewMode('matrix')}
          >
            <Grid3x3 className="h-3 w-3" />
          </Button>
          <Button 
            variant={viewMode === 'categories' ? 'primary' : 'ghost'} 
            size="sm" 
            className="h-7 px-2"
            onClick={() => setViewMode('categories')}
          >
            <Folder className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 ml-2"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className={cn("h-3 w-3 sm:h-4 sm:w-4", widgetColors.text.secondary)} />
          </Button>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap gap-1 mb-3 flex-shrink-0">
        <Button
          variant={filterMode === 'all' ? 'primary' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setFilterMode('all')}
        >
          전체
        </Button>
        <Button
          variant={filterMode === 'today' ? 'primary' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setFilterMode('today')}
        >
          오늘
        </Button>
        <Button
          variant={filterMode === 'week' ? 'primary' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setFilterMode('week')}
        >
          이번주
        </Button>
        <Button
          variant={filterMode === 'overdue' ? 'primary' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setFilterMode('overdue')}
        >
          지연
        </Button>
        <Button
          variant={filterMode === 'recurring' ? 'primary' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setFilterMode('recurring')}
        >
          반복
        </Button>
      </div>

      {/* 할일 추가 폼 */}
      {showAddForm && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg flex-shrink-0">
          <input
            type="text"
            placeholder="새 할일 입력..."
            value={newTodo.title || ''}
            onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-2 py-1 text-sm border rounded mb-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTodo()
            }}
          />
          <div className="flex flex-wrap gap-2 mb-2">
            <select
              value={newTodo.category}
              onChange={(e) => setNewTodo(prev => ({ ...prev, category: e.target.value }))}
              className="text-xs px-2 py-1 border rounded"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={newTodo.priority}
              onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value as TodoItem['priority'] }))}
              className="text-xs px-2 py-1 border rounded"
            >
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={newTodo.recurring?.enabled || false}
                onChange={(e) => setNewTodo(prev => ({ 
                  ...prev, 
                  recurring: { ...prev.recurring!, enabled: e.target.checked } 
                }))}
                className="h-3 w-3"
              />
              <span className="text-xs">반복</span>
            </label>
            {newTodo.recurring?.enabled && (
              <select
                value={newTodo.recurring?.pattern}
                onChange={(e) => setNewTodo(prev => ({ 
                  ...prev, 
                  recurring: { ...prev.recurring!, pattern: e.target.value as any } 
                }))}
                className="text-xs px-2 py-1 border rounded"
              >
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
                <option value="yearly">매년</option>
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addTodo}>추가</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>취소</Button>
          </div>
        </div>
      )}

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* 리스트 뷰 */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {incompleteTodos.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg transition-colors",
                  "hover:bg-[var(--color-primary-surfaceHover)]",
                  todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed
                    ? "bg-red-50" : ""
                )}
              >
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="mt-0.5 p-0 h-auto min-h-0"
                  onClick={() => toggleTodo(todo.id)}
                >
                  <Square className={cn(
                    "w-4 h-4",
                    widgetColors.text.tertiary,
                    "hover:text-[var(--color-brand-secondary-start)]"
                  )} />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Typography variant="body1" className={cn("text-sm", widgetColors.text.primary)}>
                        {todo.title}
                      </Typography>
                      {todo.description && (
                        <Typography variant="body2" className={cn("text-xs mt-0.5", widgetColors.text.secondary)}>
                          {todo.description}
                        </Typography>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {todo.category && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {todo.category}
                          </span>
                        )}
                        {todo.tags?.map(tag => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            #{tag}
                          </span>
                        ))}
                        {todo.recurring?.enabled && (
                          <RefreshCw className="w-3 h-3 text-blue-500" />
                        )}
                        {getPriorityIcon(todo.priority)}
                        {todo.dueDate && (
                          <Typography variant="body2" className="text-xs text-gray-500">
                            {new Date(todo.dueDate).toLocaleDateString('ko-KR')}
                          </Typography>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* 완료된 항목 */}
            {completedTodos.length > 0 && (
              <>
                <div className={cn("border-t pt-2 mt-2 border-gray-200")}>
                  <Typography variant="body2" className={cn(widgetColors.text.secondary, "mb-1")}>
                    완료됨 ({completedTodos.length})
                  </Typography>
                </div>
                {completedTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-lg transition-colors opacity-60",
                      "hover:bg-gray-50"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-0.5 p-0 h-auto min-h-0"
                      onClick={() => toggleTodo(todo.id)}
                    >
                      <CheckSquare className={cn("w-4 h-4", widgetColors.status.success.icon)} />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <Typography variant="body1" className={cn(widgetColors.text.tertiary, "line-through text-sm")}>
                        {todo.title}
                      </Typography>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 우선순위 매트릭스 뷰 */}
        {viewMode === 'matrix' && (
          <div className="h-full grid grid-cols-2 gap-2">
            <div className="border border-red-200 rounded-lg p-2 bg-red-50/50">
              <Typography variant="body2" className="text-xs font-semibold text-red-700 mb-1">
                긴급 & 중요 ({matrixTodos.urgentImportant.length})
              </Typography>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {matrixTodos.urgentImportant.map(todo => (
                  <div key={todo.id} className="text-xs p-1 bg-white rounded cursor-pointer hover:bg-red-100" onClick={() => toggleTodo(todo.id)}>
                    {todo.title}
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-yellow-200 rounded-lg p-2 bg-yellow-50/50">
              <Typography variant="body2" className="text-xs font-semibold text-yellow-700 mb-1">
                중요 ({matrixTodos.notUrgentImportant.length})
              </Typography>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {matrixTodos.notUrgentImportant.map(todo => (
                  <div key={todo.id} className="text-xs p-1 bg-white rounded cursor-pointer hover:bg-yellow-100" onClick={() => toggleTodo(todo.id)}>
                    {todo.title}
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-blue-200 rounded-lg p-2 bg-blue-50/50">
              <Typography variant="body2" className="text-xs font-semibold text-blue-700 mb-1">
                긴급 ({matrixTodos.urgentNotImportant.length})
              </Typography>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {matrixTodos.urgentNotImportant.map(todo => (
                  <div key={todo.id} className="text-xs p-1 bg-white rounded cursor-pointer hover:bg-blue-100" onClick={() => toggleTodo(todo.id)}>
                    {todo.title}
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-2 bg-gray-50/50">
              <Typography variant="body2" className="text-xs font-semibold text-gray-700 mb-1">
                기타 ({matrixTodos.notUrgentNotImportant.length})
              </Typography>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {matrixTodos.notUrgentNotImportant.map(todo => (
                  <div key={todo.id} className="text-xs p-1 bg-white rounded cursor-pointer hover:bg-gray-100" onClick={() => toggleTodo(todo.id)}>
                    {todo.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 카테고리 뷰 */}
        {viewMode === 'categories' && (
          <div className="space-y-3">
            {Object.entries(categorizedTodos).map(([category, categoryTodos]) => (
              <div key={category} className="">
                <div className="flex items-center gap-2 mb-1">
                  <Folder className="w-3 h-3 text-gray-500" />
                  <Typography variant="body2" className="text-xs font-semibold text-gray-700">
                    {category} ({categoryTodos.filter(t => !t.completed).length}/{categoryTodos.length})
                  </Typography>
                </div>
                <div className="space-y-1 pl-5">
                  {categoryTodos.filter(t => !t.completed).map(todo => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-2 p-1 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleTodo(todo.id)}
                    >
                      <Square className="w-3 h-3 text-gray-400" />
                      <Typography variant="body2" className="text-xs flex-1">
                        {todo.title}
                      </Typography>
                      {todo.recurring?.enabled && <RefreshCw className="w-3 h-3 text-blue-500" />}
                      {getPriorityIcon(todo.priority)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 요약 */}
      <div className={cn("mt-3 pt-2 sm:mt-4 sm:pt-3 border-t border-gray-200 flex-shrink-0")}>
        <Typography variant="body2" className={cn("text-xs sm:text-sm", widgetColors.text.secondary)}>
          {incompleteTodos.length}개 남음, {completedTodos.length}개 완료
        </Typography>
      </div>
    </div>
  )
}