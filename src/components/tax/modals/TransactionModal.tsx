'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  X, 
  Save, 
  Calendar,
  Building2,
  Receipt,
  FileText,
  DollarSign,
  Calculator,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';
import useTaxStore from '@/lib/stores/taxStore';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Transaction>) => Promise<void>;
  transaction?: Transaction | null;
  mode: 'add' | 'edit';
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction,
  mode
}: TransactionModalProps) {
  const [formData, setFormData] = useState<Partial<Transaction>>({
    transaction_type: 'sales',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    supplier_name: '',
    supplier_business_number: '',
    supply_amount: 0,
    vat_amount: 0,
    total_amount: 0,
    payment_status: 'pending',
    invoice_number: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 편집 모드일 때 데이터 로드
  useEffect(() => {
    if (mode === 'edit' && transaction) {
      setFormData({
        ...transaction,
        transaction_date: format(new Date(transaction.transaction_date), 'yyyy-MM-dd')
      });
    } else {
      // 새 거래 추가 시 초기화
      setFormData({
        transaction_type: 'sales',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        supplier_name: '',
        supplier_business_number: '',
        supply_amount: 0,
        vat_amount: 0,
        total_amount: 0,
        payment_status: 'pending',
        invoice_number: '',
        notes: ''
      });
    }
  }, [mode, transaction]);

  // 공급가액 변경 시 부가세와 합계 자동 계산
  const handleSupplyAmountChange = (value: string) => {
    const supply = Number(value) || 0;
    const vat = Math.round(supply * 0.1);
    const total = supply + vat;

    setFormData(prev => ({
      ...prev,
      supply_amount: supply,
      vat_amount: vat,
      total_amount: total
    }));
  };

  // 부가세 수동 변경 시 합계만 재계산
  const handleVatAmountChange = (value: string) => {
    const vat = Number(value) || 0;
    const supply = Number(formData.supply_amount) || 0;
    const total = supply + vat;

    setFormData(prev => ({
      ...prev,
      vat_amount: vat,
      total_amount: total
    }));
  };

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_name?.trim()) {
      newErrors.supplier_name = '거래처명을 입력해주세요';
    }

    if (!formData.transaction_date) {
      newErrors.transaction_date = '거래일을 선택해주세요';
    }

    if (Number(formData.supply_amount) <= 0) {
      newErrors.supply_amount = '공급가액을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
          <Typography variant="h2" className="text-xl font-semibold text-txt-primary">
            {mode === 'add' ? '거래 추가' : '거래 편집'}
          </Typography>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-txt-secondary" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 거래 구분 */}
          <div>
            <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
              거래 구분 *
            </Typography>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, transaction_type: 'sales' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.transaction_type === 'sales'
                    ? 'bg-blue-600 text-white'
                    : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                }`}
              >
                매출
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, transaction_type: 'purchase' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.transaction_type === 'purchase'
                    ? 'bg-red-600 text-white'
                    : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                }`}
              >
                매입
              </button>
            </div>
          </div>

          {/* 거래일 */}
          <div>
            <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
              거래일 *
            </Typography>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className={`w-full pl-10 pr-3 py-2 bg-white border ${
                  errors.transaction_date ? 'border-red-500' : 'border-border-light'
                } rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent`}
              />
            </div>
            {errors.transaction_date && (
              <Typography variant="body2" className="text-red-500 text-xs mt-1">
                {errors.transaction_date}
              </Typography>
            )}
          </div>

          {/* 거래처 정보 */}
          <div className="space-y-4">
            <div>
              <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                거래처명 *
              </Typography>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                <input
                  type="text"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 bg-white border ${
                    errors.supplier_name ? 'border-red-500' : 'border-border-light'
                  } rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent`}
                  placeholder="거래처명을 입력하세요"
                />
              </div>
              {errors.supplier_name && (
                <Typography variant="body2" className="text-red-500 text-xs mt-1">
                  {errors.supplier_name}
                </Typography>
              )}
            </div>

            <div>
              <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                사업자번호
              </Typography>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                <input
                  type="text"
                  value={formData.supplier_business_number}
                  onChange={(e) => setFormData({ ...formData, supplier_business_number: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                  placeholder="123-45-67890"
                />
              </div>
            </div>
          </div>

          {/* 금액 정보 */}
          <div className="space-y-4">
            <div>
              <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                공급가액 *
              </Typography>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                <input
                  type="number"
                  value={formData.supply_amount}
                  onChange={(e) => handleSupplyAmountChange(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 bg-white border ${
                    errors.supply_amount ? 'border-red-500' : 'border-border-light'
                  } rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent`}
                  placeholder="0"
                />
              </div>
              {errors.supply_amount && (
                <Typography variant="body2" className="text-red-500 text-xs mt-1">
                  {errors.supply_amount}
                </Typography>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                  부가세
                </Typography>
                <div className="relative">
                  <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                  <input
                    type="number"
                    value={formData.vat_amount}
                    onChange={(e) => handleVatAmountChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                  합계
                </Typography>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                  <input
                    type="number"
                    value={formData.total_amount}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 bg-bg-secondary border border-border-light rounded-lg text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="space-y-4">
            <div>
              <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                계산서 번호
              </Typography>
              <div className="relative">
                <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                  placeholder="INV-2025-001"
                />
              </div>
            </div>

            <div>
              <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                결제 상태
              </Typography>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_status: 'pending' })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.payment_status === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  대기
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_status: 'paid' })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.payment_status === 'paid'
                      ? 'bg-green-600 text-white'
                      : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  완료
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_status: 'overdue' })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.payment_status === 'overdue'
                      ? 'bg-red-600 text-white'
                      : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  연체
                </button>
              </div>
            </div>

            <div>
              <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                메모
              </Typography>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-txt-tertiary" />
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent resize-none"
                  rows={3}
                  placeholder="추가 메모를 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4 border-t border-border-light">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSaving}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? (
                '저장 중...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'add' ? '추가' : '저장'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}