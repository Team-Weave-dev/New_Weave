'use client';

import React from 'react';
import SimpleHeaderNavigation from '@/components/navigation/SimpleHeaderNavigation';
import FloatingQuickMenu from '@/components/FloatingQuickMenu';
import { ToastProvider } from '@/hooks/useToast';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg-primary">
        {/* Header Navigation */}
        <SimpleHeaderNavigation />
        
        {/* Main Content with Top Padding for Fixed Header - 모바일과 데스크톱 패딩 조정 */}
        <main className="pt-14 sm:pt-16 min-h-screen">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
        
        {/* Floating Quick Menu with AI Chatbot */}
        <FloatingQuickMenu />
      </div>
    </ToastProvider>
  );
}