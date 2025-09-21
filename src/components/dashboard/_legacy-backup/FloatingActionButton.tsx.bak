'use client'

import React, { useState } from 'react'
import { Plus, Grid, Save, Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

interface FABAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  color?: string
}

interface FloatingActionButtonProps {
  actions?: FABAction[]
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  onAddWidget?: () => void
  onToggleGrid?: () => void
  onSave?: () => void
  onSettings?: () => void
}

/**
 * 플로팅 액션 버튼 (FAB)
 * 모바일에서 주요 동작을 빠르게 접근할 수 있도록 제공
 */
export function FloatingActionButton({
  actions,
  className,
  position = 'bottom-right',
  onAddWidget,
  onToggleGrid,
  onSave,
  onSettings
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 기본 액션들
  const defaultActions: FABAction[] = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: '위젯 추가',
      onClick: () => {
        onAddWidget?.()
        setIsOpen(false)
      },
      color: 'bg-blue-500'
    },
    {
      icon: <Grid className="h-5 w-5" />,
      label: '그리드 변경',
      onClick: () => {
        onToggleGrid?.()
        setIsOpen(false)
      },
      color: 'bg-green-500'
    },
    {
      icon: <Save className="h-5 w-5" />,
      label: '저장',
      onClick: () => {
        onSave?.()
        setIsOpen(false)
      },
      color: 'bg-purple-500'
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: '설정',
      onClick: () => {
        onSettings?.()
        setIsOpen(false)
      },
      color: 'bg-gray-500'
    }
  ]

  const finalActions = actions || defaultActions

  // 위치 클래스
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  return (
    <>
      {/* 오버레이 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB 컨테이너 */}
      <div
        className={cn(
          'fixed z-50 lg:hidden',
          positionClasses[position],
          className
        )}
      >
        {/* 서브 액션 버튼들 */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-16 right-0 space-y-3"
            >
              {finalActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-end gap-2"
                >
                  {/* 라벨 */}
                  <span className="bg-gray-800 text-white text-sm px-3 py-1 rounded-full whitespace-nowrap">
                    {action.label}
                  </span>
                  
                  {/* 액션 버튼 */}
                  <button
                    onClick={action.onClick}
                    className={cn(
                      'w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110',
                      action.color || 'bg-gray-500'
                    )}
                  >
                    {action.icon}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 메인 FAB 버튼 */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all',
            isOpen 
              ? 'bg-red-500 rotate-45' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500'
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </motion.button>
      </div>
    </>
  )
}

/**
 * 미니 FAB - 단일 액션용
 */
interface MiniFABProps {
  icon: React.ReactNode
  onClick: () => void
  label?: string
  color?: string
  className?: string
}

export function MiniFAB({
  icon,
  onClick,
  label,
  color = 'bg-blue-500',
  className
}: MiniFABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-4 right-4 w-12 h-12 rounded-full shadow-lg',
        'flex items-center justify-center text-white',
        'transition-transform hover:scale-110 active:scale-95',
        'lg:hidden z-50',
        color,
        className
      )}
      aria-label={label}
    >
      {icon}
    </button>
  )
}