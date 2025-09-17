'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Keyboard, X, HelpCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Typography from '@/components/ui/Typography'

interface KeyboardShortcutsProps {
  className?: string
}

interface ShortcutGroup {
  title: string
  shortcuts: Array<{
    keys: string[]
    description: string
  }>
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: '네비게이션',
    shortcuts: [
      { keys: ['Tab'], description: '다음 위젯으로 이동' },
      { keys: ['Shift', 'Tab'], description: '이전 위젯으로 이동' },
      { keys: ['Enter'], description: '위젯 선택/선택 해제' },
      { keys: ['Esc'], description: '선택 해제 및 포커스 해제' },
    ],
  },
  {
    title: '위젯 이동',
    shortcuts: [
      { keys: ['↑', '↓', '←', '→'], description: '위젯 이동' },
      { keys: ['Shift', '↑'], description: '위젯 높이 감소' },
      { keys: ['Shift', '↓'], description: '위젯 높이 증가' },
      { keys: ['Shift', '←'], description: '위젯 너비 감소' },
      { keys: ['Shift', '→'], description: '위젯 너비 증가' },
    ],
  },
  {
    title: '위젯 관리',
    shortcuts: [
      { keys: ['Space'], description: '전체화면 토글' },
      { keys: ['Ctrl/Cmd', 'L'], description: '위젯 잠금/잠금 해제' },
      { keys: ['Ctrl/Cmd', 'S'], description: '위젯 설정 열기' },
      { keys: ['Delete'], description: '위젯 삭제' },
      { keys: ['Backspace'], description: '위젯 삭제 (대체)' },
    ],
  },
]

export function KeyboardShortcuts({ className }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // 키보드 단축키로 도움말 열기 (F1 또는 Shift+?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1' || (e.shiftKey && e.key === '?')) {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // 처음 방문 시 도움말 버튼 표시
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('dashboard-keyboard-help-seen')
    if (!hasSeenHelp) {
      setShowHelp(true)
      setTimeout(() => {
        setShowHelp(false)
        localStorage.setItem('dashboard-keyboard-help-seen', 'true')
      }, 5000)
    }
  }, [])

  if (!isOpen) {
    return (
      <div className={cn('fixed bottom-4 right-4 z-50', className)}>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setIsOpen(true)}
          className={cn(
            'rounded-full shadow-lg bg-white hover:bg-gray-50 border border-gray-200',
            showHelp && 'animate-pulse ring-2 ring-blue-400 ring-offset-2'
          )}
          title="키보드 단축키 (F1)"
        >
          <Keyboard className="h-5 w-5" />
          {showHelp && (
            <span className="ml-2 text-sm font-medium">키보드 단축키</span>
          )}
        </Button>
        {showHelp && (
          <div className="absolute bottom-full right-0 mb-2 mr-2">
            <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                <span>F1 또는 Shift+?로 열기</span>
              </div>
              <div className="absolute bottom-0 right-4 transform translate-y-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', className)}>
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-gray-600" />
            <Typography variant="h3" className="text-gray-900">
              키보드 단축키
            </Typography>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
          <div className="space-y-6">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <Typography variant="h4" className="text-gray-700 mb-3">
                  {group.title}
                </Typography>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-gray-400 text-sm">+</span>
                            )}
                            <kbd className="px-2 py-1 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Typography variant="caption" className="text-gray-500 text-center">
            F1 또는 Shift+?를 눌러 이 도움말을 언제든지 열 수 있습니다
          </Typography>
        </div>
      </div>
    </div>
  )
}