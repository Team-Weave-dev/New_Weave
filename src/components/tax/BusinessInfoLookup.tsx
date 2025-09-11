'use client';

import React, { useState } from 'react';
import { Building2, Search, Upload, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { BusinessInfo, BusinessInfoApiResponse, formatBusinessNumber, cleanBusinessNumber, validateBusinessNumber, getBusinessStatusLabel, getTaxTypeLabel } from '@/lib/types/business';
import { cn } from '@/lib/utils';
import { taxService } from '@/lib/services/supabase/tax.service';

interface BusinessInfoLookupProps {
  onBusinessInfoFound?: (businessInfo: BusinessInfo) => void;
  className?: string;
  projectId?: string; // 프로젝트 ID로 세금 레코드 연결
  saveToDatabase?: boolean; // 데이터베이스에 저장 여부
}

export default function BusinessInfoLookup({ 
  onBusinessInfoFound, 
  className = '',
  projectId,
  saveToDatabase = true
}: BusinessInfoLookupProps) {
  const [businessNumber, setBusinessNumber] = useState('');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessNumber(e.target.value);
    setBusinessNumber(formatted);
    setError(null);
  };

  const searchBusinessInfo = async (bNo: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const cleanedBNo = cleanBusinessNumber(bNo);
      
      if (!validateBusinessNumber(cleanedBNo)) {
        setError('올바른 사업자등록번호를 입력해주세요. (10자리)');
        return;
      }

      const response = await fetch('/api/business-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessNumber: cleanedBNo }),
      });

      const data: BusinessInfoApiResponse = await response.json();
      
      if (data.status_code === 'OK' && data.data && data.data.length > 0) {
        const foundInfo = data.data[0];
        setBusinessInfo(foundInfo);
        
        // Supabase에 세금 레코드 저장
        if (saveToDatabase) {
          try {
            // TODO: tax_transactions 테이블 구조에 맞는 데이터 저장 로직 필요
            // 현재 tax_transactions는 거래 데이터용이며 사업자 정보 저장용이 아님
            // await taxService.createTaxRecord({
            //   user_id: '', // TODO: 실제 사용자 ID 필요
            //   business_number: foundInfo.b_no,
            //   tax_type: foundInfo.tax_type || '일반과세',
            //   year: new Date().getFullYear(),
            //   quarter: Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4,
            //   amount: 0,
            //   status: 'pending',
            //   due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString(), // 다음 달 10일
            //   metadata: {
            //     business_info: JSON.parse(JSON.stringify(foundInfo)),
            //     business_number: foundInfo.b_no,
            //     tax_type: foundInfo.tax_type,
            //     tax_type_code: foundInfo.tax_type_cd,
            //     tax_type_change_date: foundInfo.tax_type_change_dt,
            //     invoice_apply_date: foundInfo.invoice_apply_dt,
            //     business_status: foundInfo.b_stt,
            //     business_status_code: foundInfo.b_stt_cd,
            //     project_id: projectId || null
            //   } as any
            // });
          } catch (err) {
            console.error('Failed to save tax record:', err);
            // 저장 실패해도 계속 진행
          }
        }
        
        // 상위 컴포넌트에 알림
        onBusinessInfoFound?.(foundInfo);
      } else {
        setError(data.error_msg || '조회된 사업자 정보가 없습니다.');
      }
    } catch (err) {
      console.error('사업자 정보 조회 오류:', err);
      setError('사업자 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!businessNumber || !validateBusinessNumber(cleanBusinessNumber(businessNumber))) {
      setError('올바른 사업자등록번호를 입력해주세요. (10자리)');
      return;
    }
    searchBusinessInfo(businessNumber);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusColor = (statusCode: string): string => {
    switch (statusCode) {
      case '01': // 계속사업자
        return 'text-green-700 bg-green-100 border-green-200';
      case '02': // 휴업자
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case '03': // 폐업자
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (statusCode: string) => {
    switch (statusCode) {
      case '01':
        return <CheckCircle className="w-4 h-4" />;
      case '02':
        return <Clock className="w-4 h-4" />;
      case '03':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTaxTypeColor = (taxTypeCode: string): string => {
    switch (taxTypeCode) {
      case '01': // 일반과세자
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case '02': // 간이과세자
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case '03': // 면세사업자
        return 'text-purple-700 bg-purple-100 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className={cn("bg-white rounded-lg border border-border-light p-6", className)}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-txt-primary mb-2 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          사업자 정보 조회
        </h2>
        <p className="text-txt-secondary">
          국세청 사업자등록정보를 조회하여 과세 유형과 납세자 상태를 확인합니다.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              value={businessNumber}
              onChange={handleBusinessNumberChange}
              onKeyPress={handleKeyPress}
              placeholder="사업자등록번호 (예: 123-45-67890)"
              maxLength={12}
              className="w-full"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || !businessNumber}
            variant="primary"
            className="flex items-center space-x-2 px-6"
          >
            <Search className="w-4 h-4" />
            <span>조회</span>
          </Button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-weave-primary"></div>
            <p className="mt-2 text-txt-secondary">국세청에서 정보를 조회하고 있습니다...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {businessInfo && !loading && (
          <div className="mt-6 p-6 bg-bg-secondary rounded-lg border border-border-light">
            <h3 className="text-lg font-semibold text-txt-primary mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              조회된 사업자 정보
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    사업자등록번호
                  </label>
                  <p className="text-lg font-semibold text-txt-primary">
                    {formatBusinessNumber(businessInfo.b_no)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-2">
                    납세자 상태
                  </label>
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border",
                    getStatusColor(businessInfo.b_stt_cd)
                  )}>
                    {getStatusIcon(businessInfo.b_stt_cd)}
                    <span className="ml-1">{businessInfo.b_stt}</span>
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-2">
                    과세 유형
                  </label>
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border",
                    getTaxTypeColor(businessInfo.tax_type_cd)
                  )}>
                    {businessInfo.tax_type}
                  </span>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="space-y-4">
                {businessInfo.end_dt && businessInfo.end_dt !== '' && (
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1">
                      폐업일자
                    </label>
                    <p className="text-txt-primary">{businessInfo.end_dt}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    단위과세전환여부
                  </label>
                  <p className="text-txt-primary">
                    {businessInfo.utcc_yn === 'Y' ? '예' : '아니오'}
                  </p>
                </div>

                {businessInfo.tax_type_change_dt && businessInfo.tax_type_change_dt !== '' && (
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1">
                      과세유형전환일자
                    </label>
                    <p className="text-txt-primary">{businessInfo.tax_type_change_dt}</p>
                  </div>
                )}

                {businessInfo.invoice_apply_dt && businessInfo.invoice_apply_dt !== '' && (
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1">
                      세금계산서적용일자
                    </label>
                    <p className="text-txt-primary">{businessInfo.invoice_apply_dt}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 추가 정보 */}
            {businessInfo.rbf_tax_type && businessInfo.rbf_tax_type !== '' && (
              <div className="mt-6 pt-4 border-t border-border-light">
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    직전 과세유형
                  </label>
                  <p className="text-txt-primary">{businessInfo.rbf_tax_type}</p>
                </div>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>참고:</strong> 이 정보는 국세청에서 제공하는 공개 데이터로, 
                세금계산서 발행과 과세 유형 확인에 활용할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}