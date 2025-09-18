'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import { WidgetInfo } from './widgetData';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

// 위젯 컴포넌트 동적 로드 - 타입 매핑 추가
const widgetTypeToComponent: Record<string, string> = {
  'project-summary': 'ProjectSummaryWidget',
  'task-tracker': 'TaskTrackerWidget',
  'client-overview': 'ClientOverviewWidget',
  'tax-deadline': 'TaxDeadlineWidget',
  'tax-calculator': 'TaxCalculatorWidget',
  'invoice-status': 'InvoiceStatusWidget',
  'expense-tracker': 'ExpenseTrackerWidget',
  'revenue-chart': 'RevenueChartWidget',
  'kpi-metrics': 'KPIWidget',
  'calendar': 'CalendarWidget',
  'calendar-view': 'CalendarViewWidget',
  'event-list': 'EventListWidget',
  'todo-list': 'TodoListWidget',
  'recent-activity': 'RecentActivityWidget',
  'time-tracker': 'TimeTrackerWidget',
  'pomodoro': 'PomodoroWidget',
  'quick-notes': 'QuickNotesWidget',
  'announcements': 'AnnouncementsWidget',
  'notification-center': 'NotificationCenterWidget',
  'team-status': 'TeamStatusWidget',
  'quick-links': 'QuickLinksWidget',
  'weather': 'WeatherWidget',
  'custom': 'CustomWidget',
  'realtime-test': 'RealtimeTestWidget'
};

// Default export 위젯들
const defaultExportWidgets = [
  'CalendarViewWidget',
  'ClientOverviewWidget',
  'EventListWidget',
  'NotificationCenterWidget',
  'TeamStatusWidget',
  'TodoListWidget'
];

// 동적 import 함수
const loadWidget = (type: string) => {
  const componentName = widgetTypeToComponent[type];
  if (!componentName) return null;
  
  const isDefaultExport = defaultExportWidgets.includes(componentName);
  
  return lazy(() => 
    import(`@/components/dashboard/widgets/${componentName}`).then(module => {
      if (isDefaultExport || type === 'todo-list') {
        return { default: module.default };
      } else {
        return { default: module[componentName] };
      }
    })
  );
};

interface WidgetPreviewCardProps {
  widget: WidgetInfo;
}

export function WidgetPreviewCard({ widget }: WidgetPreviewCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [WidgetComponent, setWidgetComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Intersection Observer로 뷰포트에 들어올 때만 위젯 로드
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`widget-card-${widget.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [widget.id]);

  useEffect(() => {
    // 뷰포트에 들어왔을 때만 컴포넌트 로드
    if (isVisible && !WidgetComponent) {
      const component = loadWidget(widget.type);
      setWidgetComponent(() => component);
    }
  }, [isVisible, widget.type, WidgetComponent]);

  return (
    <Card id={`widget-card-${widget.id}`} className="overflow-hidden hover:shadow-lg transition-all duration-200">
      {/* 헤더 */}
      <div className="p-4 border-b border-[var(--color-border-subtle)]">
        <div className="flex justify-between items-start mb-2">
          <Typography variant="h4" className="text-[var(--color-text-primary)]">
            {widget.name}
          </Typography>
          <StatusBadge status={widget.status} />
        </div>
        <Typography variant="body2" className="text-[var(--color-text-secondary)]">
          {widget.description}
        </Typography>
      </div>

      {/* 메인 컨텐츠 - 좌우 레이아웃 */}
      <div className="flex flex-col lg:flex-row">
        {/* 왼쪽: 위젯 미리보기 */}
        <div className="flex-1 p-6 bg-[var(--color-background-secondary)] min-h-[300px]">
          <Typography variant="h6" className="text-[var(--color-text-primary)] mb-4">
            미리보기
          </Typography>
          {isVisible ? (
            <Suspense fallback={<LoadingPreview />}>
              {WidgetComponent ? (
                <div className="transform scale-90 origin-top-left pointer-events-none">
                  <WidgetComponent 
                    id={`preview-${widget.id}`}
                    isEditMode={false}
                    config={{
                      isPreviewMode: true, // 프리뷰 모드 플래그 추가
                      disableTimers: true, // 타이머 비활성화
                      disableRealtime: true // 실시간 업데이트 비활성화
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <Typography variant="caption" className="text-[var(--color-text-tertiary)]">
                    미리보기 준비 중
                  </Typography>
                </div>
              )}
            </Suspense>
          ) : (
            <LoadingPreview />
          )}
        </div>

        {/* 오른쪽: 상세 정보 */}
        <div className="flex-1 p-6 space-y-4 bg-[var(--color-background-primary)]">
          <div>
            <Typography variant="h6" className="text-[var(--color-text-primary)] mb-3">
              주요 기능
            </Typography>
            <ul className="space-y-2">
              {widget.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[var(--color-status-success)] mt-0.5">✓</span>
                  <Typography variant="body2" className="text-[var(--color-text-secondary)]">
                    {feature}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Typography variant="h6" className="text-[var(--color-text-primary)] mb-3">
              UI 구성요소
            </Typography>
            <div className="flex flex-wrap gap-2">
              {widget.uiComponents.map((component, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 bg-[var(--color-background-secondary)] rounded-full text-sm text-[var(--color-text-secondary)]"
                >
                  {component}
                </span>
              ))}
            </div>
          </div>

          <div>
            <Typography variant="h6" className="text-[var(--color-text-primary)] mb-3">
              기술 정보
            </Typography>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Typography variant="caption" className="text-[var(--color-text-tertiary)]">
                  위젯 ID:
                </Typography>
                <code className="text-xs bg-[var(--color-background-secondary)] px-2 py-0.5 rounded">
                  {widget.type}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <Typography variant="caption" className="text-[var(--color-text-tertiary)]">
                  상태:
                </Typography>
                <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                  {widget.status === 'completed' ? '개발 완료' : '개발 중'}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    completed: 'bg-[var(--color-status-success)]',
    'in-progress': 'bg-[var(--color-status-warning)]',
    planned: 'bg-[var(--color-status-info)]'
  };

  const labels = {
    completed: '완료',
    'in-progress': '진행중',
    planned: '계획됨'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs text-white ${colors[status as keyof typeof colors]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}

function LoadingPreview() {
  return (
    <div className="flex items-center justify-center h-[200px]">
      <div className="animate-pulse">
        <Typography variant="caption" className="text-[var(--color-text-tertiary)]">
          로딩 중...
        </Typography>
      </div>
    </div>
  );
}