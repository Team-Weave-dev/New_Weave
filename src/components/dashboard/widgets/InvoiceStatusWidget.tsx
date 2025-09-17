'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { FileText, AlertCircle, CheckCircle, Clock, DollarSign, TrendingUp, Send, Calendar } from 'lucide-react';

interface Invoice {
  id: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  sentDate?: string;
  paidDate?: string;
  reminderCount: number;
  lastReminderDate?: string;
}

export const InvoiceStatusWidget: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'pending' | 'paid' | 'draft'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Mock 데이터 로드
  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        clientName: '테크노바',
        invoiceNumber: 'INV-2025-001',
        amount: 5500000,
        dueDate: '2025-01-20',
        status: 'overdue',
        sentDate: '2024-12-20',
        reminderCount: 2,
        lastReminderDate: '2025-01-10'
      },
      {
        id: '2',
        clientName: '디지털웨이브',
        invoiceNumber: 'INV-2025-002',
        amount: 3200000,
        dueDate: '2025-01-25',
        status: 'pending',
        sentDate: '2025-01-05',
        reminderCount: 0
      },
      {
        id: '3',
        clientName: '스마트솔루션',
        invoiceNumber: 'INV-2025-003',
        amount: 7800000,
        dueDate: '2025-02-10',
        status: 'pending',
        sentDate: '2025-01-10',
        reminderCount: 0
      },
      {
        id: '4',
        clientName: '이노베이션랩',
        invoiceNumber: 'INV-2024-045',
        amount: 4500000,
        dueDate: '2024-12-15',
        status: 'paid',
        sentDate: '2024-11-15',
        paidDate: '2024-12-10',
        reminderCount: 0
      },
      {
        id: '5',
        clientName: '퓨처테크',
        invoiceNumber: 'INV-2025-004',
        amount: 2800000,
        dueDate: '2025-02-15',
        status: 'draft',
        reminderCount: 0
      }
    ];

    // 로컬스토리지에서 데이터 로드
    const savedInvoices = localStorage.getItem('invoiceStatusWidget');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    } else {
      setInvoices(mockInvoices);
      localStorage.setItem('invoiceStatusWidget', JSON.stringify(mockInvoices));
    }
  }, []);

  // 데이터 저장
  const saveInvoices = (updatedInvoices: Invoice[]) => {
    setInvoices(updatedInvoices);
    localStorage.setItem('invoiceStatusWidget', JSON.stringify(updatedInvoices));
  };

  // 통계 계산
  const calculateStats = () => {
    const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const pending = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
    const overdue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);
    const paid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);

    return { total, pending, overdue, paid };
  };

  // 필터링된 청구서
  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    return invoice.status === filter;
  });

  // 리마인더 전송
  const sendReminder = (invoiceId: string) => {
    const updatedInvoices = invoices.map(invoice => {
      if (invoice.id === invoiceId) {
        return {
          ...invoice,
          reminderCount: invoice.reminderCount + 1,
          lastReminderDate: new Date().toISOString().split('T')[0]
        };
      }
      return invoice;
    });
    saveInvoices(updatedInvoices);
    alert(`리마인더가 전송되었습니다: ${invoices.find(i => i.id === invoiceId)?.clientName}`);
  };

  // 상태 업데이트
  const updateStatus = (invoiceId: string, newStatus: Invoice['status']) => {
    const updatedInvoices = invoices.map(invoice => {
      if (invoice.id === invoiceId) {
        return {
          ...invoice,
          status: newStatus,
          paidDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : invoice.paidDate
        };
      }
      return invoice;
    });
    saveInvoices(updatedInvoices);
    setSelectedInvoice(null);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  // 상태별 색상
  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      case 'draft':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // 상태 라벨
  const getStatusLabel = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return '결제완료';
      case 'pending':
        return '대기중';
      case 'overdue':
        return '연체';
      case 'draft':
        return '초안';
      default:
        return status;
    }
  };

  const stats = calculateStats();

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Typography variant="h3" className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          청구서 현황
        </Typography>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <Typography variant="caption" className="text-blue-600 mb-1">
            총 청구액
          </Typography>
          <Typography variant="body1" className="font-bold text-blue-900">
            {formatCurrency(stats.total)}
          </Typography>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <Typography variant="caption" className="text-yellow-600 mb-1">
            대기중
          </Typography>
          <Typography variant="body1" className="font-bold text-yellow-900">
            {formatCurrency(stats.pending)}
          </Typography>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <Typography variant="caption" className="text-red-600 mb-1">
            연체
          </Typography>
          <Typography variant="body1" className="font-bold text-red-900">
            {formatCurrency(stats.overdue)}
          </Typography>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <Typography variant="caption" className="text-green-600 mb-1">
            결제완료
          </Typography>
          <Typography variant="body1" className="font-bold text-green-900">
            {formatCurrency(stats.paid)}
          </Typography>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'overdue', 'pending', 'paid', 'draft'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === status
                ? 'bg-[var(--color-brand-primary-start)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? '전체' : getStatusLabel(status)}
            {status !== 'all' && (
              <span className="ml-1 text-xs">
                ({invoices.filter(inv => inv.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 청구서 목록 */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredInvoices.map(invoice => (
          <div
            key={invoice.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedInvoice(invoice)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <Typography variant="body1" className="font-medium">
                  {invoice.clientName}
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  {invoice.invoiceNumber}
                </Typography>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                {getStatusLabel(invoice.status)}
              </span>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <Typography variant="body2" className="text-gray-600">
                  만기일: {formatDate(invoice.dueDate)}
                </Typography>
                {invoice.reminderCount > 0 && (
                  <Typography variant="caption" className="text-orange-600">
                    리마인더 {invoice.reminderCount}회 발송
                  </Typography>
                )}
              </div>
              <Typography variant="body1" className="font-bold">
                {formatCurrency(invoice.amount)}
              </Typography>
            </div>
          </div>
        ))}
      </div>

      {/* 상세 모달 */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <Typography variant="h4" className="mb-4">
              청구서 상세
            </Typography>
            
            <div className="space-y-3 mb-6">
              <div>
                <Typography variant="caption" className="text-gray-500">
                  고객
                </Typography>
                <Typography variant="body1">
                  {selectedInvoice.clientName}
                </Typography>
              </div>
              
              <div>
                <Typography variant="caption" className="text-gray-500">
                  청구서 번호
                </Typography>
                <Typography variant="body1">
                  {selectedInvoice.invoiceNumber}
                </Typography>
              </div>
              
              <div>
                <Typography variant="caption" className="text-gray-500">
                  금액
                </Typography>
                <Typography variant="body1" className="font-bold">
                  {formatCurrency(selectedInvoice.amount)}
                </Typography>
              </div>
              
              <div>
                <Typography variant="caption" className="text-gray-500">
                  상태
                </Typography>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                    {getStatusLabel(selectedInvoice.status)}
                  </span>
                </div>
              </div>
              
              <div>
                <Typography variant="caption" className="text-gray-500">
                  만기일
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedInvoice.dueDate)}
                </Typography>
              </div>
              
              {selectedInvoice.sentDate && (
                <div>
                  <Typography variant="caption" className="text-gray-500">
                    발송일
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedInvoice.sentDate)}
                  </Typography>
                </div>
              )}
              
              {selectedInvoice.paidDate && (
                <div>
                  <Typography variant="caption" className="text-gray-500">
                    결제일
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedInvoice.paidDate)}
                  </Typography>
                </div>
              )}
              
              {selectedInvoice.reminderCount > 0 && (
                <div>
                  <Typography variant="caption" className="text-gray-500">
                    리마인더
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.reminderCount}회 발송
                    {selectedInvoice.lastReminderDate && (
                      <span className="text-gray-500 text-sm ml-2">
                        (마지막: {formatDate(selectedInvoice.lastReminderDate)})
                      </span>
                    )}
                  </Typography>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {selectedInvoice.status === 'pending' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatus(selectedInvoice.id, 'paid');
                  }}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  결제 완료
                </Button>
              )}
              
              {(selectedInvoice.status === 'pending' || selectedInvoice.status === 'overdue') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    sendReminder(selectedInvoice.id);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-1" />
                  리마인더
                </Button>
              )}
              
              {selectedInvoice.status === 'draft' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatus(selectedInvoice.id, 'pending');
                  }}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-1" />
                  발송
                </Button>
              )}
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
                className="flex-1"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};