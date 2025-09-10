'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { Filter, Download, Upload, Plus, FileText, X } from 'lucide-react';
import { taxTransactionService } from '@/lib/services/supabase/tax-transactions.service';
import type { Transaction, TransactionFilters } from '@/lib/services/supabase/tax-transactions.service';
import DataExtractor from '@/components/ai-assistant/DataExtractor';
import type { ExtractedData } from '@/types/ai-assistant';

export default function TaxTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    dateRange: 'thisYear',  // 2024년 전체 데이터를 표시하도록 변경
    transactionType: 'all',
    projectId: null,
    clientId: null
  });

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await taxTransactionService.getTransactions(filters);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // 추출된 데이터를 거래로 변환
  const handleDataExtracted = (data: ExtractedData) => {
    console.log('Extracted data:', data);
    
    // 추출된 데이터를 기반으로 거래 내역 자동 생성 로직
    // TODO: 세금계산서, 영수증 등 문서 타입에 따라 자동으로 거래 내역 생성
    const extractedInfo = (data as any).extractedData || data;
    
    if (extractedInfo.documentType === '세금계산서' || extractedInfo.totalAmount) {
      // 세금계산서나 영수증 데이터를 거래로 변환
      const newTransaction = {
        supplier_name: extractedInfo.vendor || extractedInfo.companyName || '',
        business_number: extractedInfo.businessNumber || '',
        supply_amount: extractedInfo.supplyAmount || (extractedInfo.totalAmount ? extractedInfo.totalAmount / 1.1 : 0),
        vat_amount: extractedInfo.taxAmount || (extractedInfo.totalAmount ? extractedInfo.totalAmount * 0.1 / 1.1 : 0),
        total_amount: extractedInfo.totalAmount || 0,
        transaction_date: extractedInfo.date || new Date().toISOString().split('T')[0],
        description: extractedInfo.description || '증빙 업로드로 생성'
      };
      
      console.log('새로운 거래 생성 준비:', newTransaction);
      // TODO: taxTransactionService.createTransaction(newTransaction);
    }
    
    // 모달 닫기
    setShowUploadModal(false);
    // 거래 목록 새로고침
    loadTransactions();
  };

  // 거래 추가 처리
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newTransaction = {
      transaction_date: formData.get('transaction_date') as string,
      transaction_type: formData.get('transaction_type') as '매입' | '매출',
      supplier_name: formData.get('supplier_name') as string,
      business_number: formData.get('business_number') as string || '',
      supply_amount: Number(formData.get('supply_amount')) || 0,
      vat_amount: Number(formData.get('vat_amount')) || 0,
      withholding_tax_3_3: Number(formData.get('withholding_tax_3_3')) || 0,
      withholding_tax_6_8: Number(formData.get('withholding_tax_6_8')) || 0,
      total_amount: 0, // 자동 계산
      category: formData.get('category') as string || '',
      description: formData.get('description') as string || '',
      user_id: 'mock-user'
    };
    
    // 합계 자동 계산
    if (newTransaction.transaction_type === '매출') {
      newTransaction.total_amount = newTransaction.supply_amount + newTransaction.vat_amount 
        - newTransaction.withholding_tax_3_3 - newTransaction.withholding_tax_6_8;
    } else {
      newTransaction.total_amount = newTransaction.supply_amount + newTransaction.vat_amount;
    }
    
    try {
      await taxTransactionService.createTransaction(newTransaction);
      setShowAddModal(false);
      loadTransactions();
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 툴바 */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="w-4 h-4 mr-2" />
            필터
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowUploadModal(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            증빙 업로드
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            엑셀 업로드
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            거래 추가
          </Button>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilter && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-txt-secondary mb-2">
                기간
              </label>
              <select 
                className="w-full px-3 py-2 border border-border-light rounded-md"
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              >
                <option value="thisMonth">이번 달</option>
                <option value="lastMonth">지난 달</option>
                <option value="thisYear">올해</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-txt-secondary mb-2">
                거래 유형
              </label>
              <select 
                className="w-full px-3 py-2 border border-border-light rounded-md"
                value={filters.transactionType}
                onChange={(e) => setFilters({...filters, transactionType: e.target.value as any})}
              >
                <option value="all">전체</option>
                <option value="매출">매출</option>
                <option value="매입">매입</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* 거래 목록 */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-txt-tertiary">
            데이터를 불러오는 중...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Typography variant="body1" className="text-txt-tertiary mb-4">
              거래 내역이 없습니다
            </Typography>
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              첫 거래 추가하기
            </Button>
          </div>
        ) : (
          <>
            {/* 모바일 카드 뷰 (768px 미만) */}
            <div className="block md:hidden space-y-3">
              {transactions.map((transaction) => {
                // 실제 입금액 계산 (매출의 경우 원천세를 제외한 금액)
                const actualAmount = transaction.transaction_type === '매출' 
                  ? transaction.total_amount - transaction.withholding_tax_3_3 - transaction.withholding_tax_6_8
                  : transaction.total_amount;
                
                return (
                  <div 
                    key={transaction.id}
                    className="bg-white border border-border-light rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      // 프로젝트가 연결된 경우 프로젝트 페이지로 이동
                      if (transaction.project_id) {
                        window.location.href = `/projects/${transaction.project_id}`;
                      }
                    }}
                  >
                    {/* 상단 헤더 */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.transaction_type === '매출' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.transaction_type}
                        </span>
                        <Typography variant="caption" className="text-txt-tertiary">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </Typography>
                      </div>
                    </div>

                    {/* 거래처 정보 */}
                    <div className="mb-3">
                      <Typography variant="body1" className="font-semibold text-txt-primary">
                        {transaction.supplier_name}
                      </Typography>
                      {transaction.business_number && (
                        <Typography variant="caption" className="text-txt-tertiary">
                          사업자번호: {transaction.business_number}
                        </Typography>
                      )}
                      {transaction.description && (
                        <Typography variant="caption" className="text-txt-secondary block mt-1">
                          {transaction.description}
                        </Typography>
                      )}
                    </div>

                    {/* 금액 정보 그리드 */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-bg-secondary rounded p-2">
                        <Typography variant="caption" className="text-txt-tertiary">
                          공급가액
                        </Typography>
                        <Typography variant="body2" className="font-medium text-txt-primary">
                          ₩{Number(transaction.supply_amount).toLocaleString()}
                        </Typography>
                      </div>
                      {transaction.vat_amount > 0 && (
                        <div className="bg-bg-secondary rounded p-2">
                          <Typography variant="caption" className="text-txt-tertiary">
                            부가세(10%)
                          </Typography>
                          <Typography variant="body2" className="font-medium text-txt-primary">
                            ₩{Number(transaction.vat_amount).toLocaleString()}
                          </Typography>
                        </div>
                      )}
                      {transaction.withholding_tax_3_3 > 0 && (
                        <div className="bg-orange-50 rounded p-2">
                          <Typography variant="caption" className="text-orange-700">
                            원천세(3.3%)
                          </Typography>
                          <Typography variant="body2" className="font-medium text-orange-600">
                            ₩{Number(transaction.withholding_tax_3_3).toLocaleString()}
                          </Typography>
                        </div>
                      )}
                      {transaction.withholding_tax_6_8 > 0 && (
                        <div className="bg-orange-50 rounded p-2">
                          <Typography variant="caption" className="text-orange-700">
                            원천세(8.8%)
                          </Typography>
                          <Typography variant="body2" className="font-medium text-orange-600">
                            ₩{Number(transaction.withholding_tax_6_8).toLocaleString()}
                          </Typography>
                        </div>
                      )}
                    </div>

                    {/* 합계 */}
                    <div className="border-t border-border-light pt-3">
                      <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-txt-secondary">
                          {transaction.transaction_type === '매출' ? '입금액' : '지급액'}
                        </Typography>
                        <div className="text-right">
                          <Typography variant="body1" className="font-bold text-txt-primary">
                            ₩{Number(actualAmount).toLocaleString()}
                          </Typography>
                          {transaction.transaction_type === '매출' && (transaction.withholding_tax_3_3 > 0 || transaction.withholding_tax_6_8 > 0) && (
                            <Typography variant="caption" className="text-txt-tertiary">
                              총액: ₩{Number(transaction.total_amount).toLocaleString()}
                            </Typography>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 프로젝트 정보 (있는 경우) */}
                    {transaction.category && (
                      <div className="mt-3 pt-3 border-t border-border-light">
                        <Typography variant="caption" className="text-txt-tertiary">
                          프로젝트: {transaction.category}
                        </Typography>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 데스크톱 테이블 뷰 (768px 이상) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary border-b border-border-light">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <Typography variant="body2" className="font-semibold text-txt-secondary">
                        날짜
                      </Typography>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Typography variant="body2" className="font-semibold text-txt-secondary">
                        구분
                      </Typography>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Typography variant="body2" className="font-semibold text-txt-secondary">
                        프로젝트/품목
                      </Typography>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Typography variant="body2" className="font-semibold text-txt-secondary">
                        클라이언트/공급자
                      </Typography>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Typography variant="body2" className="font-semibold text-txt-secondary">
                        공급가액
                      </Typography>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Typography variant="body2" className="font-semibold text-txt-secondary">
                        부가세(10%)
                      </Typography>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Typography variant="body2" className="font-semibold text-txt-secondary">
                        원천세(3.3%)
                      </Typography>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Typography variant="body2" className="font-semibold text-txt-secondary">
                        원천세(8.8%)
                      </Typography>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Typography variant="body2" className="font-semibold text-txt-secondary">
                        합계(입금액)
                      </Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    // 실제 입금액 계산 (매출의 경우 원천세를 제외한 금액)
                    const actualAmount = transaction.transaction_type === '매출' 
                      ? transaction.total_amount - transaction.withholding_tax_3_3 - transaction.withholding_tax_6_8
                      : transaction.total_amount;
                    
                    return (
                      <tr 
                        key={transaction.id}
                        className="border-b border-border-light hover:bg-bg-secondary transition-colors cursor-pointer"
                        onClick={() => {
                          // 프로젝트가 연결된 경우 프로젝트 페이지로 이동
                          if (transaction.project_id) {
                            window.location.href = `/projects/${transaction.project_id}`;
                          }
                        }}
                      >
                        <td className="px-4 py-3">
                          <Typography variant="body2" className="text-txt-primary">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </Typography>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.transaction_type === '매출' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {transaction.transaction_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <Typography variant="body2" className="text-txt-primary font-medium">
                              {transaction.category || (transaction.transaction_type === '매출' ? 'A프로젝트' : '공급처')}
                            </Typography>
                            {transaction.description && (
                              <Typography variant="caption" className="text-txt-tertiary">
                                {transaction.description}
                              </Typography>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <Typography variant="body2" className="text-txt-primary">
                              {transaction.supplier_name}
                            </Typography>
                            {transaction.business_number && (
                              <Typography variant="caption" className="text-txt-tertiary">
                                {transaction.business_number}
                              </Typography>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Typography variant="body2" className="text-txt-primary">
                            ₩{Number(transaction.supply_amount).toLocaleString()}
                          </Typography>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Typography variant="body2" className="text-txt-primary">
                            {transaction.vat_amount > 0 ? `₩${Number(transaction.vat_amount).toLocaleString()}` : '-'}
                          </Typography>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Typography variant="body2" className={transaction.withholding_tax_3_3 > 0 ? "text-orange-600" : "text-txt-tertiary"}>
                            {transaction.withholding_tax_3_3 > 0 ? `₩${Number(transaction.withholding_tax_3_3).toLocaleString()}` : '-'}
                          </Typography>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Typography variant="body2" className={transaction.withholding_tax_6_8 > 0 ? "text-orange-600" : "text-txt-tertiary"}>
                            {transaction.withholding_tax_6_8 > 0 ? `₩${Number(transaction.withholding_tax_6_8).toLocaleString()}` : '-'}
                          </Typography>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div>
                            <Typography variant="body2" className="font-semibold text-txt-primary">
                              ₩{Number(actualAmount).toLocaleString()}
                            </Typography>
                            {transaction.transaction_type === '매출' && (transaction.withholding_tax_3_3 > 0 || transaction.withholding_tax_6_8 > 0) && (
                              <Typography variant="caption" className="text-txt-tertiary">
                                (총 ₩{Number(transaction.total_amount).toLocaleString()})
                              </Typography>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* 거래 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border-light p-4 flex justify-between items-center">
              <Typography variant="h2" className="text-xl font-bold text-txt-primary">
                거래 추가
              </Typography>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    거래일자 *
                  </label>
                  <input
                    type="date"
                    name="transaction_date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-border-light rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    거래 유형 *
                  </label>
                  <select
                    name="transaction_type"
                    required
                    className="w-full px-3 py-2 border border-border-light rounded-md"
                  >
                    <option value="매출">매출</option>
                    <option value="매입">매입</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    거래처명 *
                  </label>
                  <input
                    type="text"
                    name="supplier_name"
                    required
                    placeholder="거래처명 입력"
                    className="w-full px-3 py-2 border border-border-light rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    사업자번호
                  </label>
                  <input
                    type="text"
                    name="business_number"
                    placeholder="123-45-67890"
                    className="w-full px-3 py-2 border border-border-light rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    공급가액 *
                  </label>
                  <input
                    type="number"
                    name="supply_amount"
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 border border-border-light rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    부가세
                  </label>
                  <input
                    type="number"
                    name="vat_amount"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-border-light rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    원천세(3.3%)
                  </label>
                  <input
                    type="number"
                    name="withholding_tax_3_3"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-border-light rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    원천세(8.8%)
                  </label>
                  <input
                    type="number"
                    name="withholding_tax_6_8"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-border-light rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    카테고리
                  </label>
                  <input
                    type="text"
                    name="category"
                    placeholder="서비스, IT서비스 등"
                    className="w-full px-3 py-2 border border-border-light rounded-md"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    설명
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="거래 내용 설명"
                    className="w-full px-3 py-2 border border-border-light rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  취소
                </Button>
                <Button type="submit" variant="primary">
                  거래 추가
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 증빙 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border-light p-4 flex justify-between items-center">
              <Typography variant="h2" className="text-xl font-bold text-txt-primary">
                증빙 업로드
              </Typography>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <Typography variant="body1" className="text-txt-secondary">
                  세금계산서, 계산서, 영수증, 카드전표 등의 증빙 서류를 업로드하면 
                  AI가 자동으로 내용을 인식하여 거래 내역을 생성합니다.
                </Typography>
                <Typography variant="body2" className="text-txt-tertiary mt-2">
                  * 추후 홈택스 연동을 통해 세금계산서, 원천세 신고내역, 카드 매출/매입 내역을 
                  자동으로 불러올 수 있습니다.
                </Typography>
              </div>
              
              <DataExtractor
                onDataExtracted={handleDataExtracted}
                onError={(error) => console.error('Data extraction error:', error)}
                maxFileSize={10}
                acceptedFormats={['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp']}
                enableRAG={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}