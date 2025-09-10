/**
 * 클라이언트 서비스
 * 클라이언트 관련 데이터 조회 및 관리
 */

/**
 * 클라이언트 상태
 */
export type ClientStatus = 'active' | 'inactive' | 'prospect';

/**
 * 클라이언트 타입
 */
export type ClientType = 'individual' | 'company' | 'government' | 'nonprofit';

/**
 * 클라이언트 상세 정보
 */
export interface ClientDetail {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  businessNumber?: string; // 사업자등록번호
  representative?: string; // 대표자
  industry?: string; // 업종
  description?: string;
  
  // 프로젝트 정보
  projectIds: string[];
  activeProjectCount: number;
  completedProjectCount: number;
  
  // 재무 정보
  totalRevenue: number;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number; // 미수금
  
  // 연락 정보
  lastContact?: Date;
  nextFollowUp?: Date;
  contactHistory: ContactRecord[];
  
  // 메타데이터
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * 연락 기록
 */
export interface ContactRecord {
  id: string;
  date: Date;
  type: 'email' | 'phone' | 'meeting' | 'other';
  subject: string;
  notes?: string;
  nextAction?: string;
}

/**
 * 클라이언트 요약 정보
 */
export interface ClientSummary {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  email?: string;
  phone?: string;
  activeProjects: number;
  totalRevenue: number;
  lastContact?: Date;
}

/**
 * 클라이언트 서비스 클래스
 */
export class ClientService {
  // 임시 데이터 저장소
  private static clients: Map<string, ClientDetail> = new Map();

  /**
   * 초기 샘플 데이터 생성
   */
  static initializeSampleData() {
    const sampleClients: ClientDetail[] = [
      {
        id: 'client_001',
        name: '테크스타트업 A사',
        type: 'company',
        status: 'active',
        email: 'contact@techstartup-a.com',
        phone: '02-1234-5678',
        address: '서울시 강남구 테헤란로 123',
        website: 'https://techstartup-a.com',
        businessNumber: '123-45-67890',
        representative: '김대표',
        industry: 'IT/소프트웨어',
        description: 'AI 기반 솔루션 개발 스타트업',
        projectIds: ['proj_001'],
        activeProjectCount: 1,
        completedProjectCount: 2,
        totalRevenue: 150000000,
        totalInvoiced: 150000000,
        totalPaid: 125000000,
        outstanding: 25000000,
        lastContact: new Date('2024-03-10'),
        nextFollowUp: new Date('2024-03-20'),
        contactHistory: [
          {
            id: 'contact_001',
            date: new Date('2024-03-10'),
            type: 'meeting',
            subject: '프로젝트 진행 상황 점검',
            notes: '2차 마일스톤 완료 확인, 3차 진행 계획 논의',
            nextAction: '3차 개발 착수'
          },
          {
            id: 'contact_002',
            date: new Date('2024-02-15'),
            type: 'email',
            subject: '계약서 서명 완료',
            notes: '프로젝트 계약 체결'
          }
        ],
        tags: ['우수고객', 'IT', '장기계약'],
        notes: '향후 추가 프로젝트 논의 예정',
        createdAt: '2023-06-15',
        updatedAt: '2024-03-10',
        createdBy: 'admin'
      },
      {
        id: 'client_002',
        name: '유통회사 B',
        type: 'company',
        status: 'active',
        email: 'info@distribution-b.com',
        phone: '02-2345-6789',
        address: '서울시 종로구 종로 456',
        businessNumber: '234-56-78901',
        representative: '이대표',
        industry: '유통/도소매',
        description: '전국 유통망을 보유한 중견기업',
        projectIds: ['proj_002'],
        activeProjectCount: 1,
        completedProjectCount: 0,
        totalRevenue: 80000000,
        totalInvoiced: 0,
        totalPaid: 0,
        outstanding: 0,
        lastContact: new Date('2024-03-01'),
        contactHistory: [
          {
            id: 'contact_003',
            date: new Date('2024-03-01'),
            type: 'meeting',
            subject: '프로젝트 킥오프 미팅',
            notes: '요구사항 확정 및 일정 협의'
          }
        ],
        tags: ['신규고객', '유통', 'B2B'],
        createdAt: '2024-02-01',
        updatedAt: '2024-03-01',
        createdBy: 'admin'
      },
      {
        id: 'client_003',
        name: '스타트업 C',
        type: 'company',
        status: 'inactive',
        email: 'hello@startup-c.com',
        phone: '02-3456-7890',
        industry: '모바일/앱',
        description: '모바일 서비스 스타트업',
        projectIds: ['proj_003'],
        activeProjectCount: 0,
        completedProjectCount: 1,
        totalRevenue: 30000000,
        totalInvoiced: 30000000,
        totalPaid: 30000000,
        outstanding: 0,
        lastContact: new Date('2024-02-25'),
        contactHistory: [
          {
            id: 'contact_004',
            date: new Date('2024-02-25'),
            type: 'email',
            subject: '프로젝트 완료 감사 메일',
            notes: '성공적인 프로젝트 완료'
          }
        ],
        tags: ['완료고객', '모바일'],
        createdAt: '2023-09-01',
        updatedAt: '2024-02-25',
        createdBy: 'admin'
      },
      {
        id: 'client_004',
        name: '김개인',
        type: 'individual',
        status: 'prospect',
        email: 'kim@example.com',
        phone: '010-1234-5678',
        description: '개인 사업자, 온라인 쇼핑몰 운영',
        projectIds: [],
        activeProjectCount: 0,
        completedProjectCount: 0,
        totalRevenue: 0,
        totalInvoiced: 0,
        totalPaid: 0,
        outstanding: 0,
        lastContact: new Date('2024-03-05'),
        contactHistory: [
          {
            id: 'contact_005',
            date: new Date('2024-03-05'),
            type: 'phone',
            subject: '프로젝트 문의',
            notes: '쇼핑몰 리뉴얼 관련 상담',
            nextAction: '견적서 발송'
          }
        ],
        tags: ['잠재고객', '이커머스'],
        createdAt: '2024-03-05',
        updatedAt: '2024-03-05',
        createdBy: 'admin'
      }
    ];

    // 샘플 데이터 저장
    sampleClients.forEach(client => {
      this.clients.set(client.id, client);
    });
  }

  /**
   * 클라이언트 목록 조회
   */
  static async getClientsByUserId(
    userId: string,
    status?: ClientStatus,
    limit?: number
  ): Promise<ClientSummary[]> {
    // 초기 데이터 생성
    if (this.clients.size === 0) {
      this.initializeSampleData();
    }

    let clients = Array.from(this.clients.values());

    // 상태 필터링
    if (status) {
      clients = clients.filter(c => c.status === status);
    }

    // 요약 정보로 변환
    const summaries: ClientSummary[] = clients.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      email: c.email,
      phone: c.phone,
      activeProjects: c.activeProjectCount,
      totalRevenue: c.totalRevenue,
      lastContact: c.lastContact
    }));

    // 정렬 (활성 상태 > 매출 > 이름)
    summaries.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      if (a.totalRevenue !== b.totalRevenue) {
        return b.totalRevenue - a.totalRevenue;
      }
      return a.name.localeCompare(b.name);
    });

    // 제한 적용
    if (limit) {
      return summaries.slice(0, limit);
    }

    return summaries;
  }

  /**
   * 클라이언트 상세 정보 조회
   */
  static async getClientById(clientId: string): Promise<ClientDetail | null> {
    if (this.clients.size === 0) {
      this.initializeSampleData();
    }

    return this.clients.get(clientId) || null;
  }

  /**
   * 클라이언트 검색
   */
  static async searchClients(
    query: string,
    userId: string
  ): Promise<ClientSummary[]> {
    const clients = await this.getClientsByUserId(userId);
    const normalizedQuery = query.toLowerCase();

    return clients.filter(c => 
      c.name.toLowerCase().includes(normalizedQuery) ||
      c.email?.toLowerCase().includes(normalizedQuery) ||
      c.phone?.includes(query)
    );
  }

  /**
   * 클라이언트 통계
   */
  static async getClientStatistics(userId: string) {
    const clients = await this.getClientsByUserId(userId);
    
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const prospectClients = clients.filter(c => c.status === 'prospect').length;
    
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);
    const averageRevenue = totalRevenue / (totalClients || 1);
    
    // 유지율 계산 (활성 클라이언트 / 전체 클라이언트)
    const retentionRate = totalClients > 0 
      ? Math.round((activeClients / totalClients) * 100) 
      : 0;

    return {
      totalClients,
      activeClients,
      prospectClients,
      inactiveClients: totalClients - activeClients - prospectClients,
      totalRevenue,
      averageRevenue: Math.round(averageRevenue),
      retentionRate,
      topClients: clients
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)
    };
  }

  /**
   * 미수금이 있는 클라이언트 조회
   */
  static async getClientsWithOutstanding(userId: string): Promise<ClientSummary[]> {
    if (this.clients.size === 0) {
      this.initializeSampleData();
    }

    const clientsWithOutstanding = Array.from(this.clients.values())
      .filter(c => c.outstanding > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        email: c.email,
        phone: c.phone,
        activeProjects: c.activeProjectCount,
        totalRevenue: c.totalRevenue,
        lastContact: c.lastContact,
        outstanding: c.outstanding
      }))
      .sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0));

    return clientsWithOutstanding;
  }

  /**
   * 팔로우업 필요한 클라이언트 조회
   */
  static async getClientsNeedingFollowUp(userId: string): Promise<ClientSummary[]> {
    if (this.clients.size === 0) {
      this.initializeSampleData();
    }

    const now = new Date();
    const followUpClients = Array.from(this.clients.values())
      .filter(c => {
        // 다음 팔로우업 날짜가 있고 현재 시간 이후인 경우
        if (c.nextFollowUp && c.nextFollowUp <= now) return true;
        
        // 마지막 연락 후 30일 이상 경과한 활성 클라이언트
        if (c.status === 'active' && c.lastContact) {
          const daysSinceLastContact = (now.getTime() - c.lastContact.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLastContact > 30;
        }
        
        return false;
      })
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        email: c.email,
        phone: c.phone,
        activeProjects: c.activeProjectCount,
        totalRevenue: c.totalRevenue,
        lastContact: c.lastContact
      }));

    return followUpClients;
  }

  /**
   * 클라이언트 생성
   */
  static async createClient(client: Omit<ClientDetail, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClientDetail> {
    const id = `client_${Date.now()}`;
    const newClient: ClientDetail = {
      ...client,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.clients.set(id, newClient);
    return newClient;
  }

  /**
   * 클라이언트 업데이트
   */
  static async updateClient(clientId: string, updates: Partial<ClientDetail>): Promise<ClientDetail | null> {
    const client = this.clients.get(clientId);
    if (!client) return null;

    const updatedClient = {
      ...client,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.clients.set(clientId, updatedClient);
    return updatedClient;
  }

  /**
   * 연락 기록 추가
   */
  static async addContactRecord(
    clientId: string,
    record: Omit<ContactRecord, 'id'>
  ): Promise<ContactRecord | null> {
    const client = this.clients.get(clientId);
    if (!client) return null;

    const newRecord: ContactRecord = {
      ...record,
      id: `contact_${Date.now()}`
    };

    client.contactHistory.push(newRecord);
    client.lastContact = record.date;
    client.updatedAt = new Date().toISOString();

    this.clients.set(clientId, client);
    return newRecord;
  }
}

export default ClientService;