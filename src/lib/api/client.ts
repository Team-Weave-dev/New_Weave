// API 클라이언트 유틸리티

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    // URL 파라미터 처리
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    // 기본 헤더 설정
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // 쿠키 포함
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET 요청
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  // POST 요청
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT 요청
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH 요청
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// 기본 API 클라이언트 인스턴스
export const apiClient = new APIClient('/api');

// 특정 API 엔드포인트용 클라이언트
export const authAPI = {
  login: (email: string, password: string) => 
    apiClient.post('/auth/login', { email, password }),
  
  logout: () => 
    apiClient.post('/auth/logout'),
  
  getSession: () => 
    apiClient.get('/auth/session'),
  
  signup: (data: any) => 
    apiClient.post('/auth/signup', data),
};

export const projectsAPI = {
  getAll: (params?: { status?: string; search?: string }) => 
    apiClient.get('/projects', params),
  
  getById: (id: string) => 
    apiClient.get(`/projects/${id}`),
  
  create: (data: any) => 
    apiClient.post('/projects', data),
  
  update: (id: string, data: any) => 
    apiClient.put(`/projects/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/projects/${id}`),
};

export const clientsAPI = {
  getAll: (params?: { search?: string }) => 
    apiClient.get('/clients', params),
  
  getById: (id: string) => 
    apiClient.get(`/clients/${id}`),
  
  create: (data: any) => 
    apiClient.post('/clients', data),
  
  update: (id: string, data: any) => 
    apiClient.put(`/clients/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/clients/${id}`),
};

// 세무 관리 API
export const taxAPI = {
  getTransactions: (params?: any) => 
    apiClient.get('/tax/transactions', params),
  
  createTransaction: (data: any) => 
    apiClient.post('/tax/transactions', data),
  
  updateTransaction: (id: string, data: any) => 
    apiClient.put(`/tax/transactions/${id}`, data),
  
  deleteTransaction: (id: string) => 
    apiClient.delete(`/tax/transactions/${id}`),
  
  getReport: (type: string, params: any) => 
    apiClient.get(`/tax/reports/${type}`, params),
};

export default apiClient;