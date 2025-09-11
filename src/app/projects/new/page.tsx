'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { FormPageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import { projectsService } from '@/lib/services/supabase/projects.service';
import { clientService, type Client } from '@/lib/services/supabase/clients.service';
import { 
  FolderPlus,
  Save,
  X,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    status: 'planning' as 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    budget: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    progress: 0
  });

  // 클라이언트 목록 불러오기
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      // TODO: 실제 사용자 ID로 교체 필요
      const userId = 'system';
      const clientsData = await clientService.getClients(userId);
      setClients(clientsData);
    } catch (err) {
      console.error('Failed to load clients:', err);
      setError('클라이언트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.client_id) {
      setError('프로젝트명과 클라이언트는 필수입니다.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await projectsService.createProject({
        user_id: 'system', // TODO: 실제 사용자 ID로 교체 필요
        name: formData.name,
        description: formData.description || undefined,
        client_id: formData.client_id,
        status: formData.status as 'planning' | 'in_progress' | 'completed' | 'on_hold',
        budget_estimated: formData.budget || undefined,
        start_date: formData.start_date,
        due_date: formData.end_date || undefined
      });

      router.push('/projects');
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('프로젝트 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <FormPageContainer>
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-weave-primary-light rounded-lg">
              <FolderPlus className="w-6 h-6 text-weave-primary" />
            </div>
            <div>
              <Typography variant="h2" className="text-2xl mb-1 text-txt-primary">
                새 프로젝트 생성
              </Typography>
              <Typography variant="body1" className="text-txt-secondary">
                프로젝트 정보를 입력하고 관리를 시작하세요
              </Typography>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <Typography variant="body2" className="text-red-600">
              {error}
            </Typography>
          </div>
        )}

        {/* 프로젝트 정보 입력 폼 */}
        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 프로젝트명 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  프로젝트명 *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="프로젝트 이름을 입력하세요"
                  required
                />
              </div>

              {/* 설명 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="프로젝트에 대한 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-border-medium rounded-md focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-weave-primary"
                />
              </div>

              {/* 클라이언트 */}
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  클라이언트 *
                </label>
                {loading ? (
                  <div className="flex items-center gap-2 text-txt-tertiary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>클라이언트 목록 불러오는 중...</span>
                  </div>
                ) : (
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-medium rounded-md focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-weave-primary"
                    required
                  >
                    <option value="">클라이언트 선택</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.company} - {client.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-border-medium rounded-md focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-weave-primary"
                >
                  <option value="planning">기획</option>
                  <option value="in_progress">진행중</option>
                  <option value="review">검토</option>
                  <option value="completed">완료</option>
                  <option value="on_hold">보류</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>

              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  우선순위
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-border-medium rounded-md focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-weave-primary"
                >
                  <option value="urgent">긴급</option>
                  <option value="high">높음</option>
                  <option value="medium">보통</option>
                  <option value="low">낮음</option>
                </select>
              </div>

              {/* 예산 */}
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  예산
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                  <Input
                    type="number"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 시작일 */}
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  시작일
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 종료일 */}
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  종료일
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 진행률 */}
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  진행률 (%)
                </label>
                <Input
                  type="number"
                  value={formData.progress}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  }))}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border-light">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/projects')}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || loading}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    프로젝트 생성
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </FormPageContainer>
    </AppLayout>
  );
}