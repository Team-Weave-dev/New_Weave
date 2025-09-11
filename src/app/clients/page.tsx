'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import BusinessInfoLookup from '@/components/tax/BusinessInfoLookup';
import { BusinessInfo } from '@/lib/types/business';
import { clientService, type Client } from '@/lib/services/supabase/clients.service';
import { projectsService } from '@/lib/services/supabase/projects.service';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building, 
  Edit, 
  Trash2,
  FileText,
  X,
  Save,
  Building2,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

// 클라이언트 타입 with 통계
type ClientWithStats = Client & {
  totalProjects: number;
  totalRevenue: number;
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Client & { status?: 'active' | 'inactive' }>>({
    name: '',
    company: '',
    business_number: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    tax_type: ''
  });

  // 클라이언트 데이터 불러오기
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: 실제 사용자 ID로 교체 필요
      const userId = 'system';
      const clientsData = await clientService.getClients(userId);
      
      if (!clientsData || clientsData.length === 0) {
        setClients([]);
        return;
      }
      
      // 각 클라이언트의 프로젝트 통계 가져오기
      const clientsWithStats = await Promise.all(
        clientsData.map(async (client) => {
          try {
            const projects = await projectsService.getClientProjects(client.id);
            const totalRevenue = projects.reduce((sum, p) => sum + (p.budget_estimated || 0), 0);
            
            return {
              ...client,
              totalProjects: projects.length,
              totalRevenue
            };
          } catch (err) {
            // 프로젝트 조회 실패 시 기본값 사용
            return {
              ...client,
              totalProjects: 0,
              totalRevenue: 0
            };
          }
        })
      );
      
      setClients(clientsWithStats);
    } catch (err) {
      console.error('Failed to load clients:', err);
      setError('클라이언트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (isActive?: boolean) => {
    return isActive !== false ? 
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">활성</span> :
      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">비활성</span>;
  };

  const handleBusinessInfoFound = (businessInfo: BusinessInfo) => {
    // 사업자 정보로 폼 자동 채우기
    setFormData(prev => ({
      ...prev,
      business_number: businessInfo.b_no,
      tax_type: businessInfo.tax_type
    }));
  };

  const handleAddClient = async () => {
    if (!formData.name || !formData.company || !formData.email) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      // TODO: 실제 사용자 ID로 교체 필요
      const userId = 'system';
      const newClient = await clientService.createClient({
        user_id: userId,
        name: formData.name || '',
        company: formData.company || '',
        business_number: formData.business_number,
        email: formData.email || '',
        phone: formData.phone,
        address: formData.address,
        is_active: formData.status === 'active' || formData.status === undefined,
        tax_type: formData.tax_type
      });

      if (newClient) {
        const clientWithStats: ClientWithStats = {
          ...newClient,
          totalProjects: 0,
          totalRevenue: 0
        };

        setClients(prev => [clientWithStats, ...prev]);
      } else {
        throw new Error('Failed to create client');
      }
      setShowAddModal(false);
      setFormData({
        name: '',
        company: '',
        business_number: '',
        email: '',
        phone: '',
        address: '',
        status: 'active',
        tax_type: ''
      });
    } catch (err) {
      console.error('Failed to add client:', err);
      alert('클라이언트 추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;

    setSaving(true);
    try {
      const updatedClient = await clientService.updateClient(selectedClient.id, {
        name: formData.name,
        company: formData.company,
        business_number: formData.business_number,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        is_active: formData.status === 'active' || formData.status === undefined,
        tax_type: formData.tax_type
      });

      if (updatedClient) {
        const clientWithStats: ClientWithStats = {
          ...updatedClient,
          totalProjects: selectedClient.totalProjects,
          totalRevenue: selectedClient.totalRevenue
        };

        setClients(prev => prev.map(client => 
          client.id === selectedClient.id 
            ? clientWithStats
            : client
        ));

        setSelectedClient(clientWithStats);
        setShowEditModal(false);
      } else {
        throw new Error('Failed to update client');
      }
    } catch (err) {
      console.error('Failed to update client:', err);
      alert('클라이언트 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('정말로 이 클라이언트를 삭제하시겠습니까?')) return;

    try {
      await clientService.deleteClient(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
    } catch (err) {
      console.error('Failed to delete client:', err);
      alert('클라이언트 삭제에 실패했습니다.');
    }
  };

  const openEditModal = () => {
    if (!selectedClient) return;
    
    setFormData({
      name: selectedClient.name,
      company: selectedClient.company,
      business_number: selectedClient.business_number,
      email: selectedClient.email || '',
      phone: selectedClient.phone,
      address: selectedClient.address,
      status: selectedClient.is_active !== false ? 'active' : 'inactive',
      tax_type: selectedClient.tax_type
    });
    setShowEditModal(true);
  };

  return (
    <AppLayout>
      <div className="bg-bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 - 모바일 가로 배치 최적화 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 sm:p-3 bg-weave-primary-light rounded-lg flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-weave-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <Typography variant="h2" className="text-xl sm:text-2xl mb-0 sm:mb-1 text-txt-primary leading-tight">클라이언트 관리</Typography>
                  <Typography variant="body1" className="text-sm sm:text-base text-txt-secondary leading-tight hidden sm:block">
                    고객 정보를 관리하고 프로젝트 현황을 확인하세요
                  </Typography>
                </div>
              </div>
              <Button 
                variant="primary" 
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 flex-shrink-0"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">새 클라이언트</span>
              </Button>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-txt-tertiary w-4 h-4" />
                <Input
                  placeholder="클라이언트명, 회사명, 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 클라이언트 목록 */}
            <div className="lg:col-span-2">
              <Card className="p-0">
                <div className="p-6 border-b border-border-light">
                  <Typography variant="h3">클라이언트 목록 ({filteredClients.length})</Typography>
                </div>
                {loading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-weave-primary mx-auto mb-4" />
                    <Typography variant="body1" className="text-txt-secondary">
                      클라이언트 목록을 불러오는 중...
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
                      onClick={loadClients}
                      className="mt-4"
                    >
                      다시 시도
                    </Button>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-txt-tertiary mx-auto mb-4" />
                    <Typography variant="h4" className="mb-2">클라이언트가 없습니다</Typography>
                    <Typography variant="body1" className="text-txt-secondary">
                      새 클라이언트를 추가해주세요
                    </Typography>
                  </div>
                ) : (
                <div className="divide-y divide-border-light">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`p-6 hover:bg-bg-secondary cursor-pointer transition-colors ${
                        selectedClient?.id === client.id ? 'bg-weave-primary-light/20' : ''
                      }`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-weave-primary-light rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-weave-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Typography variant="h4">{client.name}</Typography>
                              {getStatusBadge(client.is_active)}
                            </div>
                            <div className="space-y-1 text-sm text-txt-secondary">
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                {client.company}
                              </div>
                              {client.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {client.email}
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {client.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Typography variant="h4" className="text-weave-primary">
                            {(client.totalRevenue / 10000).toLocaleString()}만원
                          </Typography>
                          <Typography variant="body2" className="text-txt-tertiary">
                            프로젝트 {client.totalProjects}건
                          </Typography>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </Card>
            </div>

            {/* 클라이언트 상세 */}
            <div className="lg:col-span-1">
              {selectedClient ? (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Typography variant="h3">클라이언트 상세</Typography>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={openEditModal}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteClient(selectedClient.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center pb-4 border-b border-border-light">
                      <div className="w-20 h-20 bg-weave-primary-light rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-10 h-10 text-weave-primary" />
                      </div>
                      <Typography variant="h3">{selectedClient.name}</Typography>
                      <Typography variant="body1" className="text-txt-secondary">{selectedClient.company}</Typography>
                    </div>

                    <div className="space-y-3">
                      {selectedClient.email && (
                        <div>
                          <Typography variant="body2" className="text-txt-tertiary">이메일</Typography>
                          <Typography variant="body1">{selectedClient.email}</Typography>
                        </div>
                      )}
                      {selectedClient.phone && (
                        <div>
                          <Typography variant="body2" className="text-txt-tertiary">전화번호</Typography>
                          <Typography variant="body1">{selectedClient.phone}</Typography>
                        </div>
                      )}
                      {selectedClient.business_number && (
                        <div>
                          <Typography variant="body2" className="text-txt-tertiary">사업자번호</Typography>
                          <Typography variant="body1">{selectedClient.business_number}</Typography>
                        </div>
                      )}
                      {selectedClient.tax_type && (
                        <div>
                          <Typography variant="body2" className="text-txt-tertiary">과세유형</Typography>
                          <Typography variant="body1">{selectedClient.tax_type}</Typography>
                        </div>
                      )}
                      {selectedClient.address && (
                        <div>
                          <Typography variant="body2" className="text-txt-tertiary">주소</Typography>
                          <Typography variant="body1">{selectedClient.address}</Typography>
                        </div>
                      )}
                      <div>
                        <Typography variant="body2" className="text-txt-tertiary">상태</Typography>
                        {getStatusBadge(selectedClient.is_active)}
                      </div>
                      <div>
                        <Typography variant="body2" className="text-txt-tertiary">등록일</Typography>
                        <Typography variant="body1">
                          {selectedClient.created_at ? 
                            new Date(selectedClient.created_at).toLocaleDateString('ko-KR') : 
                            '-'}
                        </Typography>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border-light">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <Typography variant="h3" className="text-weave-primary">
                            {selectedClient.totalProjects}
                          </Typography>
                          <Typography variant="body2" className="text-txt-tertiary">총 프로젝트</Typography>
                        </div>
                        <div className="text-center">
                          <Typography variant="h3" className="text-weave-primary">
                            {(selectedClient.totalRevenue / 10000).toLocaleString()}만원
                          </Typography>
                          <Typography variant="body2" className="text-txt-tertiary">총 매출</Typography>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        프로젝트 목록 보기
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 text-center">
                  <Users className="w-16 h-16 text-txt-tertiary mx-auto mb-4" />
                  <Typography variant="h4" className="mb-2">클라이언트를 선택해주세요</Typography>
                  <Typography variant="body1" className="text-txt-secondary">
                    좌측 목록에서 클라이언트를 클릭하면 상세 정보를 확인할 수 있습니다
                  </Typography>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 클라이언트 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border-light">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-weave-primary" />
                  <Typography variant="h3" className="text-txt-primary">
                    새 클라이언트 등록
                  </Typography>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: '',
                      company: '',
                      business_number: '',
                      email: '',
                      phone: '',
                      address: '',
                      status: 'active',
                      tax_type: ''
                    });
                  }}
                  className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-txt-tertiary" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* 사업자 조회 섹션 */}
              <div className="mb-6">
                <BusinessInfoLookup 
                  onBusinessInfoFound={handleBusinessInfoFound}
                  className="mb-6"
                />
              </div>

              {/* 클라이언트 정보 입력 폼 */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-weave-primary" />
                  <Typography variant="h4">클라이언트 정보</Typography>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-2">
                      담당자명 *
                    </label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="담당자 이름"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-2">
                      회사명 *
                    </label>
                    <Input
                      value={formData.company || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="회사 이름"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-2">
                      사업자번호
                    </label>
                    <Input
                      value={formData.business_number || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_number: e.target.value }))}
                      placeholder="123-45-67890"
                      disabled={!!formData.business_number}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-2">
                      과세유형
                    </label>
                    <Input
                      value={formData.tax_type || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax_type: e.target.value }))}
                      placeholder="일반과세자"
                      disabled={!!formData.tax_type}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-2">
                      이메일 *
                    </label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@company.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-2">
                      전화번호
                    </label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="010-1234-5678"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-txt-secondary mb-2">
                      주소
                    </label>
                    <Input
                      value={formData.address || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="서울시 강남구 테헤란로 123"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-2">
                      상태
                    </label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                      className="w-full px-3 py-2 border border-border-medium rounded-md focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-weave-primary"
                    >
                      <option value="active">활성</option>
                      <option value="inactive">비활성</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({
                        name: '',
                        company: '',
                        business_number: '',
                        email: '',
                        phone: '',
                        address: '',
                        status: 'active',
                        tax_type: ''
                      });
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAddClient}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        등록 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        등록하기
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 클라이언트 수정 모달 */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border-light">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Edit className="w-5 h-5 text-weave-primary" />
                  <Typography variant="h3" className="text-txt-primary">
                    클라이언트 정보 수정
                  </Typography>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-txt-tertiary" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-2">
                    담당자명 *
                  </label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="담당자 이름"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-2">
                    회사명 *
                  </label>
                  <Input
                    value={formData.company || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="회사 이름"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-2">
                    사업자번호
                  </label>
                  <Input
                    value={formData.business_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_number: e.target.value }))}
                    placeholder="123-45-67890"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-2">
                    과세유형
                  </label>
                  <Input
                    value={formData.tax_type || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_type: e.target.value }))}
                    placeholder="일반과세자"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-2">
                    이메일 *
                  </label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-2">
                    전화번호
                  </label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="010-1234-5678"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-txt-secondary mb-2">
                    주소
                  </label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="서울시 강남구 테헤란로 123"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-2">
                    상태
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full px-3 py-2 border border-border-medium rounded-md focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-weave-primary"
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowEditModal(false)}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEditClient}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      저장하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}