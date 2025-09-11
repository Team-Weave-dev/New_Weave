'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { DataPageContainer } from '@/components/layout/PageContainer';
import { ProjectTabContent, ClientTabContent, InvoiceTabContent, PaymentTabContent } from '@/components/projects/ProjectTabs';
import { projectsService, type Project } from '@/lib/services/supabase/projects.service';
import { clientService, type Client } from '@/lib/services/supabase/clients.service';
import { invoicesService } from '@/lib/services/supabase/invoices.service';
import type { Database } from '@/lib/supabase/database.types';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  FolderOpen,
  MoreVertical,
  CheckCircle,
  XCircle,
  PauseCircle,
  BarChart3,
  Briefcase,
  Loader2
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import type { ProjectSummary, ProjectStatistics } from '@/lib/types/project';

// Supabase 프로젝트 타입
type ProjectWithClient = Project & {
  client?: Client | null;
  taskCount?: {
    total: number;
    completed: number;
  };
};

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [statistics, setStatistics] = useState<ProjectStatistics>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    averageProgress: 0,
    upcomingDeadlines: 0,
    overdueProjects: 0,
    teamUtilization: 0
  });
  const [activeTab, setActiveTab] = useState<'project' | 'clients' | 'invoices' | 'payments'>('project');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 프로젝트 데이터 불러오기
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Supabase에서 현재 사용자 가져오기
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        setError('로그인이 필요합니다.');
        return;
      }
      
      const userId = user.id;
      const projectsData = await projectsService.getProjects(userId);
      
      // 각 프로젝트에 클라이언트 정보 추가
      const projectsWithClients = await Promise.all(
        projectsData.map(async (project) => {
          let client = undefined;
          if (project.client_id) {
            try {
              client = await clientService.getClientById(project.client_id);
            } catch (err) {
              console.error(`Failed to load client for project ${project.id}:`, err);
            }
          }
          
          // 작업 통계 (현재는 더미 데이터)
          const taskCount = {
            total: Math.floor(Math.random() * 50) + 10,
            completed: Math.floor(Math.random() * 30) + 5
          };
          
          return {
            ...project,
            client: client || undefined,
            taskCount
          };
        })
      );
      
      setProjects(projectsWithClients);
      
      // 통계 계산
      const activeProjects = projectsWithClients.filter(p => p.status === 'in_progress').length;
      const completedProjects = projectsWithClients.filter(p => p.status === 'completed').length;
      const totalRevenue = projectsWithClients.reduce((sum, p) => sum + (p.budget_estimated || 0), 0);
      // TODO: progress 필드가 Project 타입에 없으므로 임시로 0으로 설정
      const averageProgress = 0;
      
      // 마감일 계산
      const today = new Date();
      const upcomingDeadlines = projectsWithClients.filter(p => {
        if (!p.due_date) return false;
        const endDate = new Date(p.due_date);
        const daysUntilDeadline = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDeadline > 0 && daysUntilDeadline <= 7;
      }).length;
      
      const overdueProjects = projectsWithClients.filter(p => {
        if (!p.due_date || p.status === 'completed') return false;
        const endDate = new Date(p.due_date);
        return endDate < today;
      }).length;
      
      setStatistics({
        totalProjects: projectsWithClients.length,
        activeProjects,
        completedProjects,
        totalRevenue,
        averageProgress,
        upcomingDeadlines,
        overdueProjects,
        teamUtilization: Math.floor(Math.random() * 30) + 60 // 더미 데이터
      });
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('프로젝트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // URL 파라미터로 탭 상태 초기화
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (tabParam === 'projects') {
        setActiveTab('project');
      } else if (tabParam === 'clients') {
        setActiveTab('clients');
      } else if (tabParam === 'invoices') {
        setActiveTab('invoices');
      } else if (tabParam === 'payments') {
        setActiveTab('payments');
      }
    }
  }, [searchParams]);

  // 상태별 색상 매핑
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'review': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'on_hold': return 'bg-orange-100 text-orange-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 우선순위별 색상 매핑
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  // 상태 한글 변환
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return '기획';
      case 'in_progress': return '진행중';
      case 'review': return '검토';
      case 'completed': return '완료';
      case 'on_hold': return '보류';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  // 필터링된 프로젝트
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (project.client?.company || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <DataPageContainer>
        {/* 헤더 - 모바일 가로 배치 최적화 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 sm:p-3 bg-weave-primary-light rounded-lg flex-shrink-0">
                  <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-weave-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <Typography variant="h2" className="text-xl sm:text-2xl mb-0 sm:mb-1 text-txt-primary leading-tight">프로젝트 관리</Typography>
                  <Typography variant="body1" className="text-sm sm:text-base text-txt-secondary leading-tight hidden sm:block">
                    모든 프로젝트를 한눈에 관리하고 추적하세요
                  </Typography>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <Button
                  variant="primary"
                  onClick={() => router.push('/projects/new')}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">새 프로젝트</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* 4개 탭 네비게이션 */}
          <div className="border-t border-border-light">
            <nav className="flex space-x-8 px-0" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('project')}
                  className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'project'
                      ? 'border-weave-primary text-weave-primary'
                      : 'border-transparent text-txt-secondary hover:text-txt-primary hover:border-border-light'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  프로젝트
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'project'
                      ? 'bg-weave-primary-light text-weave-primary'
                      : 'bg-bg-secondary text-txt-tertiary'
                  }`}>
                    {projects.length}
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveTab('clients')}
                  className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'clients'
                      ? 'border-weave-primary text-weave-primary'
                      : 'border-transparent text-txt-secondary hover:text-txt-primary hover:border-border-light'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  클라이언트
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'clients'
                      ? 'bg-weave-primary-light text-weave-primary'
                      : 'bg-bg-secondary text-txt-tertiary'
                  }`}>
                    12
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'invoices'
                      ? 'border-weave-primary text-weave-primary'
                      : 'border-transparent text-txt-secondary hover:text-txt-primary hover:border-border-light'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  인보이스
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'invoices'
                      ? 'bg-weave-primary-light text-weave-primary'
                      : 'bg-bg-secondary text-txt-tertiary'
                  }`}>
                    8
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'payments'
                      ? 'border-weave-primary text-weave-primary'
                      : 'border-transparent text-txt-secondary hover:text-txt-primary hover:border-border-light'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  결제관리
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'payments'
                      ? 'bg-weave-primary-light text-weave-primary'
                      : 'bg-bg-secondary text-txt-tertiary'
                  }`}>
                    5
                  </span>
                </button>
            </nav>
          </div>

        <div className="pt-6">
          {/* 탭에 따른 컨텐츠 렌더링 */}
          {activeTab === 'project' ? (
            <>
              {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-border-light p-4">
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-txt-secondary flex-1">총 프로젝트</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-txt-primary">
                {statistics.totalProjects}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-border-light p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-txt-secondary flex-1">활성 프로젝트</span>
                <span className="text-xs text-green-600 flex-shrink-0">진행중</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-txt-primary">
                {statistics.activeProjects}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-border-light p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-txt-secondary flex-1">총 매출액</span>
                <span className="text-xs text-txt-tertiary flex-shrink-0">수익</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-txt-primary">
                {(statistics.totalRevenue / 10000).toLocaleString()}만원
              </div>
            </div>

            <div className="bg-white rounded-lg border border-border-light p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-txt-secondary flex-1">평균 진행률</span>
                <span className="text-xs text-txt-tertiary flex-shrink-0">팀 {statistics.teamUtilization}%</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-txt-primary">
                {statistics.averageProgress}%
              </div>
            </div>
          </div>

          {/* 필터 및 검색 */}
          <div className="bg-white rounded-lg border border-border-light p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                <input
                  type="text"
                  placeholder="프로젝트명 또는 클라이언트명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                >
                  <option value="all">모든 상태</option>
                  <option value="planning">기획</option>
                  <option value="in_progress">진행중</option>
                  <option value="review">검토</option>
                  <option value="completed">완료</option>
                  <option value="on_hold">보류</option>
                </select>

                <button className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg hover:bg-bg-secondary transition-colors">
                  <Filter className="w-4 h-4" />
                  필터
                </button>
              </div>
            </div>
          </div>

          {/* 프로젝트 목록 */}
          <div className="bg-white rounded-lg border border-border-light overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-weave-primary mx-auto mb-4" />
                <Typography variant="body1" className="text-txt-secondary">
                  프로젝트 목록을 불러오는 중...
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
                  onClick={loadProjects}
                  className="mt-4"
                >
                  다시 시도
                </Button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary border-b border-border-light">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-txt-secondary uppercase tracking-wider">
                      프로젝트
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-txt-secondary uppercase tracking-wider">
                      클라이언트
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-txt-secondary uppercase tracking-wider">
                      상태
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-txt-secondary uppercase tracking-wider">
                      진행률
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-txt-secondary uppercase tracking-wider">
                      예산
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-txt-secondary uppercase tracking-wider">
                      마감일
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-txt-secondary uppercase tracking-wider">
                      팀
                    </th>
                    <th className="text-right px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {filteredProjects.map((project) => (
                    <tr 
                      key={project.id} 
                      className="hover:bg-bg-secondary transition-colors cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${getPriorityColor('medium')}`} />
                          <div>
                            <div className="text-sm font-medium text-txt-primary">
                              {project.name}
                            </div>
                            <div className="text-xs text-txt-tertiary">
                              {project.taskCount?.completed || 0}/{project.taskCount?.total || 0} 작업 완료
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-txt-primary">{project.client?.company || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-1 mr-3">
                            <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-weave-primary transition-all duration-300"
                                style={{ width: `${0}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-txt-secondary">{0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-txt-primary">
                            {((project.budget_actual || 0) / 10000).toLocaleString()}만원
                          </div>
                          <div className="text-xs text-txt-tertiary">
                            / {((project.budget_estimated || 0) / 10000).toLocaleString()}만원
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-txt-primary">
                          <Calendar className="w-4 h-4 mr-1 text-txt-tertiary" />
                          {project.due_date ? new Date(project.due_date).toLocaleDateString('ko-KR') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-txt-tertiary" />
                          <span className="text-sm text-txt-primary">0</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // 더보기 메뉴 처리
                          }}
                          className="p-1 hover:bg-bg-secondary rounded"
                        >
                          <MoreVertical className="w-4 h-4 text-txt-tertiary" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            
            {!loading && !error && filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-txt-tertiary mx-auto mb-4" />
                <p className="text-txt-secondary">프로젝트가 없습니다</p>
                <button
                  onClick={() => router.push('/projects/new')}
                  className="mt-4 text-weave-primary hover:text-weave-primary-dark"
                >
                  새 프로젝트 만들기
                </button>
              </div>
            )}
          </div>

              {/* 긴급 알림 */}
              {statistics.overdueProjects > 0 && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">주의가 필요한 프로젝트</h3>
                      <p className="text-sm text-red-700 mt-1">
                        {statistics.overdueProjects}개의 프로젝트가 마감일을 초과했습니다.
                        {statistics.upcomingDeadlines > 0 && ` ${statistics.upcomingDeadlines}개의 프로젝트가 곧 마감됩니다.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : activeTab === 'clients' ? (
            <ClientTabContent projectId="current" />
          ) : activeTab === 'invoices' ? (
            <InvoiceTabContent projectId="current" />
          ) : activeTab === 'payments' ? (
            <PaymentTabContent projectId="current" />
          ) : null}
        </div>
      </DataPageContainer>
    </AppLayout>
  );
}

// 새로운 워크플로우 기반 페이지를 기본으로 사용
import ProjectWorkflowPage from './ProjectWorkflowPage';

export default function ProjectsPage() {
  return <ProjectWorkflowPage />;
}