'use client';

import React from 'react';
import { IOSWidgetProps } from '@/lib/dashboard/ios-widget-registry';
import { Card } from '@/components/ui/Card';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export function ChartWidget(props: IOSWidgetProps) {
  // 실제 차트 데이터 시뮬레이션
  const [chartData] = React.useState<ChartData>({
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    datasets: [
      {
        label: '매출',
        data: [12500000, 19800000, 15200000, 22100000, 18700000, 25400000, 21300000],
        color: '#3B82F6'
      },
      {
        label: '비용',
        data: [8200000, 11500000, 9800000, 13400000, 10200000, 14300000, 12100000],
        color: '#EF4444'
      }
    ]
  });

  const maxValue = Math.max(
    ...chartData.datasets.flatMap(d => d.data)
  );

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // 주간 총계 계산
  const weeklyRevenue = chartData.datasets[0].data.reduce((sum, val) => sum + val, 0);
  const weeklyExpense = chartData.datasets[1].data.reduce((sum, val) => sum + val, 0);
  const weeklyProfit = weeklyRevenue - weeklyExpense;
  const profitMargin = ((weeklyProfit / weeklyRevenue) * 100).toFixed(1);

  return (
    <Card className="w-full h-full p-4 bg-card border shadow-sm">
      <div className="flex flex-col h-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{props.title || '주간 트렌드 차트'}</h3>
            <p className="text-xs text-muted-foreground mt-1">최근 7일간 데이터</p>
          </div>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {/* 간단한 차트 (CSS로 구현) */}
        <div className="flex-1 min-h-0">
          <div className="relative h-full">
            {/* Y축 라벨 */}
            <div className="absolute left-0 top-0 bottom-4 w-12 flex flex-col justify-between text-xs text-muted-foreground">
              <span>{formatValue(maxValue)}</span>
              <span>{formatValue(maxValue * 0.5)}</span>
              <span>0</span>
            </div>
            
            {/* 차트 영역 */}
            <div className="ml-14 h-full pr-2">
              <div className="relative h-full">
                {/* 그리드 라인 */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-t border-dashed border-muted-foreground/20" />
                  <div className="border-t border-dashed border-muted-foreground/20" />
                  <div className="border-t border-dashed border-muted-foreground/20" />
                </div>
                
                {/* 바 차트 */}
                <div className="relative h-full flex items-end gap-2 pb-8">
                  {chartData.labels.map((label, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-1 items-end flex-1">
                        {chartData.datasets.map((dataset, datasetIndex) => (
                          <div
                            key={datasetIndex}
                            className="flex-1 relative group"
                            style={{
                              height: `${(dataset.data[index] / maxValue) * 100}%`,
                            }}
                          >
                            <div
                              className="absolute bottom-0 left-0 right-0 rounded-t transition-all hover:opacity-80"
                              style={{
                                backgroundColor: dataset.color,
                                height: '100%',
                              }}
                            />
                            {/* 툴팁 */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {formatValue(dataset.data[index])}
                            </div>
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 범례 및 요약 */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {chartData.datasets.map((dataset, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: dataset.color }}
                  />
                  <span className="text-xs text-muted-foreground">{dataset.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs font-medium text-green-500">
                이익률 {profitMargin}%
              </span>
            </div>
          </div>
        </div>
        
        {/* 크기 정보 */}
        {props.size && (
          <div className="mt-2 text-xs text-muted-foreground">
            크기: {props.size.width}x{props.size.height}
          </div>
        )}
      </div>
    </Card>
  );
}