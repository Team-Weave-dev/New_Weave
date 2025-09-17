'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

interface EditModeHelpProps {
  isEditMode: boolean
  className?: string
}

/**
 * 편집 모드 도움말 컴포넌트
 * 스크린리더 사용자를 위한 키보드 단축키 안내
 */
export function EditModeHelp({ isEditMode, className }: EditModeHelpProps) {
  if (!isEditMode) return null

  return (
    <>
      {/* 스크린리더용 편집 모드 안내 (숨김) */}
      <div className="sr-only" role="region" aria-label="대시보드 편집 모드 안내">
        <h2>대시보드 편집 모드가 활성화되었습니다</h2>
        
        <section aria-label="키보드 단축키">
          <h3>위젯 네비게이션</h3>
          <ul>
            <li>Tab 또는 Shift+Tab: 위젯 간 이동</li>
            <li>Enter 또는 스페이스바: 위젯 선택/선택 해제</li>
            <li>화살표 키: 선택된 위젯 이동 (그리드 단위)</li>
          </ul>
          
          <h3>위젯 편집</h3>
          <ul>
            <li>Shift + 화살표 키: 위젯 크기 조정</li>
            <li>Delete 또는 Backspace: 선택된 위젯 삭제</li>
            <li>L: 위젯 잠금/잠금 해제 토글</li>
            <li>F: 전체화면 토글</li>
            <li>S: 위젯 설정 열기 (가능한 경우)</li>
          </ul>
          
          <h3>편집 모드 제어</h3>
          <ul>
            <li>Escape: 위젯 선택 해제 또는 편집 모드 종료</li>
            <li>Ctrl+S 또는 Cmd+S: 레이아웃 저장</li>
          </ul>
          
          <h3>드래그 앤 드롭</h3>
          <ul>
            <li>스페이스바: 드래그 시작/종료</li>
            <li>화살표 키 (드래그 중): 위젯 이동</li>
            <li>Escape (드래그 중): 드래그 취소</li>
          </ul>
        </section>
        
        <section aria-label="추가 정보">
          <p>위젯을 선택하면 해당 위젯의 상태와 사용 가능한 작업이 안내됩니다.</p>
          <p>충돌이 감지되면 음성으로 경고가 제공됩니다.</p>
          <p>모든 작업의 결과는 라이브 리전을 통해 즉시 알려드립니다.</p>
        </section>
      </div>

      {/* 시각적 도움말 (옵션) */}
      <div 
        className={cn(
          "fixed bottom-4 right-4 z-50 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-lg max-w-xs",
          "transition-opacity duration-300",
          className
        )}
        role="complementary"
        aria-label="편집 모드 도움말"
      >
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-700">
            <p className="font-semibold text-blue-900 mb-1">편집 모드 활성화</p>
            <p>위젯을 클릭하여 선택하고 드래그하여 이동할 수 있습니다.</p>
            <button 
              className="text-blue-600 underline mt-1 hover:text-blue-800"
              onClick={() => alert('키보드 단축키 도움말')}
              aria-label="키보드 단축키 보기"
            >
              키보드 단축키 보기
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * 접근성 건너뛰기 링크
 * 키보드 사용자를 위한 빠른 네비게이션
 */
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a 
        href="#main-content"
        className="absolute top-4 left-4 z-[100] bg-white px-4 py-2 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        대시보드 콘텐츠로 건너뛰기
      </a>
      <a 
        href="#widget-library"
        className="absolute top-4 left-48 z-[100] bg-white px-4 py-2 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        위젯 라이브러리로 건너뛰기
      </a>
      <a 
        href="#edit-controls"
        className="absolute top-4 left-96 z-[100] bg-white px-4 py-2 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        편집 컨트롤로 건너뛰기
      </a>
    </div>
  )
}