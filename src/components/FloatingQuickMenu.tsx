'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Brain, 
  FileText, 
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  FolderPlus,
  LayoutDashboard,
  Settings,
  MessageCircle,
  Send,
  Plus,
  Sparkles
} from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import { Typography } from '@/components/ui';

interface QuickMenuItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action: () => void;
  color: string;
  gradient?: string;
}

export default function FloatingQuickMenu() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 빠른 액션 메뉴 아이템 - WEAVE 디자인 시스템 적용
  const quickActions: QuickMenuItem[] = [
    {
      id: 'ai-chat',
      icon: <MessageCircle className="w-5 h-5" />,
      title: 'AI 업무비서',
      description: 'AI와 대화하며 업무 처리',
      action: () => setIsChatOpen(true),
      color: 'bg-weave-primary',
      gradient: 'from-weave-primary to-weave-primary-hover'
    },
    {
      id: 'project',
      icon: <FolderPlus className="w-5 h-5" />,
      title: '새 프로젝트',
      description: '프로젝트 시작',
      action: () => router.push('/projects'),
      color: 'bg-emerald-600',
      gradient: 'from-emerald-600 to-emerald-700'
    },
    {
      id: 'document',
      icon: <FileText className="w-5 h-5" />,
      title: '문서 생성',
      description: 'AI 문서 작성',
      action: () => router.push('/documents'),
      color: 'bg-violet-600',
      gradient: 'from-violet-600 to-violet-700'
    },
    {
      id: 'dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      title: '대시보드',
      description: '메인 화면으로',
      action: () => router.push('/dashboard'),
      color: 'bg-orange-600',
      gradient: 'from-orange-600 to-orange-700'
    }
  ];

  return (
    <>
      {/* 플로팅 퀵 액션 버튼 그룹 */}
      <div className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50">
        {!isChatOpen && (
          <div className="flex flex-col items-end gap-2 sm:gap-3">
            {/* 확장된 퀵 액션 버튼들 - WEAVE 디자인 시스템 */}
            {isExpanded && (
              <div className="flex flex-col gap-2 sm:gap-2.5">
                {quickActions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      setIsExpanded(false);
                    }}
                    className={`
                      group relative flex items-center gap-3 
                      bg-bg-primary
                      rounded-2xl pl-3 sm:pl-4 pr-4 sm:pr-5 py-3 sm:py-3.5
                      shadow-md hover:shadow-xl 
                      transform hover:scale-[1.02] hover:-translate-x-1
                      transition-all duration-200 ease-out
                      border border-border-light hover:border-weave-primary/30
                      animate-in slide-in-from-right-5 fade-in-50
                      min-w-[200px] sm:min-w-[240px]
                    `}
                    style={{ 
                      animationDelay: `${index * 40}ms`,
                      animationDuration: '300ms',
                      animationFillMode: 'both'
                    }}
                    aria-label={action.title}
                  >
                    {/* 아이콘 컨테이너 - WEAVE 스타일 */}
                    <div className={`
                      relative
                      ${action.color} text-white 
                      p-2.5 sm:p-3 rounded-xl
                      group-hover:scale-105
                      transition-all duration-200
                      shadow-sm
                    `}>
                      {action.icon}
                      {/* 아이콘 글로우 효과 */}
                      <div className={`
                        absolute inset-0 rounded-xl
                        bg-gradient-to-br ${action.gradient}
                        opacity-0 group-hover:opacity-100
                        blur-xl transition-opacity duration-300
                      `}></div>
                    </div>
                    
                    {/* 텍스트 영역 - 향상된 가독성 */}
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-txt-primary text-sm sm:text-[15px] leading-tight">
                        {action.title}
                      </div>
                      <div className="text-xs text-txt-secondary mt-0.5 leading-tight">
                        {action.description}
                      </div>
                    </div>

                    {/* CTA 인디케이터 */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-txt-tertiary font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        시작
                      </span>
                      <ChevronRight className="w-4 h-4 text-txt-tertiary group-hover:text-weave-primary group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>

                    {/* 호버 하이라이트 효과 */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-weave-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                ))}
              </div>
            )}

            {/* 메인 토글 버튼 - WEAVE 디자인 시스템 CTA */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`
                group relative 
                bg-weave-primary hover:bg-weave-primary-hover
                text-white rounded-2xl
                p-4 sm:p-[18px]
                shadow-xl hover:shadow-2xl 
                transform transition-all duration-300 ease-out
                border border-weave-primary-light
                ${isExpanded 
                  ? 'rotate-45 scale-105' 
                  : 'hover:scale-110'
                }
              `}
              aria-label={isExpanded ? "닫기" : "빠른 메뉴 열기"}
            >
              <Plus className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-200`} />
              
              {/* CTA 강조 효과 (닫혀있을 때만) */}
              {!isExpanded && (
                <>
                  {/* 메인 펄스 효과 */}
                  <div className="absolute inset-0 rounded-2xl bg-weave-primary animate-ping opacity-30"></div>
                  
                  {/* 서브 글로우 효과 */}
                  <div className="absolute -inset-1 bg-weave-primary rounded-2xl opacity-20 blur-md animate-pulse"></div>
                  
                  {/* 내부 하이라이트 */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent"></div>
                </>
              )}

              {/* 툴팁 - WEAVE 스타일 */}
              {!isExpanded && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap">
                  <Zap className="w-3.5 h-3.5 text-weave-primary-light" />
                  빠른 액션
                </div>
              )}

              {/* 스파클 효과 (닫혀있을 때) - 더 세련되게 */}
              {!isExpanded && (
                <>
                  <Sparkles className="absolute -top-1.5 -right-1.5 w-4 h-4 text-weave-primary-light animate-pulse" />
                  <div className="absolute top-0 right-0 w-2 h-2 bg-weave-primary-light rounded-full opacity-60">
                    <div className="absolute inset-0 bg-weave-primary-light rounded-full animate-ping"></div>
                  </div>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* AI 챗봇 패널 - WEAVE 디자인 시스템 */}
      {isChatOpen && (
        <div className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 w-[90vw] sm:w-96 h-[80vh] sm:h-[650px] bg-bg-primary rounded-2xl shadow-2xl border border-border-light overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* 챗봇 헤더 - WEAVE 스타일 */}
          <div className="flex items-center justify-between p-4 border-b border-border-light bg-weave-primary text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <Typography variant="h4" className="text-white font-semibold">
                  AI 업무비서
                </Typography>
                <p className="text-xs text-white/70">무엇을 도와드릴까요?</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 챗봇 인터페이스 */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </div>
      )}
    </>
  );
}