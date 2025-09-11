'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Link2,
  Unlink,
  Search,
  Building,
  Briefcase
} from 'lucide-react';
import type { MatchingResult, Client, Project } from '@/lib/services/supabase/project-matching.service';
import { 
  fetchClients, 
  fetchProjects,
  linkTransactionToProject,
  unlinkTransactionFromProject
} from '@/lib/services/supabase/project-matching.service';

interface MatchingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchingResult: MatchingResult;
  onConfirm?: () => void;
  onReject?: () => void;
}

export default function MatchingConfirmationModal({
  isOpen,
  onClose,
  matchingResult,
  onConfirm,
  onReject
}: MatchingConfirmationModalProps) {
  const [manualMode, setManualMode] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && manualMode) {
      loadClients();
    }
  }, [isOpen, manualMode]);

  useEffect(() => {
    if (selectedClient) {
      loadProjects(selectedClient.id);
    }
  }, [selectedClient]);

  const loadClients = async () => {
    try {
      const data = await fetchClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const loadProjects = async (clientId: string) => {
    try {
      const data = await fetchProjects(clientId);
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (manualMode && selectedProject) {
        // 수동 선택 모드
        await linkTransactionToProject(
          matchingResult.transaction.id,
          selectedProject.id,
          selectedClient?.id
        );
      } else if (matchingResult.suggestedProject) {
        // 자동 매칭 확인
        await linkTransactionToProject(
          matchingResult.transaction.id,
          matchingResult.suggestedProject.id,
          matchingResult.suggestedClient?.id
        );
      }
      onConfirm?.();
      onClose();
    } catch (error) {
      console.error('Failed to link transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      await unlinkTransactionFromProject(matchingResult.transaction.id);
      onReject?.();
      onClose();
    } catch (error) {
      console.error('Failed to unlink transaction:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-700 border-green-300';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (confidence >= 0.4) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.business_number?.includes(searchTerm)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-border-light flex items-center justify-between">
          <div>
            <Typography variant="h3" className="text-lg font-semibold mb-1">
              프로젝트 매칭 확인
            </Typography>
            <Typography variant="body2" className="text-txt-secondary">
              거래를 프로젝트와 연결합니다
            </Typography>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-txt-tertiary" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* 거래 정보 */}
          <div className="mb-6 p-4 bg-bg-secondary rounded-lg">
            <Typography variant="h4" className="text-sm font-medium mb-3">
              거래 정보
            </Typography>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-txt-secondary">날짜</span>
                <span className="text-txt-primary">
                  {new Date(matchingResult.transaction.transaction_date).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">거래처</span>
                <span className="text-txt-primary font-medium">
                  {matchingResult.transaction.supplier_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">금액</span>
                <span className="text-txt-primary">
                  {Number(matchingResult.transaction.total_amount).toLocaleString('ko-KR')}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">구분</span>
                <span className={`text-txt-primary font-medium ${
                  matchingResult.transaction.transaction_type === '매출' 
                    ? 'text-blue-600' 
                    : 'text-red-600'
                }`}>
                  {matchingResult.transaction.transaction_type}
                </span>
              </div>
            </div>
          </div>

          {!manualMode ? (
            <>
              {/* 자동 매칭 결과 */}
              {matchingResult.suggestedProject ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Typography variant="h4" className="text-sm font-medium">
                      자동 매칭 결과
                    </Typography>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(matchingResult.confidence)}`}>
                      신뢰도 {Math.round(matchingResult.confidence * 100)}%
                    </div>
                  </div>

                  {/* 클라이언트 정보 */}
                  {matchingResult.suggestedClient && (
                    <div className="p-4 border border-border-light rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Building className="w-5 h-5 text-txt-tertiary" />
                        <Typography variant="body2" className="font-medium">
                          {matchingResult.suggestedClient.name}
                        </Typography>
                      </div>
                      {matchingResult.suggestedClient.business_number && (
                        <Typography variant="body2" className="text-txt-secondary text-xs ml-8">
                          사업자번호: {matchingResult.suggestedClient.business_number}
                        </Typography>
                      )}
                    </div>
                  )}

                  {/* 프로젝트 정보 */}
                  <div className="p-4 border border-weave-primary-light bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="w-5 h-5 text-weave-primary" />
                      <Typography variant="body2" className="font-medium text-weave-primary">
                        {matchingResult.suggestedProject.name}
                      </Typography>
                    </div>
                    <div className="ml-8 space-y-1">
                      <Typography variant="body2" className="text-txt-secondary text-xs">
                        상태: {matchingResult.suggestedProject.status === 'in_progress' ? '진행중' : 
                               matchingResult.suggestedProject.status === 'completed' ? '완료' : 
                               matchingResult.suggestedProject.status === 'planning' ? '계획중' : '취소'}
                      </Typography>
                      <Typography variant="body2" className="text-txt-secondary text-xs">
                        기간: {new Date(matchingResult.suggestedProject.start_date).toLocaleDateString('ko-KR')} 
                        {matchingResult.suggestedProject.end_date && 
                          ` ~ ${new Date(matchingResult.suggestedProject.end_date).toLocaleDateString('ko-KR')}`}
                      </Typography>
                    </div>
                  </div>

                  {/* 매칭 사유 */}
                  <div className="p-4 bg-bg-secondary rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-txt-tertiary mt-0.5" />
                      <div>
                        <Typography variant="body2" className="text-xs font-medium text-txt-secondary mb-1">
                          매칭 사유
                        </Typography>
                        <Typography variant="body2" className="text-xs text-txt-tertiary">
                          {matchingResult.reason}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-txt-tertiary mx-auto mb-3" />
                  <Typography variant="body1" className="text-txt-secondary mb-4">
                    자동 매칭된 프로젝트가 없습니다
                  </Typography>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManualMode(true)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    수동으로 선택
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* 수동 선택 모드 */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Typography variant="h4" className="text-sm font-medium">
                  수동 프로젝트 선택
                </Typography>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setManualMode(false);
                    setSelectedClient(null);
                    setSelectedProject(null);
                  }}
                >
                  자동 매칭으로 돌아가기
                </Button>
              </div>

              {/* 클라이언트 검색 */}
              <div>
                <Typography variant="body2" className="text-sm font-medium mb-2">
                  1. 클라이언트 선택
                </Typography>
                <input
                  type="text"
                  placeholder="클라이언트명 또는 사업자번호 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary text-sm"
                />
                
                <div className="mt-2 max-h-32 overflow-y-auto border border-border-light rounded-lg">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full px-3 py-2 text-left hover:bg-bg-secondary transition-colors text-sm ${
                        selectedClient?.id === client.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium">{client.name}</div>
                      {client.business_number && (
                        <div className="text-xs text-txt-secondary">{client.business_number}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 프로젝트 선택 */}
              {selectedClient && (
                <div>
                  <Typography variant="body2" className="text-sm font-medium mb-2">
                    2. 프로젝트 선택
                  </Typography>
                  <div className="max-h-40 overflow-y-auto border border-border-light rounded-lg">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className={`w-full px-3 py-2 text-left hover:bg-bg-secondary transition-colors text-sm ${
                          selectedProject?.id === project.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-txt-secondary">
                          {project.status === 'in_progress' ? '진행중' : 
                           project.status === 'completed' ? '완료' : 
                           project.status === 'planning' ? '계획중' : '취소'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 선택된 프로젝트 미리보기 */}
              {selectedProject && (
                <div className="p-4 border border-weave-primary-light bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <Typography variant="body2" className="font-medium">
                      선택된 프로젝트
                    </Typography>
                  </div>
                  <div className="ml-8">
                    <Typography variant="body2" className="font-medium text-weave-primary">
                      {selectedProject.name}
                    </Typography>
                    <Typography variant="body2" className="text-xs text-txt-secondary mt-1">
                      클라이언트: {selectedClient?.name}
                    </Typography>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-border-light flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setManualMode(!manualMode)}
            disabled={loading}
          >
            {manualMode ? '자동 매칭 보기' : '수동 선택'}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={loading}
            >
              <Unlink className="w-4 h-4 mr-2" />
              연결 안함
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={loading || (manualMode && !selectedProject) || (!manualMode && !matchingResult.suggestedProject)}
            >
              <Link2 className="w-4 h-4 mr-2" />
              {manualMode ? '선택 항목 연결' : '자동 매칭 확인'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}