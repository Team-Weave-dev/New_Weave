'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { DataPageContainer } from '@/components/layout/PageContainer';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Database, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { insertSampleTaxData, clearSampleTaxData } from '@/lib/services/supabase/tax-sample-data';

export default function TaxTestDataPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInsertData = async () => {
    setLoading(true);
    setResult({ type: null, message: '' });
    
    try {
      const response = await insertSampleTaxData();
      
      if (response.success) {
        setResult({
          type: 'success',
          message: `성공적으로 ${response.transactionsCount}개의 거래와 ${response.summariesCount}개의 월별 요약을 생성했습니다.`
        });
      } else {
        setResult({
          type: 'error',
          message: `데이터 생성 실패: ${response.error}`
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('정말로 모든 테스트 데이터를 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setResult({ type: null, message: '' });
    
    try {
      const response = await clearSampleTaxData();
      
      if (response.success) {
        setResult({
          type: 'success',
          message: '모든 테스트 데이터가 삭제되었습니다.'
        });
      } else {
        setResult({
          type: 'error',
          message: `데이터 삭제 실패: ${response.error}`
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <DataPageContainer>
        <div className="max-w-3xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <Typography variant="h2" className="text-2xl mb-1 text-txt-primary">
                  테스트 데이터 관리
                </Typography>
                <Typography variant="body1" className="text-txt-secondary">
                  개발 및 테스트용 샘플 세무 데이터를 관리합니다
                </Typography>
              </div>
            </div>
          </div>

          {/* 경고 메시지 */}
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <Typography variant="body1" className="font-medium text-yellow-900 mb-1">
                  주의사항
                </Typography>
                <Typography variant="body2" className="text-yellow-800">
                  이 페이지는 개발 환경에서만 사용해야 합니다. 
                  실제 운영 데이터가 있는 경우 사용하지 마세요.
                </Typography>
              </div>
            </div>
          </Card>

          {/* 액션 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* 데이터 생성 */}
            <Card className="p-6">
              <div className="mb-4">
                <Typography variant="h3" className="text-lg font-semibold text-txt-primary mb-2">
                  샘플 데이터 생성
                </Typography>
                <Typography variant="body2" className="text-txt-secondary">
                  2025년 1-3월 매입/매출 데이터 약 100건을 생성합니다.
                </Typography>
              </div>
              <Button 
                variant="primary" 
                onClick={handleInsertData}
                disabled={loading}
                className="w-full"
              >
                <Database className="w-4 h-4 mr-2" />
                {loading ? '생성 중...' : '데이터 생성'}
              </Button>
            </Card>

            {/* 데이터 삭제 */}
            <Card className="p-6">
              <div className="mb-4">
                <Typography variant="h3" className="text-lg font-semibold text-txt-primary mb-2">
                  데이터 초기화
                </Typography>
                <Typography variant="body2" className="text-txt-secondary">
                  모든 세무 거래 데이터와 월별 요약을 삭제합니다.
                </Typography>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleClearData}
                disabled={loading}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {loading ? '삭제 중...' : '데이터 삭제'}
              </Button>
            </Card>
          </div>

          {/* 결과 메시지 */}
          {result.type && (
            <Card className={`p-4 ${
              result.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <Typography 
                  variant="body1" 
                  className={result.type === 'success' ? 'text-green-900' : 'text-red-900'}
                >
                  {result.message}
                </Typography>
              </div>
            </Card>
          )}

          {/* 데이터 설명 */}
          <Card className="p-6 mt-6">
            <Typography variant="h3" className="text-lg font-semibold text-txt-primary mb-4">
              생성되는 데이터 내용
            </Typography>
            <div className="space-y-3">
              <div>
                <Typography variant="body1" className="font-medium text-txt-primary mb-1">
                  매출 데이터
                </Typography>
                <ul className="list-disc list-inside space-y-1">
                  <li className="text-txt-secondary text-sm">월별 큰 프로젝트 매출 2-3건 (500만원 ~ 1500만원)</li>
                  <li className="text-txt-secondary text-sm">월별 소규모 매출 3-5건 (50만원 ~ 250만원)</li>
                </ul>
              </div>
              <div>
                <Typography variant="body1" className="font-medium text-txt-primary mb-1">
                  매입 데이터
                </Typography>
                <ul className="list-disc list-inside space-y-1">
                  <li className="text-txt-secondary text-sm">월별 고정 비용 (임대료, 서버, 라이선스 등)</li>
                  <li className="text-txt-secondary text-sm">월별 변동 비용 3-8건 (외주, 장비, 소모품 등)</li>
                </ul>
              </div>
              <div>
                <Typography variant="body1" className="font-medium text-txt-primary mb-1">
                  자동 생성 요약
                </Typography>
                <ul className="list-disc list-inside space-y-1">
                  <li className="text-txt-secondary text-sm">월별 매출/매입 합계 자동 계산</li>
                  <li className="text-txt-secondary text-sm">VAT 자동 계산 및 집계</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </DataPageContainer>
    </AppLayout>
  );
}