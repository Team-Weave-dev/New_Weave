# 대시보드 위젯 시스템 가이드 - 시스템 아키텍처 V2.0

## 핵심 기술 스택 (실제 프로젝트 기준)
```javascript
// package.json 주요 의존성
{
  "dependencies": {
    // 🔧 프레임워크
    "next": "^14.2.32",          // React 기반 풀스택 프레임워크
    "react": "^18",              // UI 라이브러리
    "typescript": "^5",          // 타입 안전성
    
    // 🎨 스타일링 & 애니메이션
    "tailwindcss": "^3.3.0",     // 유틸리티 CSS
    "framer-motion": "^12.23.12", // iOS 스타일 애니메이션
    "clsx": "^2.0.0",            // 조건부 클래스명
    "tailwind-merge": "^2.0.0",  // Tailwind 클래스 병합
    
    // 📊 상태 관리
    "zustand": "^5.0.8",         // 간단한 상태 관리
    
    // 🔄 드래그 앤 드롭
    "@hello-pangea/dnd": "^16.6.0", // Beautiful DnD의 포크 (현재 사용 중)
    
    // 📈 차트 & 데이터 시각화
    "recharts": "^3.2.0",        // React 차트 라이브러리
    "react-chartjs-2": "^5.3.0", // Chart.js React 래퍼
    "chart.js": "^4.5.0",        // 차트 라이브러리
    
    // 🗓️ 날짜 처리
    "date-fns": "^4.1.0",        // 가벼운 날짜 유틸리티
    
    // 📝 마크다운 & 에디터
    "@uiw/react-md-editor": "^4.0.8", // 마크다운 에디터
    "react-markdown": "^10.1.0",      // 마크다운 렌더러
    "marked": "^16.2.0",              // 마크다운 파서
    
    // 🎭 아이콘
    "lucide-react": "^0.541.0",  // Lucide 아이콘 (깔끔한 iOS 스타일)
    
    // 🔐 백엔드 & 인증
    "@supabase/supabase-js": "^2.56.1",        // Supabase 클라이언트
    "@supabase/auth-helpers-nextjs": "^0.10.0", // Next.js 인증 헬퍼
    
    // 🤖 AI 통합
    "@google/generative-ai": "^0.24.1", // Google Gemini AI
    "langchain": "^0.3.31",             // LangChain AI 프레임워크
    
    // 🚀 성능 최적화
    "react-window": "^1.8.10",    // 가상 스크롤링
    
    // 📄 문서 처리
    "docx": "^9.5.1",            // Word 문서 생성
    "jspdf": "^3.0.2",           // PDF 생성
    "html2canvas": "^1.4.1"      // HTML to Canvas
  }
}
```

## 프로젝트 구조 설명
```
src/
├── app/                        # Next.js App Router
│   ├── api/                   # API 라우트 (서버 로직)
│   ├── dashboard/              # 대시보드 페이지
│   └── (auth)/                # 인증 관련 페이지
│
├── components/
│   ├── ui/                    # 기본 UI 컴포넌트
│   │   ├── Button.tsx         # 스타일 버튼
│   │   ├── Card.tsx           # 스타일 카드
│   │   ├── Typography.tsx     # SF Pro 스타일 텍스트
│   │   └── ...
│   │
│   ├── dashboard/
│   │   ├── widgets/           # 위젯 컴포넌트
│   │   │   ├── ProjectSummaryWidget.tsx
│   │   │   ├── TaskTrackerWidget.tsx
│   │   │   └── ...
│   │   │
│   │   ├── controls/          # 스타일 컨트롤
│   │   │   ├── IOSSwitch.tsx
│   │   │   ├── IOSSlider.tsx
│   │   │   └── IOSSegmentedControl.tsx
│   │   │
│   │   └── templates/         # 템플릿 시스템
│   │
│   └── layout/                # 레이아웃 컴포넌트
│
├── lib/
│   ├── dashboard/             # 대시보드 비즈니스 로직
│   ├── stores/                # Zustand 상태 스토어
│   ├── theme/                 # 테마 시스템
│   └── utils/                 # 유틸리티 함수
│
└── styles/
    ├── globals.css            # 전역 스타일
    └── ios-theme.css          # iOS 테마 변수
```


# 📦 시스템 위젯 목록 (전체 22개)

## 🔢 위젯 카테고리별 분류

| 카테고리 | 위젯 수 | 위젯 목록 |
|---------|---------|-----------|
| **프로젝트 관리** | 2개 | project-summary, task-tracker |
| **세무 관련** | 2개 | tax-deadline, tax-calculator |
| **분석 및 지표** | 6개 | revenue-chart, expense-tracker, profit-loss, cash-flow, budget-monitor, kpi-metrics |
| **생산성** | 10개 | todo-list, calendar, recent-activity, time-tracker, pomodoro, notes, reminders, weather, news-feed, analytics-dashboard |
| **커스텀/기타** | 2개 | quick-actions, team-collaboration |


## 📂 프로젝트 관리 위젯 (2개)

### 1. 📊 프로젝트 요약 위젯 (ProjectSummaryWidget)

#### 기본 정보
- **타입**: `project-summary`
- **카테고리**: `project`
- **iOS 참고**: Activity 앱의 링 차트 + Reminders 앱의 스마트 리스트
- **기본 크기**: 2x2 (최소: 1x1, 최대: 4x4)

#### 상세 기능 정의
```typescript
// 프로젝트 리뷰 인터페이스 (주요 변경사항)
interface ProjectReview {
  id: string;
  projectId: string;
  projectName: string;
  client: string;               // 클라이언트명
  pm: string;                   // 프로젝트 매니저
  status: 'critical' | 'warning' | 'normal' | 'completed';
  statusLabel: string;          // 긴급, 주의, 정상, 완료 등
  progress: number;             // 0-100 진행률
  deadline: Date;
  daysRemaining: number;        // 남은 일수 (D-day 형식으로 표시)
  budget: {
    total: number;
    spent: number;
    currency: string;
  };
  currentStatus: string;        // 현재 상태 요약
  issues?: string[];            // 이슈 목록
  nextActions?: string[];       // 필요 조치사항
}

// 개별 프로젝트 정보
interface Project {
  id: string;
  name: string;
  client: string;               // 클라이언트 이름
  status: 'completed' | 'in_progress' | 'on_hold' | 'planning';
  progress: number;             // 0-100 진행률
  deadline?: string;            // 마감일
  teamMembers?: TeamMember[];   // 팀원 목록
  milestones?: Milestone[];     // 마일스톤 목록
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;              // 예산
  spent?: number;               // 지출액
  tags?: string[];              // 태그 (웹개발, 모바일, AI 등)
}

// 전체 프로젝트 요약 데이터
interface ProjectSummary {
  // 통계 정보
  total: number;                // 전체 프로젝트 수
  inProgress: number;           // 진행 중
  completed: number;            // 완료
  onHold: number;               // 보류
  
  
  // 재무 정보
  totalRevenue: number;         // 총 수익
  totalBudget: number;          // 총 예산
  totalSpent: number;           // 총 지출
  
  // 프로젝트 리뷰 정보 (주요 변경사항)
  projectReviews: ProjectReview[]; // 주요 프로젝트 리뷰 목록
  criticalProjects: ProjectReview[]; // 긴급 상태 프로젝트
  warningProjects: ProjectReview[]; // 주의 필요 프로젝트
  normalProjects: ProjectReview[]; // 정상 진행 프로젝트
}

// 위젯 설정 인터페이스
interface ProjectSummaryWidgetConfig {
  title?: string;               // 위젯 제목
  maxProjects?: number;         // 표시할 최대 프로젝트 수 (기본값: 5)
  
  // 표시 옵션
  showRevenue?: boolean;        // 수익 정보 표시
  showProgress?: boolean;       // 진행률 차트 표시
  showTeamMembers?: boolean;    // 팀원 아바타 표시
  showMilestones?: boolean;     // 마일스톤 타임라인 표시
  showDeadlines?: boolean;      // 마감일 표시
  showBudget?: boolean;         // 예산 정보 표시
  
  // 차트 옵션
  chartType?: 'ring' | 'bar' | 'line' | 'activity';
  chartColors?: string[];       // 커스텀 차트 색상
  
  // 필터 옵션
  filterByStatus?: string[];    // 상태별 필터
  filterByClient?: string[];    // 클라이언트별 필터
  filterByTag?: string[];       // 태그별 필터
  
  // 정렬 옵션
  sortBy?: 'deadline' | 'progress' | 'priority' | 'name' | 'created';
  sortOrder?: 'asc' | 'desc';
  
  // 자동화
  refreshInterval?: number;     // 자동 새로고침 간격(초)
  enableNotifications?: boolean; // 알림 활성화
}
```


### 2. 🚀 스마트 작업 추적기 위젯 (SmartTaskTrackerWidget)

- **타입**: `task-tracker`
- **카테고리**: `project`
- **iOS 참고**: Shortcuts 앱의 자동화 + Screen Time의 인사이트 패널
- **설명**: AI 기반 프로젝트 작업 관리 및 팀 협업 인사이트
- **기본 크기**: 2x2 (스마트 기능을 위한 확대)

#### 핵심 차별점 (vs TodoList, Reminders)
| 위젯 | 용도 | 주요 기능 |
|------|------|---------|
| **SmartTaskTracker** | 프로젝트/팀 작업 관리 | AI 우선순위, 병목 감지, 팀 협업 |
| TodoList | 개인 할 일 관리 | 단순 체크리스트, Todoist 스타일 |
| Reminders | 시간 기반 알림 | 일정 알림, 반복 설정 |

#### 상세 기능 정의
```typescript
interface SmartTaskTrackerWidgetProps {
  id: string;
  config?: {
    title?: string;
    viewMode?: 'kanban' | 'sprint' | 'timeline' | 'team' | 'smart';
    
    // 스마트 기능 설정
    enableAI?: boolean;              // AI 인사이트 활성화
    enableAutoSort?: boolean;         // 자동 우선순위 정렬
    enableBottleneckDetection?: boolean; // 병목 감지
    enablePredictions?: boolean;      // 마감일 예측
    
    // 표시 옵션
    showInsights?: boolean;           // AI 인사이트 패널
    showProgress?: boolean;           // 프로젝트 진행률
    showTeamLoad?: boolean;           // 팀원 작업 부하
    maxTasks?: number;               
    
    // 통합 설정
    integrations?: {
      github?: boolean;               // GitHub Issues 연동
      jira?: boolean;                 // Jira 연동
      slack?: boolean;                // Slack 알림
    };
    
    // 필터 옵션
    filterByProject?: string[];
    filterByAssignee?: string[];
    filterByStatus?: string[];
  };
  isEditMode?: boolean;
  onTaskUpdate?: (taskId: string, updates: Partial<SmartTask>) => void;
  onTaskCreate?: () => void;
  onViewChange?: (mode: string) => void;
}

interface SmartTask {
  id: string;
  title: string;
  description?: string;
  
  // 기본 속성
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  
  // 프로젝트 관련
  projectId: string;
  projectName: string;
  sprint?: string;
  epic?: string;
  
  // 팀 협업
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
    workload?: number;        // 현재 작업 부하 (0-100)
  };
  reviewer?: TeamMember;
  watchers?: TeamMember[];
  
  // 시간 관리
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: Date;
  completedAt?: Date;
  
  // 의존성
  dependencies?: string[];     // 선행 작업 ID
  blockedBy?: string[];        // 블로킹 작업 ID
  blocks?: string[];           // 이 작업이 블로킹하는 작업들
  
  // AI 인사이트
  aiInsights?: {
    suggestedPriority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
    riskLevel?: 'low' | 'medium' | 'high';  // 지연 위험도
    bottleneckScore?: number;   // 병목 점수 (0-100)
    estimatedCompletion?: Date; // AI 예측 완료일
    recommendations?: string[];  // AI 추천사항
  };
  
  // 메타데이터
  tags?: string[];
  labels?: Label[];
  customFields?: Record<string, any>;
  
  // 활동 기록
  comments?: Comment[];
  attachments?: Attachment[];
  activities?: Activity[];
  
  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
}

interface AIInsight {
  type: 'warning' | 'suggestion' | 'critical' | 'info';
  title: string;
  description: string;
  priority: number;        // 표시 우선순위
  actionable?: {
    action: string;        // 실행 가능한 액션
    taskIds?: string[];    // 관련 작업들
  };
  timestamp: Date;
}

// 스마트 뷰 모드별 데이터 구조
interface KanbanColumn {
  id: string;
  title: string;
  tasks: SmartTask[];
  limit?: number;          // WIP 제한
  color?: string;
}

interface SprintView {
  currentSprint: {
    name: string;
    startDate: Date;
    endDate: Date;
    velocity: number;
    tasks: SmartTask[];
    burndown: DataPoint[];
  };
  backlog: SmartTask[];
}

interface TeamView {
  members: Array<{
    member: TeamMember;
    tasks: SmartTask[];
    workload: number;      // 0-100
    availability: 'available' | 'busy' | 'overloaded';
  }>;
}

// 스마트 기능 엔진
interface SmartEngine {
  // 우선순위 자동 조정
  calculatePriority(task: SmartTask): 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  
  // 병목 감지
  detectBottlenecks(tasks: SmartTask[]): Array<{
    task: SmartTask;
    impact: number;        // 영향받는 작업 수
    recommendation: string;
  }>;
  
  // 작업 부하 분석
  analyzeWorkload(member: TeamMember, tasks: SmartTask[]): {
    current: number;
    optimal: number;
    recommendation: string;
  };
  
  // 마감일 예측
  predictCompletion(task: SmartTask, historicalData: any): {
    estimated: Date;
    confidence: number;    // 0-100
    risks: string[];
  };
  
  // 스마트 추천
  generateRecommendations(tasks: SmartTask[]): AIInsight[];
}
```

## 💰 세무 관련 위젯 (2개)

### 3. 📅 세무 캘린더 위젯 (TaxDeadlineWidget)
- **타입**: `tax-deadline`  
- **카테고리**: `tax`
- **iOS 참고**: Calendar 앱의 이벤트 리스트 뷰
- **설명**: 연간 정기 세무 일정을 한눈에 보여주는 정보성 위젯
- **기본 크기**: 2x2 (최소: 1x1, 최대: 2x3)

#### 핵심 기능
1. **정기 세무 일정 표시**: 매월/분기/연간 고정 세무 일정 안내
2. **D-day 표시**: 다음 마감일까지 남은 일수 표시
3. **중요도 구분**: 긴급/중요/일반 구분
4. **카테고리 태그**: VAT, 원천세, 소득세 등 세금 종류 표시
5. **월별 필터**: 특정 월의 세무 일정만 확인 가능

#### 상세 기능 정의
```typescript
interface TaxDeadlineWidgetProps {
  id: string;
  config?: {
    title?: string;
    
    // 표시 옵션
    selectedMonth?: number;          // 선택된 월 (1-12, null은 전체)
    showOnlyUpcoming?: boolean;      // 다가오는 일정만 표시
    maxItems?: number;              // 표시할 최대 항목 수 (기본: 5)
    compactMode?: boolean;          // 컴팩트 모드 (1x1 크기용)
    
    // 필터 옵션
    categories?: TaxCategory[];     // 표시할 세금 카테고리
    
    // 강조 옵션
    highlightDays?: number;         // D-day 며칠 전부터 강조 (기본: 7)
  };
  
  // 이벤트 핸들러
  onDeadlineClick?: (deadline: TaxDeadline) => void;
  onMonthChange?: (month: number) => void;
}

// 세금 카테고리 타입
type TaxCategory = 
  | 'VAT'            // 부가가치세
  | 'income-tax'     // 소득세
  | 'corporate-tax'  // 법인세
  | 'local-tax'      // 지방세
  | 'withholding'    // 원천세
  | 'property-tax'   // 재산세
  | 'customs'        // 관세
  | 'other';         // 기타

// 상태 타입
type TaxStatus = 
  | 'upcoming'       // 예정
  | 'urgent'         // 긴급 (D-3 이내)
  | 'overdue'        // 연체
  | 'completed'      // 완료
  | 'in-progress';   // 진행중

// 중요도 타입
type Importance = 
  | 'low'           
  | 'medium'        
  | 'high'          
  | 'critical';     

// 세무 마감일 인터페이스
interface TaxDeadline {
  id: string;
  title: string;                  // 세무 일정 이름
  category: TaxCategory;          // 세금 종류
  
  // 일정 정보
  deadlineDay: number;            // 마감일 (1-31)
  deadlineMonth?: number;         // 특정 월 (연간 일정용)
  frequency: 'monthly' | 'quarterly' | 'yearly';  // 반복 주기
  
  // 중요도 및 상태
  importance: 'critical' | 'high' | 'medium' | 'low';
  
  // 표시 정보
  description?: string;           // 간단한 설명
  taxPeriod?: string;            // 과세 기간 (예: "전월분", "1분기")
  note?: string;                 // 추가 안내사항
}

// 정기 세무 일정 데이터 (고정값)
const KOREAN_TAX_CALENDAR: TaxDeadline[] = [
  // 매월 반복
  {
    id: 'monthly-withholding',
    title: '원천세 납부',
    category: 'withholding',
    deadlineDay: 10,
    frequency: 'monthly',
    importance: 'high',
    description: '전월분 원천징수세 납부',
    taxPeriod: '전월분'
  },
  {
    id: 'monthly-vat-preview',
    title: '부가가치세 예정신고 (1, 7월)',
    category: 'VAT',
    deadlineDay: 25,
    deadlineMonth: 1,  // 1월, 7월
    frequency: 'quarterly',
    importance: 'critical',
    description: '부가가치세 예정신고 및 납부',
    taxPeriod: '전 분기'
  },
  {
    id: 'monthly-vat-final',
    title: '부가가치세 확정신고 (4, 10월)',
    category: 'VAT', 
    deadlineDay: 25,
    deadlineMonth: 4,  // 4월, 10월
    frequency: 'quarterly',
    importance: 'critical',
    description: '부가가치세 확정신고 및 납부',
    taxPeriod: '전 분기'
  },
  
  // 분기별
  {
    id: 'quarterly-corporate-interim',
    title: '법인세 중간예납',
    category: 'corporate-tax',
    deadlineDay: 31,
    deadlineMonth: 8,
    frequency: 'yearly',
    importance: 'high',
    description: '법인세 중간예납 신고 납부'
  },
  
  // 연간
  {
    id: 'yearly-income-tax',
    title: '종합소득세 신고',
    category: 'income-tax',
    deadlineDay: 31,
    deadlineMonth: 5,
    frequency: 'yearly',
    importance: 'critical',
    description: '전년도 종합소득세 확정신고',
    taxPeriod: '전년도'
  },
  {
    id: 'yearly-corporate-tax',
    title: '법인세 신고',
    category: 'corporate-tax',
    deadlineDay: 31,
    deadlineMonth: 3,
    frequency: 'yearly',
    importance: 'critical',
    description: '법인세 확정신고 (12월 결산법인)',
    taxPeriod: '전년도'
  },
  {
    id: 'yearly-local-income-tax',
    title: '지방소득세 신고',
    category: 'local-tax',
    deadlineDay: 31,
    deadlineMonth: 5,
    frequency: 'yearly',
    importance: 'high',
    description: '개인지방소득세 신고',
    taxPeriod: '전년도'
  }
];
```

### 4. 🧮 세금 계산기 위젯 (TaxCalculatorWidget)
- **타입**: `tax-calculator`
- **카테고리**: `tax`
- **iOS 참고**: Calculator 앱의 미니멀 입력 인터페이스
- **설명**: 부가세, 원천세(3.3%, 8.8%) 등을 간편하게 계산하고 실수령액 산출
- **기본 크기**: 1x1

##### 상세 기능 정의
```typescript
// 세금 계산기 위젯 Props
interface TaxCalculatorWidgetProps {
  id: string;
  config?: {
    title?: string;
    defaultTaxType?: TaxType;          // 기본 세금 타입
    calculationMode?: CalculationMode; // 계산 모드
    showHistory?: boolean;              // 히스토리 표시 여부
    maxHistoryItems?: number;           // 최대 히스토리 개수
    decimalPlaces?: number;             // 소수점 자릿수
    thousandSeparator?: boolean;        // 천 단위 구분
    quickAmounts?: number[];            // 빠른 금액 버튼
    theme?: 'light' | 'dark' | 'auto';  // 테마 설정
  };
  onCalculate?: (calculation: TaxCalculation) => void;
  onHistorySave?: (calculation: TaxCalculation) => void;
  onExport?: (calculations: TaxCalculation[]) => void;
}

// 세금 종류
enum TaxType {
  VAT = 'VAT',                         // 부가세 10%
  WITHHOLDING_3_3 = 'WITHHOLDING_3_3', // 원천세 3.3% (프리랜서)
  WITHHOLDING_8_8 = 'WITHHOLDING_8_8', // 원천세 8.8% (강사료 등)
  CUSTOM = 'CUSTOM'                     // 사용자 정의 세율
}

// 계산 모드
enum CalculationMode {
  FROM_SUPPLY = 'FROM_SUPPLY',         // 공급가액 기준 (세금 별도)
  FROM_TOTAL = 'FROM_TOTAL'            // 총액 기준 (세금 포함)
}

// 세금 계산 결과
interface TaxCalculation {
  id: string;
  timestamp: Date;
  
  // 입력 정보
  inputAmount: number;                 // 입력 금액
  taxType: TaxType;                    // 세금 종류
  taxRate: number;                     // 세율 (%)
  calculationMode: CalculationMode;    // 계산 모드
  
  // 계산 결과
  supplyAmount: number;                // 공급가액
  taxAmount: number;                   // 세금액
  totalAmount: number;                 // 총액 (공급가액 + 세금)
  
  // 원천세의 경우 실수령액
  netAmount?: number;                  // 실수령액 (공급가액 - 세금)
  
  // 부가세 + 원천세 복합 계산
  vatAmount?: number;                  // 부가세액
  withholdingAmount?: number;          // 원천세액
  
  // 메모 및 태그
  memo?: string;                       // 메모
  tags?: string[];                     // 태그 (프로젝트, 클라이언트 등)
  
  // 메타데이터
  currency?: string;                   // 통화 (기본: KRW)
  exchangeRate?: number;               // 환율 (외화의 경우)
}

// 계산 히스토리
interface CalculationHistory {
  calculations: TaxCalculation[];
  totalCount: number;
  lastUpdated: Date;
  
  // 통계
  statistics?: {
    totalSupplyAmount: number;         // 총 공급가액
    totalTaxAmount: number;            // 총 세금액
    averageAmount: number;             // 평균 금액
    mostUsedTaxType: TaxType;         // 가장 많이 사용된 세금 타입
  };
}

// 빠른 계산 템플릿
interface QuickCalculationTemplate {
  id: string;
  name: string;                        // 템플릿 이름
  icon?: string;                       // 아이콘
  taxType: TaxType;                    // 세금 종류
  calculationMode: CalculationMode;    // 계산 모드
  defaultAmount?: number;              // 기본 금액
  description?: string;                // 설명
}

// 위젯 기능 명세
interface TaxCalculatorFeatures {
  // 핵심 기능
  realTimeCalculation: boolean;        // 실시간 계산
  multiTaxCalculation: boolean;        // 복합 세금 계산 (부가세 + 원천세)
  reverseCalculation: boolean;         // 역산 계산 (총액 → 공급가액)
  
  // 입력 기능
  numberInput: boolean;                // 숫자 입력 필드
  quickAmountButtons: boolean;         // 빠른 금액 버튼 (10만, 100만 등)
  voiceInput?: boolean;                // 음성 입력
  
  // 결과 표시
  animatedResults: boolean;            // 결과 애니메이션
  comparisonView: boolean;             // 세금 타입별 비교 뷰
  detailedBreakdown: boolean;          // 상세 내역 표시
  
  // 편의 기능
  copyToClipboard: boolean;            // 결과 복사
  shareResults: boolean;               // 결과 공유
  exportToExcel: boolean;              // 엑셀 내보내기
  printReceipt: boolean;               // 영수증 출력
  
  // 히스토리 관리
  saveHistory: boolean;                // 계산 기록 저장
  searchHistory: boolean;              // 기록 검색
  tagManagement: boolean;              // 태그 관리
  
  // 고급 기능
  currencyConversion?: boolean;        // 환율 계산
  customTaxRates?: boolean;            // 사용자 정의 세율
  batchCalculation?: boolean;          // 일괄 계산
  apiIntegration?: boolean;            // 외부 API 연동
}
```

##### 계산 로직
```typescript
// 세금 계산 유틸리티
class TaxCalculator {
  // 공급가액 기준 계산
  static calculateFromSupply(
    supplyAmount: number, 
    taxType: TaxType
  ): TaxCalculation {
    let taxRate = 0;
    let taxAmount = 0;
    let totalAmount = 0;
    let netAmount = 0;
    
    switch (taxType) {
      case TaxType.VAT:
        taxRate = 10;
        taxAmount = supplyAmount * 0.1;
        totalAmount = supplyAmount + taxAmount;
        break;
        
      case TaxType.WITHHOLDING_3_3:
        taxRate = 3.3;
        taxAmount = supplyAmount * 0.033;
        netAmount = supplyAmount - taxAmount;
        totalAmount = supplyAmount;
        break;
        
      case TaxType.WITHHOLDING_8_8:
        taxRate = 8.8;
        taxAmount = supplyAmount * 0.088;
        netAmount = supplyAmount - taxAmount;
        totalAmount = supplyAmount;
        break;
    }
    
    return {
      id: generateId(),
      timestamp: new Date(),
      inputAmount: supplyAmount,
      taxType,
      taxRate,
      calculationMode: CalculationMode.FROM_SUPPLY,
      supplyAmount,
      taxAmount: Math.round(taxAmount),
      totalAmount: Math.round(totalAmount),
      netAmount: netAmount ? Math.round(netAmount) : undefined
    };
  }
  
  // 총액 기준 역산
  static calculateFromTotal(
    totalAmount: number,
    taxType: TaxType
  ): TaxCalculation {
    let taxRate = 0;
    let supplyAmount = 0;
    let taxAmount = 0;
    let netAmount = 0;
    
    switch (taxType) {
      case TaxType.VAT:
        taxRate = 10;
        supplyAmount = totalAmount / 1.1;
        taxAmount = totalAmount - supplyAmount;
        break;
        
      case TaxType.WITHHOLDING_3_3:
        taxRate = 3.3;
        supplyAmount = totalAmount;
        taxAmount = supplyAmount * 0.033;
        netAmount = supplyAmount - taxAmount;
        break;
        
      case TaxType.WITHHOLDING_8_8:
        taxRate = 8.8;
        supplyAmount = totalAmount;
        taxAmount = supplyAmount * 0.088;
        netAmount = supplyAmount - taxAmount;
        break;
    }
    
    return {
      id: generateId(),
      timestamp: new Date(),
      inputAmount: totalAmount,
      taxType,
      taxRate,
      calculationMode: CalculationMode.FROM_TOTAL,
      supplyAmount: Math.round(supplyAmount),
      taxAmount: Math.round(taxAmount),
      totalAmount: Math.round(totalAmount),
      netAmount: netAmount ? Math.round(netAmount) : undefined
    };
  }
  
  // 복합 계산 (부가세 + 원천세)
  static calculateCompound(
    amount: number,
    includeVAT: boolean,
    withholdingRate: number
  ): TaxCalculation {
    const supplyAmount = amount;
    const vatAmount = includeVAT ? supplyAmount * 0.1 : 0;
    const totalWithVAT = supplyAmount + vatAmount;
    const withholdingAmount = supplyAmount * (withholdingRate / 100);
    const netAmount = totalWithVAT - withholdingAmount;
    
    return {
      id: generateId(),
      timestamp: new Date(),
      inputAmount: amount,
      taxType: TaxType.CUSTOM,
      taxRate: withholdingRate,
      calculationMode: CalculationMode.FROM_SUPPLY,
      supplyAmount,
      taxAmount: withholdingAmount,
      totalAmount: totalWithVAT,
      netAmount,
      vatAmount,
      withholdingAmount
    };
  }
}
```


## 📊 분석 및 지표 위젯 (6개)

### 5. 📊 매출 차트 위젯 (RevenueChartWidget)
- **타입**: `revenue-chart`
- **카테고리**: `analytics`
- **iOS 참고**: Health 앱의 그래프 시각화
- **설명**: 월별/분기별 수익을 차트로 표시
- **기본 크기**: 2x1

### 6. 📈 KPI 지표 위젯 (KPIWidget)
- **타입**: `kpi-metrics`
- **카테고리**: `analytics`
- **iOS 참고**: Fitness 앱의 메트릭 카드
- **설명**: 핵심 성과 지표를 한눈에
- **기본 크기**: 3x1

### 7. 💳 지출 추적기 위젯 (ExpenseTrackerWidget)
- **타입**: `expense-tracker`
- **카테고리**: `analytics`
- **iOS 참고**: Wallet 앱의 지출 트래킹
- **설명**: 카테고리별 지출 관리 및 예산 설정
- **기본 크기**: 2x2

### 8. 📊 손익 계산서 위젯 (ProfitLossWidget)
- **타입**: `profit-loss`
- **카테고리**: `analytics`
- **iOS 참고**: Numbers 앱의 재무 테이블
- **설명**: 수익과 비용을 비교하여 손익 분석
- **기본 크기**: 2x2

### 9. 💵 현금 흐름 위젯 (CashFlowWidget)
- **타입**: `cash-flow`
- **카테고리**: `analytics`
- **iOS 참고**: Wallet 앱의 거래 내역
- **설명**: 수입/지출 현금 흐름 시각화
- **기본 크기**: 3x2

### 10. 💰 예산 모니터 위젯 (BudgetMonitorWidget)
- **타입**: `budget-monitor`
- **카테고리**: `analytics`
- **iOS 참고**: Wallet 앱의 예산 추적
- **설명**: 예산 대비 실제 지출 모니터링
- **기본 크기**: 2x2



## 🚀 생산성 위젯 (10개)

### 11. 📝 할 일 목록 위젯 (TodoListWidget)
- **타입**: `todo-list`
- **카테고리**: `productivity`
- **iOS 참고**: Todoist + Reminders 앱의 계층적 구조
- **기본 크기**: 2x2 (최소: 1x1, 최대: 4x4)

#### 핵심 기능 - Todoist 스타일
1. **계층적 작업 구조** (드래그앤드롭)
   - 작업을 다른 작업 위로 드래그하여 하위 작업으로 변환
   - **하위 작업을 왼쪽으로 드래그하여 상위 레벨로 복원**
   - **Shift + 드래그로 같은 레벨 유지하며 이동**
   - 최대 4단계까지 중첩 가능
   - 들여쓰기로 시각적 계층 표시
   - 키보드 단축키: Tab (들여쓰기), Shift+Tab (내어쓰기)

2. **동적 섹션 관리**
   - 작업 사이 호버 시 "섹션 추가" 버튼 표시
   - 섹션별 접기/펼치기 기능
   - 섹션 이름 편집 및 삭제

3. **스마트 우선순위 시스템**
   - P1 (빨강): 긴급하고 중요한 작업
   - P2 (주황): 중요하지만 긴급하지 않음
   - P3 (파랑): 긴급하지만 중요하지 않음
   - P4 (회색/없음): 일반 작업

#### 상세 기능 정의
```typescript
// Todoist 스타일 작업 인터페이스
interface TodoTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'p1' | 'p2' | 'p3' | 'p4'; // Todoist 우선순위 시스템
  
  // 계층 구조
  parentId?: string;      // 상위 작업 ID
  depth: number;          // 중첩 레벨 (0-3)
  children: TodoTask[];   // 하위 작업들
  isExpanded: boolean;    // 하위 작업 표시 여부
  
  // 섹션 및 프로젝트
  sectionId: string;      // 속한 섹션
  projectId?: string;     // 프로젝트 연결
  
  // 시간 관련
  dueDate?: Date;
  dueTime?: string;       // "오늘", "내일", "이번 주" 등
  recurring?: {
    enabled: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    customPattern?: string; // "매주 월,수,금" 같은 패턴
  };
  
  // 메타데이터
  labels: string[];       // 태그/라벨
  assignee?: string;      // 담당자
  createdAt: Date;
  completedAt?: Date;
  completedBy?: string;
  
  // 협업 기능
  comments?: Comment[];
  attachments?: Attachment[];
}

// 섹션 인터페이스
interface TodoSection {
  id: string;
  name: string;
  order: number;
  isExpanded: boolean;
  color?: string;
  icon?: string;
}

// 드래그앤드롭 이벤트
interface DragDropEvent {
  draggedTask: TodoTask;
  targetTask?: TodoTask;
  targetSection?: TodoSection;
  position: 'before' | 'after' | 'child' | 'parent';  // parent 추가
  
  // 드래그 방향 및 동작
  dragDirection?: 'left' | 'right' | 'up' | 'down';
  shiftKey?: boolean;        // Shift 키 눌림 여부
  indentLevel?: number;       // 목표 들여쓰기 레벨 (0-3)
}

// 계층 조작 액션
interface HierarchyAction {
  type: 'indent' | 'outdent' | 'move-to-root' | 'make-subtask' | 'promote-to-parent';
  taskId: string;
  targetParentId?: string;    // 새로운 부모 작업 ID
  targetPosition?: number;    // 목표 위치
  preserveSiblings?: boolean; // 형제 작업들도 함께 이동
}

// 위젯 설정
interface TodoListWidgetConfig {
  // 표시 옵션
  showSections: boolean;
  showSubtasks: boolean;
  showCompletedTasks: boolean;
  groupByProject: boolean;
  
  // 정렬 옵션
  sortBy: 'priority' | 'dueDate' | 'alphabetical' | 'custom';
  sortOrder: 'asc' | 'desc';
  
  // 필터
  filterByPriority?: ('p1' | 'p2' | 'p3' | 'p4')[];
  filterByLabels?: string[];
  filterByAssignee?: string;
  
  // 테마
  theme: 'light' | 'dark' | 'auto';
  accentColor?: string;
  
  // 동작 설정
  enableDragDrop: boolean;
  enableQuickAdd: boolean;
  enableNaturalLanguageInput: boolean; // "내일 오후 3시 회의 준비 p1" 같은 입력
  
  // 계층 조작 설정
  enableKeyboardShortcuts: boolean;    // Tab/Shift+Tab 단축키 활성화
  showIndentGuides: boolean;           // 들여쓰기 가이드라인 표시
  autoPromoteOrphans: boolean;         // 부모 삭제 시 자식을 자동으로 상위로 승격
  maxNestingDepth: number;             // 최대 중첩 깊이 (기본: 4)
}
```

### 12. 📆 캘린더 위젯 (CalendarWidget)
- **타입**: `calendar`
- **카테고리**: `productivity`
- **스타일 참고**: Google Calendar + iOS Calendar 하이브리드
- **설명**: 구글 캘린더 스타일의 일정 관리 위젯 (Google Calendar API 연동 준비)
- **기본 크기**: 2x2 (최소: 2x2, 최대: 4x4)

#### 상세 기능 정의

##### 📊 데이터 모델 (Google Calendar API v3 호환)
```typescript
// 이벤트 인터페이스 (Google Calendar Event 스키마 기반)
interface CalendarEvent {
  id: string;                        // 이벤트 고유 ID
  calendarId?: string;               // 소속 캘린더 ID
  
  // 기본 정보
  summary: string;                   // 이벤트 제목
  description?: string;              // 상세 설명
  location?: string;                 // 장소 (주소 또는 회의실)
  status?: 'confirmed' | 'tentative' | 'cancelled';  // 상태
  
  // 시간 정보
  start: EventDateTime;              // 시작 시간
  end: EventDateTime;                // 종료 시간
  allDay?: boolean;                  // 종일 이벤트 여부
  timezone?: string;                 // 타임존 (Asia/Seoul 등)
  
  // 참석자 정보
  organizer?: EventAttendee;         // 주최자
  attendees?: EventAttendee[];       // 참석자 목록
  
  // 반복 설정
  recurrence?: string[];              // RRULE 형식 반복 규칙
  recurringEventId?: string;          // 반복 이벤트의 마스터 ID
  originalStartTime?: EventDateTime;  // 원래 시작 시간 (반복 예외)
  
  // 알림 설정
  reminders?: {
    useDefault: boolean;             // 기본 알림 사용
    overrides?: EventReminder[];    // 커스텀 알림
  };
  
  // 시각화
  colorId?: string;                  // Google Calendar 색상 ID (1-11)
  backgroundColor?: string;          // 커스텀 배경색
  foregroundColor?: string;          // 커스텀 글자색
  
  // 메타데이터
  created?: Date;                    // 생성일시
  updated?: Date;                    // 수정일시
  creator?: EventAttendee;           // 생성자
  htmlLink?: string;                 // 웹 링크
  
  // 확장 속성
  extendedProperties?: {
    private?: Record<string, string>; // 비공개 속성
    shared?: Record<string, string>;  // 공유 속성
  };
  
  // 회의 정보
  conferenceData?: {
    entryPoints?: ConferenceEntryPoint[];
    conferenceSolution?: ConferenceSolution;
    createRequest?: CreateConferenceRequest;
  };
}

// 날짜/시간 정보
interface EventDateTime {
  date?: string;         // 날짜 (YYYY-MM-DD) - 종일 이벤트용
  dateTime?: string;     // 날짜+시간 (RFC3339) - 시간 지정 이벤트용
  timeZone?: string;     // 타임존
}

// 참석자 정보
interface EventAttendee {
  id?: string;
  email: string;
  displayName?: string;
  organizer?: boolean;
  self?: boolean;
  resource?: boolean;
  optional?: boolean;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  comment?: string;
  additionalGuests?: number;
}

// 알림 설정
interface EventReminder {
  method: 'email' | 'popup' | 'sms';
  minutes: number;      // 이벤트 전 알림 시간 (분)
}

// 캘린더 정보
interface Calendar {
  id: string;
  summary: string;                   // 캘린더 이름
  description?: string;               // 설명
  location?: string;                  // 위치
  timeZone?: string;                  // 기본 타임존
  
  // 색상 설정
  colorId?: string;                   // Google 색상 ID
  backgroundColor?: string;           // 배경색
  foregroundColor?: string;           // 글자색
  
  // 권한 및 공유
  accessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  defaultReminders?: EventReminder[];  // 기본 알림
  
  // 상태
  selected?: boolean;                  // UI에서 선택 여부
  hidden?: boolean;                    // 숨김 여부
  primary?: boolean;                   // 주 캘린더 여부
}

// 회의 정보
interface ConferenceEntryPoint {
  entryPointType: 'video' | 'phone' | 'sip' | 'more';
  uri?: string;
  label?: string;
  pin?: string;
  accessCode?: string;
  meetingCode?: string;
  passcode?: string;
  password?: string;
}

interface ConferenceSolution {
  key: {
    type: string;  // 'hangoutsMeet', 'zoom', 'teams' 등
  };
  name: string;
  iconUri: string;
}

// 위젯 설정
interface CalendarWidgetConfig {
  title?: string;
  
  // 뷰 설정
  defaultView?: 'month' | 'week' | 'day' | 'agenda';
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0=일요일, 1=월요일
  showWeekNumbers?: boolean;
  
  // 표시 옵션
  calendars?: string[];                // 표시할 캘린더 ID 목록
  maxEventsPerDay?: number;            // 일별 최대 표시 이벤트 수
  showDeclinedEvents?: boolean;        // 거절된 이벤트 표시
  showWeekends?: boolean;              // 주말 표시
  
  // Google Calendar 연동
  googleCalendarEnabled?: boolean;      // Google Calendar 연동 활성화
  syncInterval?: number;                // 동기화 간격 (분)
  offlineMode?: boolean;               // 오프라인 모드
  
  // 한국 특화 기능
  showKoreanHolidays?: boolean;        // 한국 공휴일 표시
  showLunarCalendar?: boolean;         // 음력 표시
  
  // 테마 설정
  theme?: 'light' | 'dark' | 'auto';
  colorScheme?: 'google' | 'pastel' | 'material' | 'custom';
  
  // 권한 설정
  allowCreate?: boolean;                // 이벤트 생성 허용
  allowEdit?: boolean;                  // 이벤트 편집 허용
  allowDelete?: boolean;                // 이벤트 삭제 허용
  
  // 알림 설정
  enableReminders?: boolean;            // 알림 활성화
  defaultReminderMinutes?: number;      // 기본 알림 시간
}
```

##### 🎨 UI 컴포넌트 구조

```typescript
interface CalendarWidgetProps {
  id: string;
  config?: CalendarWidgetConfig;
  
  // 이벤트 핸들러
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventCreate?: (event: Partial<CalendarEvent>) => void;
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void;
  onEventDelete?: (eventId: string) => void;
  onViewChange?: (view: 'month' | 'week' | 'day' | 'agenda') => void;
  
  // Google Calendar 연동
  onGoogleAuthRequired?: () => void;
  onSyncStatusChange?: (status: 'syncing' | 'synced' | 'error') => void;
}
```

##### 📱 View 모드별 기능

**1. Month View (기본)**
- 7x6 그리드 레이아웃
- 이전/다음 달 날짜 흐림 표시
- 일별 최대 3개 이벤트 표시 + "+N more" 표시
- 오늘 날짜 하이라이트
- 한국 공휴일 빨간색 표시

**2. Week View**
- 7일 x 24시간 그리드
- 시간별 이벤트 블록
- 현재 시간 라인 표시
- 드래그로 이벤트 생성
- 이벤트 충돌 시 자동 너비 조정

**3. Day View**
- 24시간 세로 타임라인
- 분 단위 정밀 표시
- 종일 이벤트 상단 영역
- 시간대별 이벤트 상세 표시

**4. Agenda View**
- 리스트 형식 이벤트 표시
- 날짜별 그루핑
- 무한 스크롤
- 검색 및 필터 기능

##### 🎨 Material Design 색상 시스템

```typescript
const GOOGLE_CALENDAR_COLORS = {
  1: { background: '#a4bdfc', foreground: '#1d1d1d' },  // Lavender
  2: { background: '#7ae7bf', foreground: '#1d1d1d' },  // Sage
  3: { background: '#dbadff', foreground: '#1d1d1d' },  // Grape
  4: { background: '#ff887c', foreground: '#1d1d1d' },  // Flamingo
  5: { background: '#fbd75b', foreground: '#1d1d1d' },  // Banana
  6: { background: '#ffb878', foreground: '#1d1d1d' },  // Tangerine
  7: { background: '#46d6db', foreground: '#1d1d1d' },  // Peacock
  8: { background: '#e1e1e1', foreground: '#1d1d1d' },  // Graphite
  9: { background: '#5484ed', foreground: '#ffffff' },  // Blueberry
  10: { background: '#51b749', foreground: '#ffffff' }, // Basil
  11: { background: '#dc2127', foreground: '#ffffff' }  // Tomato
};
```

##### 🔄 Google Calendar API 연동 준비

```typescript
// API 엔드포인트 매핑
interface CalendarAPIService {
  // 인증
  authorize(): Promise<void>;
  refreshToken(): Promise<string>;
  
  // 캘린더 목록
  listCalendars(): Promise<Calendar[]>;
  getCalendar(calendarId: string): Promise<Calendar>;
  
  // 이벤트 CRUD
  listEvents(params: {
    calendarId: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    orderBy?: 'startTime' | 'updated';
  }): Promise<CalendarEvent[]>;
  
  getEvent(calendarId: string, eventId: string): Promise<CalendarEvent>;
  
  createEvent(calendarId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent>;
  
  updateEvent(
    calendarId: string, 
    eventId: string, 
    event: Partial<CalendarEvent>
  ): Promise<CalendarEvent>;
  
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
  
  // 동기화
  watchEvents(calendarId: string): Promise<void>;
  syncEvents(calendarId: string, syncToken?: string): Promise<{
    events: CalendarEvent[];
    nextSyncToken: string;
  }>;
}
```

##### 🎯 핵심 기능

1. **빠른 이벤트 생성**
   - 날짜 클릭 → 간단 입력 모달
   - 자연어 입력 지원 ("내일 오후 3시 회의")
   - 기본 알림 자동 설정

2. **드래그 앤 드롭**
   - 이벤트 날짜/시간 변경
   - 이벤트 기간 조정 (리사이즈)
   - 캘린더 간 이벤트 이동

3. **반복 일정**
   - RRULE 표준 지원
   - 복잡한 반복 패턴 (매월 둘째 화요일 등)
   - 반복 예외 처리

4. **스마트 기능**
   - 충돌 감지 및 알림
   - 여행 시간 자동 계산 (장소 기반)
   - 회의실 자동 예약

5. **협업 기능**
   - 참석자 초대 및 응답 관리
   - 바쁜 시간 확인
   - 공유 캘린더 지원

##### ⚡ 성능 최적화

- 가상 스크롤링 (대량 이벤트)
- 이벤트 데이터 캐싱
- 점진적 로딩 (월별 데이터)
- Web Worker를 통한 반복 일정 계산
- IndexedDB 오프라인 저장소

### 13. 🔔 최근 활동 위젯 (RecentActivityWidget)
- **타입**: `recent-activity`
- **카테고리**: `productivity`
- **iOS 참고**: Notification Center의 타임라인

#### 개념 및 필요성
- **목적**: 모든 시스템 알림을 중앙에서 관리
- **가치**: 중요한 정보를 놓치지 않도록 통합 관리
- **iOS 참고**: Notification Center

#### 상세 기능 정의
```typescript
interface NotificationCenterWidgetProps {
  id: string;
  config?: {
    maxNotifications?: number;
    groupByApp?: boolean;
    showBadges?: boolean;
    enableSound?: boolean;
    priorities?: ('high' | 'medium' | 'low')[];
  };
  onNotificationClick?: (notification: Notification) => void;
  onClearAll?: () => void;
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  source: string;        // 어느 위젯/시스템에서 온 알림인지
  actionUrl?: string;    // 클릭 시 이동할 URL
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  actions?: {
    label: string;
    action: () => void;
  }[];
}
```

### 14. ⏰ 시간 추적기 위젯 (TimeTrackerWidget)
- **타입**: `time-tracker`
- **카테고리**: `productivity`
- **iOS 참고**: Screen Time 앱의 활동 추적
- **설명**: 프로젝트별 시간 추적 및 리포트
- **기본 크기**: 2x2

### 15. 🍅 뽀모도로 타이머 위젯 (PomodoroWidget)
- **타입**: `pomodoro`
- **카테고리**: `productivity`
- **iOS 참고**: Clock 앱의 타이머
- **설명**: 집중력 향상을 위한 뽀모도로 기법 타이머
- **기본 크기**: 2x2

### 16. 📝 메모 위젯 (NotesWidget)
- **타입**: `notes`
- **카테고리**: `productivity`
- **iOS 참고**: Notes 앱
- **설명**: 간단한 메모와 아이디어 저장
- **기본 크기**: 1x2

### 17. 🔔 리마인더 위젯 (RemindersWidget)
- **타입**: `reminders`
- **카테고리**: `productivity`
- **iOS 참고**: Reminders 앱
- **설명**: 중요한 일정과 알림 관리
- **기본 크기**: 2x2

### 18. ☁️ 날씨 정보 위젯 (WeatherWidget)
- **타입**: `weather`
- **카테고리**: `productivity`
- **iOS 참고**: Weather 앱
- **설명**: 현재 위치 날씨 및 5일 예보
- **기본 크기**: 2x1

### 19. 📰 뉴스 피드 위젯 (NewsFeedWidget)
- **타입**: `news-feed`
- **카테고리**: `productivity`
- **iOS 참고**: News 앱
- **설명**: 관심 분야 최신 뉴스 표시
- **기본 크기**: 2x3

### 20. 📊 분석 대시보드 위젯 (AnalyticsDashboardWidget)
- **타입**: `analytics-dashboard`
- **카테고리**: `productivity`
- **iOS 참고**: Screen Time 앱의 통계
- **설명**: 통합 분석 및 인사이트 제공
- **기본 크기**: 3x3


## 🎨 커스텀/기타 위젯 (2개)

### 21. ⚡ 빠른 실행 위젯 (QuickActionsWidget)
- **타입**: `quick-actions`
- **카테고리**: `custom`
- **목적**: 자주 사용하는 기능 바로가기
- **가치**: 클릭 한 번으로 주요 작업 실행
- **iOS 참고**: Control Center 토글

#### 구현 예시
```tsx
const QuickActionsWidget: React.FC = () => {
  const actions = [
    { icon: '📊', label: '보고서 생성', action: generateReport },
    { icon: '📧', label: '일괄 메일 발송', action: sendBulkEmail },
    { icon: '💾', label: '백업 실행', action: runBackup },
    { icon: '🔄', label: '동기화', action: syncData },
    { icon: '📈', label: '분석 시작', action: startAnalysis },
    { icon: '🔒', label: '잠금 모드', action: enableLockMode }
  ];
  
  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {actions.map(action => (
        <IOSControlButton
          key={action.label}
          icon={action.icon}
          label={action.label}
          onClick={action.action}
          hapticFeedback="impact"
        />
      ))}
    </div>
  );
};
```

### 22. 👥 팀 협업 위젯 (TeamCollaborationWidget)
- **타입**: `team-collaboration`
- **카테고리**: `custom`
- **목적**: 실시간 팀 커뮤니케이션 및 협업
- **가치**: 대시보드에서 바로 팀 상태 확인 및 소통
- **iOS 참고**: Messages 앱의 그룹 채팅

#### UI 구성
```tsx
const TeamCollaborationWidget: React.FC = () => {
  return (
    <div className="ios-widget-container">
      {/* 팀 멤버 상태 (온라인/오프라인) */}
      <TeamMemberStatus members={teamMembers} />
      
      {/* 최근 메시지 */}
      <RecentMessages 
        messages={messages}
        onReply={(message) => {/* 답장 */}}
      />
      
      {/* 공유 파일 */}
      <SharedFiles 
        files={sharedFiles}
        onFileClick={(file) => {/* 파일 열기 */}}
      />
      
      {/* 빠른 메시지 입력 */}
      <QuickMessageInput 
        onSend={(message) => {/* 메시지 전송 */}}
      />
    </div>
  );
};
```

### 23. 🤖 AI 어시스턴트 위젯 (AIAssistantWidget)

#### 개념 및 필요성
- **목적**: AI 기반 업무 도우미 및 인사이트 제공
- **가치**: 자연어로 명령하고 추천받기
- **iOS 참고**: Siri 인터페이스

#### 기능 예시
```typescript
interface AIAssistantWidgetProps {
  id: string;
  config?: {
    model?: 'gpt-4' | 'gpt-3.5' | 'claude';
    capabilities?: ('chat' | 'analysis' | 'automation')[];
    maxTokens?: number;
    temperature?: number;
  };
  onCommand?: (command: string) => Promise<AIResponse>;
}

// 사용 예시
const commands = [
  "이번 달 매출 요약해줘",
  "내일 일정 정리해줘",
  "프로젝트 진행률 분석해줘",
  "세금 신고 마감일 알려줘"
];
```

## 📊 성능 최적화 체크리스트

- [ ] React.lazy()로 위젯 동적 로딩
- [ ] useMemo()로 expensive 계산 캐싱
- [ ] useCallback()으로 함수 재생성 방지
- [ ] 큰 리스트는 react-window 사용
- [ ] 이미지는 next/image 사용
- [ ] 불필요한 re-render 방지 (React.memo)
- [ ] 애니메이션은 transform/opacity만 사용
- [ ] will-change CSS 속성 신중하게 사용

## 🎯 접근성(A11y) 체크리스트

- [ ] 모든 인터랙티브 요소에 aria-label
- [ ] 키보드 내비게이션 지원 (Tab, Enter, Esc)
- [ ] Focus 표시가 명확한가?
- [ ] 색상 대비 7:1 이상
- [ ] 스크린 리더 테스트 완료
- [ ] role 속성 적절히 사용
- [ ] 에러 메시지 접근 가능
- [ ] 로딩 상태 알림


## 🏛️ 아키텍처 패턴 상세

### 위젯 레지스트리 패턴 (실제 프로젝트 구조)
```typescript
// src/lib/dashboard/ios-widget-registry.ts
// 싱글톤 패턴으로 구현된 iOS 스타일 위젯 레지스트리
class IOSWidgetRegistry {
  private static instance: IOSWidgetRegistry;
  private widgets: Map<string, WidgetDefinition> = new Map();
  
  static getInstance(): IOSWidgetRegistry {
    if (!IOSWidgetRegistry.instance) {
      IOSWidgetRegistry.instance = new IOSWidgetRegistry();
    }
    return IOSWidgetRegistry.instance;
  }
  
  register(type: string, component: React.FC, metadata: WidgetMetadata) {
    this.widgets.set(type, { component, metadata });
  }
  
  getWidget(type: string): WidgetDefinition | undefined {
    return this.widgets.get(type);
  }
  
  getAllWidgets(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }
}

// iOS 스타일 위젯 레지스트리는 별도로 관리
export const iosWidgetRegistry = IOSWidgetRegistry.getInstance();
```

### Lazy Loading 패턴
```typescript
// 동적 임포트와 Suspense를 활용한 최적화
const LazyWidget = lazy(() => 
  import('./widgets/HeavyWidget')
    .then(module => ({
      default: module.HeavyWidget
    }))
);

// 사용 시
<Suspense fallback={<WidgetSkeleton />}>
  <ErrorBoundary fallback={<WidgetError />}>
    <LazyWidget {...props} />
  </ErrorBoundary>
</Suspense>
```

### 상태 관리 패턴 (Zustand - iOS 대시보드 스토어)
```typescript
// src/lib/stores/useIOSDashboardStore.ts
// 실제 프로젝트에서 사용 중인 iOS 대시보드 스토어
import { create } from 'zustand';
import { IOSStyleWidget } from '@/types/ios-dashboard';

interface IOSDashboardStore {
  // 상태
  widgets: IOSStyleWidget[];
  isEditMode: boolean;
  isWiggling: boolean;
  selectedWidgetId: string | null;
  
  // 액션
  addWidget: (widget: IOSStyleWidget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<IOSStyleWidget>) => void;
  updateWidgetPosition: (id: string, position: { x: number; y: number }) => void;
  toggleEditMode: () => void;
  startWiggle: () => void;
  stopWiggle: () => void;
  
  // 드래그 앤 드롭 (@hello-pangea/dnd)
  handleDragEnd: (result: DropResult) => void;
  
  // 레이아웃
  updateLayout: (widgets: IOSStyleWidget[]) => void;
  resetLayout: () => void;
  
  // 성능 최적화
  batchUpdate: (updates: Array<{ id: string; changes: Partial<IOSStyleWidget> }>) => void;
}

export const useIOSDashboardStore = create<IOSDashboardStore>((set) => ({
  widgets: [],
  isEditMode: false,
  isWiggling: false,
  selectedWidgetId: null,
  
  addWidget: (widget) => 
    set(state => ({ 
      widgets: [...state.widgets, widget] 
    })),
  
  removeWidget: (id) => 
    set(state => ({ 
      widgets: state.widgets.filter(w => w.id !== id) 
    })),
  
  updateWidget: (id, updates) =>
    set(state => ({
      widgets: state.widgets.map(w => 
        w.id === id ? { ...w, ...updates } : w
      )
    })),
  
  updateWidgetPosition: (id, position) =>
    set(state => ({
      widgets: state.widgets.map(w =>
        w.id === id ? { ...w, position } : w
      )
    })),
  
  toggleEditMode: () => 
    set(state => ({ 
      isEditMode: !state.isEditMode,
      isWiggling: !state.isEditMode // iOS 스타일 wiggle 애니메이션
    })),
  
  startWiggle: () => set({ isWiggling: true }),
  stopWiggle: () => set({ isWiggling: false }),
  
  // @hello-pangea/dnd 드래그 처리
  handleDragEnd: (result) => {
    if (!result.destination) return;
    
    set(state => {
      const widgets = [...state.widgets];
      const [reorderedWidget] = widgets.splice(result.source.index, 1);
      widgets.splice(result.destination!.index, 0, reorderedWidget);
      return { widgets };
    });
  },
  
  updateLayout: (widgets) => set({ widgets }),
  resetLayout: () => set({ widgets: [] }),
  
  batchUpdate: (updates) =>
    set(state => ({
      widgets: state.widgets.map(widget => {
        const update = updates.find(u => u.id === widget.id);
        return update ? { ...widget, ...update.changes } : widget;
      })
    }))
}));
```

## 🔐 보안 가이드라인

### 입력 검증
```typescript
// Zod를 활용한 스키마 검증
const widgetConfigSchema = z.object({
  title: z.string().max(100),
  refreshInterval: z.number().min(10).max(3600),
  maxItems: z.number().min(1).max(100),
  theme: z.enum(['light', 'dark', 'auto'])
});

// 사용 예시
try {
  const validConfig = widgetConfigSchema.parse(userInput);
  // 안전한 설정 사용
} catch (error) {
  // 검증 실패 처리
}
```

### XSS 방지
```typescript
// React의 기본 XSS 보호 + 추가 sanitization
import DOMPurify from 'isomorphic-dompurify';

const SafeHTMLContent: React.FC<{ html: string }> = ({ html }) => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
    ALLOWED_ATTR: ['class']
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

## 📈 성능 모니터링

### 위젯 성능 측정
```typescript
// Performance Observer API 활용
const measureWidgetPerformance = (widgetName: string) => {
  const startMark = `${widgetName}-start`;
  const endMark = `${widgetName}-end`;
  
  performance.mark(startMark);
  
  // 위젯 렌더링
  
  performance.mark(endMark);
  performance.measure(widgetName, startMark, endMark);
  
  const measure = performance.getEntriesByName(widgetName)[0];
  console.log(`${widgetName} 렌더링 시간: ${measure.duration}ms`);
};
```

### React DevTools Profiler 활용
```typescript
import { Profiler } from 'react';

const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) => {
  // 성능 데이터 수집
  analytics.track('widget_render', {
    widgetId: id,
    phase,
    duration: actualDuration
  });
};

<Profiler id="widget" onRender={onRenderCallback}>
  <Widget />
</Profiler>
```

## 📊 분석 및 모니터링

### 위젯 사용 통계
```typescript
// Google Analytics 4 연동
const trackWidgetUsage = (action: string, widgetType: string) => {
  gtag('event', 'widget_interaction', {
    action,
    widget_type: widgetType,
    user_id: getUserId(),
    timestamp: new Date().toISOString()
  });
};

// Sentry 에러 추적
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // 위젯 관련 컨텍스트 추가
    if (event.tags?.widget) {
      event.fingerprint = ['widget', event.tags.widget];
    }
    return event;
  }
});
```

## 🎯 결론

이 문서는 WEAVE 대시보드 위젯 시스템을 iOS 스타일로 재설계한 포괄적인 가이드입니다.

### 핵심 개선사항
1. **iOS 디자인 시스템 적용**: 일관된 사용자 경험 제공
2. **실제 기술 스택 반영**: 
   - @hello-pangea/dnd (Beautiful DnD 포크)
   - recharts, chart.js (차트 라이브러리)
   - lucide-react (아이콘)
   - Zustand 5.0 (상태 관리)
3. **5개 신규 위젯 제안**: 생산성과 협업 강화
4. **상세한 구현 가이드**: 초급 개발자도 쉽게 따라할 수 있는 문서
5. **성능과 접근성 최적화**: 모든 사용자를 위한 빠르고 접근 가능한 시스템