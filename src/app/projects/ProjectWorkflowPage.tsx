'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { DataPageContainer } from '@/components/layout/PageContainer';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { 
  Users,
  Briefcase,
  FileText,
  FileSignature,
  CreditCard,
  ChartBar,
  Settings,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { projectsService } from '@/lib/services/supabase/projects.service';
import { clientService, type Client } from '@/lib/services/supabase/clients.service';
import { invoicesService } from '@/lib/services/supabase/invoices.service';
import type { Database } from '@/lib/supabase/database.types';
import AIDocumentModal from '@/components/ai-assistant/AIDocumentModal';

// 워크플로우 기반 탭 구조
interface WorkflowTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  description?: string;
}

// 프로젝트 워크플로우 상태
enum ProjectStage {
  CLIENT_REGISTERED = 'client_registered',
  PROJECT_CREATED = 'project_created',
  QUOTATION_DRAFT = 'quotation_draft',
  QUOTATION_SENT = 'quotation_sent',
  QUOTATION_APPROVED = 'quotation_approved',
  CONTRACT_DRAFT = 'contract_draft',
  CONTRACT_SIGNED = 'contract_signed',
  DEPOSIT_INVOICED = 'deposit_invoiced',
  DEPOSIT_RECEIVED = 'deposit_received',
  IN_PROGRESS = 'in_progress',
  REPORT_SUBMITTED = 'report_submitted',
  FINAL_INVOICED = 'final_invoiced',
  COMPLETED = 'completed'
}

// 타입 정의
type Project = Database['public']['Tables']['projects']['Row'];
type Invoice = Database['public']['Tables']['invoices']['Row'];

export default function ProjectWorkflowPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('clients');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AI 모달 상태
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDocumentType, setAIDocumentType] = useState<'quotation' | 'contract' | 'invoice' | 'report'>('quotation');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // 데이터 상태
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  
  // 검색 및 필터
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // 워크플로우 순서대로 탭 정의
  const workflowTabs: WorkflowTab[] = [
    {
      id: 'clients',
      label: '클라이언트',
      icon: <Users className="w-4 h-4" />,
      count: clients.length,
      description: '고객사 정보 관리'
    },
    {
      id: 'projects',
      label: '프로젝트',
      icon: <Briefcase className="w-4 h-4" />,
      count: projects.length,
      description: '프로젝트 생성 및 관리'
    },
    {
      id: 'quotations',
      label: '견적서',
      icon: <FileText className="w-4 h-4" />,
      count: quotations.length,
      description: 'AI 기반 견적서 생성'
    },
    {
      id: 'contracts',
      label: '계약서',
      icon: <FileSignature className="w-4 h-4" />,
      count: contracts.length,
      description: '전자계약 및 서명'
    },
    {
      id: 'billing',
      label: '청구/정산',
      icon: <CreditCard className="w-4 h-4" />,
      count: invoices.length,
      description: '인보이스 및 결제 관리'
    },
    {
      id: 'reports',
      label: '보고서',
      icon: <ChartBar className="w-4 h-4" />,
      count: reports.length,
      description: '진행 및 완료 보고서'
    },
    {
      id: 'settings',
      label: '설정',
      icon: <Settings className="w-4 h-4" />,
      description: '프로젝트 설정'
    }
  ];

  // URL 파라미터로 탭 초기화
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && workflowTabs.find(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock 사용자 ID 사용 (Supabase 연결 제거)
      const userId = 'mock-user';
      
      // 병렬로 Mock 데이터 로드
      const [clientsData, projectsData, invoicesData] = await Promise.all([
        clientService.getClients(userId),
        projectsService.getProjects(userId),
        invoicesService.getInvoices(userId)
      ]);
      
      setClients(clientsData);
      setProjects(projectsData);
      setInvoices(invoicesData);
      
      // 견적서, 계약서, 보고서는 추후 구현
      setQuotations([]);
      setContracts([]);
      setReports([]);
      
    } catch (err) {
      console.error('Failed to load data:', err);
      // Mock 데이터 사용 시 에러는 무시하고 로딩 완료 처리
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // URL 업데이트
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url);
  };

  // AI 모달 열기 핸들러
  const handleOpenAIModal = (type: 'quotation' | 'contract' | 'invoice' | 'report') => {
    setAIDocumentType(type);
    // 현재 탭에서 선택된 프로젝트/클라이언트 정보 설정
    if (projects.length > 0) {
      setSelectedProject(projects[0]); // 첨 번째 프로젝트 자동 선택
    }
    if (clients.length > 0) {
      setSelectedClient(clients[0]); // 첨 번째 클라이언트 자동 선택
    }
    setShowAIModal(true);
  };

  // 각 탭의 컨텐츠 렌더링
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-weave-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <Typography variant="body1" className="text-red-500 mb-4">
            {error}
          </Typography>
          <Button variant="outline" onClick={loadData}>
            다시 시도
          </Button>
        </div>
      );
    }

    switch (activeTab) {
      case 'clients':
        return <ClientsTab clients={clients} projects={projects} searchQuery={searchQuery} />;
      case 'projects':
        return <ProjectsTab projects={projects} clients={clients} searchQuery={searchQuery} />;
      case 'quotations':
        return <QuotationsTab quotations={quotations} projects={projects} onOpenAIModal={handleOpenAIModal} />;
      case 'contracts':
        return <ContractsTab contracts={contracts} projects={projects} onOpenAIModal={handleOpenAIModal} />;
      case 'billing':
        return <BillingTab invoices={invoices} projects={projects} onOpenAIModal={handleOpenAIModal} />;
      case 'reports':
        return <ReportsTab reports={reports} projects={projects} onOpenAIModal={handleOpenAIModal} />;
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <DataPageContainer>
        {/* 헤더 - 모바일 최적화 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 sm:p-3 bg-weave-primary-light rounded-lg flex-shrink-0">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-weave-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <Typography variant="h2" className="text-xl sm:text-2xl mb-0 sm:mb-1 text-txt-primary">
                  프로젝트 관리
                </Typography>
                <Typography variant="body2" className="text-sm text-txt-secondary hidden sm:block">
                  워크플로우 기반 통합 프로젝트 관리
                </Typography>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => handleTabChange('projects')}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">새 프로젝트</span>
            </Button>
          </div>
        </div>

        {/* 탭 네비게이션 - 모바일 스크롤 가능 */}
        <div className="border-b border-border-light -mx-4 sm:-mx-6 lg:-mx-12 px-4 sm:px-6 lg:px-12">
          <nav className="flex gap-0 overflow-x-auto scrollbar-hide" aria-label="Workflow tabs">
            {workflowTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-weave-primary text-weave-primary'
                    : 'border-transparent text-txt-secondary hover:text-txt-primary hover:border-border-light'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 5)}</span>
                {tab.count !== undefined && (
                  <span className={`ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-weave-primary-light text-weave-primary'
                      : 'bg-bg-secondary text-txt-tertiary'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* 검색 바 - 모바일 최적화 */}
        <div className="mt-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm sm:text-base border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary"
              >
                <option value="all">전체</option>
                <option value="active">진행중</option>
                <option value="completed">완료</option>
                <option value="pending">대기</option>
              </select>
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border-light rounded-lg hover:bg-bg-secondary transition-colors">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">필터</span>
              </button>
            </div>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white rounded-lg border border-border-light min-h-[400px]">
          {renderTabContent()}
        </div>

        {/* AI 문서 생성 모달 */}
        <AIDocumentModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          documentType={aiDocumentType}
          projectData={selectedProject ? {
            id: selectedProject.id,
            name: selectedProject.name,
            clientId: selectedProject.client_id || undefined,
            clientName: clients.find(c => c.id === selectedProject.client_id)?.company,
            budget: selectedProject.budget_estimated || undefined,
            description: selectedProject.description || undefined
          } : undefined}
          clientData={selectedClient ? {
            id: selectedClient.id,
            company: selectedClient.company,
            email: selectedClient.email || undefined,
            phone: selectedClient.phone || undefined
          } : undefined}
          onDocumentGenerated={(doc) => {
            console.log('Generated document:', doc);
            // TODO: 생성된 문서 저장 로직
          }}
        />
      </DataPageContainer>
    </AppLayout>
  );
}

// 클라이언트 탭 컴포넌트
function ClientsTab({ clients, projects, searchQuery }: { clients: Client[], projects: Project[], searchQuery: string }) {
  const router = useRouter();
  const filteredClients = clients.filter(client => 
    client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 각 클라이언트별 프로젝트 수 계산
  const getProjectCount = (clientId: string) => {
    return projects.filter(project => project.client_id === clientId).length;
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4" className="text-txt-primary">
          클라이언트 목록
        </Typography>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/clients/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          새 클라이언트
        </Button>
      </div>

      {/* 모바일 카드 뷰 / 데스크톱 테이블 뷰 */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-secondary border-b border-border-light">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-txt-secondary uppercase">회사명</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-txt-secondary uppercase">담당자</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-txt-secondary uppercase">연락처</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-txt-secondary uppercase">프로젝트</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-txt-secondary uppercase">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-bg-secondary cursor-pointer">
                <td className="px-4 py-3 text-sm text-txt-primary">{client.company}</td>
                <td className="px-4 py-3 text-sm text-txt-secondary">{client.name || '-'}</td>
                <td className="px-4 py-3 text-sm text-txt-secondary">{client.phone || '-'}</td>
                <td className="px-4 py-3 text-sm text-txt-primary">{getProjectCount(client.id)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    활성
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="sm:hidden space-y-3">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-bg-secondary rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <Typography variant="body1" className="font-medium text-txt-primary">
                  {client.company}
                </Typography>
                <Typography variant="caption" className="text-txt-secondary">
                  {client.name || '담당자 없음'}
                </Typography>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                활성
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-txt-tertiary">
              <span>{client.phone || '연락처 없음'}</span>
              <span>프로젝트 {getProjectCount(client.id)}개</span>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-txt-tertiary mx-auto mb-4" />
          <Typography variant="body1" className="text-txt-secondary">
            등록된 클라이언트가 없습니다
          </Typography>
        </div>
      )}
    </div>
  );
}

// 프로젝트 탭 컴포넌트
function ProjectsTab({ projects, clients, searchQuery }: { projects: Project[], clients: Client[], searchQuery: string }) {
  const router = useRouter();
  const filteredProjects = projects.filter(project => 
    project.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4" className="text-txt-primary">
          프로젝트 목록
        </Typography>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/projects/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          새 프로젝트
        </Button>
      </div>

      {/* 프로젝트 워크플로우 상태 표시 */}
      <div className="mb-6 p-4 bg-bg-secondary rounded-lg">
        <Typography variant="body2" className="text-txt-secondary mb-3">
          워크플로우 진행 상황
        </Typography>
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {['견적', '계약', '계약금', '수행', '정산', '완료'].map((stage, index) => (
            <div key={stage} className="flex items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                index <= 2 ? 'bg-weave-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {index + 1}
              </div>
              <span className="ml-2 text-xs text-txt-tertiary">{stage}</span>
              {index < 5 && <div className="w-4 sm:w-8 h-0.5 bg-gray-200 ml-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* 프로젝트 리스트 */}
      <div className="space-y-3">
        {filteredProjects.map((project) => {
          const client = clients.find(c => c.id === project.client_id);
          return (
            <div 
              key={project.id} 
              className="bg-bg-secondary rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Typography variant="body1" className="font-medium text-txt-primary">
                    {project.name}
                  </Typography>
                  <Typography variant="caption" className="text-txt-secondary">
                    {client?.company || '클라이언트 미지정'}
                  </Typography>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  project.status === 'completed' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {project.status === 'in_progress' ? '진행중' :
                   project.status === 'completed' ? '완료' : '대기'}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-txt-tertiary">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {project.due_date ? new Date(project.due_date).toLocaleDateString('ko-KR') : '마감일 없음'}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {((project.budget_estimated || 0) / 10000).toLocaleString()}만원
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {project.progress || 0}%
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="mt-3">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-weave-primary transition-all duration-300"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-txt-tertiary mx-auto mb-4" />
          <Typography variant="body1" className="text-txt-secondary">
            등록된 프로젝트가 없습니다
          </Typography>
        </div>
      )}
    </div>
  );
}

// 견적서 탭
function QuotationsTab({ quotations, projects, onOpenAIModal }: { quotations: any[], projects: Project[], onOpenAIModal: (type: 'quotation') => void }) {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4" className="text-txt-primary">
          견적서 관리
        </Typography>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenAIModal('quotation')}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          AI 견적서 생성
        </Button>
      </div>
      
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-txt-tertiary mx-auto mb-4" />
        <Typography variant="body1" className="text-txt-secondary mb-2">
          견적서 기능 준비중
        </Typography>
        <Typography variant="caption" className="text-txt-tertiary">
          AI 기반 견적서 자동 생성 기능이 곧 제공됩니다
        </Typography>
      </div>
    </div>
  );
}

// 계약서 탭
function ContractsTab({ contracts, projects, onOpenAIModal }: { contracts: any[], projects: Project[], onOpenAIModal: (type: 'contract') => void }) {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4" className="text-txt-primary">
          계약서 관리
        </Typography>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenAIModal('contract')}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          AI 계약서 생성
        </Button>
      </div>
      
      <div className="text-center py-12">
        <FileSignature className="w-12 h-12 text-txt-tertiary mx-auto mb-4" />
        <Typography variant="body1" className="text-txt-secondary mb-2">
          계약서 기능 준비중
        </Typography>
        <Typography variant="caption" className="text-txt-tertiary">
          전자서명 기반 계약 관리 기능이 곧 제공됩니다
        </Typography>
      </div>
    </div>
  );
}

// 청구/정산 탭 (인보이스와 결제 통합)
function BillingTab({ invoices, projects, onOpenAIModal }: { invoices: Invoice[], projects: Project[], onOpenAIModal: (type: 'invoice') => void }) {
  const router = useRouter();
  
  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4" className="text-txt-primary">
          청구 및 정산 관리
        </Typography>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenAIModal('invoice')}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          AI 청구서 생성
        </Button>
      </div>

      {/* 청구 현황 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-bg-secondary rounded-lg p-3">
          <Typography variant="caption" className="text-txt-tertiary">
            총 청구액
          </Typography>
          <Typography variant="h4" className="text-txt-primary">
            {(invoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / 10000).toLocaleString()}만원
          </Typography>
        </div>
        <div className="bg-bg-secondary rounded-lg p-3">
          <Typography variant="caption" className="text-txt-tertiary">
            입금 완료
          </Typography>
          <Typography variant="h4" className="text-green-600">
            {(invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0) / 10000).toLocaleString()}만원
          </Typography>
        </div>
        <div className="bg-bg-secondary rounded-lg p-3">
          <Typography variant="caption" className="text-txt-tertiary">
            미수금
          </Typography>
          <Typography variant="h4" className="text-orange-600">
            {(invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0) / 10000).toLocaleString()}만원
          </Typography>
        </div>
        <div className="bg-bg-secondary rounded-lg p-3">
          <Typography variant="caption" className="text-txt-tertiary">
            연체
          </Typography>
          <Typography variant="h4" className="text-red-600">
            {invoices.filter(inv => {
              if (!inv.due_date || inv.status === 'paid') return false;
              return new Date(inv.due_date) < new Date();
            }).length}건
          </Typography>
        </div>
      </div>

      {/* 청구서 목록 */}
      <div className="space-y-3">
        {invoices.map((invoice) => {
          const project = projects.find(p => p.id === invoice.project_id);
          const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';
          
          return (
            <div 
              key={invoice.id} 
              className={`bg-bg-secondary rounded-lg p-4 border ${
                isOverdue ? 'border-red-200' : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Typography variant="body1" className="font-medium text-txt-primary">
                    {invoice.invoice_number}
                  </Typography>
                  <Typography variant="caption" className="text-txt-secondary">
                    {project?.name || '프로젝트 미지정'}
                  </Typography>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                  invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                  isOverdue ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {invoice.status === 'paid' ? '입금완료' :
                   invoice.status === 'sent' ? '발송됨' :
                   isOverdue ? '연체' : '대기'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-txt-tertiary">
                <div className="flex items-center gap-4">
                  <span>발행: {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('ko-KR') : '-'}</span>
                  <span>만기: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ko-KR') : '-'}</span>
                </div>
                <Typography variant="body2" className="font-medium text-txt-primary">
                  {((invoice.total || 0) / 10000).toLocaleString()}만원
                </Typography>
              </div>
            </div>
          );
        })}
      </div>

      {invoices.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-txt-tertiary mx-auto mb-4" />
          <Typography variant="body1" className="text-txt-secondary">
            청구서가 없습니다
          </Typography>
        </div>
      )}
    </div>
  );
}

// 보고서 탭
function ReportsTab({ reports, projects, onOpenAIModal }: { reports: any[], projects: Project[], onOpenAIModal: (type: 'report') => void }) {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4" className="text-txt-primary">
          보고서 관리
        </Typography>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenAIModal('report')}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          AI 보고서 생성
        </Button>
      </div>
      
      <div className="text-center py-12">
        <ChartBar className="w-12 h-12 text-txt-tertiary mx-auto mb-4" />
        <Typography variant="body1" className="text-txt-secondary mb-2">
          보고서 기능 준비중
        </Typography>
        <Typography variant="caption" className="text-txt-tertiary">
          프로젝트 진행 및 완료 보고서 기능이 곧 제공됩니다
        </Typography>
      </div>
    </div>
  );
}

// 설정 탭
function SettingsTab() {
  const [reminderSettings, setReminderSettings] = useState({
    // 알림 활성화
    enableReminders: true,
    emailNotifications: true,
    pushNotifications: false,
    
    // 리마인더 시기
    reminderTiming: '3days',
    reminderTime: '09:00',
    
    // 알림 항목
    projectDeadline: true,
    invoicePayment: true,
    taxDeadline: true,
    contractRenewal: true,
    
    // 워크플로우
    autoStatusUpdate: false,
    aiDocumentGeneration: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setReminderSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    console.log('Settings saved:', reminderSettings);
    // TODO: Supabase에 설정 저장
    alert('설정이 저장되었습니다.');
  };

  return (
    <div className="p-4 sm:p-6">
      <Typography variant="h4" className="text-txt-primary mb-6">
        프로젝트 설정
      </Typography>
      
      <div className="space-y-6">
        {/* 기본 알림 설정 */}
        <div className="bg-bg-secondary rounded-lg p-4">
          <Typography variant="body1" className="font-medium text-txt-primary mb-4">
            기본 알림 설정
          </Typography>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm text-txt-primary">자동 알림 활성화</span>
                <span className="block text-xs text-txt-tertiary mt-0.5">
                  프로젝트 관련 모든 알림을 받습니다
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderSettings.enableReminders}
                  onChange={(e) => handleSettingChange('enableReminders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-weave-primary"></div>
              </label>
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm text-txt-primary">이메일 알림</span>
                <span className="block text-xs text-txt-tertiary mt-0.5">
                  등록된 이메일로 알림을 발송합니다
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderSettings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-weave-primary"></div>
              </label>
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm text-txt-primary">푸시 알림</span>
                <span className="block text-xs text-txt-tertiary mt-0.5">
                  브라우저 푸시 알림을 받습니다
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderSettings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-weave-primary"></div>
              </label>
            </label>
          </div>
        </div>

        {/* 결제 리마인더 설정 */}
        <div className="bg-bg-secondary rounded-lg p-4">
          <Typography variant="body1" className="font-medium text-txt-primary mb-4">
            결제 리마인더 설정
          </Typography>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-txt-secondary mb-2">
                  리마인더 시기
                </label>
                <select
                  value={reminderSettings.reminderTiming}
                  onChange={(e) => handleSettingChange('reminderTiming', e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary text-sm"
                >
                  <option value="1day">1일 전</option>
                  <option value="3days">3일 전</option>
                  <option value="7days">7일 전</option>
                  <option value="14days">14일 전</option>
                  <option value="30days">30일 전</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-txt-secondary mb-2">
                  알림 시간
                </label>
                <select
                  value={reminderSettings.reminderTime}
                  onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary text-sm"
                >
                  <option value="09:00">오전 9시</option>
                  <option value="12:00">오후 12시</option>
                  <option value="15:00">오후 3시</option>
                  <option value="18:00">오후 6시</option>
                  <option value="21:00">오후 9시</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-txt-secondary mb-3">
                알림 받을 항목
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reminderSettings.projectDeadline}
                    onChange={(e) => handleSettingChange('projectDeadline', e.target.checked)}
                    className="w-4 h-4 text-weave-primary rounded focus:ring-weave-primary"
                  />
                  <span className="ml-3 text-sm text-txt-primary">프로젝트 마감일</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reminderSettings.invoicePayment}
                    onChange={(e) => handleSettingChange('invoicePayment', e.target.checked)}
                    className="w-4 h-4 text-weave-primary rounded focus:ring-weave-primary"
                  />
                  <span className="ml-3 text-sm text-txt-primary">인보이스 결제 기한</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reminderSettings.taxDeadline}
                    onChange={(e) => handleSettingChange('taxDeadline', e.target.checked)}
                    className="w-4 h-4 text-weave-primary rounded focus:ring-weave-primary"
                  />
                  <span className="ml-3 text-sm text-txt-primary">세금 신고 기한</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reminderSettings.contractRenewal}
                    onChange={(e) => handleSettingChange('contractRenewal', e.target.checked)}
                    className="w-4 h-4 text-weave-primary rounded focus:ring-weave-primary"
                  />
                  <span className="ml-3 text-sm text-txt-primary">계약 갱신 알림</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 워크플로우 설정 */}
        <div className="bg-bg-secondary rounded-lg p-4">
          <Typography variant="body1" className="font-medium text-txt-primary mb-4">
            워크플로우 설정
          </Typography>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm text-txt-primary">자동 상태 업데이트</span>
                <span className="block text-xs text-txt-tertiary mt-0.5">
                  프로젝트 진행 상태를 자동으로 업데이트합니다
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderSettings.autoStatusUpdate}
                  onChange={(e) => handleSettingChange('autoStatusUpdate', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-weave-primary"></div>
              </label>
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm text-txt-primary">AI 문서 생성</span>
                <span className="block text-xs text-txt-tertiary mt-0.5">
                  AI를 활용한 문서 자동 생성 기능을 사용합니다
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderSettings.aiDocumentGeneration}
                  onChange={(e) => handleSettingChange('aiDocumentGeneration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-weave-primary"></div>
              </label>
            </label>
          </div>
        </div>

        {/* 템플릿 관리 */}
        <div className="bg-bg-secondary rounded-lg p-4">
          <Typography variant="body1" className="font-medium text-txt-primary mb-3">
            템플릿 관리
          </Typography>
          <Typography variant="caption" className="text-txt-tertiary block mb-3">
            프로젝트에서 사용할 문서 템플릿을 관리합니다
          </Typography>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              템플릿 설정
            </Button>
            <Button variant="outline" size="sm">
              템플릿 가져오기
            </Button>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end pt-4">
          <Button 
            variant="primary"
            onClick={handleSaveSettings}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            설정 저장
          </Button>
        </div>
      </div>
    </div>
  );
}