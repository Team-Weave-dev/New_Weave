import { DashboardLayout, WidgetType } from '@/types/dashboard';

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: 'project' | 'tax' | 'balanced' | 'minimal';
  layout: Partial<DashboardLayout>;
  recommendedFor: string[];
}

// 프로젝트 관리형 템플릿
export const projectTemplate: DashboardTemplate = {
  id: 'project-focused',
  name: '프로젝트 중심',
  description: '프로젝트 관리와 작업 추적에 최적화된 대시보드',
  preview: '📊',
  category: 'project',
  recommendedFor: ['프로젝트 매니저', '팀 리더', '개발자'],
  layout: {
    gridSize: '3x3',
    widgets: [
      {
        id: 'project-summary-1',
        type: 'project-summary' as WidgetType,
        position: { x: 0, y: 0, width: 2, height: 1 },
        config: {}
      },
      {
        id: 'task-tracker-1',
        type: 'task-tracker' as WidgetType,
        position: { x: 2, y: 0, width: 1, height: 2 },
        config: {}
      },
      {
        id: 'kpi-metrics-1',
        type: 'kpi-metrics' as WidgetType,
        position: { x: 0, y: 1, width: 2, height: 1 },
        config: {}
      },
      {
        id: 'revenue-chart-1',
        type: 'revenue-chart' as WidgetType,
        position: { x: 0, y: 2, width: 3, height: 1 },
        config: {}
      }
    ]
  }
};

// 세무 관리형 템플릿
export const taxTemplate: DashboardTemplate = {
  id: 'tax-focused',
  name: '세무 중심',
  description: '세무 일정과 계산에 특화된 대시보드',
  preview: '📅',
  category: 'tax',
  recommendedFor: ['세무사', '회계사', '재무 담당자'],
  layout: {
    gridSize: '3x3',
    widgets: [
      {
        id: 'tax-deadline-1',
        type: 'tax-deadline' as WidgetType,
        position: { x: 0, y: 0, width: 2, height: 2 },
        config: {}
      },
      {
        id: 'tax-calculator-1',
        type: 'tax-calculator' as WidgetType,
        position: { x: 2, y: 0, width: 1, height: 1 },
        config: {}
      },
      {
        id: 'revenue-chart-2',
        type: 'revenue-chart' as WidgetType,
        position: { x: 2, y: 1, width: 1, height: 1 },
        config: {}
      },
      {
        id: 'kpi-metrics-2',
        type: 'kpi-metrics' as WidgetType,
        position: { x: 0, y: 2, width: 3, height: 1 },
        config: {}
      }
    ]
  }
};

// 균형형 템플릿
export const balancedTemplate: DashboardTemplate = {
  id: 'balanced',
  name: '균형형',
  description: '프로젝트와 세무를 균형있게 관리하는 대시보드',
  preview: '⚖️',
  category: 'balanced',
  recommendedFor: ['사업주', '프리랜서', '일반 사용자'],
  layout: {
    gridSize: '3x3',
    widgets: [
      {
        id: 'project-summary-2',
        type: 'project-summary' as WidgetType,
        position: { x: 0, y: 0, width: 1, height: 1 },
        config: {}
      },
      {
        id: 'tax-deadline-2',
        type: 'tax-deadline' as WidgetType,
        position: { x: 1, y: 0, width: 1, height: 1 },
        config: {}
      },
      {
        id: 'kpi-metrics-3',
        type: 'kpi-metrics' as WidgetType,
        position: { x: 2, y: 0, width: 1, height: 1 },
        config: {}
      },
      {
        id: 'task-tracker-2',
        type: 'task-tracker' as WidgetType,
        position: { x: 0, y: 1, width: 2, height: 1 },
        config: {}
      },
      {
        id: 'revenue-chart-3',
        type: 'revenue-chart' as WidgetType,
        position: { x: 2, y: 1, width: 1, height: 2 },
        config: {}
      },
      {
        id: 'tax-calculator-2',
        type: 'tax-calculator' as WidgetType,
        position: { x: 0, y: 2, width: 2, height: 1 },
        config: {}
      }
    ]
  }
};

// 미니멀 템플릿
export const minimalTemplate: DashboardTemplate = {
  id: 'minimal',
  name: '미니멀',
  description: '핵심 정보만 간결하게 표시하는 대시보드',
  preview: '✨',
  category: 'minimal',
  recommendedFor: ['신규 사용자', '간단한 업무', '시작하기'],
  layout: {
    gridSize: '2x2',
    widgets: [
      {
        id: 'kpi-metrics-4',
        type: 'kpi-metrics' as WidgetType,
        position: { x: 0, y: 0, width: 2, height: 1 },
        config: {}
      },
      {
        id: 'task-tracker-3',
        type: 'task-tracker' as WidgetType,
        position: { x: 0, y: 1, width: 1, height: 1 },
        config: {}
      },
      {
        id: 'revenue-chart-4',
        type: 'revenue-chart' as WidgetType,
        position: { x: 1, y: 1, width: 1, height: 1 },
        config: {}
      }
    ]
  }
};

// 모든 템플릿 배열
export const dashboardTemplates: DashboardTemplate[] = [
  projectTemplate,
  taxTemplate,
  balancedTemplate,
  minimalTemplate
];

// 템플릿 적용 함수
export const applyTemplate = (templateId: string): Partial<DashboardLayout> | null => {
  const template = dashboardTemplates.find(t => t.id === templateId);
  return template ? template.layout : null;
};