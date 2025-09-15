'use client';

import React from 'react';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import ContentCard, { FeaturedCard } from './ContentCard';
import { Calculator, FileText, CreditCard, AlertTriangle } from 'lucide-react';
import type { HomeContentSection as HomeContentSectionType } from '@/lib/types/content';

interface HomeContentSectionProps {
  content: HomeContentSectionType;
  className?: string;
}

export function HomeContentSection({ content, className = '' }: HomeContentSectionProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* 피처드 카드 */}
      {content.featured && (
        <section>
          <Typography variant="h2" className="mb-4">
            추천 콘텐츠
          </Typography>
          <FeaturedCard content={content.featured} />
        </section>
      )}

      {/* 카테고리별 콘텐츠 */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 세금 관련 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-green-600" />
            </div>
            <Typography variant="h4">세금 · 정산</Typography>
          </div>
          <div className="space-y-4">
            {content.categories.tax.map((card) => (
              <ContentCard key={card.id} content={card} size="small" />
            ))}
          </div>
        </div>

        {/* 계약 관련 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <Typography variant="h4">계약 · 견적</Typography>
          </div>
          <div className="space-y-4">
            {content.categories.contract.map((card) => (
              <ContentCard key={card.id} content={card} size="small" />
            ))}
          </div>
        </div>

        {/* 인보이스 관련 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <Typography variant="h4">인보이스 · 수금</Typography>
          </div>
          <div className="space-y-4">
            {content.categories.invoicing.map((card) => (
              <ContentCard key={card.id} content={card} size="small" />
            ))}
          </div>
        </div>
      </section>

      {/* What's New + Popular */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Typography variant="h3" className="mb-4">
            새로운 소식
          </Typography>
          <div className="space-y-4">
            {content.releases.slice(0, 3).map((card) => (
              <ContentCard key={card.id} content={card} size="small" />
            ))}
          </div>
        </div>
        
        <div>
          <Typography variant="h3" className="mb-4">
            인기 콘텐츠
          </Typography>
          <div className="space-y-4">
            {content.popular.slice(0, 3).map((card) => (
              <ContentCard key={card.id} content={card} size="small" />
            ))}
          </div>
        </div>
      </section>

      {/* 법적 고지 */}
      <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="flex-1">
            <Typography variant="body2" className="text-sm text-yellow-800 font-medium mb-1">
              법적 고지
            </Typography>
            <Typography variant="body2" className="text-sm text-yellow-700">
              본 콘텐츠는 일반적인 정보 제공 목적으로만 작성되었으며, 세무나 법률 자문으로 해석될 수 없습니다.
              구체적인 사안은 반드시 전문가와 상의하시기 바랍니다.
            </Typography>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm text-weave-primary hover:text-weave-primary-hover mt-2 font-medium p-0 h-auto"
            >
              세무사 연결 서비스 →
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomeContentSection;