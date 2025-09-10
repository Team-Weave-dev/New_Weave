// 목업 데이터 서비스
// 추후 실제 API/DB와 연동 가능하도록 설계

// 사용자 정보 타입
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  businessNumber: string;
  address: string;
  representative: string;
  businessType: string;
  businessItem: string;
}

// 클라이언트 정보 타입
export interface ClientInfo {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  businessNumber?: string;
  representative?: string;
  businessType?: string;
  businessItem?: string;
  createdAt: Date;
}

// 프로젝트 정보 타입
export interface ProjectInfo {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  budget: number;
  description: string;
  deliverables: string[];
  paymentTerms: string;
  createdAt: Date;
}

// 목업 사용자 데이터 (로그인한 사용자 정보)
const mockUserData: UserInfo = {
  id: 'user-001',
  name: '김철수',
  email: 'kim@weave.com',
  phone: '010-1234-5678',
  company: '위브 테크놀로지',
  businessNumber: '123-45-67890',
  address: '서울특별시 강남구 테헤란로 123, 4층',
  representative: '김철수',
  businessType: '서비스업',
  businessItem: '소프트웨어 개발 및 공급업'
};

// 목업 클라이언트 데이터
const mockClientsData: ClientInfo[] = [
  {
    id: 'client-001',
    name: '이영희',
    company: '스타트업 주식회사',
    email: 'lee@startup.com',
    phone: '02-2222-3333',
    address: '서울특별시 서초구 서초대로 456',
    businessNumber: '987-65-43210',
    representative: '이영희',
    businessType: '도소매업',
    businessItem: '전자상거래업',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'client-002',
    name: '박민수',
    company: '테크 이노베이션',
    email: 'park@techinno.com',
    phone: '031-444-5555',
    address: '경기도 성남시 분당구 판교로 789',
    businessNumber: '456-78-90123',
    representative: '박민수',
    businessType: '제조업',
    businessItem: 'IoT 디바이스 제조',
    createdAt: new Date('2024-03-20')
  },
  {
    id: 'client-003',
    name: '최지원',
    company: '크리에이티브 스튜디오',
    email: 'choi@creative.com',
    phone: '02-6666-7777',
    address: '서울특별시 마포구 연남로 321',
    businessNumber: '321-09-87654',
    representative: '최지원',
    businessType: '서비스업',
    businessItem: '디자인 및 컨설팅',
    createdAt: new Date('2024-05-10')
  }
];

// 목업 프로젝트 데이터
const mockProjectsData: ProjectInfo[] = [
  {
    id: 'project-001',
    name: '이커머스 플랫폼 구축',
    clientId: 'client-001',
    clientName: '스타트업 주식회사',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    status: 'in_progress',
    budget: 50000000,
    description: '모바일 중심의 이커머스 플랫폼 구축 프로젝트입니다. React Native를 사용한 크로스 플랫폼 앱 개발과 Node.js 기반 백엔드 API 서버를 구축합니다.',
    deliverables: [
      'iOS/Android 앱',
      'Admin 웹 대시보드',
      'REST API 서버',
      '기술 문서'
    ],
    paymentTerms: '계약 시 30%, 중간 30%, 완료 시 40%',
    createdAt: new Date('2024-12-15')
  },
  {
    id: 'project-002',
    name: 'IoT 대시보드 개발',
    clientId: 'client-002',
    clientName: '테크 이노베이션',
    startDate: '2025-02-01',
    endDate: '2025-04-30',
    status: 'planning',
    budget: 35000000,
    description: 'IoT 디바이스 관리 및 모니터링을 위한 실시간 대시보드 개발. WebSocket을 활용한 실시간 데이터 시각화와 디바이스 제어 기능을 포함합니다.',
    deliverables: [
      '웹 대시보드',
      '실시간 모니터링 시스템',
      'API 서버',
      '사용자 매뉴얼'
    ],
    paymentTerms: '계약 시 40%, 완료 시 60%',
    createdAt: new Date('2025-01-10')
  },
  {
    id: 'project-003',
    name: '브랜드 웹사이트 리뉴얼',
    clientId: 'client-003',
    clientName: '크리에이티브 스튜디오',
    startDate: '2024-11-01',
    endDate: '2024-12-31',
    status: 'completed',
    budget: 25000000,
    description: '기업 브랜드 웹사이트 전면 리뉴얼. 모던한 디자인과 반응형 레이아웃, SEO 최적화를 적용한 Next.js 기반 웹사이트입니다.',
    deliverables: [
      '반응형 웹사이트',
      'CMS 시스템',
      'SEO 최적화',
      '호스팅 설정'
    ],
    paymentTerms: '계약 시 50%, 완료 시 50%',
    createdAt: new Date('2024-10-20')
  }
];

// 데이터 조회 서비스 함수들

/**
 * 현재 로그인한 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<UserInfo> {
  // Mock 사용자 확인 (개발용)
  if (typeof window !== 'undefined') {
    const mockUser = localStorage.getItem('mock_user');
    if (mockUser) {
      const userData = JSON.parse(mockUser);
      // Mock 사용자 데이터 반환
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          ...mockUserData,
          id: userData.id || 'mock-user-id',
          email: userData.email || 'test@example.com',
          name: userData.name || '테스트 사용자'
        }), 100);
      });
    }
  }
  
  // 실제 구현 시 API 호출로 대체
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockUserData), 100);
  });
}

/**
 * 클라이언트 목록 조회
 */
export async function getClients(): Promise<ClientInfo[]> {
  // 실제 구현 시 API 호출로 대체
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockClientsData), 100);
  });
}

/**
 * 특정 클라이언트 정보 조회
 */
export async function getClientById(clientId: string): Promise<ClientInfo | undefined> {
  // 실제 구현 시 API 호출로 대체
  return new Promise((resolve) => {
    setTimeout(() => {
      const client = mockClientsData.find(c => c.id === clientId);
      resolve(client);
    }, 100);
  });
}

/**
 * 프로젝트 목록 조회
 */
export async function getProjects(): Promise<ProjectInfo[]> {
  // 실제 구현 시 API 호출로 대체
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockProjectsData), 100);
  });
}

/**
 * 특정 프로젝트 정보 조회
 */
export async function getProjectById(projectId: string): Promise<ProjectInfo | undefined> {
  // 실제 구현 시 API 호출로 대체
  return new Promise((resolve) => {
    setTimeout(() => {
      const project = mockProjectsData.find(p => p.id === projectId);
      resolve(project);
    }, 100);
  });
}

/**
 * 클라이언트별 프로젝트 조회
 */
export async function getProjectsByClientId(clientId: string): Promise<ProjectInfo[]> {
  // 실제 구현 시 API 호출로 대체
  return new Promise((resolve) => {
    setTimeout(() => {
      const projects = mockProjectsData.filter(p => p.clientId === clientId);
      resolve(projects);
    }, 100);
  });
}

/**
 * 통합 문서 생성용 데이터 조회
 * 문서 생성 시 필요한 모든 관련 데이터를 한 번에 조회
 */
export async function getDocumentGenerationData(projectId?: string, clientId?: string) {
  const user = await getCurrentUser();
  const clients = await getClients();
  const projects = await getProjects();
  
  let selectedProject: ProjectInfo | undefined;
  let selectedClient: ClientInfo | undefined;
  
  if (projectId) {
    selectedProject = await getProjectById(projectId);
    if (selectedProject) {
      selectedClient = await getClientById(selectedProject.clientId);
    }
  } else if (clientId) {
    selectedClient = await getClientById(clientId);
  }
  
  return {
    user,
    clients,
    projects,
    selectedProject,
    selectedClient
  };
}