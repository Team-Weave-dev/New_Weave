// Mock 인보이스 서비스 - Supabase 연결 제거

export interface Invoice {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  invoice_number: string;
  client_id?: string;
  project_id?: string;
  issue_date?: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items?: any[];
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
  payment_terms?: string;
  clients?: {
    id: string;
    name?: string;
    company?: string;
  };
  projects?: {
    id: string;
    name?: string;
  };
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'clients' | 'projects'>;
export type InvoiceUpdate = Partial<InvoiceInsert>;

// Mock 데이터
const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    created_at: '2024-12-01T09:00:00Z',
    updated_at: '2024-12-01T09:00:00Z',
    user_id: 'mock-user',
    invoice_number: 'INV-2024-001',
    client_id: 'client-1',
    project_id: 'proj-1',
    issue_date: '2024-12-01',
    due_date: '2024-12-31',
    status: 'sent',
    items: [
      { description: '웹사이트 개발', quantity: 1, price: 5000000, total: 5000000 }
    ],
    subtotal: 5000000,
    tax: 500000,
    total: 5500000,
    notes: '프로젝트 1차 대금',
    payment_terms: '30일 이내',
    clients: {
      id: 'client-1',
      name: '김철수',
      company: '㈜테크스타트'
    },
    projects: {
      id: 'proj-1',
      name: '웹사이트 리뉴얼'
    }
  },
  {
    id: 'inv-2',
    created_at: '2024-11-15T10:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
    user_id: 'mock-user',
    invoice_number: 'INV-2024-002',
    client_id: 'client-3',
    project_id: 'proj-3',
    issue_date: '2024-11-15',
    due_date: '2024-12-15',
    status: 'paid',
    items: [
      { description: '쇼핑몰 구축', quantity: 1, price: 6000000, total: 6000000 }
    ],
    subtotal: 6000000,
    tax: 600000,
    total: 6600000,
    notes: '프로젝트 완료 대금',
    payment_terms: '30일 이내',
    clients: {
      id: 'client-3',
      name: '박민수',
      company: '이커머스플러스'
    },
    projects: {
      id: 'proj-3',
      name: '쇼핑몰 구축'
    }
  },
  {
    id: 'inv-3',
    created_at: '2024-10-01T11:00:00Z',
    updated_at: '2024-10-01T11:00:00Z',
    user_id: 'mock-user',
    invoice_number: 'INV-2024-003',
    client_id: 'client-2',
    issue_date: '2024-10-01',
    due_date: '2024-10-31',
    status: 'overdue',
    items: [
      { description: '디자인 작업', quantity: 1, price: 2000000, total: 2000000 }
    ],
    subtotal: 2000000,
    tax: 200000,
    total: 2200000,
    notes: '디자인 프로젝트',
    payment_terms: '30일 이내',
    clients: {
      id: 'client-2',
      name: '이영희',
      company: '디자인컴퍼니'
    }
  }
];

export class InvoicesService {
  // 인보이스 생성
  async createInvoice(invoice: Omit<InvoiceInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    const newInvoice: Invoice = {
      ...invoice as InvoiceInsert,
      id: `inv-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 클라이언트와 프로젝트 정보 추가 (mock)
    if (invoice.client_id) {
      newInvoice.clients = {
        id: invoice.client_id,
        name: 'Mock Client',
        company: 'Mock Company'
      };
    }
    
    mockInvoices.push(newInvoice);
    return newInvoice;
  }

  // 인보이스 목록 조회
  async getInvoices(userId: string, status?: Invoice['status']): Promise<Invoice[]> {
    let result = mockInvoices.filter(inv => inv.user_id === 'mock-user');
    
    if (status) {
      result = result.filter(inv => inv.status === status);
    }
    
    // 날짜 역순 정렬
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return result;
  }

  // 인보이스 ID로 조회
  async getInvoiceById(id: string): Promise<Invoice | null> {
    return mockInvoices.find(inv => inv.id === id) || null;
  }

  // 인보이스 업데이트
  async updateInvoice(id: string, data: InvoiceUpdate): Promise<Invoice> {
    const index = mockInvoices.findIndex(inv => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');
    
    mockInvoices[index] = {
      ...mockInvoices[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    return mockInvoices[index];
  }

  // 인보이스 삭제
  async deleteInvoice(id: string): Promise<void> {
    const index = mockInvoices.findIndex(inv => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');
    
    mockInvoices.splice(index, 1);
  }

  // 인보이스 상태 업데이트
  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    return this.updateInvoice(id, { status });
  }

  // 클라이언트별 인보이스 조회
  async getClientInvoices(clientId: string): Promise<Invoice[]> {
    return mockInvoices.filter(inv => inv.client_id === clientId);
  }

  // 프로젝트별 인보이스 조회
  async getProjectInvoices(projectId: string): Promise<Invoice[]> {
    return mockInvoices.filter(inv => inv.project_id === projectId);
  }

  // 인보이스 통계
  async getInvoiceStatistics(userId: string) {
    const invoices = mockInvoices.filter(inv => inv.user_id === 'mock-user');
    
    const total = invoices.length;
    const draft = invoices.filter(inv => inv.status === 'draft').length;
    const sent = invoices.filter(inv => inv.status === 'sent').length;
    const paid = invoices.filter(inv => inv.status === 'paid').length;
    const overdue = invoices.filter(inv => inv.status === 'overdue').length;
    
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingAmount = invoices
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    return {
      total,
      byStatus: { draft, sent, paid, overdue },
      amounts: { total: totalAmount, paid: paidAmount, pending: pendingAmount }
    };
  }

  // 다음 인보이스 번호 생성
  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastInvoice = mockInvoices
      .filter(inv => inv.invoice_number.startsWith(`INV-${year}`))
      .sort((a, b) => b.invoice_number.localeCompare(a.invoice_number))[0];
    
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-').pop() || '0');
      return `INV-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
    }
    
    return `INV-${year}-001`;
  }
}

export const invoicesService = new InvoicesService();