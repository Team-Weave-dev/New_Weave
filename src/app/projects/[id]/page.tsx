'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkspacePageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { ArrowLeft, Calendar, DollarSign, FileText, User, Building, Hash, TrendingUp } from 'lucide-react';
import { taxTransactionService } from '@/lib/services/supabase/tax-transactions.service';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';

// Mock 프로젝트 데이터
const mockProjects = {
  'proj-1': {
    id: 'proj-1',
    name: '웹사이트 개발',
    client: '테크스타트',
    status: '진행중',
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    totalBudget: 5000000,
    description: '기업 웹사이트 리뉴얼 프로젝트'
  },
  'proj-2': {
    id: 'proj-2',
    name: 'UI/UX 디자인',
    client: '디자인컴퍼니',
    status: '완료',
    startDate: '2024-11-01',
    endDate: '2024-12-10',
    totalBudget: 3000000,
    description: '모바일 앱 UI/UX 디자인'
  },
  'proj-3': {
    id: 'proj-3',
    name: '쇼핑몰 구축',
    client: '이커머스플러스',
    status: '완료',
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    totalBudget: 8000000,
    description: '온라인 쇼핑몰 플랫폼 구축'
  },
  'proj-4': {
    id: 'proj-4',
    name: '프리랜서 개발 용역',
    client: '프리랜서김개발',
    status: '진행중',
    startDate: '2024-12-01',
    endDate: '2025-01-31',
    totalBudget: 7000000,
    description: '백엔드 API 개발 프로젝트'
  },
  'proj-5': {
    id: 'proj-5',
    name: 'UI/UX 디자인 용역',
    client: '프리랜서박디자인',
    status: '완료',
    startDate: '2024-10-01',
    endDate: '2024-10-31',
    totalBudget: 2800000,
    description: '프리랜서 UI/UX 디자인 프로젝트'
  },
  'proj-6': {
    id: 'proj-6',
    name: '마케팅 대행',
    client: '개인사업자이마케팅',
    status: '진행중',
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    totalBudget: 3000000,
    description: '디지털 마케팅 캠페인'
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const project = mockProjects[projectId as keyof typeof mockProjects];

  useEffect(() => {
    if (projectId) {
      loadProjectTransactions();
    }
  }, [projectId]);

  const loadProjectTransactions = async () => {
    try {
      const data = await taxTransactionService.getProjectTransactions(projectId);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load project transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!project) {
    return (
      <WorkspacePageContainer>
        <div className="text-center py-12">
          <Typography variant="h2" className="text-txt-tertiary mb-4">
            프로젝트를 찾을 수 없습니다
          </Typography>
          <Button onClick={() => router.push('/projects')} variant="primary">
            프로젝트 목록으로 돌아가기
          </Button>
        </div>
      </WorkspacePageContainer>
    );
  }

  const totalRevenue = transactions
    .filter(t => t.transaction_type === '매출')
    .reduce((sum, t) => sum + t.total_amount - t.withholding_tax_3_3 - t.withholding_tax_6_8, 0);
  
  const totalExpense = transactions
    .filter(t => t.transaction_type === '매입')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const profit = totalRevenue - totalExpense;
  const profitRate = project.totalBudget > 0 ? (profit / project.totalBudget) * 100 : 0;

  return (
    <WorkspacePageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/tax-management?tab=transactions')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              매입매출 상세로
            </Button>
            <div>
              <Typography variant="h1" className="text-2xl font-bold text-txt-primary">
                {project.name}
              </Typography>
              <Typography variant="body2" className="text-txt-secondary">
                {project.description}
              </Typography>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.status === '완료' 
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {project.status}
          </div>
        </div>

        {/* 프로젝트 정보 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-txt-tertiary" />
              <div>
                <Typography variant="caption" className="text-txt-tertiary">
                  클라이언트
                </Typography>
                <Typography variant="body1" className="font-medium text-txt-primary">
                  {project.client}
                </Typography>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-txt-tertiary" />
              <div>
                <Typography variant="caption" className="text-txt-tertiary">
                  프로젝트 기간
                </Typography>
                <Typography variant="body1" className="font-medium text-txt-primary">
                  {new Date(project.startDate).toLocaleDateString()} ~ {new Date(project.endDate).toLocaleDateString()}
                </Typography>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-txt-tertiary" />
              <div>
                <Typography variant="caption" className="text-txt-tertiary">
                  예산
                </Typography>
                <Typography variant="body1" className="font-medium text-txt-primary">
                  ₩{project.totalBudget.toLocaleString()}
                </Typography>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-txt-tertiary" />
              <div>
                <Typography variant="caption" className="text-txt-tertiary">
                  프로젝트 ID
                </Typography>
                <Typography variant="body1" className="font-medium text-txt-primary">
                  {project.id}
                </Typography>
              </div>
            </div>
          </Card>
        </div>

        {/* 수익성 분석 */}
        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold text-txt-primary mb-4">
            수익성 분석
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Typography variant="body2" className="text-txt-secondary mb-1">
                총 매출 (입금액)
              </Typography>
              <Typography variant="h3" className="text-xl font-bold text-green-600">
                ₩{totalRevenue.toLocaleString()}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" className="text-txt-secondary mb-1">
                총 비용
              </Typography>
              <Typography variant="h3" className="text-xl font-bold text-red-600">
                ₩{totalExpense.toLocaleString()}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" className="text-txt-secondary mb-1">
                순이익
              </Typography>
              <Typography variant="h3" className={`text-xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₩{profit.toLocaleString()}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" className="text-txt-secondary mb-1">
                수익률
              </Typography>
              <Typography variant="h3" className={`text-xl font-bold ${profitRate >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {profitRate.toFixed(1)}%
              </Typography>
            </div>
          </div>
        </Card>

        {/* 거래 내역 */}
        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold text-txt-primary mb-4">
            거래 내역
          </Typography>
          {loading ? (
            <div className="text-center py-8 text-txt-tertiary">
              데이터를 불러오는 중...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-txt-tertiary">
              연결된 거래 내역이 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary border-b border-border-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-txt-secondary text-sm font-medium">
                      날짜
                    </th>
                    <th className="px-4 py-3 text-left text-txt-secondary text-sm font-medium">
                      구분
                    </th>
                    <th className="px-4 py-3 text-left text-txt-secondary text-sm font-medium">
                      거래처
                    </th>
                    <th className="px-4 py-3 text-right text-txt-secondary text-sm font-medium">
                      공급가액
                    </th>
                    <th className="px-4 py-3 text-right text-txt-secondary text-sm font-medium">
                      부가세
                    </th>
                    <th className="px-4 py-3 text-right text-txt-secondary text-sm font-medium">
                      원천세(3.3%)
                    </th>
                    <th className="px-4 py-3 text-right text-txt-secondary text-sm font-medium">
                      원천세(8.8%)
                    </th>
                    <th className="px-4 py-3 text-right text-txt-secondary text-sm font-medium">
                      입금액
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const actualAmount = transaction.transaction_type === '매출'
                      ? transaction.total_amount - transaction.withholding_tax_3_3 - transaction.withholding_tax_6_8
                      : transaction.total_amount;
                    
                    return (
                      <tr key={transaction.id} className="border-b border-border-light">
                        <td className="px-4 py-3 text-txt-primary text-sm">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
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
                        <td className="px-4 py-3 text-txt-primary text-sm">
                          {transaction.supplier_name}
                        </td>
                        <td className="px-4 py-3 text-right text-txt-primary text-sm">
                          ₩{transaction.supply_amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-txt-primary text-sm">
                          {transaction.vat_amount > 0 ? `₩${transaction.vat_amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span className={transaction.withholding_tax_3_3 > 0 ? "text-orange-600" : "text-txt-tertiary"}>
                            {transaction.withholding_tax_3_3 > 0 ? `₩${transaction.withholding_tax_3_3.toLocaleString()}` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span className={transaction.withholding_tax_6_8 > 0 ? "text-orange-600" : "text-txt-tertiary"}>
                            {transaction.withholding_tax_6_8 > 0 ? `₩${transaction.withholding_tax_6_8.toLocaleString()}` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-txt-primary text-sm">
                          ₩{actualAmount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </WorkspacePageContainer>
  );
}