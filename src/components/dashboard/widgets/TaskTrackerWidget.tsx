'use client'

import React, { useState, useEffect, forwardRef, memo } from 'react'
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
}

type SortOption = 'priority' | 'dueDate' | 'project' | 'status'
type FilterOption = 'all' | 'today' | 'week' | 'overdue' | 'completed'
type ViewMode = 'list' | 'kanban'

// 간소화된 TaskTrackerWidget - 드래그 앤 드롭 제거
const TaskTrackerWidget = forwardRef<HTMLDivElement, WidgetProps>((props, ref) => {
  const { layout, isDragging, widgetId } = props
  const color = widgetColors[props.color ?? 'zinc'] ?? widgetColors.zinc
  const [tasks, setTasks] = useState<Task[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 샘플 데이터
  useEffect(() => {
    const sampleTasks: Task[] = [
      {
        id: '1',
        title: 'Dashboard UI 개선',
        description: '위젯 드래그 앤 드롭 기능 구현',
        completed: false,
        priority: 'high',
        status: 'in-progress',
        createdAt: new Date(),
        tags: ['UI', 'Development']
      },
      {
        id: '2',
        title: 'API 문서 작성',
        description: 'REST API 엔드포인트 문서화',
        completed: false,
        priority: 'medium',
        status: 'todo',
        createdAt: new Date(),
        tags: ['Documentation']
      },
      {
        id: '3',
        title: '테스트 코드 작성',
        description: '단위 테스트 및 E2E 테스트',
        completed: true,
        priority: 'low',
        status: 'done',
        createdAt: new Date(),
        completedAt: new Date(),
        tags: ['Testing']
      }
    ]
    setTasks(sampleTasks)
    setLoading(false)
  }, [])

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            completed: !task.completed,
            status: !task.completed ? 'done' : 'todo',
            completedAt: !task.completed ? new Date() : undefined
          }
        : task
    ))
  }

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium':
        return <Flag className="h-4 w-4 text-yellow-500" />
      default:
        return <Flag className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status?: Task['status']) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-700'
      case 'in-progress':
        return 'bg-blue-100 text-blue-700'
      case 'review':
        return 'bg-yellow-100 text-yellow-700'
      case 'done':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // 태스크 아이템 렌더링
  const TaskItem = ({ task }: { task: Task }) => (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <button
        onClick={() => toggleTaskComplete(task.id)}
        className="flex-shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Typography 
            variant="body2" 
            className={cn(
              "font-medium truncate",
              task.completed && "line-through text-gray-400"
            )}
          >
            {task.title}
          </Typography>
          {task.status && (
            <span className={cn(
              "px-2 py-0.5 text-xs rounded-full",
              getStatusColor(task.status)
            )}>
              {task.status}
            </span>
          )}
        </div>
        
        {task.description && (
          <Typography variant="caption" className="text-gray-500 truncate">
            {task.description}
          </Typography>
        )}
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {task.tags.map(tag => (
              <span 
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {getPriorityIcon(task.priority)}
      </div>
    </div>
  )

  // 칸반 뷰 렌더링
  const renderKanbanView = () => {
    const columns = ['todo', 'in-progress', 'review', 'done'] as const
    const columnNames = {
      'todo': '할 일',
      'in-progress': '진행 중',
      'review': '검토',
      'done': '완료'
    }

    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map(column => {
          const columnTasks = tasks.filter(task => 
            (task.status || 'todo') === column
          )
          
          return (
            <div 
              key={column}
              className="flex-shrink-0 w-72 bg-gray-50 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <Typography variant="body2" className="font-semibold">
                  {columnNames[column]}
                </Typography>
                <span className="text-sm text-gray-500">
                  {columnTasks.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {columnTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-lg shadow-sm">
                    <TaskItem task={task} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 리스트 뷰 렌더링
  const renderListView = () => (
    <div className="space-y-1">
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )

  if (loading) {
    return (
      <Card 
        ref={ref} 
        className={cn(
          "h-full transition-all duration-200",
          isDragging && "opacity-50 scale-[0.98]",
          color.card,
          color.border
        )}
      >
        <div className="flex items-center justify-center h-full">
          <Typography variant="body2" className="text-gray-400">
            로딩 중...
          </Typography>
        </div>
      </Card>
    )
  }

  return (
    <Card 
      ref={ref} 
      className={cn(
        "h-full flex flex-col overflow-hidden transition-all duration-200",
        isDragging && "opacity-50 scale-[0.98]",
        color.card,
        color.border
      )}
    >
      {/* 헤더 */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={cn("h-5 w-5", color.icon)} />
            <Typography variant="h6" className="font-semibold">
              작업 목록
            </Typography>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {tasks.length}개
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title={viewMode === 'list' ? '칸반 뷰' : '리스트 뷰'}
            >
              {viewMode === 'list' ? (
                <Kanban className="h-4 w-4 text-gray-600" />
              ) : (
                <List className="h-4 w-4 text-gray-600" />
              )}
            </button>
            
            <button
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="새 작업 추가"
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'list' ? renderListView() : renderKanbanView()}
      </div>

      {/* 푸터 */}
      <div className="px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            완료: {tasks.filter(t => t.completed).length}/{tasks.length}
          </span>
          <span>
            오늘: {tasks.filter(t => {
              const today = new Date().toDateString()
              return t.createdAt.toDateString() === today
            }).length}
          </span>
        </div>
      </div>
    </Card>
  )
})

TaskTrackerWidget.displayName = 'TaskTrackerWidget'

export default memo(TaskTrackerWidget, areWidgetPropsEqual)