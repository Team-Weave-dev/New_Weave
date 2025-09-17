"use client";

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Building2, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  ChevronRight,
  Users,
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company?: string;
  totalRevenue: number;
  revenueGrowth: number; // percentage change from last period
  activeProjects: number;
  completedProjects: number;
  totalProjects: number;
  status: 'active' | 'inactive' | 'pending';
  lastContact?: Date;
  monthlyRecurring?: number;
  outstanding?: number;
}

interface Project {
  id: string;
  clientId: string;
  name: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  revenue: number;
  startDate: Date;
  endDate?: Date;
  progress: number;
}

interface ClientOverviewWidgetProps {
  onRemove?: () => void;
  onSettings?: () => void;
}

const ClientOverviewWidget: React.FC<ClientOverviewWidgetProps> = ({ 
  onRemove, 
  onSettings 
}) => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'projects' | 'name'>('revenue');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  // Mock data for clients
  const mockClients: Client[] = [
    {
      id: '1',
      name: 'John Smith',
      company: 'Tech Solutions Inc.',
      totalRevenue: 125000,
      revenueGrowth: 15.5,
      activeProjects: 2,
      completedProjects: 5,
      totalProjects: 7,
      status: 'active',
      lastContact: new Date(2024, 11, 10),
      monthlyRecurring: 5000,
      outstanding: 12000
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      company: 'Digital Marketing Co.',
      totalRevenue: 87500,
      revenueGrowth: -5.2,
      activeProjects: 1,
      completedProjects: 3,
      totalProjects: 4,
      status: 'active',
      lastContact: new Date(2024, 11, 12),
      monthlyRecurring: 3500,
      outstanding: 0
    },
    {
      id: '3',
      name: 'Mike Davis',
      company: 'E-commerce Masters',
      totalRevenue: 62000,
      revenueGrowth: 8.3,
      activeProjects: 3,
      completedProjects: 2,
      totalProjects: 5,
      status: 'active',
      lastContact: new Date(2024, 11, 8),
      monthlyRecurring: 2500,
      outstanding: 5000
    },
    {
      id: '4',
      name: 'Emily Chen',
      company: 'Design Studio Pro',
      totalRevenue: 45000,
      revenueGrowth: 22.1,
      activeProjects: 1,
      completedProjects: 8,
      totalProjects: 9,
      status: 'active',
      lastContact: new Date(2024, 11, 15),
      monthlyRecurring: 0,
      outstanding: 3000
    },
    {
      id: '5',
      name: 'Robert Wilson',
      company: undefined,
      totalRevenue: 15000,
      revenueGrowth: 0,
      activeProjects: 0,
      completedProjects: 2,
      totalProjects: 2,
      status: 'inactive',
      lastContact: new Date(2024, 10, 20),
      monthlyRecurring: 0,
      outstanding: 0
    }
  ];

  // Mock data for projects
  const mockProjects: Project[] = [
    { id: '1', clientId: '1', name: 'Website Redesign', status: 'active', revenue: 25000, startDate: new Date(2024, 10, 1), progress: 65 },
    { id: '2', clientId: '1', name: 'Mobile App Development', status: 'active', revenue: 45000, startDate: new Date(2024, 9, 15), progress: 40 },
    { id: '3', clientId: '2', name: 'SEO Campaign', status: 'active', revenue: 15000, startDate: new Date(2024, 11, 1), progress: 20 },
    { id: '4', clientId: '3', name: 'E-commerce Platform', status: 'active', revenue: 35000, startDate: new Date(2024, 8, 1), progress: 80 },
    { id: '5', clientId: '3', name: 'Payment Integration', status: 'active', revenue: 12000, startDate: new Date(2024, 11, 5), progress: 15 },
    { id: '6', clientId: '3', name: 'Analytics Dashboard', status: 'active', revenue: 8000, startDate: new Date(2024, 11, 10), progress: 5 },
    { id: '7', clientId: '4', name: 'Brand Identity', status: 'active', revenue: 18000, startDate: new Date(2024, 10, 20), progress: 55 },
  ];

  // Calculate summary statistics
  const summary = useMemo(() => {
    const activeClients = mockClients.filter(c => c.status === 'active');
    const totalRevenue = mockClients.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalOutstanding = mockClients.reduce((sum, c) => sum + (c.outstanding || 0), 0);
    const totalRecurring = mockClients.reduce((sum, c) => sum + (c.monthlyRecurring || 0), 0);
    const activeProjects = mockClients.reduce((sum, c) => sum + c.activeProjects, 0);

    return {
      totalClients: mockClients.length,
      activeClients: activeClients.length,
      totalRevenue,
      totalOutstanding,
      totalRecurring,
      activeProjects,
      avgRevenuePerClient: totalRevenue / mockClients.length
    };
  }, []);

  // Filter and sort clients
  const processedClients = useMemo(() => {
    let filtered = mockClients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => client.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'projects':
          return b.activeProjects - a.activeProjects;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, filterStatus, sortBy]);

  // Get projects for selected client
  const clientProjects = selectedClient 
    ? mockProjects.filter(p => p.clientId === selectedClient)
    : [];

  const selectedClientData = selectedClient 
    ? mockClients.find(c => c.id === selectedClient)
    : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-[var(--color-status-success)]';
      case 'inactive':
        return 'text-[var(--color-text-secondary)]';
      case 'pending':
        return 'text-[var(--color-status-warning)]';
      case 'on-hold':
        return 'text-[var(--color-status-warning)]';
      case 'completed':
        return 'text-[var(--color-status-info)]';
      case 'cancelled':
        return 'text-[var(--color-status-error)]';
      default:
        return 'text-[var(--color-text-secondary)]';
    }
  };

  return (
    <Card className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <Typography variant="h6" className="font-semibold">
              고객 현황
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="w-8 h-8 p-0"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                전체 고객
              </Typography>
              <Users className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </div>
            <Typography variant="h6" className="font-bold text-[var(--color-text-primary)]">
              {summary.totalClients}
            </Typography>
            <Typography variant="caption" className="text-[var(--color-status-success)]">
              {summary.activeClients} 활성
            </Typography>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                총 매출
              </Typography>
              <DollarSign className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </div>
            <Typography variant="h6" className="font-bold text-[var(--color-text-primary)]">
              {formatCurrency(summary.totalRevenue)}
            </Typography>
            <Typography variant="caption" className="text-[var(--color-text-secondary)]">
              평균 {formatCurrency(summary.avgRevenuePerClient)}
            </Typography>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                진행 프로젝트
              </Typography>
              <FolderOpen className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </div>
            <Typography variant="h6" className="font-bold text-[var(--color-text-primary)]">
              {summary.activeProjects}
            </Typography>
            <Typography variant="caption" className="text-[var(--color-text-secondary)]">
              진행 중
            </Typography>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                미수금
              </Typography>
              <AlertCircle className="w-4 h-4 text-[var(--color-status-warning)]" />
            </div>
            <Typography variant="h6" className="font-bold text-[var(--color-status-warning)]">
              {formatCurrency(summary.totalOutstanding)}
            </Typography>
            <Typography variant="caption" className="text-[var(--color-text-secondary)]">
              대기 중
            </Typography>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="고객 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            >
              <option value="revenue">매출순</option>
              <option value="projects">프로젝트순</option>
              <option value="name">이름순</option>
            </select>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-[var(--color-brand-primary)] text-white' : 'bg-white'}`}
              >
                목록
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 ${viewMode === 'cards' ? 'bg-[var(--color-brand-primary)] text-white' : 'bg-white'}`}
              >
                카드
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {!selectedClient ? (
          // Client List/Cards View
          viewMode === 'list' ? (
            <div className="space-y-2">
              {processedClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client.id)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Typography variant="body1" className="font-medium">
                          {client.name}
                        </Typography>
                        {client.company && (
                          <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                            ({client.company})
                          </Typography>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {client.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                          매출: {formatCurrency(client.totalRevenue)}
                        </Typography>
                        <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                          프로젝트: {client.activeProjects}/{client.totalProjects}
                        </Typography>
                        {client.revenueGrowth !== 0 && (
                          <div className="flex items-center gap-1">
                            {client.revenueGrowth > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-[var(--color-status-success)]" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-[var(--color-status-error)]" />
                            )}
                            <Typography 
                              variant="caption" 
                              className={client.revenueGrowth > 0 ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'}
                            >
                              {Math.abs(client.revenueGrowth)}%
                            </Typography>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Cards View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Typography variant="body1" className="font-medium">
                        {client.name}
                      </Typography>
                      {client.company && (
                        <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                          {client.company}
                        </Typography>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {client.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        총 매출
                      </Typography>
                      <Typography variant="caption" className="font-medium">
                        {formatCurrency(client.totalRevenue)}
                      </Typography>
                    </div>
                    <div className="flex justify-between">
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        진행 프로젝트
                      </Typography>
                      <Typography variant="caption" className="font-medium">
                        {client.activeProjects}개
                      </Typography>
                    </div>
                    {client.monthlyRecurring > 0 && (
                      <div className="flex justify-between">
                        <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                          월 구독
                        </Typography>
                        <Typography variant="caption" className="font-medium">
                          {formatCurrency(client.monthlyRecurring)}
                        </Typography>
                      </div>
                    )}
                    {client.outstanding > 0 && (
                      <div className="flex justify-between">
                        <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                          미수금
                        </Typography>
                        <Typography variant="caption" className="font-medium text-[var(--color-status-warning)]">
                          {formatCurrency(client.outstanding)}
                        </Typography>
                      </div>
                    )}
                  </div>

                  {client.revenueGrowth !== 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                          성장률
                        </Typography>
                        <div className="flex items-center gap-1">
                          {client.revenueGrowth > 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-[var(--color-status-success)]" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-[var(--color-status-error)]" />
                          )}
                          <Typography 
                            variant="body2" 
                            className={`font-medium ${
                              client.revenueGrowth > 0 ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'
                            }`}
                          >
                            {Math.abs(client.revenueGrowth)}%
                          </Typography>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          // Client Detail View
          <div>
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedClient(null)}
                className="gap-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                뒤로
              </Button>
            </div>

            {selectedClientData && (
              <div className="space-y-4">
                {/* Client Header */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <Typography variant="h5" className="font-bold mb-1">
                        {selectedClientData.name}
                      </Typography>
                      {selectedClientData.company && (
                        <Typography variant="body2" className="text-[var(--color-text-secondary)] mb-2">
                          {selectedClientData.company}
                        </Typography>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedClientData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedClientData.status === 'active' ? '활성 고객' : '비활성 고객'}
                      </span>
                    </div>
                    <div className="text-right">
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        마지막 연락
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {selectedClientData.lastContact ? formatDate(selectedClientData.lastContact) : 'N/A'}
                      </Typography>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div>
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        총 매출
                      </Typography>
                      <Typography variant="body1" className="font-bold">
                        {formatCurrency(selectedClientData.totalRevenue)}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        월 구독
                      </Typography>
                      <Typography variant="body1" className="font-bold">
                        {formatCurrency(selectedClientData.monthlyRecurring || 0)}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        미수금
                      </Typography>
                      <Typography variant="body1" className="font-bold text-[var(--color-status-warning)]">
                        {formatCurrency(selectedClientData.outstanding || 0)}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        성장률
                      </Typography>
                      <div className="flex items-center gap-1">
                        {selectedClientData.revenueGrowth > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-[var(--color-status-success)]" />
                        ) : selectedClientData.revenueGrowth < 0 ? (
                          <ArrowDownRight className="w-4 h-4 text-[var(--color-status-error)]" />
                        ) : null}
                        <Typography 
                          variant="body1" 
                          className={`font-bold ${
                            selectedClientData.revenueGrowth > 0 
                              ? 'text-[var(--color-status-success)]' 
                              : selectedClientData.revenueGrowth < 0
                              ? 'text-[var(--color-status-error)]'
                              : ''
                          }`}
                        >
                          {selectedClientData.revenueGrowth > 0 ? '+' : ''}{selectedClientData.revenueGrowth}%
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Projects Section */}
                <div>
                  <Typography variant="h6" className="font-semibold mb-3">
                    프로젝트 ({clientProjects.length})
                  </Typography>
                  <div className="space-y-2">
                    {clientProjects.map((project) => (
                      <div key={project.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Typography variant="body1" className="font-medium">
                            {project.name}
                          </Typography>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                            {project.status === 'active' ? '진행중' : 
                             project.status === 'completed' ? '완료' :
                             project.status === 'on-hold' ? '대기' : '취소'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                            시작일: {formatDate(project.startDate)}
                          </Typography>
                          <Typography variant="caption" className="font-medium">
                            {formatCurrency(project.revenue)}
                          </Typography>
                        </div>
                        {project.status === 'active' && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                                진행률
                              </Typography>
                              <Typography variant="caption" className="font-medium">
                                {project.progress}%
                              </Typography>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[var(--color-brand-primary)] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ClientOverviewWidget;