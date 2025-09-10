'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Package,
  Zap,
  FileCode,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Loader2,
  BarChart3,
  Layers,
  FileSize,
  Activity,
  Download
} from 'lucide-react';

interface BundleMetric {
  name: string;
  originalSize: number;
  optimizedSize: number;
  reduction: number;
  gzipped: number;
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: number;
  cached: boolean;
}

export default function BundleOptimizationTest() {
  const [bundles, setBundles] = useState<BundleMetric[]>([
    {
      name: 'Main Bundle',
      originalSize: 850,
      optimizedSize: 420,
      reduction: 50.6,
      gzipped: 135
    },
    {
      name: 'Tax Management',
      originalSize: 320,
      optimizedSize: 185,
      reduction: 42.2,
      gzipped: 62
    },
    {
      name: 'UI Components',
      originalSize: 180,
      optimizedSize: 95,
      reduction: 47.2,
      gzipped: 32
    },
    {
      name: 'Charts Library',
      originalSize: 280,
      optimizedSize: 150,
      reduction: 46.4,
      gzipped: 48
    },
    {
      name: 'Vendor Bundle',
      originalSize: 1200,
      optimizedSize: 680,
      reduction: 43.3,
      gzipped: 220
    }
  ]);

  const [chunks, setChunks] = useState<ChunkInfo[]>([
    { name: 'framework', size: 142, modules: 45, cached: true },
    { name: 'main', size: 278, modules: 112, cached: false },
    { name: 'tax-management', size: 185, modules: 38, cached: false },
    { name: 'ui-components', size: 95, modules: 24, cached: true },
    { name: 'charts', size: 150, modules: 18, cached: false },
    { name: 'vendor', size: 680, modules: 156, cached: true }
  ]);

  const [loadTime, setLoadTime] = useState({
    fcp: 1.2, // First Contentful Paint
    lcp: 2.1, // Largest Contentful Paint
    fid: 45,  // First Input Delay
    cls: 0.08, // Cumulative Layout Shift
    ttfb: 0.6  // Time to First Byte
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [optimizationTips] = useState([
    {
      severity: 'high',
      title: 'Large Bundle Detected',
      description: 'Vendor bundle is over 500KB. Consider code splitting.',
      impact: '~200KB reduction possible'
    },
    {
      severity: 'medium',
      title: 'Unused Exports',
      description: '12 unused exports detected in tax management module.',
      impact: '~25KB reduction possible'
    },
    {
      severity: 'low',
      title: 'Duplicate Dependencies',
      description: 'date-fns imported in multiple chunks.',
      impact: '~15KB reduction possible'
    }
  ]);

  // 총 통계 계산
  const totalStats = bundles.reduce((acc, bundle) => ({
    original: acc.original + bundle.originalSize,
    optimized: acc.optimized + bundle.optimizedSize,
    gzipped: acc.gzipped + bundle.gzipped
  }), { original: 0, optimized: 0, gzipped: 0 });

  const totalReduction = ((totalStats.original - totalStats.optimized) / totalStats.original * 100).toFixed(1);

  // 번들 분석
  const runBundleAnalysis = async () => {
    setAnalyzing(true);
    
    // 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 최적화된 결과 업데이트
    setBundles(bundles.map(bundle => ({
      ...bundle,
      optimizedSize: bundle.optimizedSize * 0.9,
      reduction: ((bundle.originalSize - bundle.optimizedSize * 0.9) / bundle.originalSize * 100),
      gzipped: bundle.gzipped * 0.85
    })));
    
    setAnalyzing(false);
  };

  // 성능 점수 계산
  const getPerformanceScore = () => {
    let score = 100;
    
    // LCP 기준 (2.5초 이하 좋음)
    if (loadTime.lcp > 2.5) score -= 20;
    else if (loadTime.lcp > 4) score -= 40;
    
    // FID 기준 (100ms 이하 좋음)
    if (loadTime.fid > 100) score -= 15;
    else if (loadTime.fid > 300) score -= 30;
    
    // CLS 기준 (0.1 이하 좋음)
    if (loadTime.cls > 0.1) score -= 10;
    else if (loadTime.cls > 0.25) score -= 20;
    
    return Math.max(0, score);
  };

  const performanceScore = getPerformanceScore();

  // 색상 헬퍼
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <Typography variant="h2" className="text-xl font-bold">
                번들 최적화 분석
              </Typography>
              <Typography variant="body2" className="text-txt-secondary">
                프론트엔드 번들 크기 및 성능 최적화
              </Typography>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={runBundleAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                번들 분석
              </>
            )}
          </Button>
        </div>

        {/* 전체 통계 */}
        <div className="grid grid-cols-5 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-5 h-5 text-gray-600" />
              <Typography variant="body2" className="text-gray-600">
                원본 크기
              </Typography>
            </div>
            <Typography variant="h3" className="text-2xl font-bold text-gray-700">
              {(totalStats.original / 1024).toFixed(1)} MB
            </Typography>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <Typography variant="body2" className="text-blue-600">
                최적화 후
              </Typography>
            </div>
            <Typography variant="h3" className="text-2xl font-bold text-blue-700">
              {(totalStats.optimized / 1024).toFixed(1)} MB
            </Typography>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              <Typography variant="body2" className="text-green-600">
                크기 감소
              </Typography>
            </div>
            <Typography variant="h3" className="text-2xl font-bold text-green-700">
              {totalReduction}%
            </Typography>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileSize className="w-5 h-5 text-purple-600" />
              <Typography variant="body2" className="text-purple-600">
                Gzip 압축
              </Typography>
            </div>
            <Typography variant="h3" className="text-2xl font-bold text-purple-700">
              {(totalStats.gzipped / 1024).toFixed(2)} MB
            </Typography>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <Typography variant="body2" className="text-orange-600">
                성능 점수
              </Typography>
            </div>
            <Typography variant="h3" className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore}/100
            </Typography>
          </div>
        </div>
      </Card>

      {/* 번들 상세 */}
      <Card className="p-6">
        <Typography variant="h3" className="text-lg font-semibold mb-4">
          번들 크기 분석
        </Typography>

        <div className="space-y-3">
          {bundles.map((bundle, index) => (
            <div key={index} className="p-4 bg-bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="body1" className="font-medium">
                  {bundle.name}
                </Typography>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <Typography variant="body2" className="text-xs text-txt-secondary">
                      원본
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {bundle.originalSize} KB
                    </Typography>
                  </div>
                  <div className="text-right">
                    <Typography variant="body2" className="text-xs text-txt-secondary">
                      최적화
                    </Typography>
                    <Typography variant="body2" className="font-medium text-blue-600">
                      {bundle.optimizedSize.toFixed(0)} KB
                    </Typography>
                  </div>
                  <div className="text-right">
                    <Typography variant="body2" className="text-xs text-txt-secondary">
                      Gzip
                    </Typography>
                    <Typography variant="body2" className="font-medium text-green-600">
                      {bundle.gzipped.toFixed(0)} KB
                    </Typography>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <Typography variant="body2" className="text-xs text-txt-secondary">
                      감소율
                    </Typography>
                    <Typography variant="body2" className="font-bold text-green-600">
                      -{bundle.reduction.toFixed(1)}%
                    </Typography>
                  </div>
                </div>
              </div>

              {/* 진행 바 */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="bg-gray-400"
                    style={{ width: `${(bundle.optimizedSize / bundle.originalSize) * 100}%` }}
                  />
                  <div 
                    className="bg-green-500"
                    style={{ width: `${(bundle.gzipped / bundle.originalSize) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 청크 정보 */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            청크 분석
          </Typography>

          <div className="space-y-2">
            {chunks.map((chunk, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-txt-tertiary" />
                  <div>
                    <Typography variant="body2" className="font-medium">
                      {chunk.name}
                    </Typography>
                    <Typography variant="body2" className="text-xs text-txt-secondary">
                      {chunk.modules} modules
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Typography variant="body2" className="font-medium">
                    {chunk.size} KB
                  </Typography>
                  {chunk.cached && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                      Cached
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            Core Web Vitals
          </Typography>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" className="font-medium">
                  FCP (First Contentful Paint)
                </Typography>
                <Typography variant="body2" className="text-xs text-txt-secondary">
                  첫 콘텐츠 렌더링
                </Typography>
              </div>
              <Typography variant="body2" className={`font-bold ${loadTime.fcp < 1.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                {loadTime.fcp}s
              </Typography>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" className="font-medium">
                  LCP (Largest Contentful Paint)
                </Typography>
                <Typography variant="body2" className="text-xs text-txt-secondary">
                  최대 콘텐츠 렌더링
                </Typography>
              </div>
              <Typography variant="body2" className={`font-bold ${loadTime.lcp < 2.5 ? 'text-green-600' : 'text-yellow-600'}`}>
                {loadTime.lcp}s
              </Typography>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" className="font-medium">
                  FID (First Input Delay)
                </Typography>
                <Typography variant="body2" className="text-xs text-txt-secondary">
                  첫 입력 지연
                </Typography>
              </div>
              <Typography variant="body2" className={`font-bold ${loadTime.fid < 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                {loadTime.fid}ms
              </Typography>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" className="font-medium">
                  CLS (Cumulative Layout Shift)
                </Typography>
                <Typography variant="body2" className="text-xs text-txt-secondary">
                  누적 레이아웃 이동
                </Typography>
              </div>
              <Typography variant="body2" className={`font-bold ${loadTime.cls < 0.1 ? 'text-green-600' : 'text-yellow-600'}`}>
                {loadTime.cls}
              </Typography>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" className="font-medium">
                  TTFB (Time to First Byte)
                </Typography>
                <Typography variant="body2" className="text-xs text-txt-secondary">
                  첫 바이트 수신 시간
                </Typography>
              </div>
              <Typography variant="body2" className={`font-bold ${loadTime.ttfb < 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                {loadTime.ttfb}s
              </Typography>
            </div>
          </div>
        </Card>
      </div>

      {/* 최적화 팁 */}
      <Card className="p-6">
        <Typography variant="h3" className="text-lg font-semibold mb-4">
          최적화 권장사항
        </Typography>

        <div className="space-y-3">
          {optimizationTips.map((tip, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(tip.severity)}`}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div className="flex-1">
                  <Typography variant="body1" className="font-medium">
                    {tip.title}
                  </Typography>
                  <Typography variant="body2" className="mt-1">
                    {tip.description}
                  </Typography>
                  <Typography variant="body2" className="text-sm font-medium mt-2">
                    예상 개선: {tip.impact}
                  </Typography>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}