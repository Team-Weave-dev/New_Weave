'use client';

// 동적 렌더링 강제 - Static Generation 방지
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Select from '@/components/ui/Select';
import Typography from '@/components/ui/Typography';
import { invoicesService } from '@/lib/services/supabase/invoices.service';
import { clientService, type Client } from '@/lib/services/supabase/clients.service';
import { projectsService, type Project } from '@/lib/services/supabase/projects.service';
import type { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

// Supabase 타입
type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceStatus = Database['public']['Tables']['invoices']['Row']['status'];

type InvoiceWithRelations = Invoice & {
  client?: Client | null;
  project?: Project | null;
};


const statusOptions = [
  { value: 'all', label: '전체' },
  { value: 'draft', label: '임시저장' },
  { value: 'issued', label: '발행됨' },
  { value: 'overdue', label: '연체' },
  { value: 'paid', label: '결제완료' },
  { value: 'cancelled', label: '취소됨' }
];

const getStatusColor = (status: InvoiceStatus): string => {
  switch (status) {
    case 'draft':
      return 'text-txt-tertiary border border-border-light/50';
    case 'sent':
      return 'text-weave-primary border border-blue-200/50';
    case 'overdue':
      return 'text-red-600 border border-red-200/50';
    case 'paid':
      return 'text-green-600 border border-green-200/50';
    case 'cancelled':
      return 'text-txt-tertiary border border-border-light/30';
    default:
      return 'text-txt-tertiary border border-border-light/50';
  }
};

const getStatusLabel = (status: InvoiceStatus): string => {
  switch (status) {
    case 'draft':
      return '임시저장';
    case 'sent':
      return '발행됨';
    case 'overdue':
      return '연체';
    case 'paid':
      return '결제완료';
    case 'cancelled':
      return '취소됨';
    default:
      return status;
  }
};

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('ko-KR') + '원';
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ko-KR');
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인보이스 데이터 불러오기
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: 실제 사용자 ID로 교체 필요
      const userId = 'system';
      const invoicesData = await invoicesService.getInvoices(userId);
      
      // 각 인보이스에 클라이언트와 프로젝트 정보 추가
      const invoicesWithRelations = await Promise.all(
        invoicesData.map(async (invoice) => {
          let client = undefined;
          let project = undefined;
          
          if (invoice.client_id) {
            try {
              client = await clientService.getClientById(invoice.client_id);
            } catch (err) {
              console.error(`Failed to load client for invoice ${invoice.id}:`, err);
            }
          }
          
          if (invoice.project_id) {
            try {
              project = await projectsService.getProjectById(invoice.project_id);
            } catch (err) {
              console.error(`Failed to load project for invoice ${invoice.id}:`, err);
            }
          }
          
          return {
            ...invoice,
            client: client || undefined,
            project: project || undefined
          };
        })
      );
      
      setInvoices(invoicesWithRelations);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setError('인보이스 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = selectedStatus === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === selectedStatus);

  return (
    <AppLayout>
      <div className="bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - 모바일 가로 배치 최적화 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-3 bg-weave-primary-light rounded-lg flex-shrink-0">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-weave-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="h2" className="text-xl sm:text-2xl mb-0 sm:mb-1 text-txt-primary leading-tight">인보이스 관리</Typography>
              <Typography variant="body1" className="text-sm sm:text-base text-txt-secondary leading-tight hidden sm:block">
                발행된 인보이스를 관리하고 결제 상태를 추적하세요
              </Typography>
            </div>
          </div>
          <Button 
            variant="primary" 
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 flex-shrink-0"
            onClick={() => console.log('Navigate to invoice creation')}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">새 인보이스</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-border-light p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-txt-secondary mb-2">
                상태 필터
              </label>
              <Select
                options={statusOptions}
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                placeholder="상태 선택"
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-txt-tertiary">
                총 {filteredInvoices.length}건의 인보이스
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-lg border border-border-light overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-weave-primary mx-auto mb-4" />
              <Typography variant="body1" className="text-txt-secondary">
                인보이스 목록을 불러오는 중...
              </Typography>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <Typography variant="body1" className="text-red-500">
                {error}
              </Typography>
              <Button
                variant="outline"
                onClick={loadInvoices}
                className="mt-4"
              >
                다시 시도
              </Button>
            </div>
          ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>인보이스 번호</Table.Head>
                <Table.Head>클라이언트</Table.Head>
                <Table.Head>발행일</Table.Head>
                <Table.Head>만료일</Table.Head>
                <Table.Head>금액</Table.Head>
                <Table.Head>상태</Table.Head>
                <Table.Head>액션</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredInvoices.map((invoice) => {
                return (
                  <Table.Row key={invoice.id}>
                    <Table.Cell>
                      <div className="font-medium text-txt-primary">
                        {invoice.invoice_number}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <div className="font-medium text-txt-primary">
                          {invoice.client?.company || '-'}
                        </div>
                        <div className="text-sm text-txt-tertiary">
                          {invoice.client?.business_number || ''}
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-txt-secondary">
                      {invoice.issue_date ? formatDate(new Date(invoice.issue_date)) : '-'}
                    </Table.Cell>
                    <Table.Cell className="text-txt-secondary">
                      {invoice.due_date ? formatDate(new Date(invoice.due_date)) : '-'}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="font-medium text-txt-primary">
                        {formatCurrency(invoice.total || 0)}
                      </div>
                      {(invoice.tax || 0) > 0 && (
                        <div className="text-xs text-txt-tertiary">
                          VAT 포함
                        </div>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/50 backdrop-blur-sm",
                        getStatusColor(invoice.status)
                      )}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => console.log('View invoice', invoice.id)}
                        >
                          보기
                        </Button>
                        {invoice.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => console.log('Edit invoice', invoice.id)}
                          >
                            수정
                          </Button>
                        )}
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => console.log('Mark as paid', invoice.id)}
                          >
                            결제완료
                          </Button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
          )}

          {!loading && !error && filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <div className="text-txt-tertiary text-lg mb-2">
                조건에 맞는 인보이스가 없습니다
              </div>
              <div className="text-txt-tertiary text-sm">
                새로운 인보이스를 생성하거나 필터를 변경해보세요
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-lg border border-border-light p-6">
            <Typography variant="body2" className="font-medium text-txt-secondary mb-1">
              총 발행 금액
            </Typography>
            <Typography variant="h3" className="text-2xl">
              {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.total || 0), 0))}
            </Typography>
          </div>
          
          <div className="bg-white rounded-lg border border-border-light p-6">
            <Typography variant="body2" className="font-medium text-txt-secondary mb-1">
              결제 완료
            </Typography>
            <Typography variant="h3" className="text-2xl text-green-600">
              {formatCurrency(invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0))}
            </Typography>
          </div>
          
          <div className="bg-white rounded-lg border border-border-light p-6">
            <Typography variant="body2" className="font-medium text-txt-secondary mb-1">
              미수금
            </Typography>
            <Typography variant="h3" className="text-2xl text-orange-600">
              {formatCurrency(invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total || 0), 0))}
            </Typography>
          </div>
          
          <div className="bg-white rounded-lg border border-border-light p-6">
            <Typography variant="body2" className="font-medium text-txt-secondary mb-1">
              연체 금액
            </Typography>
            <Typography variant="h3" className="text-2xl text-red-600">
              {formatCurrency(invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total || 0), 0))}
            </Typography>
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  );
}