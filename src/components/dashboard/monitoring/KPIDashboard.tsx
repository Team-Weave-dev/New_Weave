/**
 * KPIDashboard - 실시간 성능 및 사용 메트릭 대시보드
 * 
 * Phase 3.3: 모니터링 대시보드의 일부로 구현
 * - 실시간 메트릭 표시
 * - 성능 지표 시각화
 * - 최적화 제안
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { performanceMonitor, PerformanceMetrics } from '@/lib/dashboard/performance/PerformanceMonitor';
import { lazyWidgetLoader } from '@/lib/dashboard/performance/LazyWidgetLoader';
import { Card } from '@/components/ui/Card';
import { 
  Activity,
  Zap,
  Memory,
  Cpu,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  X
} from 'lucide-react';

interface KPIDashboardProps {
  isVisible: boolean;
  onClose?: () => void;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  compact?: boolean;
}

interface KPIData {
  adoptionRate: number;
  errorRate: number;
  performance: {
    p50: number;
    p95: number;
    p99: number;
  };
  satisfaction: number;
}

export function KPIDashboard({
  isVisible,
  onClose,
  position = 'bottom-right',
  compact = false,
}: KPIDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [kpiData, setKpiData] = useState<KPIData>({
    adoptionRate: 0,
    errorRate: 0,
    performance: { p50: 0, p95: 0, p99: 0 },
    satisfaction: 0,
  });
  const [lazyLoadStats, setLazyLoadStats] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // 실시간 메트릭 구독
  useEffect(() => {
    if (!isVisible) return;
    
    const unsubscribe = performanceMonitor.startMonitoring((newMetrics) => {
      setMetrics(newMetrics);
      
      // KPI 계산
      const adoptionRate = calculateAdoptionRate();
      const errorRate = performanceMonitor.getErrorRate();
      const p95Latency = performanceMonitor.getP95Latency();
      
      setKpiData({
        adoptionRate,
        errorRate,
        performance: {
          p50: newMetrics.renderTime,
          p95: p95Latency,
          p99: p95Latency * 1.2, // 근사값
        },
        satisfaction: calculateSatisfaction(newMetrics),
      });
      
      // 최적화 제안
      setSuggestions(performanceMonitor.getOptimizationSuggestions());
    });
    
    // Lazy load 통계
    const updateLazyStats = setInterval(() => {
      setLazyLoadStats(lazyWidgetLoader.getPerformanceStats());
    }, 2000);
    
    return () => {
      performanceMonitor.stopMonitoring();
      clearInterval(updateLazyStats);
    };
  }, [isVisible]);
  
  // 채택률 계산 (예시)
  const calculateAdoptionRate = (): number => {
    // 실제로는 서버에서 가져와야 함
    const totalUsers = 1000;
    const iosUsers = Math.round(Math.random() * 800 + 200);
    return (iosUsers / totalUsers) * 100;
  };
  
  // 만족도 계산
  const calculateSatisfaction = (metrics: PerformanceMetrics): number => {
    let score = 5.0;
    
    // 성능에 따른 감점
    if (metrics.fps < 30) score -= 1.0;
    else if (metrics.fps < 55) score -= 0.5;
    
    if (metrics.memoryPercentage > 80) score -= 1.0;
    else if (metrics.memoryPercentage > 60) score -= 0.5;
    
    if (metrics.renderTime > 100) score -= 1.0;
    else if (metrics.renderTime > 50) score -= 0.5;
    
    return Math.max(1, Math.min(5, score));
  };
  
  // 위치 스타일
  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 9999,
      margin: '16px',
    };
    
    switch (position) {
      case 'top-right':
        return { ...base, top: 0, right: 0 };
      case 'bottom-right':
        return { ...base, bottom: 0, right: 0 };
      case 'top-left':
        return { ...base, top: 0, left: 0 };
      case 'bottom-left':
        return { ...base, bottom: 0, left: 0 };
    }
  };
  
  // 메트릭 색상
  const getMetricColor = (value: number, type: 'fps' | 'memory' | 'error' | 'latency') => {
    switch (type) {
      case 'fps':
        if (value >= 55) return 'text-green-500';
        if (value >= 30) return 'text-yellow-500';
        return 'text-red-500';
      case 'memory':
        if (value <= 50) return 'text-green-500';
        if (value <= 75) return 'text-yellow-500';
        return 'text-red-500';
      case 'error':
        if (value <= 1) return 'text-green-500';
        if (value <= 5) return 'text-yellow-500';
        return 'text-red-500';
      case 'latency':
        if (value <= 16) return 'text-green-500';
        if (value <= 33) return 'text-yellow-500';
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // 성능 아이콘
  const getPerformanceIcon = () => {
    if (!metrics) return <Activity className="w-4 h-4" />;
    
    switch (metrics.performanceLevel) {
      case 'high':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'low':
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };
  
  if (!isVisible || !metrics) return null;
  
  // Compact 모드
  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={getPositionStyles()}
          className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg"
        >
          <div className="flex items-center gap-4 text-sm">
            {getPerformanceIcon()}
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              <span className={getMetricColor(metrics.fps, 'fps')}>
                {metrics.fps.toFixed(0)} FPS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Memory className="w-3 h-3" />
              <span className={getMetricColor(metrics.memoryPercentage, 'memory')}>
                {metrics.memoryPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3" />
              <span className={getMetricColor(kpiData.errorRate, 'error')}>
                {kpiData.errorRate.toFixed(1)}% err
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
  
  // Full 모드
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        style={getPositionStyles()}
        className="w-96"
      >
        <Card className="bg-background/95 backdrop-blur shadow-xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <h3 className="font-semibold">Performance Monitor</h3>
              {getPerformanceIcon()}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* 메트릭 */}
          <div className="p-4 space-y-4">
            {/* 기본 메트릭 */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={<Zap className="w-4 h-4" />}
                label="FPS"
                value={metrics.fps.toFixed(0)}
                unit="fps"
                color={getMetricColor(metrics.fps, 'fps')}
              />
              <MetricCard
                icon={<Memory className="w-4 h-4" />}
                label="Memory"
                value={metrics.memoryUsage.toFixed(0)}
                unit="MB"
                color={getMetricColor(metrics.memoryPercentage, 'memory')}
                subtitle={`${metrics.memoryPercentage.toFixed(0)}%`}
              />
              <MetricCard
                icon={<Cpu className="w-4 h-4" />}
                label="Render"
                value={metrics.renderTime.toFixed(1)}
                unit="ms"
                color={getMetricColor(metrics.renderTime, 'latency')}
              />
              <MetricCard
                icon={<Activity className="w-4 h-4" />}
                label="Widgets"
                value={`${metrics.visibleWidgets}/${metrics.totalWidgets}`}
                color="text-blue-500"
                subtitle={metrics.virtualizedWidgets > 0 ? `${metrics.virtualizedWidgets} virtual` : undefined}
              />
            </div>
            
            {/* KPI */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Key Metrics</h4>
              <div className="space-y-1">
                <KPIBar 
                  label="Adoption Rate" 
                  value={kpiData.adoptionRate} 
                  max={100}
                  unit="%"
                  color="bg-blue-500"
                />
                <KPIBar 
                  label="Error Rate" 
                  value={kpiData.errorRate} 
                  max={10}
                  unit="%"
                  color={kpiData.errorRate > 5 ? 'bg-red-500' : kpiData.errorRate > 2 ? 'bg-yellow-500' : 'bg-green-500'}
                />
                <KPIBar 
                  label="P95 Latency" 
                  value={kpiData.performance.p95} 
                  max={100}
                  unit="ms"
                  color={kpiData.performance.p95 > 50 ? 'bg-red-500' : kpiData.performance.p95 > 16 ? 'bg-yellow-500' : 'bg-green-500'}
                />
                <KPIBar 
                  label="Satisfaction" 
                  value={kpiData.satisfaction} 
                  max={5}
                  unit="/5"
                  color="bg-purple-500"
                />
              </div>
            </div>
            
            {/* Lazy Loading Stats */}
            {lazyLoadStats && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Widget Loading</h4>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>Loaded: {lazyLoadStats.loadedWidgets}/{lazyLoadStats.totalWidgets}</div>
                  <div>Loading: {lazyLoadStats.loadingWidgets}</div>
                  <div>Avg Load Time: {lazyLoadStats.averageLoadTime.toFixed(0)}ms</div>
                  <div>Est. Memory: ~{lazyLoadStats.memoryEstimate.toFixed(1)}MB</div>
                </div>
              </div>
            )}
            
            {/* 최적화 제안 */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Suggestions</h4>
                <div className="space-y-1">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <Info className="w-3 h-3 mt-0.5 text-blue-500" />
                      <span className="text-muted-foreground">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// 메트릭 카드 컴포넌트
function MetricCard({
  icon,
  label,
  value,
  unit,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-lg font-semibold ${color}`}>
        {value}
        {unit && <span className="text-xs font-normal ml-1">{unit}</span>}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      )}
    </div>
  );
}

// KPI 바 컴포넌트
function KPIBar({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}