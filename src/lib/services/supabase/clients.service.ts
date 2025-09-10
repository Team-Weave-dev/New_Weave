// Mock 클라이언트 서비스 - Supabase 연결 제거

export interface Client {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  company: string;
  business_number?: string | null;
  tax_type?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean;
  metadata?: any;
}

export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type ClientUpdate = Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>;

// Mock 데이터
const mockClients: Client[] = [
  {
    id: 'client-1',
    created_at: '2024-10-01T09:00:00Z',
    updated_at: '2024-10-01T09:00:00Z',
    user_id: 'mock-user',
    name: '김철수',
    company: '㈜테크스타트',
    business_number: '123-45-67890',
    tax_type: '법인',
    email: 'kim@techstart.com',
    phone: '010-1234-5678',
    address: '서울시 강남구 테헤란로 123',
    notes: 'VIP 고객',
    is_active: true,
    metadata: { priority: 'high' }
  },
  {
    id: 'client-2',
    created_at: '2024-10-15T10:00:00Z',
    updated_at: '2024-10-15T10:00:00Z',
    user_id: 'mock-user',
    name: '이영희',
    company: '디자인컴퍼니',
    business_number: '456-78-90123',
    tax_type: '개인',
    email: 'lee@designcompany.com',
    phone: '010-2345-6789',
    address: '서울시 서초구 서초대로 456',
    notes: '디자인 전문 업체',
    is_active: true,
    metadata: null
  },
  {
    id: 'client-3',
    created_at: '2024-09-01T11:00:00Z',
    updated_at: '2024-09-01T11:00:00Z',
    user_id: 'mock-user',
    name: '박민수',
    company: '이커머스플러스',
    business_number: '234-56-78901',
    tax_type: '법인',
    email: 'park@ecommerce.com',
    phone: '010-3456-7890',
    address: '서울시 송파구 올림픽로 789',
    notes: '온라인 쇼핑몰 운영',
    is_active: true,
    metadata: { type: 'ecommerce' }
  }
];

export class ClientService {
  // 클라이언트 목록 조회
  async getClients(userId: string): Promise<Client[]> {
    return mockClients.filter(c => c.user_id === 'mock-user' && c.is_active !== false);
  }

  // 클라이언트 ID로 조회
  async getClientById(id: string): Promise<Client | null> {
    return mockClients.find(c => c.id === id) || null;
  }

  // 클라이언트 생성
  async createClient(data: ClientInsert): Promise<Client> {
    const newClient: Client = {
      ...data,
      id: `client-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: data.is_active !== false
    };
    mockClients.push(newClient);
    return newClient;
  }

  // 클라이언트 수정
  async updateClient(id: string, data: ClientUpdate): Promise<Client> {
    const index = mockClients.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Client not found');
    
    mockClients[index] = {
      ...mockClients[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    return mockClients[index];
  }

  // 클라이언트 삭제 (soft delete)
  async deleteClient(id: string): Promise<void> {
    const index = mockClients.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Client not found');
    
    mockClients[index].is_active = false;
    mockClients[index].updated_at = new Date().toISOString();
  }

  // 클라이언트 검색
  async searchClients(userId: string, query: string): Promise<Client[]> {
    const lowerQuery = query.toLowerCase();
    return mockClients.filter(c => 
      c.user_id === 'mock-user' &&
      c.is_active !== false &&
      (c.name.toLowerCase().includes(lowerQuery) ||
       c.company.toLowerCase().includes(lowerQuery) ||
       c.email?.toLowerCase().includes(lowerQuery) ||
       c.business_number?.includes(query))
    );
  }

  // 클라이언트 통계
  async getClientStatistics(userId: string) {
    const clients = mockClients.filter(c => c.user_id === 'mock-user');
    const active = clients.filter(c => c.is_active !== false);
    
    return {
      total: active.length,
      active: active.length,
      inactive: clients.length - active.length,
      byTaxType: {
        corporation: active.filter(c => c.tax_type === '법인').length,
        individual: active.filter(c => c.tax_type === '개인').length
      }
    };
  }

  // 사업자번호로 클라이언트 조회
  async getClientByBusinessNumber(businessNumber: string): Promise<Client | null> {
    return mockClients.find(c => 
      c.business_number === businessNumber && c.is_active !== false
    ) || null;
  }

  // 클라이언트 활성/비활성 토글
  async toggleClientActive(id: string): Promise<Client> {
    const client = mockClients.find(c => c.id === id);
    if (!client) throw new Error('Client not found');
    
    client.is_active = !client.is_active;
    client.updated_at = new Date().toISOString();
    return client;
  }
}

export const clientService = new ClientService();