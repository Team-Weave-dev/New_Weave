'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Play,
  RefreshCcw,
  Download,
  FileText
} from 'lucide-react';
import {
  autoMatchTransaction,
  batchAutoMatch,
  linkTransactionToProject,
  fetchClients,
  fetchProjects
} from '@/lib/services/supabase/project-matching.service';
import {
  calculateProjectProfitability,
  calculateMultipleProjectsProfitability,
  getProjectProfitabilityAggregates
} from '@/lib/services/supabase/project-profitability.service';
import {
  fetchTransactionsWithPagination
} from '@/lib/services/supabase/tax-transactions.service';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  duration: number;
}

export default function ProjectIntegrationTest() {
  const [testSuite, setTestSuite] = useState<TestSuite>({
    name: '프로젝트 연동 통합 테스트',
    tests: [],
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    duration: 0
  });
  const [running, setRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  // 테스트 케이스 정의
  const testCases = [
    {
      name: '클라이언트 조회 테스트',
      fn: testClientFetch
    },
    {
      name: '프로젝트 조회 테스트',
      fn: testProjectFetch
    },
    {
      name: '거래 자동 매칭 테스트',
      fn: testAutoMatching
    },
    {
      name: '일괄 매칭 테스트',
      fn: testBatchMatching
    },
    {
      name: '프로젝트 연결 테스트',
      fn: testProjectLinking
    },
    {
      name: '수익성 계산 테스트',
      fn: testProfitabilityCalculation
    },
    {
      name: '수익성 집계 테스트',
      fn: testProfitabilityAggregates
    },
    {
      name: '성능 테스트',
      fn: testPerformance
    },
    {
      name: '데이터 일관성 테스트',
      fn: testDataConsistency
    }
  ];

  // 테스트 실행
  const runTests = async () => {
    setRunning(true);
    const results: TestResult[] = [];
    const startTime = Date.now();
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    for (const testCase of testCases) {
      setCurrentTest(testCase.name);
      
      const testStart = Date.now();
      const result: TestResult = {
        name: testCase.name,
        status: 'running',
        message: '테스트 실행 중...'
      };
      
      // 테스트 상태 업데이트
      setTestSuite(prev => ({
        ...prev,
        tests: [...results, result]
      }));

      try {
        const testResult = await testCase.fn();
        result.status = testResult.status;
        result.message = testResult.message;
        result.details = testResult.details;
        result.duration = Date.now() - testStart;

        if (result.status === 'passed') passed++;
        else if (result.status === 'failed') failed++;
        else if (result.status === 'warning') warnings++;

      } catch (error) {
        result.status = 'failed';
        result.message = `테스트 실행 중 오류: ${error}`;
        result.duration = Date.now() - testStart;
        failed++;
      }

      results.push(result);
      
      // 각 테스트 후 UI 업데이트
      setTestSuite({
        name: '프로젝트 연동 통합 테스트',
        tests: results,
        totalTests: testCases.length,
        passed,
        failed,
        warnings,
        duration: Date.now() - startTime
      });

      // 테스트 간 대기
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTest(null);
    setRunning(false);
  };

  // 테스트 함수들
  async function testClientFetch(): Promise<TestResult> {
    try {
      const clients = await fetchClients();
      
      if (clients.length > 0) {
        return {
          name: '클라이언트 조회 테스트',
          status: 'passed',
          message: `${clients.length}개 클라이언트 조회 성공`,
          details: { count: clients.length }
        };
      } else {
        return {
          name: '클라이언트 조회 테스트',
          status: 'warning',
          message: '클라이언트가 없습니다. 테스트 데이터를 추가하세요.',
          details: { count: 0 }
        };
      }
    } catch (error) {
      return {
        name: '클라이언트 조회 테스트',
        status: 'failed',
        message: `조회 실패: ${error}`,
        details: { error }
      };
    }
  }

  async function testProjectFetch(): Promise<TestResult> {
    try {
      const projects = await fetchProjects();
      
      if (projects.length > 0) {
        const activeProjects = projects.filter(p => p.status === 'in_progress');
        return {
          name: '프로젝트 조회 테스트',
          status: 'passed',
          message: `전체 ${projects.length}개, 진행중 ${activeProjects.length}개`,
          details: { 
            total: projects.length,
            active: activeProjects.length 
          }
        };
      } else {
        return {
          name: '프로젝트 조회 테스트',
          status: 'warning',
          message: '프로젝트가 없습니다. 테스트 데이터를 추가하세요.',
          details: { total: 0 }
        };
      }
    } catch (error) {
      return {
        name: '프로젝트 조회 테스트',
        status: 'failed',
        message: `조회 실패: ${error}`,
        details: { error }
      };
    }
  }

  async function testAutoMatching(): Promise<TestResult> {
    try {
      // 테스트용 거래 데이터
      const response = await fetchTransactionsWithPagination({
        pageSize: 5
      });
      
      if (response.data.length === 0) {
        return {
          name: '거래 자동 매칭 테스트',
          status: 'warning',
          message: '테스트할 거래가 없습니다.',
          details: {}
        };
      }

      const matchResults = await Promise.all(
        response.data.map(txn => autoMatchTransaction(txn))
      );

      const exactMatches = matchResults.filter(r => r.matchType === 'exact').length;
      const fuzzyMatches = matchResults.filter(r => r.matchType === 'fuzzy').length;
      const avgConfidence = matchResults.reduce((sum, r) => sum + r.confidence, 0) / matchResults.length;

      return {
        name: '거래 자동 매칭 테스트',
        status: 'passed',
        message: `정확: ${exactMatches}, 유사: ${fuzzyMatches}, 평균 신뢰도: ${(avgConfidence * 100).toFixed(1)}%`,
        details: {
          total: matchResults.length,
          exact: exactMatches,
          fuzzy: fuzzyMatches,
          avgConfidence
        }
      };
    } catch (error) {
      return {
        name: '거래 자동 매칭 테스트',
        status: 'failed',
        message: `매칭 실패: ${error}`,
        details: { error }
      };
    }
  }

  async function testBatchMatching(): Promise<TestResult> {
    try {
      const response = await fetchTransactionsWithPagination({
        pageSize: 10
      });
      
      if (response.data.length === 0) {
        return {
          name: '일괄 매칭 테스트',
          status: 'warning',
          message: '테스트할 거래가 없습니다.',
          details: {}
        };
      }

      const startTime = Date.now();
      const results = await batchAutoMatch(response.data);
      const duration = Date.now() - startTime;

      const successRate = results.filter(r => r.confidence > 0.5).length / results.length;

      return {
        name: '일괄 매칭 테스트',
        status: 'passed',
        message: `${results.length}건 처리, 성공률: ${(successRate * 100).toFixed(1)}%, 소요시간: ${duration}ms`,
        details: {
          processed: results.length,
          successRate,
          duration
        }
      };
    } catch (error) {
      return {
        name: '일괄 매칭 테스트',
        status: 'failed',
        message: `일괄 매칭 실패: ${error}`,
        details: { error }
      };
    }
  }

  async function testProjectLinking(): Promise<TestResult> {
    try {
      // 매칭 결과 중 하나를 선택하여 연결 테스트
      const response = await fetchTransactionsWithPagination({
        pageSize: 1,
        filters: { project_id: null }
      });
      
      if (response.data.length === 0) {
        return {
          name: '프로젝트 연결 테스트',
          status: 'warning',
          message: '연결 가능한 거래가 없습니다.',
          details: {}
        };
      }

      const transaction = response.data[0];
      const matchResult = await autoMatchTransaction(transaction);
      
      if (matchResult.suggestedProject) {
        await linkTransactionToProject(
          transaction.id,
          matchResult.suggestedProject.id,
          matchResult.suggestedClient?.id
        );

        return {
          name: '프로젝트 연결 테스트',
          status: 'passed',
          message: `거래를 ${matchResult.suggestedProject.name} 프로젝트에 연결 성공`,
          details: {
            transactionId: transaction.id,
            projectId: matchResult.suggestedProject.id,
            confidence: matchResult.confidence
          }
        };
      } else {
        return {
          name: '프로젝트 연결 테스트',
          status: 'warning',
          message: '매칭된 프로젝트가 없어 연결 테스트를 건너뜁니다.',
          details: {}
        };
      }
    } catch (error) {
      return {
        name: '프로젝트 연결 테스트',
        status: 'failed',
        message: `연결 실패: ${error}`,
        details: { error }
      };
    }
  }

  async function testProfitabilityCalculation(): Promise<TestResult> {
    try {
      const projects = await fetchProjects();
      
      if (projects.length === 0) {
        return {
          name: '수익성 계산 테스트',
          status: 'warning',
          message: '계산할 프로젝트가 없습니다.',
          details: {}
        };
      }

      const profitability = await calculateProjectProfitability(projects[0].id);
      
      if (profitability) {
        return {
          name: '수익성 계산 테스트',
          status: 'passed',
          message: `${profitability.projectName}: 수익 ${profitability.netProfit.toLocaleString()}원, 이익률 ${profitability.profitMargin.toFixed(1)}%`,
          details: {
            projectName: profitability.projectName,
            revenue: profitability.totalRevenue,
            expense: profitability.totalExpense,
            profit: profitability.netProfit,
            margin: profitability.profitMargin,
            roi: profitability.roi
          }
        };
      } else {
        return {
          name: '수익성 계산 테스트',
          status: 'failed',
          message: '수익성 계산 실패',
          details: {}
        };
      }
    } catch (error) {
      return {
        name: '수익성 계산 테스트',
        status: 'failed',
        message: `계산 실패: ${error}`,
        details: { error }
      };
    }
  }

  async function testProfitabilityAggregates(): Promise<TestResult> {
    try {
      const aggregates = await getProjectProfitabilityAggregates();
      
      return {
        name: '수익성 집계 테스트',
        status: 'passed',
        message: `프로젝트 ${aggregates.totalProjects}개, 총 수익 ${aggregates.totalProfit.toLocaleString()}원`,
        details: {
          totalProjects: aggregates.totalProjects,
          activeProjects: aggregates.activeProjects,
          totalRevenue: aggregates.totalRevenue,
          totalExpense: aggregates.totalExpense,
          totalProfit: aggregates.totalProfit,
          avgProfitMargin: aggregates.avgProfitMargin,
          avgROI: aggregates.avgROI
        }
      };
    } catch (error) {
      return {
        name: '수익성 집계 테스트',
        status: 'failed',
        message: `집계 실패: ${error}`,
        details: { error }
      };
    }
  }

  async function testPerformance(): Promise<TestResult> {
    try {
      const startTime = Date.now();
      
      // 병렬 처리 테스트
      const [clients, projects, transactions] = await Promise.all([
        fetchClients(),
        fetchProjects(),
        fetchTransactionsWithPagination({ pageSize: 20 })
      ]);
      
      const loadTime = Date.now() - startTime;
      
      // 매칭 성능 테스트
      const matchStart = Date.now();
      if (transactions.data.length > 0) {
        await batchAutoMatch(transactions.data.slice(0, 10));
      }
      const matchTime = Date.now() - matchStart;
      
      const totalTime = Date.now() - startTime;
      
      const performanceScore = totalTime < 3000 ? 'passed' : 
                              totalTime < 5000 ? 'warning' : 'failed';
      
      return {
        name: '성능 테스트',
        status: performanceScore as any,
        message: `총 소요시간: ${totalTime}ms (로드: ${loadTime}ms, 매칭: ${matchTime}ms)`,
        details: {
          totalTime,
          loadTime,
          matchTime,
          clientCount: clients.length,
          projectCount: projects.length,
          transactionCount: transactions.data.length
        }
      };
    } catch (error) {
      return {
        name: '성능 테스트',
        status: 'failed',
        message: `성능 테스트 실패: ${error}`,
        details: { error }
      };
    }
  }

  async function testDataConsistency(): Promise<TestResult> {
    try {
      const projects = await fetchProjects();
      const profitabilities = await calculateMultipleProjectsProfitability(
        projects.slice(0, 5).map(p => p.id)
      );
      
      let inconsistencies = 0;
      const issues: string[] = [];
      
      // 데이터 일관성 검증
      profitabilities.forEach(prof => {
        // 수익 = 매출 - 매입 검증
        const calculatedProfit = prof.totalRevenue - prof.totalExpense;
        if (Math.abs(calculatedProfit - prof.netProfit) > 0.01) {
          inconsistencies++;
          issues.push(`${prof.projectName}: 수익 계산 불일치`);
        }
        
        // 이익률 검증
        if (prof.totalRevenue > 0) {
          const expectedMargin = (prof.netProfit / prof.totalRevenue) * 100;
          if (Math.abs(expectedMargin - prof.profitMargin) > 0.1) {
            inconsistencies++;
            issues.push(`${prof.projectName}: 이익률 계산 불일치`);
          }
        }
      });
      
      if (inconsistencies === 0) {
        return {
          name: '데이터 일관성 테스트',
          status: 'passed',
          message: `${profitabilities.length}개 프로젝트 검증 완료, 모든 데이터 일치`,
          details: {
            checked: profitabilities.length,
            inconsistencies: 0
          }
        };
      } else {
        return {
          name: '데이터 일관성 테스트',
          status: 'warning',
          message: `${inconsistencies}개 불일치 발견`,
          details: {
            checked: profitabilities.length,
            inconsistencies,
            issues
          }
        };
      }
    } catch (error) {
      return {
        name: '데이터 일관성 테스트',
        status: 'failed',
        message: `일관성 검증 실패: ${error}`,
        details: { error }
      };
    }
  }

  // 테스트 결과 내보내기
  const exportResults = () => {
    const report = {
      suite: testSuite.name,
      date: new Date().toISOString(),
      duration: testSuite.duration,
      summary: {
        total: testSuite.totalTests,
        passed: testSuite.passed,
        failed: testSuite.failed,
        warnings: testSuite.warnings
      },
      tests: testSuite.tests
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // 상태별 아이콘
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  // 상태별 색상
  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h2" className="text-xl font-bold mb-1">
              프로젝트 연동 통합 테스트
            </Typography>
            <Typography variant="body2" className="text-txt-secondary">
              프로젝트 연동 시스템의 모든 기능을 검증합니다
            </Typography>
          </div>
          
          <div className="flex items-center gap-2">
            {testSuite.tests.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportResults}
                disabled={running}
              >
                <Download className="w-4 h-4 mr-2" />
                결과 내보내기
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={runTests}
              disabled={running}
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  테스트 실행 중...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  테스트 실행
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 진행 상태 */}
        {testSuite.tests.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-bg-secondary rounded-lg">
              <Typography variant="h3" className="text-2xl font-bold text-txt-primary">
                {testSuite.totalTests}
              </Typography>
              <Typography variant="body2" className="text-xs text-txt-secondary">
                전체 테스트
              </Typography>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Typography variant="h3" className="text-2xl font-bold text-green-700">
                {testSuite.passed}
              </Typography>
              <Typography variant="body2" className="text-xs text-green-600">
                성공
              </Typography>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <Typography variant="h3" className="text-2xl font-bold text-red-700">
                {testSuite.failed}
              </Typography>
              <Typography variant="body2" className="text-xs text-red-600">
                실패
              </Typography>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Typography variant="h3" className="text-2xl font-bold text-yellow-700">
                {testSuite.warnings}
              </Typography>
              <Typography variant="body2" className="text-xs text-yellow-600">
                경고
              </Typography>
            </div>
          </div>
        )}

        {/* 테스트 결과 목록 */}
        {testSuite.tests.length > 0 && (
          <div className="space-y-2">
            <Typography variant="h3" className="text-lg font-semibold mb-3">
              테스트 결과
            </Typography>
            {testSuite.tests.map((test, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${getStatusColor(test.status)}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Typography variant="body2" className="font-medium">
                        {test.name}
                      </Typography>
                      {test.duration && (
                        <Typography variant="body2" className="text-xs text-txt-tertiary">
                          {test.duration}ms
                        </Typography>
                      )}
                    </div>
                    <Typography variant="body2" className="text-sm text-txt-secondary mt-1">
                      {test.message}
                    </Typography>
                    {test.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-txt-tertiary cursor-pointer hover:text-txt-secondary">
                          상세 정보
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 현재 실행 중인 테스트 */}
        {currentTest && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <Typography variant="body2" className="text-sm text-blue-700">
                실행 중: {currentTest}
              </Typography>
            </div>
          </div>
        )}

        {/* 총 소요시간 */}
        {testSuite.duration > 0 && !running && (
          <div className="text-center py-3 border-t">
            <Typography variant="body2" className="text-txt-secondary">
              총 소요시간: {(testSuite.duration / 1000).toFixed(2)}초
            </Typography>
          </div>
        )}
      </div>
    </Card>
  );
}