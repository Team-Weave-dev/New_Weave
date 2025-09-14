/**
 * Mock Data Provider for Dashboard Widget System
 * This will be replaced with Supabase integration after complete development
 */

// WidgetPosition과 WidgetConfig 타입 정의
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  title?: string;
  [key: string]: any;
}

// Dashboard Layout 인터페이스
export interface DashboardLayout {
  id: string;
  user_id: string;
  name: string;
  grid_size: '3x3' | '4x4';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Dashboard Widget 인터페이스  
export interface DashboardWidget {
  id: string;
  layout_id: string;
  widget_type: string;
  position: WidgetPosition;
  config: WidgetConfig;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

// User Settings 인터페이스
export interface UserSettings {
  id: string;
  user_id: string;
  has_seen_onboarding: boolean;
  preferred_theme: 'light' | 'dark' | 'system';
  auto_save_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Mock 사용자 ID
const MOCK_USER_ID = 'mock-user-123';

// Mock 레이아웃 데이터
export const mockLayouts: DashboardLayout[] = [
  {
    id: 'layout-1',
    user_id: MOCK_USER_ID,
    name: '기본 대시보드',
    grid_size: '3x3',
    is_default: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'layout-2',
    user_id: MOCK_USER_ID,
    name: '프로젝트 관리',
    grid_size: '4x4',
    is_default: false,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z'
  },
  {
    id: 'layout-3',
    user_id: MOCK_USER_ID,
    name: '세무 대시보드',
    grid_size: '3x3',
    is_default: false,
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z'
  }
];

// Mock 위젯 데이터
export const mockWidgets: DashboardWidget[] = [
  {
    id: 'widget-1',
    layout_id: 'layout-1',
    widget_type: 'ProjectSummary',
    position: { x: 0, y: 0, width: 2, height: 1 },
    config: { title: '프로젝트 현황' },
    is_locked: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'widget-2',
    layout_id: 'layout-1',
    widget_type: 'TaxDeadline',
    position: { x: 2, y: 0, width: 1, height: 2 },
    config: { title: '세무 일정' },
    is_locked: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'widget-3',
    layout_id: 'layout-1',
    widget_type: 'RevenueChart',
    position: { x: 0, y: 1, width: 2, height: 2 },
    config: { title: '월별 수익', chartType: 'line' },
    is_locked: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'widget-4',
    layout_id: 'layout-1',
    widget_type: 'TaskTracker',
    position: { x: 2, y: 2, width: 1, height: 1 },
    config: { title: '작업 추적' },
    is_locked: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// Mock 사용자 설정
export const mockUserSettings: UserSettings = {
  id: 'settings-1',
  user_id: MOCK_USER_ID,
  has_seen_onboarding: false, // 온보딩 테스트를 위해 false로 설정
  preferred_theme: 'light',
  auto_save_enabled: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

// Mock 프로젝트 데이터 (위젯에서 사용)
export const mockProjects = [
  {
    id: 'proj-1',
    name: '웹사이트 리디자인',
    status: 'in_progress',
    progress: 65,
    dueDate: '2025-02-15',
    priority: 'high'
  },
  {
    id: 'proj-2',
    name: '모바일 앱 개발',
    status: 'planning',
    progress: 25,
    dueDate: '2025-03-30',
    priority: 'medium'
  },
  {
    id: 'proj-3',
    name: '마케팅 캠페인',
    status: 'in_progress',
    progress: 80,
    dueDate: '2025-01-31',
    priority: 'high'
  },
  {
    id: 'proj-4',
    name: '데이터베이스 마이그레이션',
    status: 'completed',
    progress: 100,
    dueDate: '2025-01-10',
    priority: 'low'
  }
];

// Mock 세무 일정 데이터
export const mockTaxDeadlines = [
  {
    id: 'tax-1',
    title: '부가가치세 신고',
    date: '2025-01-25',
    type: 'vat',
    status: 'pending'
  },
  {
    id: 'tax-2',
    title: '종합소득세 중간예납',
    date: '2025-02-15',
    type: 'income',
    status: 'pending'
  },
  {
    id: 'tax-3',
    title: '원천세 납부',
    date: '2025-01-10',
    type: 'withholding',
    status: 'completed'
  },
  {
    id: 'tax-4',
    title: '법인세 중간예납',
    date: '2025-03-31',
    type: 'corporate',
    status: 'pending'
  }
];

// Mock 수익 데이터
export const mockRevenueData = [
  { month: '2024-08', revenue: 4500000, expense: 3200000 },
  { month: '2024-09', revenue: 5200000, expense: 3500000 },
  { month: '2024-10', revenue: 4800000, expense: 3300000 },
  { month: '2024-11', revenue: 5800000, expense: 3800000 },
  { month: '2024-12', revenue: 6500000, expense: 4200000 },
  { month: '2025-01', revenue: 5500000, expense: 3600000 }
];

// Mock 작업 데이터
export const mockTasks = [
  {
    id: 'task-1',
    title: '분기 보고서 작성',
    projectId: 'proj-1',
    dueDate: '2025-01-20',
    priority: 'high',
    status: 'in_progress',
    assignee: '김철수'
  },
  {
    id: 'task-2',
    title: 'UI 디자인 검토',
    projectId: 'proj-1',
    dueDate: '2025-01-18',
    priority: 'medium',
    status: 'pending',
    assignee: '이영희'
  },
  {
    id: 'task-3',
    title: '데이터베이스 백업',
    projectId: 'proj-4',
    dueDate: '2025-01-15',
    priority: 'high',
    status: 'completed',
    assignee: '박민수'
  },
  {
    id: 'task-4',
    title: '고객 미팅 준비',
    projectId: 'proj-3',
    dueDate: '2025-01-22',
    priority: 'medium',
    status: 'pending',
    assignee: '정다은'
  }
];

// Mock KPI 데이터
export const mockKPIData = {
  totalRevenue: {
    value: 32500000,
    change: 12.5,
    target: 35000000
  },
  activeProjects: {
    value: 8,
    change: 33.3,
    target: 10
  },
  customerSatisfaction: {
    value: 4.6,
    change: 5.7,
    target: 4.5
  },
  tasksCompleted: {
    value: 145,
    change: -8.2,
    target: 150
  }
};

// Helper 함수들
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Mock API 지연 시뮬레이션
export const simulateApiDelay = (ms: number = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// LocalStorage 키
export const STORAGE_KEYS = {
  LAYOUTS: 'dashboard_layouts',
  WIDGETS: 'dashboard_widgets',
  USER_SETTINGS: 'user_settings',
  CURRENT_LAYOUT: 'current_layout_id'
} as const;