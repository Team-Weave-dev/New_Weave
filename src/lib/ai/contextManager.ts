/**
 * 컨텍스트 매니저
 * 사용자와 비즈니스 데이터의 컨텍스트를 관리
 */

import { IntentAnalysis } from './intentAnalyzer';
import { ProjectSummary } from '../types/project';

/**
 * 사용자 컨텍스트
 */
export interface UserContext {
  id: string;
  name?: string;
  email?: string;
  preferences: UserPreferences;
  history: ChatHistory[];
  lastActive?: Date;
}

/**
 * 사용자 선호 설정
 */
export interface UserPreferences {
  responseStyle: 'concise' | 'detailed' | 'balanced';
  language: 'ko' | 'en';
  expertise: string[];
  timezone?: string;
  workingHours?: {
    start: string;
    end: string;
  };
}

/**
 * 대화 이력
 */
export interface ChatHistory {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
}

/**
 * 비즈니스 컨텍스트
 */
export interface BusinessContext {
  projects?: ProjectSummary[];
  clients?: ClientSummary[];
  documents?: DocumentSummary[];
  invoices?: InvoiceSummary[];
  tasks?: TaskSummary[];
  financials?: FinancialSummary;
}

/**
 * 클라이언트 요약
 */
export interface ClientSummary {
  id: string;
  name: string;
  projects: number;
  totalRevenue: number;
  lastContact?: Date;
  status: 'active' | 'inactive' | 'prospect';
  relevanceScore?: number;
}

/**
 * 문서 요약
 */
export interface DocumentSummary {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  lastModified: Date;
  tags?: string[];
  relevanceScore?: number;
}

/**
 * 인보이스 요약
 */
export interface InvoiceSummary {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
}

/**
 * 태스크 요약
 */
export interface TaskSummary {
  id: string;
  title: string;
  projectId?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
}

/**
 * 재무 요약
 */
export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  pendingInvoices: number;
  overdueAmount: number;
  monthlyRecurring: number;
}

/**
 * 지식 컨텍스트
 */
export interface KnowledgeContext {
  chunks?: KnowledgeChunk[];
  taxRules?: TaxKnowledge[];
  templates?: Template[];
  bestPractices?: BestPractice[];
}

/**
 * 지식 청크
 */
export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  category: string;
  relevance: number;
}

/**
 * 세무 지식
 */
export interface TaxKnowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  effectiveDate?: Date;
  relevanceScore?: number;
}

/**
 * 템플릿
 */
export interface Template {
  id: string;
  name: string;
  type: string;
  content: string;
  variables?: string[];
}

/**
 * 모범 사례
 */
export interface BestPractice {
  id: string;
  title: string;
  description: string;
  category: string;
  examples?: string[];
}

/**
 * 통합 컨텍스트
 */
export interface EnrichedContext {
  user?: UserContext;
  business?: BusinessContext;
  knowledge?: KnowledgeContext;
  relevanceScores?: Map<string, number>;
  timestamp: Date;
  sessionId?: string;
}

/**
 * 컨텍스트 매니저 클래스
 */
export class ContextManager {
  private userCache: Map<string, UserContext> = new Map();
  private sessionCache: Map<string, EnrichedContext> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30분

  /**
   * 컨텍스트 수집
   */
  async gatherContext(
    intent: IntentAnalysis,
    userId: string,
    sessionId?: string
  ): Promise<EnrichedContext> {
    // 세션 캐시 확인
    if (sessionId && this.sessionCache.has(sessionId)) {
      const cached = this.sessionCache.get(sessionId)!;
      if (Date.now() - cached.timestamp.getTime() < this.CACHE_TTL) {
        return cached;
      }
    }

    // 사용자 컨텍스트 수집
    const userContext = await this.getUserContext(userId);
    
    // 비즈니스 컨텍스트 수집
    const businessContext = await this.getBusinessContext(userId, intent);
    
    // 지식 베이스 컨텍스트 수집
    const knowledgeContext = await this.getKnowledgeContext(intent.message, intent.primaryIntent);
    
    // 관련성 점수 계산
    const relevanceScores = this.calculateRelevanceScores(intent, businessContext, knowledgeContext);
    
    // 통합 컨텍스트 생성
    const enrichedContext: EnrichedContext = {
      user: userContext,
      business: businessContext,
      knowledge: knowledgeContext,
      relevanceScores,
      timestamp: new Date(),
      sessionId
    };
    
    // 캐시 저장
    if (sessionId) {
      this.sessionCache.set(sessionId, enrichedContext);
    }
    
    return enrichedContext;
  }

  /**
   * 사용자 컨텍스트 가져오기
   */
  async getUserContext(userId: string): Promise<UserContext> {
    // 캐시 확인
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!;
    }

    // TODO: 실제 데이터베이스에서 사용자 정보 가져오기
    const userContext: UserContext = {
      id: userId,
      preferences: {
        responseStyle: 'balanced',
        language: 'ko',
        expertise: []
      },
      history: await this.getChatHistory(userId)
    };

    // 캐시 저장
    this.userCache.set(userId, userContext);
    
    return userContext;
  }

  /**
   * 비즈니스 컨텍스트 가져오기
   */
  async getBusinessContext(
    userId: string, 
    intent: IntentAnalysis
  ): Promise<BusinessContext> {
    const context: BusinessContext = {};

    // 의도에 따라 필요한 데이터만 가져오기
    switch (intent.primaryIntent) {
      case 'project':
        context.projects = await this.getProjects(userId);
        context.clients = await this.getClients(userId);
        context.tasks = await this.getTasks(userId);
        break;
      
      case 'document':
        context.documents = await this.getDocuments(userId);
        context.projects = await this.getProjects(userId);
        break;
      
      case 'tax':
        context.financials = await this.getFinancials(userId);
        context.invoices = await this.getInvoices(userId);
        break;
      
      case 'analysis':
        context.projects = await this.getProjects(userId);
        context.financials = await this.getFinancials(userId);
        context.clients = await this.getClients(userId);
        break;
      
      default:
        // 일반 의도는 최소한의 컨텍스트만
        context.projects = await this.getProjects(userId, 5); // 최근 5개만
    }

    return context;
  }

  /**
   * 지식 베이스 컨텍스트 가져오기
   */
  async getKnowledgeContext(
    query: string,
    domain: string
  ): Promise<KnowledgeContext> {
    const context: KnowledgeContext = {};

    // 도메인별 지식 검색
    switch (domain) {
      case 'tax':
        context.taxRules = await this.searchTaxKnowledge(query);
        break;
      
      case 'document':
        context.templates = await this.searchTemplates(query);
        break;
      
      case 'project':
      case 'analysis':
        context.bestPractices = await this.searchBestPractices(query);
        break;
    }

    // RAG 지식 청크 검색 (모든 도메인)
    context.chunks = await this.searchKnowledgeChunks(query);

    return context;
  }

  /**
   * 대화 이력 가져오기
   */
  private async getChatHistory(userId: string, limit: number = 10): Promise<ChatHistory[]> {
    // TODO: 실제 데이터베이스에서 대화 이력 가져오기
    return [];
  }

  /**
   * 프로젝트 목록 가져오기
   */
  private async getProjects(userId: string, limit?: number): Promise<ProjectSummary[]> {
    const { ProjectService } = await import('../services/projectService');
    return await ProjectService.getProjectsByUserId(userId, limit);
  }

  /**
   * 클라이언트 목록 가져오기
   */
  private async getClients(userId: string): Promise<ClientSummary[]> {
    const { ClientService } = await import('../services/clientService');
    const clients = await ClientService.getClientsByUserId(userId);
    
    // Map ClientService's ClientSummary to contextManager's ClientSummary
    return clients.map(client => ({
      id: client.id,
      name: client.name,
      projects: client.activeProjects, // Map activeProjects to projects
      totalRevenue: client.totalRevenue,
      lastContact: client.lastContact,
      status: client.status === 'active' ? 'active' : 
              client.status === 'inactive' ? 'inactive' : 'prospect',
      relevanceScore: 0
    }));
  }

  /**
   * 문서 목록 가져오기
   */
  private async getDocuments(userId: string): Promise<DocumentSummary[]> {
    // TODO: 실제 데이터베이스에서 문서 가져오기
    return [];
  }

  /**
   * 인보이스 목록 가져오기
   */
  private async getInvoices(userId: string): Promise<InvoiceSummary[]> {
    // TODO: 실제 데이터베이스에서 인보이스 가져오기
    return [];
  }

  /**
   * 태스크 목록 가져오기
   */
  private async getTasks(userId: string): Promise<TaskSummary[]> {
    // TODO: 실제 데이터베이스에서 태스크 가져오기
    return [];
  }

  /**
   * 재무 정보 가져오기
   */
  private async getFinancials(userId: string): Promise<FinancialSummary> {
    // TODO: 실제 데이터베이스에서 재무 정보 가져오기
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      profitMargin: 0,
      pendingInvoices: 0,
      overdueAmount: 0,
      monthlyRecurring: 0
    };
  }

  /**
   * 세무 지식 검색
   */
  private async searchTaxKnowledge(query: string): Promise<TaxKnowledge[]> {
    const { TaxKnowledgeSearch } = await import('./knowledgeBase/taxKnowledge');
    const taxSearch = new TaxKnowledgeSearch();
    const keywords = query.split(/\s+/).filter(w => w.length > 2);
    const results = taxSearch.searchByKeywords(keywords);
    
    return results.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category,
      effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : undefined,
      relevanceScore: 0.8
    }));
  }

  /**
   * 템플릿 검색
   */
  private async searchTemplates(query: string): Promise<Template[]> {
    // TODO: 템플릿 라이브러리에서 검색
    return [];
  }

  /**
   * 모범 사례 검색
   */
  private async searchBestPractices(query: string): Promise<BestPractice[]> {
    // TODO: 모범 사례 데이터베이스에서 검색
    return [];
  }

  /**
   * 지식 청크 검색
   */
  private async searchKnowledgeChunks(query: string): Promise<KnowledgeChunk[]> {
    // TODO: RAG 벡터 스토어에서 검색
    return [];
  }

  /**
   * 관련성 점수 계산
   */
  private calculateRelevanceScores(
    intent: IntentAnalysis,
    businessContext: BusinessContext,
    knowledgeContext: KnowledgeContext
  ): Map<string, number> {
    const scores = new Map<string, number>();

    // 프로젝트 관련성
    if (businessContext.projects) {
      businessContext.projects.forEach(project => {
        const score = this.calculateItemRelevance(project.name, intent.keywords);
        scores.set(`project_${project.id}`, score);
      });
    }

    // 클라이언트 관련성
    if (businessContext.clients) {
      businessContext.clients.forEach(client => {
        const score = this.calculateItemRelevance(client.name, intent.keywords);
        scores.set(`client_${client.id}`, score);
      });
    }

    // 지식 청크 관련성
    if (knowledgeContext.chunks) {
      knowledgeContext.chunks.forEach(chunk => {
        scores.set(`knowledge_${chunk.id}`, chunk.relevance);
      });
    }

    return scores;
  }

  /**
   * 항목 관련성 계산
   */
  private calculateItemRelevance(text: string, keywords: string[]): number {
    const normalizedText = text.toLowerCase();
    let matchCount = 0;

    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    return keywords.length > 0 ? matchCount / keywords.length : 0;
  }

  /**
   * 캐시 정리
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.userCache.delete(userId);
      // 해당 사용자의 세션 캐시도 정리
      for (const [sessionId, context] of this.sessionCache.entries()) {
        if (context.user?.id === userId) {
          this.sessionCache.delete(sessionId);
        }
      }
    } else {
      this.userCache.clear();
      this.sessionCache.clear();
    }
  }

  /**
   * 만료된 캐시 정리
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    
    for (const [sessionId, context] of this.sessionCache.entries()) {
      if (now - context.timestamp.getTime() > this.CACHE_TTL) {
        this.sessionCache.delete(sessionId);
      }
    }
  }
}

export default ContextManager;