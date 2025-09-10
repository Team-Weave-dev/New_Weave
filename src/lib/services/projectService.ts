/**
 * 프로젝트 서비스
 * 프로젝트 관련 데이터 조회 및 관리
 */

import { ProjectDetail, ProjectSummary, ProjectStatus, ProjectPriority } from '../types/project';

/**
 * 프로젝트 서비스 클래스
 */
export class ProjectService {
  // 임시 데이터 저장소 (실제로는 데이터베이스 사용)
  private static projects: Map<string, ProjectDetail> = new Map();

  /**
   * 초기 샘플 데이터 생성
   */
  static initializeSampleData() {
    const sampleProjects: ProjectDetail[] = [
      {
        id: 'proj_001',
        name: 'WEAVE 플랫폼 개발',
        description: 'AI 기반 업무 자동화 플랫폼 개발 프로젝트',
        clientId: 'client_001',
        clientName: '테크스타트업 A사',
        status: 'in_progress' as ProjectStatus,
        priority: 'high' as ProjectPriority,
        startDate: '2024-01-15',
        dueDate: '2024-06-30',
        progress: 65,
        budget: {
          estimated: 50000000,
          spent: 32500000,
          remaining: 17500000,
          currency: 'KRW'
        },
        totalRevenue: 50000000,
        totalExpenses: 32500000,
        profitMargin: 35,
        milestones: [
          {
            id: 'ms_001',
            title: '기획 및 설계',
            description: '시스템 아키텍처 설계',
            dueDate: '2024-02-15',
            completedDate: '2024-02-10',
            isCompleted: true,
            progress: 100
          },
          {
            id: 'ms_002',
            title: '백엔드 개발',
            description: 'API 및 데이터베이스 구축',
            dueDate: '2024-04-15',
            isCompleted: false,
            progress: 80
          },
          {
            id: 'ms_003',
            title: '프론트엔드 개발',
            description: 'UI/UX 구현',
            dueDate: '2024-05-30',
            isCompleted: false,
            progress: 60
          }
        ],
        team: [
          {
            id: 'member_001',
            name: '김개발',
            role: '풀스택 개발자',
            email: 'dev@example.com',
            joinedDate: '2024-01-15'
          },
          {
            id: 'member_002',
            name: '이디자인',
            role: 'UI/UX 디자이너',
            email: 'design@example.com',
            joinedDate: '2024-01-20'
          }
        ],
        documents: [],
        tasks: [
          {
            id: 'task_001',
            title: 'AI 모델 통합',
            description: 'Gemini API 통합 작업',
            status: 'in_progress',
            priority: 'high',
            createdAt: '2024-03-01'
          },
          {
            id: 'task_002',
            title: '데이터베이스 최적화',
            description: '쿼리 성능 개선',
            status: 'todo',
            priority: 'medium',
            createdAt: '2024-03-05'
          }
        ],
        invoices: [
          {
            id: 'inv_001',
            invoiceNumber: 'INV-2024-001',
            amount: 25000000,
            issuedDate: '2024-02-15',
            dueDate: '2024-03-15',
            status: 'paid',
            paidDate: '2024-03-10'
          }
        ],
        payments: [
          {
            id: 'pay_001',
            amount: 25000000,
            date: '2024-03-10',
            method: 'bank_transfer',
            status: 'completed',
            description: '1차 대금',
            invoiceId: 'inv_001'
          }
        ],
        tags: ['AI', '플랫폼', '자동화'],
        category: '소프트웨어 개발',
        createdAt: '2024-01-15',
        updatedAt: '2024-03-10',
        createdBy: 'admin'
      },
      {
        id: 'proj_002',
        name: '전자상거래 플랫폼 구축',
        description: 'B2B 전자상거래 플랫폼 개발',
        clientId: 'client_002',
        clientName: '유통회사 B',
        status: 'planning' as ProjectStatus,
        priority: 'medium' as ProjectPriority,
        startDate: '2024-04-01',
        dueDate: '2024-09-30',
        progress: 15,
        budget: {
          estimated: 80000000,
          spent: 5000000,
          remaining: 75000000,
          currency: 'KRW'
        },
        totalRevenue: 80000000,
        totalExpenses: 5000000,
        profitMargin: 40,
        milestones: [
          {
            id: 'ms_004',
            title: '요구사항 분석',
            description: '비즈니스 요구사항 정의',
            dueDate: '2024-04-30',
            isCompleted: false,
            progress: 50
          }
        ],
        team: [],
        documents: [],
        tasks: [],
        invoices: [],
        payments: [],
        tags: ['전자상거래', 'B2B', '플랫폼'],
        category: '이커머스',
        createdAt: '2024-03-01',
        updatedAt: '2024-03-10',
        createdBy: 'admin'
      },
      {
        id: 'proj_003',
        name: '모바일 앱 개발',
        description: '크로스플랫폼 모바일 애플리케이션',
        clientId: 'client_003',
        clientName: '스타트업 C',
        status: 'completed' as ProjectStatus,
        priority: 'low' as ProjectPriority,
        startDate: '2023-10-01',
        endDate: '2024-02-28',
        dueDate: '2024-02-28',
        completedDate: '2024-02-25',
        progress: 100,
        budget: {
          estimated: 30000000,
          spent: 28000000,
          remaining: 2000000,
          currency: 'KRW'
        },
        totalRevenue: 30000000,
        totalExpenses: 28000000,
        profitMargin: 25,
        milestones: [],
        team: [],
        documents: [],
        tasks: [],
        invoices: [],
        payments: [],
        tags: ['모바일', 'Flutter', 'iOS', 'Android'],
        category: '모바일 개발',
        createdAt: '2023-10-01',
        updatedAt: '2024-02-28',
        createdBy: 'admin'
      }
    ];

    // 샘플 데이터 저장
    sampleProjects.forEach(project => {
      this.projects.set(project.id, project);
    });
  }

  /**
   * 사용자의 프로젝트 목록 조회
   */
  static async getProjectsByUserId(
    userId: string,
    limit?: number,
    status?: ProjectStatus
  ): Promise<ProjectSummary[]> {
    // 초기 데이터 생성
    if (this.projects.size === 0) {
      this.initializeSampleData();
    }

    let projects = Array.from(this.projects.values());

    // 상태 필터링
    if (status) {
      projects = projects.filter(p => p.status === status);
    }

    // 요약 정보로 변환
    const summaries: ProjectSummary[] = projects.map(p => ({
      id: p.id,
      name: p.name,
      clientName: p.clientName,
      status: p.status,
      priority: p.priority,
      progress: p.progress,
      dueDate: p.dueDate,
      budget: {
        estimated: p.budget.estimated,
        spent: p.budget.spent
      },
      teamSize: p.team.length,
      taskCount: {
        total: p.tasks.length,
        completed: p.tasks.filter(t => t.status === 'done').length
      }
    }));

    // 정렬 (우선순위 > 마감일)
    summaries.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    // 제한 적용
    if (limit) {
      return summaries.slice(0, limit);
    }

    return summaries;
  }

  /**
   * 프로젝트 상세 정보 조회
   */
  static async getProjectById(projectId: string): Promise<ProjectDetail | null> {
    if (this.projects.size === 0) {
      this.initializeSampleData();
    }

    return this.projects.get(projectId) || null;
  }

  /**
   * 프로젝트 검색
   */
  static async searchProjects(
    query: string,
    userId: string
  ): Promise<ProjectSummary[]> {
    const projects = await this.getProjectsByUserId(userId);
    const normalizedQuery = query.toLowerCase();

    return projects.filter(p => 
      p.name.toLowerCase().includes(normalizedQuery) ||
      p.clientName.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * 프로젝트 통계 조회
   */
  static async getProjectStatistics(userId: string) {
    const projects = await this.getProjectsByUserId(userId);
    
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => 
      p.status === 'in_progress' || p.status === 'review'
    ).length;
    const completedProjects = projects.filter(p => 
      p.status === 'completed'
    ).length;
    
    const totalRevenue = projects.reduce((sum, p) => 
      sum + p.budget.estimated, 0
    );
    
    const averageProgress = projects.reduce((sum, p) => 
      sum + p.progress, 0
    ) / (totalProjects || 1);
    
    const now = new Date();
    const upcomingDeadlines = projects.filter(p => {
      const dueDate = new Date(p.dueDate);
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilDue > 0 && daysUntilDue <= 7;
    }).length;
    
    const overdueProjects = projects.filter(p => {
      const dueDate = new Date(p.dueDate);
      return dueDate < now && p.status !== 'completed';
    }).length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalRevenue,
      averageProgress: Math.round(averageProgress),
      upcomingDeadlines,
      overdueProjects,
      teamUtilization: 85 // 임시 값
    };
  }

  /**
   * 진행 중인 프로젝트의 태스크 조회
   */
  static async getActiveProjectTasks(userId: string) {
    const projects = await this.getProjectsByUserId(userId, undefined, 'in_progress');
    const tasks: any[] = [];

    for (const projectSummary of projects) {
      const project = await this.getProjectById(projectSummary.id);
      if (project?.tasks) {
        project.tasks.forEach(task => {
          tasks.push({
            ...task,
            projectId: project.id,
            projectName: project.name
          });
        });
      }
    }

    return tasks;
  }

  /**
   * 마감 임박 프로젝트 조회
   */
  static async getUpcomingDeadlines(userId: string, days: number = 7) {
    const projects = await this.getProjectsByUserId(userId);
    const now = new Date();
    
    return projects.filter(p => {
      const dueDate = new Date(p.dueDate);
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilDue > 0 && daysUntilDue <= days && p.status !== 'completed';
    }).sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  /**
   * 프로젝트 생성
   */
  static async createProject(project: Omit<ProjectDetail, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectDetail> {
    const id = `proj_${Date.now()}`;
    const newProject: ProjectDetail = {
      ...project,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.set(id, newProject);
    return newProject;
  }

  /**
   * 프로젝트 업데이트
   */
  static async updateProject(projectId: string, updates: Partial<ProjectDetail>): Promise<ProjectDetail | null> {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }
}

export default ProjectService;