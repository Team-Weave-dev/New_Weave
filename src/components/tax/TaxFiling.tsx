'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { FileText, Calendar, AlertCircle, Download, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function TaxFiling() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024Q4');

  // Mock 세무 신고 현황 데이터
  const filingStatus = [
    {
      id: '1',
      type: '부가가치세',
      period: '2024년 4분기',
      deadline: '2025-01-25',
      status: 'pending',
      taxAmount: 1250000,
      description: '10월 ~ 12월 부가가치세'
    },
    {
      id: '2',
      type: '원천세',
      period: '2024년 12월',
      deadline: '2025-01-10',
      status: 'completed',
      taxAmount: 350000,
      description: '12월 원천징수세액'
    },
    {
      id: '3',
      type: '종합소득세',
      period: '2024년',
      deadline: '2025-05-31',
      status: 'future',
      taxAmount: 0,
      description: '2024년 귀속 종합소득세'
    }
  ];

  // Mock 세금 요약 데이터
  const taxSummary = {
    totalPayable: 1250000,
    paidThisYear: 4800000,
    upcomingPayments: 1250000,
    vatRefundable: 320000
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      case 'future': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'future': return <Calendar className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'completed': return '신고완료';
      case 'pending': return '신고대기';
      case 'future': return '예정';
      default: return '확인필요';
    }
  };

  return (
    <div className="space-y-6">
      {/* 세금 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <Typography variant="body2" className="text-txt-secondary mb-2">
            납부할 세금
          </Typography>
          <Typography variant="h3" className="text-2xl font-bold text-red-600">
            ₩{taxSummary.totalPayable.toLocaleString()}
          </Typography>
        </Card>
        
        <Card className="p-4">
          <Typography variant="body2" className="text-txt-secondary mb-2">
            올해 납부액
          </Typography>
          <Typography variant="h3" className="text-2xl font-bold text-txt-primary">
            ₩{taxSummary.paidThisYear.toLocaleString()}
          </Typography>
        </Card>
        
        <Card className="p-4">
          <Typography variant="body2" className="text-txt-secondary mb-2">
            예정 납부액
          </Typography>
          <Typography variant="h3" className="text-2xl font-bold text-orange-600">
            ₩{taxSummary.upcomingPayments.toLocaleString()}
          </Typography>
        </Card>
        
        <Card className="p-4">
          <Typography variant="body2" className="text-txt-secondary mb-2">
            환급예정액
          </Typography>
          <Typography variant="h3" className="text-2xl font-bold text-green-600">
            ₩{taxSummary.vatRefundable.toLocaleString()}
          </Typography>
        </Card>
      </div>

      {/* 세무 신고 현황 */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Typography variant="h3" className="text-lg font-semibold text-txt-primary">
            세무 신고 현황
          </Typography>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            신고서 다운로드
          </Button>
        </div>

        <div className="space-y-4">
          {filingStatus.map((filing) => (
            <div key={filing.id} className="border border-border-light rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Typography variant="body1" className="font-medium text-txt-primary">
                      {filing.type}
                    </Typography>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(filing.status)}`}>
                      {getStatusIcon(filing.status)}
                      {getStatusText(filing.status)}
                    </span>
                  </div>
                  
                  <Typography variant="body2" className="text-txt-secondary mb-1">
                    {filing.period} · {filing.description}
                  </Typography>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <Typography variant="body2" className="text-txt-tertiary">
                      신고기한: {filing.deadline}
                    </Typography>
                    {filing.taxAmount > 0 && (
                      <Typography variant="body2" className="font-medium text-txt-primary">
                        세액: ₩{filing.taxAmount.toLocaleString()}
                      </Typography>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {filing.status === 'pending' && (
                    <>
                      <Button variant="outline" size="sm">
                        신고서 작성
                      </Button>
                      <Button variant="primary" size="sm">
                        전자신고
                      </Button>
                    </>
                  )}
                  {filing.status === 'completed' && (
                    <Button variant="outline" size="sm">
                      신고내역 확인
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 세무 캘린더 */}
      <Card className="p-6">
        <Typography variant="h3" className="text-lg font-semibold text-txt-primary mb-4">
          세무 캘린더
        </Typography>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 rounded">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <Typography variant="body2" className="font-medium text-txt-primary">
                  1월 10일 - 12월분 원천세 신고
                </Typography>
                <Typography variant="caption" className="text-txt-tertiary">
                  근로소득, 사업소득 원천징수세액
                </Typography>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-50 rounded">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <Typography variant="body2" className="font-medium text-txt-primary">
                  1월 25일 - 4분기 부가가치세 신고
                </Typography>
                <Typography variant="caption" className="text-txt-tertiary">
                  10~12월 매출/매입 부가가치세
                </Typography>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <Typography variant="body2" className="font-medium text-txt-primary">
                  3월 10일 - 법인세 중간예납
                </Typography>
                <Typography variant="caption" className="text-txt-tertiary">
                  2024년 법인세 중간예납
                </Typography>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <Typography variant="body2" className="font-medium text-txt-primary">
                  5월 31일 - 종합소득세 신고
                </Typography>
                <Typography variant="caption" className="text-txt-tertiary">
                  2024년 귀속 종합소득세
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}