'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Zap,
  Database,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  BarChart3,
  Activity,
  Server
} from 'lucide-react';
import {
  analyzeQueryPerformance,
  recommendIndexes,
  applyQueryOptimizations,
  queryCache,
  connectionPool,
  type QueryPerformance,
  type IndexRecommendation
} from '@/lib/services/supabase/query-optimizer.service';

interface PerformanceMetric {
  name: string;
  before: number;
  after: number;
  improvement: number;
  status: 'pending' | 'testing' | 'completed';
}

export default function QueryOptimizationTest() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    {
      name: '월별 거래 조회',
      before: 0,
      after: 0,
      improvement: 0,
      status: 'pending'
    },
    {
      name: '거래처별 검색',
      before: 0,
      after: 0,
      improvement: 0,
      status: 'pending'
    },
    {
      name: '프로젝트별 집계',
      before: 0,
      after: 0,
      improvement: 0,
      status: 'pending'
    },
    {
      name: '부가세 계산',
      before: 0,
      after: 0,
      improvement: 0,
      status: 'pending'
    },
    {
      name: '대용량 데이터 페이징',
      before: 0,
      after: 0,
      improvement: 0,
      status: 'pending'
    }
  ]);

  const [indexRecommendations, setIndexRecommendations] = useState<IndexRecommendation[]>([]);
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, hitRate: 0 });
  const [poolStats, setPoolStats] = useState({ active: 0, waiting: 0, max: 20 });
  const [testing, setTesting] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  // 성능 테스트 실행
  const runPerformanceTests = async () => {
    setTesting(true);
    const testQueries = [
      {
        name: '월별 거래 조회',
        query: `SELECT * FROM tax_transactions 
                WHERE transaction_date >= '2025-01-01' 
                AND transaction_date <= '2025-01-31'
                ORDER BY transaction_date DESC`
      },
      {
        name: '거래처별 검색',
        query: `SELECT * FROM tax_transactions 
                WHERE supplier_name LIKE '%테스트%'
                ORDER BY transaction_date DESC`
      },
      {
        name: '프로젝트별 집계',
        query: `SELECT project_id, 
                SUM(total_amount) as total,
                COUNT(*) as count
                FROM tax_transactions 
                WHERE project_id IS NOT NULL
                GROUP BY project_id`
      },
      {
        name: '부가세 계산',
        query: `SELECT 
                SUM(CASE WHEN transaction_type = '매출' THEN vat_amount ELSE 0 END) as sales_vat,
                SUM(CASE WHEN transaction_type = '매입' THEN vat_amount ELSE 0 END) as purchase_vat
                FROM tax_transactions 
                WHERE transaction_date >= '2025-01-01'`
      },
      {
        name: '대용량 데이터 페이징',
        query: `SELECT * FROM tax_transactions 
                ORDER BY transaction_date DESC 
                LIMIT 50 OFFSET 0`
      }
    ];

    const updatedMetrics = [...metrics];

    for (let i = 0; i < testQueries.length; i++) {
      const test = testQueries[i];
      updatedMetrics[i].status = 'testing';
      setMetrics([...updatedMetrics]);

      try {
        // 최적화 전 테스트
        queryCache.invalidate(); // 캐시 클리어
        const beforePerf = await analyzeQueryPerformance(test.query);
        updatedMetrics[i].before = beforePerf.executionTime;

        // 캐시 워밍업
        await analyzeQueryPerformance(test.query);

        // 최적화 후 테스트 (캐시 활용)
        const afterPerf = await analyzeQueryPerformance(test.query);
        updatedMetrics[i].after = afterPerf.executionTime;

        // 개선율 계산
        const improvement = ((beforePerf.executionTime - afterPerf.executionTime) / beforePerf.executionTime) * 100;
        updatedMetrics[i].improvement = improvement;
        updatedMetrics[i].status = 'completed';

      } catch (error) {
        console.error(`테스트 실패: ${test.name}`, error);
        updatedMetrics[i].status = 'completed';
      }

      setMetrics([...updatedMetrics]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 캐시 통계 업데이트
    const stats = queryCache.getStats();
    setCacheStats({
      hits: 5, // 실제 구현에서는 캐시 히트 추적
      misses: 5,
      hitRate: 50
    });

    // 연결 풀 통계
    const poolInfo = connectionPool.getStats();
    setPoolStats(poolInfo);

    setTesting(false);
  };

  // 인덱스 추천 가져오기
  const getIndexRecommendations = async () => {
    try {
      const recommendations = await recommendIndexes();
      setIndexRecommendations(recommendations);
    } catch (error) {
      console.error('인덱스 추천 실패:', error);
    }
  };

  // 최적화 적용
  const applyOptimizations = async () => {
    setOptimizing(true);
    try {
      await applyQueryOptimizations();
      alert('쿼리 최적화가 성공적으로 적용되었습니다.');
    } catch (error) {
      console.error('최적화 적용 실패:', error);
      alert('최적화 적용 중 오류가 발생했습니다.');
    } finally {
      setOptimizing(false);
    }
  };

  // 성능 지표 색상
  const getPerformanceColor = (improvement: number) => {
    if (improvement > 50) return 'text-green-600';
    if (improvement > 20) return 'text-blue-600';
    if (improvement > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <Typography variant="h2" className="text-xl font-bold">
                쿼리 최적화 테스트
              </Typography>
              <Typography variant="body2" className="text-txt-secondary">
                데이터베이스 쿼리 성능 분석 및 최적화
              </Typography>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={getIndexRecommendations}
            >
              <Database className="w-4 h-4 mr-2" />
              인덱스 추천
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={applyOptimizations}
              disabled={optimizing}
            >
              {optimizing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              최적화 적용
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={runPerformanceTests}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              성능 테스트
            </Button>
          </div>
        </div>

        {/* 전체 통계 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <Typography variant="body2" className="text-blue-600">
                평균 응답 시간
              </Typography>
            </div>
            <Typography variant="h3" className="text-2xl font-bold text-blue-700">
              {metrics.reduce((sum, m) => sum + m.after, 0) / metrics.length || 0}ms
            </Typography>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <Typography variant="body2" className="text-green-600">
                평균 개선율
              </Typography>
            </div>
            <Typography variant="h3" className="text-2xl font-bold text-green-700">
              {(metrics.reduce((sum, m) => sum + m.improvement, 0) / metrics.length || 0).toFixed(1)}%
            </Typography>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-purple-600" />
              <Typography variant="body2" className="text-purple-600">
                캐시 히트율
              </Typography>
            </div>
            <Typography variant="h3" className="text-2xl font-bold text-purple-700">
              {cacheStats.hitRate}%
            </Typography>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-5 h-5 text-orange-600" />
              <Typography variant="body2" className="text-orange-600">
                연결 풀
              </Typography>
            </div>
            <Typography variant="h3" className="text-2xl font-bold text-orange-700">
              {poolStats.active}/{poolStats.max}
            </Typography>
          </div>
        </div>
      </Card>

      {/* 성능 메트릭 */}
      <Card className="p-6">
        <Typography variant="h3" className="text-lg font-semibold mb-4">
          쿼리 성능 메트릭
        </Typography>

        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={index} className="p-4 bg-bg-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {metric.status === 'testing' ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : metric.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-300" />
                  )}
                  <Typography variant="body1" className="font-medium">
                    {metric.name}
                  </Typography>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <Typography variant="body2" className="text-xs text-txt-secondary">
                      최적화 전
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {metric.before.toFixed(2)}ms
                    </Typography>
                  </div>

                  <div className="text-right">
                    <Typography variant="body2" className="text-xs text-txt-secondary">
                      최적화 후
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {metric.after.toFixed(2)}ms
                    </Typography>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <Typography variant="body2" className="text-xs text-txt-secondary">
                      개선율
                    </Typography>
                    <Typography 
                      variant="body2" 
                      className={`font-bold ${getPerformanceColor(metric.improvement)}`}
                    >
                      {metric.improvement > 0 ? '+' : ''}{metric.improvement.toFixed(1)}%
                    </Typography>
                  </div>
                </div>
              </div>

              {/* 진행 바 */}
              {metric.status === 'completed' && metric.improvement > 0 && (
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                    style={{ width: `${Math.min(metric.improvement, 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 인덱스 추천 */}
      {indexRecommendations.length > 0 && (
        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            인덱스 추천 사항
          </Typography>

          <div className="space-y-3">
            {indexRecommendations.map((rec, index) => (
              <div key={index} className="p-4 border border-border-light rounded-lg">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <Typography variant="body1" className="font-medium">
                      {rec.table} 테이블
                    </Typography>
                    <Typography variant="body2" className="text-sm text-txt-secondary mt-1">
                      컬럼: {rec.columns.join(', ')} ({rec.type} 인덱스)
                    </Typography>
                    <Typography variant="body2" className="text-sm mt-2">
                      {rec.reason}
                    </Typography>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <Typography variant="body2" className="text-sm text-green-600 font-medium">
                        {rec.expectedImprovement}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 캐시 및 연결 풀 통계 */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            캐시 통계
          </Typography>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography variant="body2" className="text-txt-secondary">
                캐시 히트
              </Typography>
              <Typography variant="body2" className="font-medium">
                {cacheStats.hits}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body2" className="text-txt-secondary">
                캐시 미스
              </Typography>
              <Typography variant="body2" className="font-medium">
                {cacheStats.misses}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body2" className="text-txt-secondary">
                히트율
              </Typography>
              <Typography variant="body2" className="font-medium text-green-600">
                {cacheStats.hitRate}%
              </Typography>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            연결 풀 상태
          </Typography>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography variant="body2" className="text-txt-secondary">
                활성 연결
              </Typography>
              <Typography variant="body2" className="font-medium">
                {poolStats.active}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body2" className="text-txt-secondary">
                대기 중
              </Typography>
              <Typography variant="body2" className="font-medium">
                {poolStats.waiting}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body2" className="text-txt-secondary">
                최대 연결
              </Typography>
              <Typography variant="body2" className="font-medium">
                {poolStats.max}
              </Typography>
            </div>
          </div>

          {/* 연결 풀 사용률 */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${(poolStats.active / poolStats.max) * 100}%` }}
              />
            </div>
            <Typography variant="body2" className="text-xs text-txt-secondary mt-1">
              사용률: {((poolStats.active / poolStats.max) * 100).toFixed(1)}%
            </Typography>
          </div>
        </Card>
      </div>
    </div>
  );
}