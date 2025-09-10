// Mock 리마인더 서비스 - Supabase 연결 제거

export interface Reminder {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'cancelled';
  project_id?: string;
  client_id?: string;
  repeat_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  notification_sent?: boolean;
  projects?: {
    id: string;
    name?: string;
  };
  clients?: {
    id: string;
    name?: string;
    company?: string;
  };
}

export type ReminderInsert = Omit<Reminder, 'id' | 'created_at' | 'updated_at' | 'projects' | 'clients'>;
export type ReminderUpdate = Partial<ReminderInsert>;

// Mock 데이터
const mockReminders: Reminder[] = [
  {
    id: 'rem-1',
    created_at: '2024-12-01T09:00:00Z',
    updated_at: '2024-12-01T09:00:00Z',
    user_id: 'mock-user',
    title: '월말 정산 리마인더',
    description: '이번 달 세무 정산 및 보고서 작성',
    due_date: '2024-12-31',
    priority: 'high',
    status: 'pending',
    repeat_type: 'monthly',
    notification_sent: false
  },
  {
    id: 'rem-2',
    created_at: '2024-12-05T10:00:00Z',
    updated_at: '2024-12-05T10:00:00Z',
    user_id: 'mock-user',
    title: '프로젝트 진행 점검',
    description: '웹사이트 리뉴얼 프로젝트 중간 점검',
    due_date: '2024-12-15',
    priority: 'medium',
    status: 'pending',
    project_id: 'proj-1',
    notification_sent: false,
    projects: {
      id: 'proj-1',
      name: '웹사이트 리뉴얼'
    }
  },
  {
    id: 'rem-3',
    created_at: '2024-11-20T11:00:00Z',
    updated_at: '2024-12-01T11:00:00Z',
    user_id: 'mock-user',
    title: '클라이언트 미팅',
    description: '테크스타트 담당자와 정기 미팅',
    due_date: '2024-12-20',
    priority: 'high',
    status: 'pending',
    client_id: 'client-1',
    notification_sent: false,
    clients: {
      id: 'client-1',
      name: '김철수',
      company: '㈜테크스타트'
    }
  },
  {
    id: 'rem-4',
    created_at: '2024-11-01T09:00:00Z',
    updated_at: '2024-11-30T18:00:00Z',
    user_id: 'mock-user',
    title: '쇼핑몰 프로젝트 완료',
    description: '이커머스플러스 쇼핑몰 구축 완료',
    due_date: '2024-11-30',
    priority: 'urgent',
    status: 'completed',
    project_id: 'proj-3',
    client_id: 'client-3',
    notification_sent: true,
    projects: {
      id: 'proj-3',
      name: '쇼핑몰 구축'
    },
    clients: {
      id: 'client-3',
      name: '박민수',
      company: '이커머스플러스'
    }
  }
];

export class RemindersService {
  // 리마인더 생성
  async createReminder(reminder: Omit<ReminderInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Reminder> {
    const newReminder: Reminder = {
      ...reminder as ReminderInsert,
      id: `rem-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notification_sent: false
    };
    
    mockReminders.push(newReminder);
    return newReminder;
  }

  // 리마인더 목록 조회
  async getReminders(userId: string, status?: Reminder['status']): Promise<Reminder[]> {
    let result = mockReminders.filter(r => r.user_id === 'mock-user');
    
    if (status) {
      result = result.filter(r => r.status === status);
    }
    
    // 날짜순 정렬 (가장 가까운 날짜가 먼저)
    result.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
    
    return result;
  }

  // 리마인더 ID로 조회
  async getReminderById(id: string): Promise<Reminder | null> {
    return mockReminders.find(r => r.id === id) || null;
  }

  // 리마인더 업데이트
  async updateReminder(id: string, data: ReminderUpdate): Promise<Reminder> {
    const index = mockReminders.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reminder not found');
    
    mockReminders[index] = {
      ...mockReminders[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    return mockReminders[index];
  }

  // 리마인더 삭제
  async deleteReminder(id: string): Promise<void> {
    const index = mockReminders.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reminder not found');
    
    mockReminders.splice(index, 1);
  }

  // 리마인더 상태 업데이트
  async updateReminderStatus(id: string, status: Reminder['status']): Promise<Reminder> {
    return this.updateReminder(id, { status });
  }

  // 예정된 리마인더 조회
  async getUpcomingReminders(userId: string, days: number = 7): Promise<Reminder[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return mockReminders.filter(r => {
      if (r.user_id !== 'mock-user') return false;
      if (r.status !== 'pending') return false;
      if (!r.due_date) return false;
      
      const dueDate = new Date(r.due_date);
      return dueDate >= now && dueDate <= futureDate;
    });
  }

  // 오늘의 리마인더 조회
  async getTodayReminders(userId: string): Promise<Reminder[]> {
    const today = new Date().toISOString().split('T')[0];
    
    return mockReminders.filter(r => 
      r.user_id === 'mock-user' &&
      r.status === 'pending' &&
      r.due_date?.startsWith(today)
    );
  }

  // 프로젝트별 리마인더 조회
  async getProjectReminders(projectId: string): Promise<Reminder[]> {
    return mockReminders.filter(r => r.project_id === projectId);
  }

  // 클라이언트별 리마인더 조회
  async getClientReminders(clientId: string): Promise<Reminder[]> {
    return mockReminders.filter(r => r.client_id === clientId);
  }

  // 리마인더 완료 처리
  async completeReminder(id: string): Promise<Reminder> {
    const reminder = await this.updateReminderStatus(id, 'completed');
    
    // 반복 리마인더 처리
    if (reminder.repeat_type && reminder.repeat_type !== 'none') {
      const newDueDate = this.getNextRepeatDate(reminder.due_date!, reminder.repeat_type);
      
      await this.createReminder({
        ...reminder,
        due_date: newDueDate,
        status: 'pending',
        notification_sent: false
      });
    }
    
    return reminder;
  }

  // 다음 반복 날짜 계산
  private getNextRepeatDate(currentDate: string, repeatType: string): string {
    const date = new Date(currentDate);
    
    switch (repeatType) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date.toISOString().split('T')[0];
  }

  // 리마인더 통계
  async getReminderStatistics(userId: string) {
    const reminders = mockReminders.filter(r => r.user_id === 'mock-user');
    
    const total = reminders.length;
    const pending = reminders.filter(r => r.status === 'pending').length;
    const completed = reminders.filter(r => r.status === 'completed').length;
    const overdue = reminders.filter(r => {
      if (r.status !== 'pending' || !r.due_date) return false;
      return new Date(r.due_date) < new Date();
    }).length;
    
    const byPriority = {
      urgent: reminders.filter(r => r.priority === 'urgent').length,
      high: reminders.filter(r => r.priority === 'high').length,
      medium: reminders.filter(r => r.priority === 'medium').length,
      low: reminders.filter(r => r.priority === 'low').length
    };
    
    return {
      total,
      pending,
      completed,
      overdue,
      byPriority
    };
  }
}

export const remindersService = new RemindersService();