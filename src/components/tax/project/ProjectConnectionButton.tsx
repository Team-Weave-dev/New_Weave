'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Link2, Unlink, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  autoMatchTransaction,
  linkTransactionToProject,
  unlinkTransactionFromProject,
  type MatchingResult
} from '@/lib/services/supabase/project-matching.service';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';

interface ProjectConnectionButtonProps {
  transaction: Transaction;
  onConnectionChange?: () => void;
  showDetails?: boolean;
}

export default function ProjectConnectionButton({
  transaction,
  onConnectionChange,
  showDetails = false
}: ProjectConnectionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchingResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'matched' | 'connected'>('idle');

  // 자동 매칭 실행
  const handleAutoMatch = async () => {
    setLoading(true);
    try {
      const result = await autoMatchTransaction(transaction);
      setMatchResult(result);
      
      if (result.suggestedClient || result.suggestedProject) {
        setStatus('matched');
      }
    } catch (error) {
      console.error('Auto matching failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 연결
  const handleConnect = async () => {
    if (!matchResult?.suggestedProject) return;
    
    setLoading(true);
    try {
      await linkTransactionToProject(
        transaction.id,
        matchResult.suggestedProject.id,
        matchResult.suggestedClient?.id
      );
      setStatus('connected');
      onConnectionChange?.();
    } catch (error) {
      console.error('Project connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 연결 해제
  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await unlinkTransactionFromProject(transaction.id);
      setStatus('idle');
      setMatchResult(null);
      onConnectionChange?.();
    } catch (error) {
      console.error('Project disconnection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 신뢰도에 따른 색상
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 신뢰도에 따른 아이콘
  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (confidence >= 0.6) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  // 이미 연결된 경우
  if (transaction.project_id) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          프로젝트 연결됨
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={handleDisconnect}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
          연결 해제
        </Button>
      </div>
    );
  }

  // 매칭 결과가 있는 경우
  if (status === 'matched' && matchResult) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getConfidenceIcon(matchResult.confidence)}
            <span className={`text-sm ${getConfidenceColor(matchResult.confidence)}`}>
              신뢰도 {Math.round(matchResult.confidence * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="xs"
              onClick={handleConnect}
              disabled={loading || !matchResult.suggestedProject}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
              연결
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setStatus('idle');
                setMatchResult(null);
              }}
            >
              취소
            </Button>
          </div>
        </div>
        
        {showDetails && (
          <div className="text-xs text-txt-secondary space-y-1 p-2 bg-bg-secondary rounded">
            {matchResult.suggestedClient && (
              <div>
                <span className="font-medium">클라이언트:</span> {matchResult.suggestedClient.name}
              </div>
            )}
            {matchResult.suggestedProject && (
              <div>
                <span className="font-medium">프로젝트:</span> {matchResult.suggestedProject.name}
              </div>
            )}
            <div>
              <span className="font-medium">매칭 사유:</span> {matchResult.reason}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 연결 성공 상태
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          연결 완료
        </span>
      </div>
    );
  }

  // 초기 상태
  return (
    <Button
      variant="outline"
      size="xs"
      onClick={handleAutoMatch}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin mr-1" />
          매칭 중...
        </>
      ) : (
        <>
          <Link2 className="w-3 h-3 mr-1" />
          프로젝트 연결
        </>
      )}
    </Button>
  );
}