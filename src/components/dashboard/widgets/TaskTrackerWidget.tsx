'use client'

import React, { useState, useEffect, useMemo, useCallback, forwardRef, memo } from 'react'
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  ChevronDown,
  Filter,
  Calendar,
  Flag,
  X,
  Edit2,
  Trash2,
  Kanban,
  List,
  ChevronUp
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'
import type { WidgetProps } from '@/types/dashboard'
import { cn } from '@/lib/utils'
import { getSupabaseClientSafe } from '@/lib/supabase/client'
import { widgetColors } from '@/lib/dashboard/widget-colors'
import { areWidgetPropsEqual } from '@/lib/dashboard/optimization'
import { FixedSizeList } from 'react-window'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  useScreenReader,
  useAriaProps,
  useDragAndDropAnnouncements 
} from '@/lib/accessibility/hooks/useScreenReader'
import { ariaLabels } from '@/lib/accessibility/screen-reader'

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'urgent' | 'high' | 'medium' | 'low'
  dueDate?: Date
  projectId?: string
  projectName?: string
  createdAt: Date
  completedAt?: Date
  tags?: string[]
  status?: 'todo' | 'in-progress' | 'review' | 'done'
  subtasks?: SubTask[]
}

interface SubTask {
  id: string
  title: string
  completed: boolean
}

type SortOption = 'priority' | 'dueDate' | 'project' | 'status'
type FilterOption = 'all' | 'today' | 'week' | 'overdue' | 'completed'
type ViewMode = 'list' | 'kanban'

// 가상 스크롤링 TaskRow 컴포넌트의 props
interface TaskRowProps {
  index: number
  style: React.CSSProperties
  data: {
    tasks: Task[]
    toggleTaskComplete: (id: string) => void
    toggleTaskExpanded: (id: string) => void
    toggleSubtask: (taskId: string, subtaskId: string) => void
    deleteTask: (id: string) => void
    expandedTasks: Set<string>
    getPriorityColor: (priority: Task['priority']) => string
    getPriorityIcon: (priority: Task['priority']) => React.ReactNode
  }
}

// 가상 스크롤링을 위한 TaskRow 컴포넌트 - React.memo로 최적화
const TaskRow = memo(({ index, style, data }: TaskRowProps) => {
  const {
    tasks,
    toggleTaskComplete,
    toggleTaskExpanded,
    toggleSubtask,
    deleteTask,
    expandedTasks,
    getPriorityColor,
    getPriorityIcon
  } = data
  
  const task = tasks[index]
  
  if (!task) return null
  
  return (
    <div style={style}>
      <div
        className={cn(
          "group p-2 mx-2 rounded-lg hover:bg-gray-50 transition-colors",
          task.completed && "opacity-60"
        )}
      >
        <div className="flex items-start gap-2">
          <button
            onClick={() => toggleTaskComplete(task.id)}
            className="mt-0.5 flex-shrink-0"
          >
            {task.completed ? (
              <CheckCircle2 className={cn("w-4 h-4", widgetColors.status.success.icon)} />
            ) : (
              <Circle className={cn("w-4 h-4", widgetColors.icon.muted, "hover:text-gray-600")} />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {task.subtasks && task.subtasks.length > 0 && (
                    <button
                      onClick={() => toggleTaskExpanded(task.id)}
                      className="p-0.5 hover:bg-gray-200 rounded"
                    >
                      {expandedTasks.has(task.id) ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronUp className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  <Typography 
                    variant="body2" 
                    className={cn(
                      "text-gray-900",
                      task.completed && "line-through"
                    )}
                  >
                    {task.title}
                  </Typography>
                </div>
                {task.description && (
                  <Typography variant="caption" className="text-gray-500 ml-5">
                    {task.description}
                  </Typography>
                )}
              </div>
              
              {/* 우선순위 배지 */}
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                getPriorityColor(task.priority)
              )}>
                {getPriorityIcon(task.priority)}
                <span className="hidden sm:inline">
                  {task.priority === 'urgent' && '긴급'}
                  {task.priority === 'high' && '높음'}
                  {task.priority === 'medium' && '보통'}
                  {task.priority === 'low' && '낮음'}
                </span>
              </div>
            </div>
            
            {/* 서브태스크 */}
            {expandedTasks.has(task.id) && task.subtasks && task.subtasks.length > 0 && (
              <div className="ml-6 mt-2 space-y-1">
                {task.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSubtask(task.id, subtask.id)}
                      className="flex-shrink-0"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <Circle className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    <Typography
                      variant="caption"
                      className={cn(
                        "text-gray-700",
                        subtask.completed && "line-through text-gray-500"
                      )}
                    >
                      {subtask.title}
                    </Typography>
                  </div>
                ))}
              </div>
            )}
            
            {/* 메타 정보 */}
            <div className="flex items-center gap-3 mt-1">
              {task.projectName && (
                <span className="text-xs text-gray-500">
                  {task.projectName}
                </span>
              )}
              {task.dueDate && (
                <span className={cn(
                  "flex items-center gap-1 text-xs",
                  new Date(task.dueDate) < new Date() && !task.completed
                    ? widgetColors.status.error.text
                    : widgetColors.text.tertiary
                )}>
                  <Calendar className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
              {task.tags && task.tags.length > 0 && (
                <div className="flex gap-1">
                  {task.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 작업 액션 (호버 시 표시) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => deleteTask(task.id)}
              className={cn("p-1 transition-colors", widgetColors.icon.muted, "hover:" + widgetColors.status.error.text)}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

// 칸반 카드 컴포넌트 - React.memo로 최적화
interface KanbanCardProps {
  task: Task
  onToggleComplete: (id: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string) => void
  onDelete: (id: string) => void
  getPriorityColor: (priority: Task['priority']) => string
  getPriorityIcon: (priority: Task['priority']) => React.ReactNode
}

const KanbanCard = memo(({
  task,
  onToggleComplete,
  onToggleSubtask,
  onDelete,
  getPriorityColor,
  getPriorityIcon
}: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [expanded, setExpanded] = useState(false)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow",
        task.completed && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleComplete(task.id)
            }}
            className="mt-0.5 flex-shrink-0"
          >
            {task.completed ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
          <div className="flex-1">
            <Typography 
              variant="body2" 
              className={cn(
                "text-gray-900 font-medium",
                task.completed && "line-through"
              )}
            >
              {task.title}
            </Typography>
            {task.description && (
              <Typography variant="caption" className="text-gray-500 mt-1">
                {task.description}
              </Typography>
            )}
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
          getPriorityColor(task.priority)
        )}>
          {getPriorityIcon(task.priority)}
        </div>
      </div>

      {/* 서브태스크 */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            <span>
              {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} 완료
            </span>
          </button>
          {expanded && (
            <div className="mt-1 space-y-1">
              {task.subtasks.map(subtask => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleSubtask(task.id, subtask.id)
                    }}
                    className="flex-shrink-0"
                  >
                    {subtask.completed ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <Circle className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  <Typography
                    variant="caption"
                    className={cn(
                      "text-gray-700",
                      subtask.completed && "line-through text-gray-500"
                    )}
                  >
                    {subtask.title}
                  </Typography>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 메타 정보 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.projectName && (
            <span className="text-xs text-gray-500">
              {task.projectName}
            </span>
          )}
          {task.dueDate && (
            <span className={cn(
              "flex items-center gap-1 text-xs",
              new Date(task.dueDate) < new Date() && !task.completed
                ? "text-red-500"
                : "text-gray-500"
            )}>
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task.id)
          }}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* 태그 */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {task.tags.map(tag => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

// TaskTrackerWidget을 React.memo로 최적화
export const TaskTrackerWidget = memo(({
  id,
  type,
  config,
  isEditMode,
  className
}: WidgetProps) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium')
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const supabase = getSupabaseClientSafe()

  // 스크린 리더 지원
  const { 
    announceCompletion,
    announceCount,
    announceSelection,
    announceWidgetState,
    announceLoading
  } = useScreenReader()
  
  const {
    announceDragStart,
    announceDragOver,
    announceDrop,
    announceDragCancel
  } = useDragAndDropAnnouncements()

  const widgetAriaProps = useAriaProps('widget', {
    type: 'TaskTracker',
    title: '작업 추적기'
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 초기 데이터 로드
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        
        // 실제로는 Supabase에서 데이터를 가져옴
        // const { data: tasksData, error } = await supabase
        //   .from('tasks')
        //   .select('*')
        //   .order('created_at', { ascending: false })

        // 임시 데이터
        const mockTasks: Task[] = [
          {
            id: '1',
            title: '프로젝트 제안서 작성',
            description: '신규 클라이언트를 위한 제안서 준비',
            completed: false,
            priority: 'urgent',
            dueDate: new Date(Date.now() + 86400000), // 내일
            projectId: 'proj1',
            projectName: '웹사이트 리뉴얼',
            createdAt: new Date(Date.now() - 86400000),
            tags: ['문서', '긴급'],
            status: 'in-progress',
            subtasks: [
              { id: 'sub1-1', title: '요구사항 분석', completed: true },
              { id: 'sub1-2', title: '견적 작성', completed: false },
              { id: 'sub1-3', title: '최종 검토', completed: false }
            ]
          },
          {
            id: '2',
            title: '클라이언트 미팅 준비',
            completed: false,
            priority: 'high',
            dueDate: new Date(Date.now() + 172800000), // 2일 후
            projectId: 'proj1',
            projectName: '웹사이트 리뉴얼',
            createdAt: new Date(Date.now() - 172800000),
            tags: ['미팅'],
            status: 'todo'
          },
          {
            id: '3',
            title: '월간 보고서 검토',
            completed: true,
            priority: 'medium',
            dueDate: new Date(Date.now() - 86400000), // 어제
            projectId: 'proj2',
            projectName: '모바일 앱 개발',
            createdAt: new Date(Date.now() - 259200000),
            completedAt: new Date(Date.now() - 86400000),
            tags: ['보고서'],
            status: 'done'
          },
          {
            id: '4',
            title: '디자인 시안 피드백',
            completed: false,
            priority: 'medium',
            dueDate: new Date(Date.now() + 259200000), // 3일 후
            projectId: 'proj2',
            projectName: '모바일 앱 개발',
            createdAt: new Date(Date.now() - 86400000),
            tags: ['디자인', '피드백'],
            status: 'review',
            subtasks: [
              { id: 'sub4-1', title: '메인 화면 검토', completed: true },
              { id: 'sub4-2', title: '색상 테마 피드백', completed: false }
            ]
          },
          {
            id: '5',
            title: '팀 회의 일정 조율',
            completed: false,
            priority: 'low',
            dueDate: new Date(Date.now() + 604800000), // 1주일 후
            projectId: 'proj3',
            projectName: '내부 프로세스 개선',
            createdAt: new Date(),
            tags: ['미팅', '내부'],
            status: 'todo'
          }
        ]

        setTasks(mockTasks)
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!isEditMode) {
      fetchTasks()
    } else {
      // 편집 모드에서는 샘플 데이터
      setTasks([
        {
          id: 'sample1',
          title: '샘플 작업 1',
          completed: false,
          priority: 'high',
          dueDate: new Date(),
          projectName: '프로젝트 A',
          createdAt: new Date()
        },
        {
          id: 'sample2',
          title: '샘플 작업 2',
          completed: true,
          priority: 'medium',
          projectName: '프로젝트 B',
          createdAt: new Date()
        }
      ])
      setLoading(false)
    }
  }, [isEditMode, supabase])

  // 작업 필터링 및 정렬
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks]

    // 필터링
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(today.getTime() + 7 * 86400000)

    switch (filterBy) {
      case 'today':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false
          const taskDate = new Date(task.dueDate)
          return taskDate >= today && taskDate < new Date(today.getTime() + 86400000)
        })
        break
      case 'week':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false
          return new Date(task.dueDate) <= weekFromNow
        })
        break
      case 'overdue':
        filtered = filtered.filter(task => {
          if (!task.dueDate || task.completed) return false
          return new Date(task.dueDate) < today
        })
        break
      case 'completed':
        filtered = filtered.filter(task => task.completed)
        break
      default:
        // 'all' - 필터링 없음
        break
    }

    // 프로젝트 필터
    if (selectedProject !== 'all') {
      filtered = filtered.filter(task => task.projectId === selectedProject)
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'project':
          return (a.projectName || '').localeCompare(b.projectName || '')
        case 'status':
          return Number(a.completed) - Number(b.completed)
        default:
          return 0
      }
    })

    return filtered
  }, [tasks, filterBy, sortBy, selectedProject])

  // 필터링 결과 알림
  useEffect(() => {
    if (!loading && filteredTasks.length > 0) {
      const completedCount = filteredTasks.filter(t => t.completed).length
      announceCount('작업 목록', filteredTasks.length)
      if (completedCount > 0) {
        announceCount('완료된 작업', completedCount, filteredTasks.length)
      }
    }
  }, [filteredTasks, loading, announceCount])

  // 작업 완료 토글 - useCallback으로 최적화
  const toggleTaskComplete = useCallback((taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId)
      if (task) {
        const newCompleted = !task.completed
        announceCompletion(
          `"${task.title}" 작업`,
          true,
          newCompleted ? '완료됨' : '미완료로 변경됨'
        )
      }
      return prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              completed: !task.completed,
              completedAt: !task.completed ? new Date() : undefined
            }
          : task
      )
    })
  }, [announceCompletion])

  // 새 작업 추가
  const addTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      completed: false,
      priority: newTaskPriority,
      createdAt: new Date()
    }

    setTasks(prev => [newTask, ...prev])
    setNewTaskTitle('')
    setNewTaskPriority('medium')
    setShowAddTask(false)
    announceCompletion(`"${newTaskTitle}" 작업 추가`, true)
  }

  // 작업 삭제 - useCallback으로 최적화
  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId)
      if (task) {
        announceCompletion(`"${task.title}" 작업 삭제`, true)
      }
      return prev.filter(task => task.id !== taskId)
    })
  }, [announceCompletion])

  // 서브태스크 토글 - useCallback으로 최적화
  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks?.map(sub =>
            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
          )
        }
      }
      return task
    }))
  }, [])

  // 태스크 확장 토글 - useCallback으로 최적화
  const toggleTaskExpanded = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }, [])

  // 칸반 보드 드래그 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    const task = tasks.find(t => t.id === event.active.id)
    if (task) {
      announceDragStart(task.title)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const activeTask = tasks.find(t => t.id === active.id)
      const overContainer = over.id as string
      
      if (activeTask && ['todo', 'in-progress', 'review', 'done'].includes(overContainer)) {
        // 상태 변경
        const statusNames = {
          'todo': '할 일',
          'in-progress': '진행 중',
          'review': '검토',
          'done': '완료'
        }
        announceDrop(activeTask.title, statusNames[overContainer as keyof typeof statusNames])
        
        setTasks(prev => prev.map(task =>
          task.id === active.id
            ? { ...task, status: overContainer as Task['status'] }
            : task
        ))
      } else {
        // 같은 컬럼 내에서 순서 변경
        const activeIndex = tasks.findIndex(t => t.id === active.id)
        const overIndex = tasks.findIndex(t => t.id === over.id)
        
        if (activeIndex !== -1 && overIndex !== -1) {
          announceDrop(activeTask?.title || '', `${overIndex + 1}번째 위치`)
          setTasks(prev => arrayMove(prev, activeIndex, overIndex))
        }
      }
    }
    
    setActiveId(null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const activeTask = tasks.find(t => t.id === active.id)
      const overContainer = over.id as string
      
      if (activeTask && ['todo', 'in-progress', 'review', 'done'].includes(overContainer)) {
        setTasks(prev => prev.map(task =>
          task.id === active.id
            ? { ...task, status: overContainer as Task['status'] }
            : task
        ))
      }
    }
  }

  // 우선순위 색상 - useCallback으로 최적화
  const getPriorityColor = useCallback((priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return cn(widgetColors.status.error.text, widgetColors.status.error.bgLight)
      case 'high': return cn(widgetColors.status.warning.text, widgetColors.status.warning.bgLight)
      case 'medium': return cn(widgetColors.primary.text, widgetColors.primary.bgLight)
      case 'low': return cn(widgetColors.text.secondary, widgetColors.bg.surfaceSecondary)
    }
  }, [])

  // 우선순위 아이콘 - useCallback으로 최적화
  const getPriorityIcon = useCallback((priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-3 h-3" />
      case 'high': return <AlertCircle className="w-3 h-3" />
      case 'medium': return <Flag className="w-3 h-3" />
      case 'low': return <Circle className="w-3 h-3" />
    }
  }, [])

  // 편집 모드 뷰
  if (isEditMode) {
    return (
      <Card className={cn("h-full flex items-center justify-center bg-gray-50", className)}>
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <Typography variant="body2" className="text-gray-600">
            작업 추적기
          </Typography>
          <Typography variant="caption" className="text-gray-500 mt-1">
            프로젝트별 작업 관리
          </Typography>
        </div>
      </Card>
    )
  }

  // 로딩 상태
  if (loading) {
    return (
      <Card className={cn("h-full p-4", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  // 통계
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    urgent: tasks.filter(t => !t.completed && t.priority === 'urgent').length,
    overdue: tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length
  }

  return (
    <Card className={cn("h-full p-4 flex flex-col", className)} {...widgetAriaProps}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className={cn("w-5 h-5", widgetColors.primary.icon)} />
          <Typography variant="h3" className={widgetColors.text.primary} id="task-tracker-title">
            작업 관리
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          {/* 뷰 모드 토글 */}
          <div 
            className="flex items-center bg-gray-100 rounded-lg p-1" 
            role="group" 
            aria-label="보기 모드 선택"
          >
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1 rounded transition-colors",
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              )}
              aria-label="리스트 보기"
              aria-pressed={viewMode === 'list'}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-1 rounded transition-colors",
                viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              )}
              aria-label="칸반 보기"
              aria-pressed={viewMode === 'kanban'}
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddTask(!showAddTask)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <Typography variant="caption" className="text-gray-500">
            전체
          </Typography>
          <Typography variant="h4" className={widgetColors.text.primary}>
            {stats.total}
          </Typography>
        </div>
        <div className="text-center">
          <Typography variant="caption" className="text-gray-500">
            완료
          </Typography>
          <Typography variant="h4" className={widgetColors.status.success.text}>
            {stats.completed}
          </Typography>
        </div>
        <div className="text-center">
          <Typography variant="caption" className="text-gray-500">
            긴급
          </Typography>
          <Typography variant="h4" className={widgetColors.status.error.text}>
            {stats.urgent}
          </Typography>
        </div>
        <div className="text-center">
          <Typography variant="caption" className="text-gray-500">
            지연
          </Typography>
          <Typography variant="h4" className={widgetColors.status.warning.text}>
            {stats.overdue}
          </Typography>
        </div>
      </div>

      {/* 필터 및 정렬 */}
      <div className="flex gap-2 mb-3">
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as FilterOption)}
          className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
        >
          <option value="all">모든 작업</option>
          <option value="today">오늘</option>
          <option value="week">이번 주</option>
          <option value="overdue">지연됨</option>
          <option value="completed">완료됨</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
        >
          <option value="priority">우선순위</option>
          <option value="dueDate">마감일</option>
          <option value="project">프로젝트</option>
          <option value="status">상태</option>
        </select>
      </div>

      {/* 새 작업 추가 폼 */}
      {showAddTask && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="새 작업 입력..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              autoFocus
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="urgent">긴급</option>
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddTask(false)
                setNewTaskTitle('')
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
            >
              추가
            </Button>
          </div>
        </div>
      )}

      {/* 작업 목록 / 칸반 보드 */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'list' ? (
          // 리스트 뷰 with 가상 스크롤링
          filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-8">
              <Typography variant="body2" className="text-gray-500">
                작업이 없습니다
              </Typography>
            </div>
          ) : (
            <FixedSizeList
              height={400} // 위젯 높이에 맞게 조정
              itemCount={filteredAndSortedTasks.length}
              itemSize={expandedTasks.size > 0 ? 120 : 80} // 동적 높이 (확장 시 더 큼)
              width="100%"
              itemData={{
                tasks: filteredAndSortedTasks,
                toggleTaskComplete,
                toggleTaskExpanded,
                toggleSubtask,
                deleteTask,
                expandedTasks,
                getPriorityColor,
                getPriorityIcon
              }}
            >
              {TaskRow}
            </FixedSizeList>
          )
        ) : (
          // 칸반 보드 뷰
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
            <div className="flex gap-3 h-full overflow-x-auto pb-2">
              {(['todo', 'in-progress', 'review', 'done'] as const).map(status => {
                const columnTasks = filteredAndSortedTasks.filter(task => 
                  task.status === status || (!task.status && status === 'todo')
                )
                
                return (
                  <div
                    key={status}
                    className="flex-1 min-w-[250px] flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Typography variant="body2" className="font-medium">
                        {status === 'todo' && '할 일'}
                        {status === 'in-progress' && '진행 중'}
                        {status === 'review' && '검토'}
                        {status === 'done' && '완료'}
                      </Typography>
                      <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">
                        {columnTasks.length}
                      </span>
                    </div>
                    
                    <SortableContext
                      items={columnTasks.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div
                        id={status}
                        className="flex-1 space-y-2 p-2 bg-gray-50 rounded-lg overflow-y-auto"
                      >
                        {columnTasks.length === 0 ? (
                          <div className="text-center py-4">
                            <Typography variant="caption" className="text-gray-400">
                              작업 없음
                            </Typography>
                          </div>
                        ) : (
                          columnTasks.map(task => (
                            <KanbanCard
                              key={task.id}
                              task={task}
                              onToggleComplete={toggleTaskComplete}
                              onToggleSubtask={toggleSubtask}
                              onDelete={deleteTask}
                              getPriorityColor={getPriorityColor}
                              getPriorityIcon={getPriorityIcon}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </div>
                )
              })}
            </div>
            
            <DragOverlay>
              {activeId ? (
                <div className="bg-white shadow-lg rounded-lg p-3 opacity-80">
                  <Typography variant="body2">
                    {tasks.find(t => t.id === activeId)?.title}
                  </Typography>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </Card>
  )
}, areWidgetPropsEqual)

// 위젯 메타데이터
export const taskTrackerWidgetMetadata = {
  name: '작업 추적기',
  description: '프로젝트별 작업을 추적하고 관리',
  icon: 'tasks',
  defaultSize: { width: 2, height: 2 },
  minSize: { width: 2, height: 2 },
  maxSize: { width: 4, height: 4 },
  tags: ['작업', '할일', '프로젝트', '관리'],
  configurable: true,
  version: '1.0.0'
}

export default TaskTrackerWidget