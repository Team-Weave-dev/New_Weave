'use client'

import React, { useState } from 'react'
import { CheckSquare, Square, Plus, Clock, AlertCircle } from 'lucide-react'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'

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

export function TodoListWidget({ className }: TodoListWidgetProps) {
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
        return <AlertCircle className="w-3 h-3 text-red-500" />
      case 'medium':
        return <Clock className="w-3 h-3 text-orange-500" />
      default:
        return <Clock className="w-3 h-3 text-gray-400" />
    }
  }

  const incompleteTodos = todos.filter(todo => !todo.completed)
  const completedTodos = todos.filter(todo => todo.completed)

  return (
    <div className={`h-full bg-white p-4 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          <Typography variant="h3" className="text-gray-900">
            할 일
          </Typography>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      <div className="space-y-3 max-h-48 overflow-y-auto">
        {/* 미완료 항목 */}
        {incompleteTodos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            onClick={() => toggleTodo(todo.id)}
          >
            <button className="mt-0.5">
              <Square className="w-4 h-4 text-gray-400 hover:text-blue-500" />
            </button>
            <div className="flex-1 min-w-0">
              <Typography variant="body1" className="text-gray-900">
                {todo.title}
              </Typography>
              <div className="flex items-center gap-2 mt-1">
                {getPriorityIcon(todo.priority)}
                <Typography variant="body2" className="text-gray-500">
                  {todo.dueDate}
                </Typography>
              </div>
            </div>
          </div>
        ))}

        {/* 완료된 항목 */}
        {completedTodos.length > 0 && (
          <>
            <div className="border-t border-gray-200 pt-3">
              <Typography variant="body2" className="text-gray-500 mb-2">
                완료된 작업 ({completedTodos.length})
              </Typography>
            </div>
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer opacity-60"
                onClick={() => toggleTodo(todo.id)}
              >
                <button className="mt-0.5">
                  <CheckSquare className="w-4 h-4 text-green-500" />
                </button>
                <div className="flex-1 min-w-0">
                  <Typography variant="body1" className="text-gray-600 line-through">
                    {todo.title}
                  </Typography>
                  <div className="flex items-center gap-2 mt-1">
                    {getPriorityIcon(todo.priority)}
                    <Typography variant="body2" className="text-gray-400">
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
      <div className="mt-4 pt-3 border-t border-gray-200">
        <Typography variant="body2" className="text-gray-600">
          {incompleteTodos.length}개 남음, {completedTodos.length}개 완료
        </Typography>
      </div>
    </div>
  )
}