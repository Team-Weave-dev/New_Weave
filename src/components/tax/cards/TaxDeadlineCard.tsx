'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Calendar, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface TaxDeadline {
  type: string;
  date: Date;
  description: string;
  period?: string;
  importance: 'high' | 'medium' | 'low';
}

interface TaxDeadlineCardProps {
  loading?: boolean;
}

export default function TaxDeadlineCard({ loading = false }: TaxDeadlineCardProps) {
  // 세무 신고 일정 계산
  const getUpcomingDeadlines = (): TaxDeadline[] => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const deadlines: TaxDeadline[] = [];

    // 부가가치세 신고 일정
    // 1기: 1-3월 → 4월 25일 신고
    // 2기: 4-6월 → 7월 25일 신고
    // 3기: 7-9월 → 10월 25일 신고
    // 4기: 10-12월 → 익년 1월 25일 신고
    const vatDeadlines = [
      { period: '1기 (1-3월)', month: 4, day: 25 },
      { period: '2기 (4-6월)', month: 7, day: 25 },
      { period: '3기 (7-9월)', month: 10, day: 25 },
      { period: '4기 (10-12월)', month: 1, day: 25, nextYear: true }
    ];

    vatDeadlines.forEach(vat => {
      const deadlineYear = vat.nextYear && currentMonth > 10 ? currentYear + 1 : currentYear;
      const deadlineDate = new Date(deadlineYear, vat.month - 1, vat.day);
      
      if (deadlineDate > today) {
        deadlines.push({
          type: '부가가치세',
          date: deadlineDate,
          description: `${vat.period} 부가가치세 신고`,
          period: vat.period,
          importance: 'high'
        });
      }
    });

    // 원천세 신고 (매월 10일)
    const withholdingDate = new Date(currentYear, currentMonth - 1, 10);
    if (withholdingDate <= today) {
      withholdingDate.setMonth(withholdingDate.getMonth() + 1);
    }
    deadlines.push({
      type: '원천세',
      date: withholdingDate,
      description: `${withholdingDate.getMonth() + 1}월 원천세 신고`,
      importance: 'medium'
    });

    // 종합소득세 신고 (5월 31일)
    if (currentMonth <= 5) {
      const incomeDate = new Date(currentYear, 4, 31);
      if (incomeDate > today) {
        deadlines.push({
          type: '종합소득세',
          date: incomeDate,
          description: `${currentYear - 1}년 종합소득세 신고`,
          importance: 'high'
        });
      }
    }

    // 법인세 신고 (결산월 + 3개월)
    // 12월 결산 기준 → 3월 31일
    if (currentMonth <= 3) {
      const corpDate = new Date(currentYear, 2, 31);
      if (corpDate > today) {
        deadlines.push({
          type: '법인세',
          date: corpDate,
          description: `${currentYear - 1}년 법인세 신고`,
          importance: 'high'
        });
      }
    }

    // 날짜순으로 정렬
    return deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const upcomingDeadlines = useMemo(() => getUpcomingDeadlines(), []);
  const nextDeadline = upcomingDeadlines[0];

  // D-Day 계산
  const calculateDDay = (date: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const dDay = nextDeadline ? calculateDDay(nextDeadline.date) : null;

  // D-Day에 따른 색상 결정
  const getDeadlineStyle = (days: number | null) => {
    if (!days) return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Calendar };
    
    if (days <= 3) {
      return { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle };
    }
    if (days <= 7) {
      return { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock };
    }
    if (days <= 14) {
      return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Calendar };
    }
    return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Calendar };
  };

  const style = getDeadlineStyle(dDay);
  const DeadlineIcon = style.icon;

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-bg-secondary rounded-lg"></div>
          <div className="w-16 h-4 bg-bg-secondary rounded"></div>
        </div>
        <div className="h-8 bg-bg-secondary rounded mb-2"></div>
        <div className="h-4 bg-bg-secondary rounded w-2/3"></div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${style.bgColor} rounded-lg transition-transform group-hover:scale-110`}>
          <DeadlineIcon className={`w-6 h-6 ${style.color}`} />
        </div>
        <span className="text-xs text-txt-tertiary font-medium">
          다음 신고
        </span>
      </div>

      {nextDeadline ? (
        <>
          <div className="mb-4">
            <Typography variant="h3" className={`text-2xl font-bold ${style.color} mb-1`}>
              D{dDay! > 0 ? '-' : '+'}{Math.abs(dDay!)}
            </Typography>
            <Typography variant="body2" className="text-txt-secondary">
              {nextDeadline.type} 신고
            </Typography>
          </div>

          <div className="pt-3 border-t border-border-light">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-txt-tertiary">마감일</span>
              <span className={`text-sm font-medium ${style.color}`}>
                {nextDeadline.date.toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short'
                })}
              </span>
            </div>
            
            {nextDeadline.period && (
              <div className="text-xs text-txt-tertiary mb-2">
                신고 대상: {nextDeadline.period}
              </div>
            )}

            {/* 알림 메시지 */}
            {dDay! <= 7 && (
              <div className={`mt-2 p-2 ${style.bgColor} rounded-md`}>
                <div className={`flex items-center gap-2 text-xs ${style.color}`}>
                  <AlertCircle className="w-3 h-3" />
                  <span className="font-medium">
                    {dDay! <= 3 ? '긴급: 신고 마감 임박!' : '신고 준비를 시작하세요'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 다음 일정 미리보기 */}
          {upcomingDeadlines.length > 1 && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <div className="text-xs text-txt-tertiary mb-1">예정된 신고</div>
              <div className="space-y-1">
                {upcomingDeadlines.slice(1, 3).map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-txt-secondary">{deadline.type}</span>
                    <span className="text-txt-tertiary">
                      {deadline.date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <Typography variant="body2" className="text-txt-secondary">
            예정된 신고 일정이 없습니다
          </Typography>
        </div>
      )}
    </Card>
  );
}