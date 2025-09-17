'use client'

import React, { useState } from 'react'
import { CheckSquare, Square, Plus, Clock, AlertCircle } from 'lucide-react'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'
import { widgetColors } from '@/lib/dashboard/widget-colors'
import { cn } from '@/lib/utils'

interface TodoItem {
  id: string
  title: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
}

interface TodoListWidgetProps {
  className?: string
}

export default function TodoListWidget({ className }: TodoListWidgetProps) {
  // 임시 데이터 - 추후 실제 API 연동
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: '1',
      title: '클라이언트 미팅 준비',
      completed: false,
      priority: 'high',
      dueDate: '오늘'
    },
    {
      id: '2',
      title: '프로젝트 제안서 검토',
      completed: true,
      priority: 'medium',
      dueDate: '어제'
    },
    {
      id: '3',
      title: '월간 보고서 작성',
      completed: false,
      priority: 'medium',
      dueDate: '내일'
    },
    {
      id: '4',
      title: '팀 미팅',
      completed: false,
      priority: 'low',
      dueDate: '금요일'
    },
  ])

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

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

  const incompleteTodos = todos.filter(todo => !todo.completed)
  const completedTodos = todos.filter(todo => todo.completed)

  return (
    <div className={cn("h-full flex flex-col p-3 sm:p-4", widgetColors.bg.surface, className)}>
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <CheckSquare className={cn("h-4 w-4 sm:h-5 sm:w-5", widgetColors.secondary.icon)} />
          <Typography variant="h3" className={cn("text-base sm:text-lg", widgetColors.text.primary)}>
            할 일
          </Typography>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className={cn("h-3 w-3 sm:h-4 sm:w-4", widgetColors.text.secondary)} />
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
        {/* 미완료 항목 */}
        {incompleteTodos.map((todo) => (
          <div
            key={todo.id}
            className={cn(
              "flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer",
              "hover:bg-[var(--color-primary-surfaceHover)]"
            )}
            onClick={() => toggleTodo(todo.id)}
          >
            <Button 
              variant="ghost" 
              size="sm"
              className="mt-0.5 p-0 h-auto min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Square className={cn(
                "w-4 h-4",
                widgetColors.text.tertiary,
                "hover:text-[var(--color-brand-secondary-start)]"
              )} />
            </Button>
            <div className="flex-1 min-w-0">
              <Typography variant="body1" className={cn("text-sm sm:text-base", widgetColors.text.primary)}>
                {todo.title}
              </Typography>
              <div className="flex items-center gap-2 mt-1">
                {getPriorityIcon(todo.priority)}
                <Typography variant="body2" className={cn("text-xs sm:text-sm", widgetColors.text.secondary)}>
                  {todo.dueDate}
                </Typography>
              </div>
            </div>
          </div>
        ))}

        {/* 완료된 항목 */}
        {completedTodos.length > 0 && (
          <>
            <div className={cn("border-t pt-3 border-gray-200")}>
              <Typography variant="body2" className={cn(widgetColors.text.secondary, "mb-2")}>
                완료된 작업 ({completedTodos.length})
              </Typography>
            </div>
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer opacity-60",
                  "hover:bg-gray-50"
                )}
                onClick={() => toggleTodo(todo.id)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-0.5 p-0 h-auto min-h-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CheckSquare className={cn("w-4 h-4", widgetColors.status.success.icon)} />
                </Button>
                <div className="flex-1 min-w-0">
                  <Typography variant="body1" className={cn(widgetColors.text.tertiary, "line-through")}>
                    {todo.title}
                  </Typography>
                  <div className="flex items-center gap-2 mt-1">
                    {getPriorityIcon(todo.priority)}
                    <Typography variant="body2" className={widgetColors.text.muted}>
                      {todo.dueDate}
                    </Typography>
                  </div>
                </div>
              </div>
            ))}
          </>
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