'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { WorkspacePageContainer } from '@/components/layout/PageContainer';
import ChatInterface from '@/components/chat/ChatInterfaceV2';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { BrainCircuit, ArrowLeft, Cpu } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();
  
  return (
    <AppLayout>
      <WorkspacePageContainer className="h-[calc(100vh-64px)]">
        <div className="h-full flex flex-col">
          {/* 헤더 섹션 - 대시보드/프로젝트와 동일한 형식 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 sm:p-3 bg-weave-primary-light rounded-lg flex-shrink-0">
                <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-weave-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <Typography variant="h2" className="text-xl sm:text-2xl mb-0 sm:mb-1 text-txt-primary leading-tight">AI 챗봇</Typography>
                <Typography variant="body1" className="text-sm sm:text-base text-txt-secondary leading-tight hidden sm:block">
                  실시간 대화형 AI 어시스턴트와 질문하고 답변받으세요
                </Typography>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Button 
                variant="ghost"
                onClick={() => router.push('/ai-assistant')}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">돌아가기</span>
              </Button>
            </div>
          </div>
          
          {/* ChatInterface 컴포넌트 */}
          <div className="flex-1 min-h-0">
            <ChatInterface />
          </div>
        </div>
      </WorkspacePageContainer>
    </AppLayout>
  );
}