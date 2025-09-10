'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { DataPageContainer } from '@/components/layout/PageContainer';
import Typography from '@/components/ui/Typography';
import { Calculator, FileSpreadsheet, FileText } from 'lucide-react';
import TaxOverview from '@/components/tax/TaxOverview';
import TaxTransactions from '@/components/tax/TaxTransactions';
import TaxFiling from '@/components/tax/TaxFiling';
import { TaxErrorBoundary } from '@/components/tax/components/TaxErrorBoundary';
import { useTaxAutoSync } from '@/hooks/useTaxRealtime';

export default function TaxManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // 실시간 데이터 자동 동기화
  useTaxAutoSync();

  const tabs = [
    { id: 'overview', label: '개요', icon: Calculator },
    { id: 'transactions', label: '매출/매입', icon: FileSpreadsheet },
    { id: 'filing', label: '세무 신고', icon: FileText }
  ];

  return (
    <AppLayout>
      <DataPageContainer>
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-weave-primary-light rounded-lg">
              <Calculator className="w-6 h-6 text-weave-primary" />
            </div>
            <div>
              <Typography variant="h2" className="text-2xl mb-1 text-txt-primary">
                세무 관리
              </Typography>
              <Typography variant="body1" className="text-txt-secondary">
                세금 계산, 신고 및 세무 관리를 한 곳에서 처리하세요
              </Typography>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex items-center gap-2 border-b border-border-light">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-weave-primary text-weave-primary'
                    : 'border-transparent text-txt-secondary hover:text-txt-primary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <TaxErrorBoundary>
          {activeTab === 'overview' && <TaxOverview />}
          {activeTab === 'transactions' && <TaxTransactions />}
          {activeTab === 'filing' && <TaxFiling />}
        </TaxErrorBoundary>
      </DataPageContainer>
    </AppLayout>
  );
}