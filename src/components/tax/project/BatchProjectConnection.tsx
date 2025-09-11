'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Link2, 
  Loader2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { 
  batchAutoMatch,
  linkTransactionToProject,
  type MatchingResult
} from '@/lib/services/supabase/project-matching.service';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';

interface BatchProjectConnectionProps {
  transactions: Transaction[];
  onComplete?: () => void;
}

interface MatchingStats {
  total: number;
  exact: number;
  fuzzy: number;
  date_amount: number;
  none: number;
  avgConfidence: number;
}

export default function BatchProjectConnection({
  transactions,
  onComplete
}: BatchProjectConnectionProps) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<MatchingResult[]>([]);
  const [stats, setStats] = useState<MatchingStats | null>(null);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'idle' | 'matched' | 'connecting' | 'completed'>('idle');

  // 일괄 매칭 실행
  const handleBatchMatch = async () => {
    setLoading(true);
    setCurrentStep('matched');
    
    try {
      const matchResults = await batchAutoMatch(transactions);
      setResults(matchResults);
      
      // 통계 계산
      const statistics: MatchingStats = {
        total: matchResults.length,
        exact: matchResults.filter(r => r.matchType === 'exact').length,
        fuzzy: matchResults.filter(r => r.matchType === 'fuzzy').length,
        date_amount: matchResults.filter(r => r.matchType === 'date_amount').length,
        none: matchResults.filter(r => r.matchType === 'none').length,
        avgConfidence: matchResults.reduce((sum, r) => sum + r.confidence, 0) / matchResults.length
      };
      
      setStats(statistics);
      
      // 신뢰도 70% 이상인 항목 자동 선택
      const autoSelected = matchResults
        .filter(r => r.confidence >= 0.7 && r.suggestedProject)
        .map(r => r.transaction.id);
      setSelectedResults(autoSelected);
      
    } catch (error) {
      console.error('Batch matching failed:', error);
      setCurrentStep('idle');
    } finally {
      setLoading(false);
    }
  };

  // 선택된 항목 연결
  const handleConnect = async () => {
    setProcessing(true);
    setCurrentStep('connecting');
    
    try {
      const connectPromises = results
        .filter(r => selectedResults.includes(r.transaction.id) && r.suggestedProject)
        .map(r => 
          linkTransactionToProject(
            r.transaction.id,
            r.suggestedProject!.id,
            r.suggestedClient?.id
          )
        );
      
      await Promise.all(connectPromises);
      setCurrentStep('completed');
      
      setTimeout(() => {
        onComplete?.();
      }, 1500);
      
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  // 개별 선택 토글
  const toggleSelection = (transactionId: string) => {
    setSelectedResults(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedResults.length === results.filter(r => r.suggestedProject).length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(
        results
          .filter(r => r.suggestedProject)
          .map(r => r.transaction.id)
      );
    }
  };

  // 신뢰도에 따른 색상
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-700 border-green-300';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (confidence >= 0.4) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  if (currentStep === 'completed') {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
          <Typography variant="h3" className="text-lg font-semibold mb-2">
            프로젝트 연결 완료
          </Typography>
          <Typography variant="body2" className="text-txt-secondary">
            {selectedResults.length}개 거래가 프로젝트에 연결되었습니다
          </Typography>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h3" className="text-lg font-semibold mb-1">
              일괄 프로젝트 연결
            </Typography>
            <Typography variant="body2" className="text-txt-secondary">
              {transactions.length}개 거래를 프로젝트와 자동으로 연결합니다
            </Typography>
          </div>
          
          {currentStep === 'idle' && (
            <Button
              variant="primary"
              onClick={handleBatchMatch}
              disabled={loading || transactions.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  매칭 중...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  자동 매칭 시작
                </>
              )}
            </Button>
          )}
        </div>

        {/* 통계 */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="text-center p-3 bg-bg-secondary rounded-lg">
              <Typography variant="h4" className="text-2xl font-bold text-txt-primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" className="text-txt-secondary">
                전체
              </Typography>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Typography variant="h4" className="text-2xl font-bold text-green-700">
                {stats.exact}
              </Typography>
              <Typography variant="body2" className="text-green-600">
                정확 일치
              </Typography>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Typography variant="h4" className="text-2xl font-bold text-yellow-700">
                {stats.fuzzy}
              </Typography>
              <Typography variant="body2" className="text-yellow-600">
                유사 일치
              </Typography>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Typography variant="h4" className="text-2xl font-bold text-orange-700">
                {stats.date_amount}
              </Typography>
              <Typography variant="body2" className="text-orange-600">
                날짜/금액
              </Typography>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Typography variant="h4" className="text-2xl font-bold text-gray-700">
                {stats.none}
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                미매칭
              </Typography>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Typography variant="h4" className="text-2xl font-bold text-blue-700">
                {Math.round(stats.avgConfidence * 100)}%
              </Typography>
              <Typography variant="body2" className="text-blue-600">
                평균 신뢰도
              </Typography>
            </div>
          </div>
        )}

        {/* 매칭 결과 목록 */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography variant="h4" className="text-sm font-medium">
                매칭 결과 ({selectedResults.length}/{results.filter(r => r.suggestedProject).length} 선택됨)
              </Typography>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
              >
                {selectedResults.length === results.filter(r => r.suggestedProject).length 
                  ? '전체 해제' 
                  : '전체 선택'}
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 border border-border-light rounded-lg p-3">
              {results.map((result) => (
                <div
                  key={result.transaction.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.suggestedProject 
                      ? 'bg-white hover:bg-bg-secondary cursor-pointer' 
                      : 'bg-gray-50 opacity-60'
                  }`}
                  onClick={() => result.suggestedProject && toggleSelection(result.transaction.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {result.suggestedProject && (
                      <input
                        type="checkbox"
                        checked={selectedResults.includes(result.transaction.id)}
                        onChange={() => toggleSelection(result.transaction.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-weave-primary rounded border-gray-300 focus:ring-weave-primary"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Typography variant="body2" className="font-medium">
                          {result.transaction.supplier_name}
                        </Typography>
                        {result.matchType === 'exact' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {result.matchType === 'fuzzy' && (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      
                      {result.suggestedProject ? (
                        <div className="text-xs text-txt-secondary mt-1">
                          <span className="font-medium">→</span> {result.suggestedClient?.name} / {result.suggestedProject.name}
                        </div>
                      ) : (
                        <div className="text-xs text-txt-tertiary mt-1">
                          매칭되는 프로젝트 없음
                        </div>
                      )}
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
                      {Math.round(result.confidence * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Typography variant="body2" className="text-txt-secondary">
                선택된 {selectedResults.length}개 거래를 프로젝트에 연결합니다
              </Typography>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep('idle');
                    setResults([]);
                    setStats(null);
                    setSelectedResults([]);
                  }}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConnect}
                  disabled={processing || selectedResults.length === 0}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      연결 중...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      선택 항목 연결
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}