// Mock 프로젝트 서비스 - Supabase 연결 제거

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  client_id?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  start_date?: string;
  due_date?: string;
  budget_estimated?: number;
  budget_actual?: number;
  created_at: string;
  updated_at: string;
  clients?: {
    id: string;
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
  };
}

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'clients'>;
export type ProjectUpdate = Partial<ProjectInsert>;

// Mock 데이터
const mockProjects: Project[] = [
  {
    id: 'proj-1',
    user_id: 'mock-user',
    name: '웹사이트 리뉴얼',
    description: '기업 웹사이트 전면 리뉴얼 프로젝트',
    client_id: 'client-1',
    status: 'in_progress',
    start_date: '2024-11-01',
    due_date: '2025-01-31',
    budget_estimated: 5000000,
    budget_actual: 3000000,
    created_at: '2024-11-01T09:00:00Z',
    updated_at: '2024-12-10T09:00:00Z',
    clients: {
      id: 'client-1',
      name: '김철수',
      company: '㈜테크스타트',
      email: 'kim@techstart.com',
      phone: '010-1234-5678'
    }
  },
  {
    id: 'proj-2',
    user_id: 'mock-user',
    name: '모바일 앱 개발',
    description: 'iOS/Android 하이브리드 앱 개발',
    client_id: 'client-2',
    status: 'planning',
    start_date: '2025-01-01',
    due_date: '2025-03-31',
    budget_estimated: 8000000,
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
    clients: {
      id: 'client-2',
      name: '이영희',
      company: '디자인컴퍼니',
      email: 'lee@designcompany.com',
      phone: '010-2345-6789'
    }
  },
  {
    id: 'proj-3',
    user_id: 'mock-user',
    name: '쇼핑몰 구축',
    description: '온라인 쇼핑몰 플랫폼 구축',
    client_id: 'client-3',
    status: 'completed',
    start_date: '2024-09-01',
    due_date: '2024-11-30',
    budget_estimated: 6000000,
    budget_actual: 6500000,
    created_at: '2024-09-01T09:00:00Z',
    updated_at: '2024-11-30T18:00:00Z',
    clients: {
      id: 'client-3',
      name: '박민수',
      company: '이커머스플러스',
      email: 'park@ecommerce.com',
      phone: '010-3456-7890'
    }
  }
];

export class ProjectsService {
  async getProjects(userId: string): Promise<Project[]> {
    // Mock 데이터 반환
    return mockProjects.filter(p => p.user_id === 'mock-user');
  }

  async getProjectById(id: string): Promise<Project | null> {
    return mockProjects.find(p => p.id === id) || null;
  }

  async createProject(data: ProjectInsert): Promise<Project> {
    const newProject: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockProjects.push(newProject);
    return newProject;
  }

  async updateProject(id: string, data: ProjectUpdate): Promise<Project> {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    
    mockProjects[index] = {
      ...mockProjects[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    return mockProjects[index];
  }

  async deleteProject(id: string): Promise<void> {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    mockProjects.splice(index, 1);
  }

  async getClientProjects(clientId: string): Promise<Project[]> {
    return mockProjects.filter(p => p.client_id === clientId);
  }

  async getProjectsByClient(clientId: string): Promise<Project[]> {
    return mockProjects.filter(p => p.client_id === clientId);
  }

  async getProjectStatistics() {
    const total = mockProjects.length;
    const inProgress = mockProjects.filter(p => p.status === 'in_progress').length;
    const completed = mockProjects.filter(p => p.status === 'completed').length;
    const onHold = mockProjects.filter(p => p.status === 'on_hold').length;
    
    return {
      total,
      inProgress,
      completed,
      onHold,
      totalBudget: mockProjects.reduce((sum, p) => sum + (p.budget_estimated || 0), 0),
      actualSpent: mockProjects.reduce((sum, p) => sum + (p.budget_actual || 0), 0)
    };
  }

  async updateProjectStatus(id: string, status: Project['status']): Promise<Project> {
    return this.updateProject(id, { status });
  }

  async getUpcomingDeadlines(days: number = 14): Promise<Project[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return mockProjects.filter(p => {
      if (!p.due_date || p.status === 'completed') return false;
      const dueDate = new Date(p.due_date);
      return dueDate >= now && dueDate <= futureDate;
    });
  }
}

export const projectsService = new ProjectsService();