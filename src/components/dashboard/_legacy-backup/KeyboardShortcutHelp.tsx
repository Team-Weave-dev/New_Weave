'use client'

import React from 'react'
import { X, Keyboard } from 'lucide-react'
import Button from '@/components/ui/Button'
import Typography from '@/components/ui/Typography'
import { cn } from '@/lib/utils'

interface KeyboardShortcutHelpProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  {
    category: '전역 단축키',
    items: [
      { keys: ['Cmd/Ctrl', 'E'], description: '편집 모드 토글' },
      { keys: ['Cmd/Ctrl', 'S'], description: '레이아웃 저장' },
      { keys: ['Cmd/Ctrl', 'Z'], description: '실행 취소 (예정)' },
      { keys: ['Cmd/Ctrl', 'Shift', 'Z'], description: '다시 실행 (예정)' },
    ]
  },
  {
    category: '편집 모드',
    items: [
      { keys: ['Tab'], description: '다음 위젯 선택' },
      { keys: ['Shift', 'Tab'], description: '이전 위젯 선택' },
      { keys: ['Escape'], description: '편집 모드 종료' },
      { keys: ['Enter'], description: '위젯 설정 열기' },
      { keys: ['Delete'], description: '선택된 위젯 삭제' },
    ]
  },
  {
    category: '위젯 조작',
    items: [
      { keys: ['Ctrl', '←↑→↓'], description: '위젯 이동' },
      { keys: ['Cmd/Ctrl', '+'], description: '위젯 크기 증가' },
      { keys: ['Cmd/Ctrl', '-'], description: '위젯 크기 감소' },
      { keys: ['Cmd/Ctrl', 'L'], description: '위젯 잠금 토글' },
      { keys: ['Cmd/Ctrl', 'R'], description: '위젯 자동 정렬' },
    ]
  },
  {
    category: '예정된 기능',
    items: [
      { keys: ['Cmd/Ctrl', 'A'], description: '모든 위젯 선택' },
      { keys: ['Cmd/Ctrl', 'D'], description: '위젯 복제' },
    ]
  }
]

export function KeyboardShortcutHelp({ isOpen, onClose }: KeyboardShortcutHelpProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-primary-surface)] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-gray-200)]">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-[var(--color-gray-600)]" />
            <Typography variant="h2" className="text-lg font-semibold">
              키보드 단축키
            </Typography>
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
          <div className="space-y-6">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <Typography variant="h3" className="text-sm font-semibold text-[var(--color-gray-700)] mb-3">
                  {category.category}
                </Typography>
                <div className="space-y-2">
                  {category.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-gray-50)]"
                    >
                      <div className="flex items-center gap-2">
                        {item.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-gray-400 text-xs">+</span>
                            )}
                            <kbd className={cn(
                              "px-2 py-1 text-xs font-mono font-semibold",
                              "bg-gray-100 border border-gray-300 rounded",
                              "shadow-sm"
                            )}>
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 안내 메시지 */}
          <div className="mt-6 p-4 bg-[var(--color-blue-50)] rounded-lg">
            <Typography variant="body2" className="text-[var(--color-blue-800)]">
              💡 <strong>팁:</strong> 편집 모드에서 위젯을 선택한 후 단축키를 사용하세요.
              대부분의 단축키는 편집 모드에서만 작동합니다.
            </Typography>
          </div>
        </div>
      </div>
    </div>
  )
}