'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { WorkspacePageContainer } from '@/components/layout/PageContainer';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import Typography from '@/components/ui/Typography';
import type { DashboardInsight, QuickAction } from '@/components/dashboard/DashboardLayout';
import type { CalendarEvent } from '@/components/dashboard/DashboardCalendar';
import { getSupabaseClientSafe } from '@/lib/supabase/client';
import { projectsService } from '@/lib/services/supabase/projects.service';
import { clientService } from '@/lib/services/supabase/clients.service';
import { invoicesService } from '@/lib/services/supabase/invoices.service';
import { remindersService } from '@/lib/services/supabase/reminders.service';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Mock 데이터 - 실제로는 API에서 가져올 데이터
interface DashboardData {
  overdueInvoices: {
    count: number;
    totalAmount: number;
  };
  upcomingDeadlines: {
    count: number;
    projects: Array<{
      id: string;
      name: string;
      dueDate: Date;
      daysLeft: number;
    }>;
  };
  monthlyFinancials: {
    issued: number;
    paid: number;
    difference: number;
    trend: number;
  };
  topClients: Array<{
    id: string;
    name: string;
    revenue: number;
    percentage: number;
  }>;
  calendarEvents: CalendarEvent[];
}

export default function Dashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseClient] = useState(() => getSupabaseClientSafe());
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 데이터 로딩 - 모의 데이터 모드 지원
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      setIsLoading(true);
      
      // 모의 데이터 모드 확인
      const isUsingMockData = 
        process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || 
        !process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (isUsingMockData) {
        // 모의 데이터 모드: Mock 사용자 ID 사용
        console.log('Using mock data mode for dashboard');
        setUserId('mock-user-id');
        await fetchDashboardData('mock-user-id');
        return;
      }
      
      // 실제 Supabase 인증 모드
      if (!supabaseClient) {
        console.log('Supabase client not available, using mock data');
        setUserId('mock-user-id');
        await fetchDashboardData('mock-user-id');
        return;
      }
      
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error || !session || !session.user) {
        console.log('No valid session in dashboard, redirecting to login');
        router.push('/login');
        return;
      }
      
      setUserId(session.user.id);
      await fetchDashboardData(session.user.id);
    };
    
    const fetchDashboardData = async (userId: string) => {
      try {
        // 실제 Supabase 데이터 가져오기
        const [projects, clients, invoices, reminders] = await Promise.all([
          projectsService.getProjects(userId),
          clientService.getClients(userId),
          invoicesService.getInvoices(userId),
          remindersService.getUpcomingReminders(userId)
        ]);
        
        // 연체 인보이스 계산
        const overdueInvoices = invoices.filter(inv => {
          if (!inv.due_date || inv.status === 'paid') return false;
          return new Date(inv.due_date) < new Date();
        });
        
        // 다가오는 마감일 계산
        const upcomingProjects = projects.filter(proj => {
          if (!proj.due_date || proj.status === 'completed') return false;
          const daysLeft = Math.ceil((new Date(proj.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysLeft > 0 && daysLeft <= 14;
        });
        
        // 월별 재무 정보 계산
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthlyInvoices = invoices.filter(inv => {
          const date = new Date(inv.issue_date || inv.created_at);
          return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        });
        
        const issued = monthlyInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const paid = monthlyInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        // 상위 클라이언트 계산 (프로젝트 기준)
        const clientRevenue = new Map<string, number>();
        projects.forEach(proj => {
          if (proj.client_id) {
            const current = clientRevenue.get(proj.client_id) || 0;
            clientRevenue.set(proj.client_id, current + (proj.budget_estimated || 0));
          }
        });
        
        const topClientsData = Array.from(clientRevenue.entries())
          .map(([clientId, revenue]) => {
            const client = clients.find(c => c.id === clientId);
            return {
              id: clientId,
              name: client?.company || '알 수 없음',
              revenue,
              percentage: 0
            };
          })
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3);
        
        const totalRevenue = topClientsData.reduce((sum, c) => sum + c.revenue, 0);
        topClientsData.forEach(client => {
          client.percentage = totalRevenue > 0 ? (client.revenue / totalRevenue) * 100 : 0;
        });
        
        // 캘린더 이벤트 생성
        const calendarEvents: CalendarEvent[] = [];
        
        // 인보이스 이벤트
        invoices.forEach(inv => {
          if (inv.issue_date) {
            calendarEvents.push({
              id: `inv-${inv.id}`,
              title: `${inv.invoice_number} 인보이스`,
              date: inv.issue_date.slice(0, 10),
              type: 'invoice'
            });
          }
          if (inv.due_date) {
            calendarEvents.push({
              id: `due-${inv.id}`,
              title: `${inv.invoice_number} 결제 예정`,
              date: inv.due_date.slice(0, 10),
              type: 'payment'
            });
          }
        });
        
        // 프로젝트 마감일 이벤트
        projects.forEach(proj => {
          if (proj.due_date) {
            calendarEvents.push({
              id: `proj-${proj.id}`,
              title: `${proj.name} 마감`,
              date: proj.due_date.slice(0, 10),
              type: 'deadline'
            });
          }
        });
        
        // 리마인더 이벤트
        reminders.forEach(rem => {
          if (rem.due_date) {
            calendarEvents.push({
              id: `rem-${rem.id}`,
              title: rem.title,
              date: rem.due_date.slice(0, 10),
              type: 'reminder'
            });
          }
        });
        
        const dashboardData: DashboardData = {
          overdueInvoices: {
            count: overdueInvoices.length,
            totalAmount: overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
          },
          upcomingDeadlines: {
            count: upcomingProjects.length,
            projects: upcomingProjects.map(proj => ({
              id: proj.id,
              name: proj.name,
              dueDate: new Date(proj.due_date!),
              daysLeft: Math.ceil((new Date(proj.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            }))
          },
          monthlyFinancials: {
            issued,
            paid,
            difference: issued - paid,
            trend: 0 // TODO: 전달 대비 비교 구현
          },
          topClients: topClientsData,
          calendarEvents
        };
        
        setDashboardData(dashboardData);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setIsLoading(false);
        // 오류 발생 시 Mock 데이터 사용
        const mockData: DashboardData = {
        overdueInvoices: {
          count: 3,
          totalAmount: 4500000
        },
        upcomingDeadlines: {
          count: 2,
          projects: [
            {
              id: '1',
              name: '웹사이트 리뉴얼',
              dueDate: new Date('2025-09-01'),
              daysLeft: 7
            },
            {
              id: '2', 
              name: '모바일 앱 개발',
              dueDate: new Date('2025-09-05'),
              daysLeft: 11
            }
          ]
        },
        monthlyFinancials: {
          issued: 12500000,
          paid: 8300000,
          difference: 4200000,
          trend: 15.2
        },
        topClients: [
          { id: '1', name: '㈜테크스타트', revenue: 3200000, percentage: 28.5 },
          { id: '2', name: '디자인컴퍼니', revenue: 2800000, percentage: 24.9 },
          { id: '3', name: '이커머스플러스', revenue: 1900000, percentage: 16.9 }
        ],
        calendarEvents: [
          {
            id: 'inv-001',
            title: '㈜테크스타트 인보이스 발송',
            date: '2025-08-26',
            type: 'invoice'
          },
          {
            id: 'pay-001',
            title: '디자인컴퍼니 결제 완료',
            date: '2025-08-25',
            type: 'payment'
          },
          {
            id: 'dead-001',
            title: '웹사이트 리뉴얼 마감',
            date: '2025-09-01',
            type: 'deadline'
          },
          {
            id: 'meet-001',
            title: '이커머스플러스 프로젝트 미팅',
            date: '2025-08-28',
            type: 'meeting'
          },
          {
            id: 'rem-001',
            title: '월말 정산 리마인더',
            date: '2025-08-31',
            type: 'reminder'
          },
          {
            id: 'inv-002',
            title: '신규 클라이언트 견적서 제출',
            date: '2025-08-29',
            type: 'invoice'
          },
          {
            id: 'pay-002',
            title: '프로젝트 1차 결제 예정',
            date: '2025-09-03',
            type: 'payment'
          },
          {
            id: 'dead-002',
            title: '모바일 앱 개발 마감',
            date: '2025-09-05',
            type: 'deadline'
          }
        ]
      };

      setDashboardData(mockData);
      }
    };

    checkAuthAndFetchData();
    
    // 실시간 구독 설정
    const setupRealtimeSubscription = (currentUserId: string) => {
      if (!supabaseClient) return;
      
      const channel = supabaseClient
        .channel('dashboard-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'projects' },
          (payload) => {
            console.log('Project change received:', payload);
            fetchDashboardData(currentUserId); // userId 전달
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'clients' },
          (payload) => {
            console.log('Client change received:', payload);
            fetchDashboardData(currentUserId); // userId 전달
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'invoices' },
          (payload) => {
            console.log('Invoice change received:', payload);
            fetchDashboardData(currentUserId); // userId 전달
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reminders' },
          (payload) => {
            console.log('Reminder change received:', payload);
            fetchDashboardData(currentUserId); // userId 전달
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Dashboard realtime subscription active');
          }
        });
      
      setRealtimeChannel(channel);
    };
    
    // 모의 데이터 모드에서는 실시간 구독 사용 안 함
    const isUsingMockData = 
      process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || 
      !process.env.NEXT_PUBLIC_SUPABASE_URL;
      
    if (userId && !isUsingMockData) {
      setupRealtimeSubscription(userId);
    }
    
    // Cleanup 함수
    return () => {
      if (realtimeChannel) {
        console.log('Unsubscribing from dashboard realtime updates');
        supabaseClient?.removeChannel(realtimeChannel);
      }
    };
  }, [router, userId, realtimeChannel]);

  // 빠른 실행 버튼들
  const quickActions: QuickAction[] = [
    {
      label: '새 프로젝트',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: () => router.push('/projects/new'),
      variant: 'primary'
    }
  ];

  // 로딩 중일 때 표시할 인사이트 (스켈레톤)
  const loadingInsights: DashboardInsight[] = [
    {
      id: 'R1',
      title: '결제 지연 청구서',
      value: '로딩중...',
      icon: <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />,
      isEmpty: false
    },
    {
      id: 'R2', 
      title: '마감 임박 프로젝트',
      value: '로딩중...',
      icon: <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />,
      isEmpty: false
    },
    {
      id: 'R3',
      title: '이번 달 발행 vs 입금',
      value: '로딩중...',
      icon: <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />,
      isEmpty: false
    },
    {
      id: 'R4',
      title: '상위 고객 기여도',
      value: '로딩중...',
      icon: <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />,
      isEmpty: false
    }
  ];

  // 실제 데이터를 바탕으로 한 인사이트
  const insights: DashboardInsight[] = dashboardData ? [
    {
      id: 'R1',
      title: '결제 지연 청구서',
      value: `${dashboardData.overdueInvoices.count}건`,
      subtitle: `${(dashboardData.overdueInvoices.totalAmount / 10000).toLocaleString()}만원`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: dashboardData.overdueInvoices.count > 0 ? 'warning' : 'default',
      actionLabel: dashboardData.overdueInvoices.count > 0 ? '연체 내역 보기' : undefined,
      onActionClick: dashboardData.overdueInvoices.count > 0 ? () => router.push('/invoices') : undefined,
      isEmpty: dashboardData.overdueInvoices.count === 0,
      emptyMessage: '연체된 청구서가 없습니다 👍'
    },
    {
      id: 'R2',
      title: '마감 임박 프로젝트',
      value: `${dashboardData.upcomingDeadlines.count}건`,
      subtitle: dashboardData.upcomingDeadlines.count > 0 ? 
        `가장 빠른 마감: D-${Math.min(...dashboardData.upcomingDeadlines.projects.map(p => p.daysLeft))}` : 
        undefined,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: dashboardData.upcomingDeadlines.count > 0 ? 'info' : 'default',
      actionLabel: dashboardData.upcomingDeadlines.count > 0 ? '프로젝트 보기' : undefined,
      onActionClick: dashboardData.upcomingDeadlines.count > 0 ? () => router.push('/projects') : undefined,
      isEmpty: dashboardData.upcomingDeadlines.count === 0,
      emptyMessage: '마감 임박 프로젝트가 없습니다'
    },
    {
      id: 'R3',
      title: '이번 달 발행 vs 입금',
      value: `${(dashboardData.monthlyFinancials.issued / 10000).toLocaleString()}만원`,
      subtitle: `입금: ${(dashboardData.monthlyFinancials.paid / 10000).toLocaleString()}만원 (차액: ${(dashboardData.monthlyFinancials.difference / 10000).toLocaleString()}만원)`,
      trend: {
        value: dashboardData.monthlyFinancials.trend,
        label: '지난달 대비',
        isPositive: dashboardData.monthlyFinancials.trend > 0
      },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      variant: 'success',
      actionLabel: '상세 리포트',
      onActionClick: () => router.push('/invoices')
    },
    {
      id: 'R4',
      title: '상위 고객 기여도',
      value: dashboardData.topClients.length > 0 ? dashboardData.topClients[0].name : '데이터 없음',
      subtitle: dashboardData.topClients.length > 0 ? 
        `${(dashboardData.topClients[0].revenue / 10000).toLocaleString()}만원 (${dashboardData.topClients[0].percentage}%)` : 
        undefined,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      actionLabel: '고객 상세',
      onActionClick: () => router.push('/clients'),
      isEmpty: dashboardData.topClients.length === 0,
      emptyMessage: '고객 데이터가 없습니다'
    }
  ] : loadingInsights;

  return (
    <AppLayout>
      <WorkspacePageContainer>
        <DashboardLayout
          insights={insights}
          quickActions={quickActions}
        >
          {/* 캘린더 및 추가 차트 */}
          <div className="grid grid-cols-1 gap-6">
            {/* 비즈니스 캘린더 */}
            <div className="mb-6">
              <DashboardCalendar 
                events={dashboardData?.calendarEvents || []}
                onDateSelect={(date) => console.log('Selected date:', date)}
                onEventClick={(event) => {
                  // 이벤트 타입에 따라 다른 페이지로 이동
                  if (event.type === 'invoice' || event.type === 'payment') {
                    router.push('/invoices');
                  } else if (event.type === 'deadline') {
                    router.push('/projects');
                  } else if (event.type === 'reminder') {
                    router.push('/reminder');
                  }
                }}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-border-light p-6">
                <Typography variant="h4" className="mb-4">
                  최근 활동
                </Typography>
                <div className="space-y-4">
                  <div className="text-sm text-txt-tertiary">
                    실제 데이터 연동 시 최근 인보이스 발행, 결제 완료, 프로젝트 업데이트 등의 활동이 표시됩니다.
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-border-light p-6">
                <Typography variant="h4" className="mb-4">
                  월별 매출 추이
                </Typography>
                <div className="space-y-4">
                  <div className="text-sm text-txt-tertiary">
                    차트 라이브러리 연동 시 월별 매출 그래프가 표시됩니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </WorkspacePageContainer>
    </AppLayout>
  );
}