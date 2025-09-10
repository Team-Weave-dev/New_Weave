/**
 * 데이터 통합 레이어
 * 다양한 데이터 소스를 통합하여 AI에게 제공
 */

import { IntentAnalysis } from './intentAnalyzer';
import { EnrichedContext } from './contextManager';
import { ProjectDetail } from '../types/project';

/**
 * 통합 데이터 인터페이스
 */
export interface IntegratedData {
  projects?: ProjectData[];
  clients?: ClientData[];
  documents?: DocumentData[];
  taxKnowledge?: TaxData[];
  generalKnowledge?: GeneralData[];
  templates?: TemplateData[];
  analytics?: AnalyticsData;
}

/**
 * 프로젝트 데이터
 */
export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  dueDate?: Date;
  clientName?: string;
  budget?: number;
  team?: string[];
  relevanceScore?: number;
}

/**
 * 클라이언트 데이터
 */
export interface ClientData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  projects: string[];
  totalRevenue: number;
  lastContact?: Date;
  notes?: string;
  relevanceScore?: number;
}

/**
 * 문서 데이터
 */
export interface DocumentData {
  id: string;
  title: string;
  type: string;
  content?: string;
  summary?: string;
  createdAt: Date;
  tags?: string[];
  projectId?: string;
  relevanceScore?: number;
}

/**
 * 세무 데이터
 */
export interface TaxData {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  effectiveDate?: Date;
  source?: string;
  relevanceScore?: number;
}

/**
 * 일반 지식 데이터
 */
export interface GeneralData {
  id: string;
  content: string;
  source: string;
  category?: string;
  relevanceScore?: number;
}

/**
 * 템플릿 데이터
 */
export interface TemplateData {
  id: string;
  name: string;
  type: string;
  content: string;
  variables?: string[];
  usage?: number;
  relevanceScore?: number;
}

/**
 * 분석 데이터
 */
export interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number[];
    growth: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    successRate: number;
  };
  clients: {
    total: number;
    active: number;
    retention: number;
  };
  performance: {
    avgProjectDuration: number;
    avgProjectValue: number;
    profitMargin: number;
  };
}

/**
 * 데이터 소스 타입
 */
type DataSource = 'projects' | 'clients' | 'documents' | 'taxes' | 'knowledge' | 'templates' | 'analytics';

/**
 * 데이터 통합 레이어 클래스
 */
export class DataIntegrationLayer {
  // 데이터 소스별 가중치
  private readonly sourceWeights: Record<DataSource, number> = {
    projects: 1.0,
    clients: 0.9,
    documents: 0.8,
    taxes: 0.95,
    knowledge: 0.85,
    templates: 0.7,
    analytics: 0.75
  };

  /**
   * 관련 데이터 수집
   */
  async fetchRelevantData(
    intent: IntentAnalysis,
    userId: string,
    context?: EnrichedContext
  ): Promise<IntegratedData> {
    // 1. 관련 데이터 소스 식별
    const relevantSources = this.identifyRelevantSources(intent);
    
    // 2. 병렬로 데이터 수집
    const dataPromises = relevantSources.map(source => 
      this.fetchDataFromSource(source, userId, intent, context)
    );
    
    const results = await Promise.all(dataPromises);
    
    // 3. 데이터 병합 및 순위 지정
    return this.mergeAndRank(results, intent);
  }

  /**
   * 관련 데이터 소스 식별
   */
  private identifyRelevantSources(intent: IntentAnalysis): DataSource[] {
    const sourceMap: Record<string, DataSource[]> = {
      'tax': ['taxes', 'knowledge', 'projects', 'documents'],
      'project': ['projects', 'clients', 'documents', 'templates'],
      'document': ['documents', 'projects', 'templates', 'clients'],
      'analysis': ['analytics', 'projects', 'clients', 'documents'],
      'general': ['knowledge', 'projects']
    };
    
    const baseSources = sourceMap[intent.primaryIntent] || ['knowledge'];
    
    // 서브 의도가 있으면 추가 소스 포함
    if (intent.subIntents) {
      const additionalSources = new Set<DataSource>();
      intent.subIntents.forEach(subIntent => {
        const sources = sourceMap[subIntent];
        if (sources) {
          sources.forEach(s => additionalSources.add(s));
        }
      });
      
      return [...new Set([...baseSources, ...additionalSources])];
    }
    
    return baseSources;
  }

  /**
   * 데이터 소스에서 데이터 가져오기
   */
  private async fetchDataFromSource(
    source: DataSource,
    userId: string,
    intent: IntentAnalysis,
    context?: EnrichedContext
  ): Promise<Partial<IntegratedData>> {
    switch (source) {
      case 'projects':
        return { projects: await this.fetchProjects(userId, intent, context) };
      
      case 'clients':
        return { clients: await this.fetchClients(userId, intent, context) };
      
      case 'documents':
        return { documents: await this.fetchDocuments(userId, intent, context) };
      
      case 'taxes':
        return { taxKnowledge: await this.fetchTaxKnowledge(intent) };
      
      case 'knowledge':
        return { generalKnowledge: await this.fetchGeneralKnowledge(intent) };
      
      case 'templates':
        return { templates: await this.fetchTemplates(intent) };
      
      case 'analytics':
        return { analytics: await this.fetchAnalytics(userId) };
      
      default:
        return {};
    }
  }

  /**
   * 프로젝트 데이터 가져오기
   */
  private async fetchProjects(
    userId: string,
    intent: IntentAnalysis,
    context?: EnrichedContext
  ): Promise<ProjectData[]> {
    // TODO: 실제 데이터베이스에서 프로젝트 가져오기
    // 현재는 컨텍스트에서 가져오기
    if (context?.business?.projects) {
      return context.business.projects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress,
        clientName: p.clientName,
        budget: p.budget.estimated,
        relevanceScore: this.calculateRelevance(p.name, intent.keywords)
      }));
    }
    
    return [];
  }

  /**
   * 클라이언트 데이터 가져오기
   */
  private async fetchClients(
    userId: string,
    intent: IntentAnalysis,
    context?: EnrichedContext
  ): Promise<ClientData[]> {
    // TODO: 실제 데이터베이스에서 클라이언트 가져오기
    if (context?.business?.clients) {
      return context.business.clients.map(c => ({
        id: c.id,
        name: c.name,
        projects: [],
        totalRevenue: c.totalRevenue,
        lastContact: c.lastContact,
        relevanceScore: this.calculateRelevance(c.name, intent.keywords)
      }));
    }
    
    return [];
  }

  /**
   * 문서 데이터 가져오기
   */
  private async fetchDocuments(
    userId: string,
    intent: IntentAnalysis,
    context?: EnrichedContext
  ): Promise<DocumentData[]> {
    // TODO: 실제 데이터베이스에서 문서 가져오기
    if (context?.business?.documents) {
      return context.business.documents.map(d => ({
        id: d.id,
        title: d.name,
        type: d.type,
        createdAt: d.createdAt,
        tags: d.tags,
        relevanceScore: this.calculateRelevance(d.name, intent.keywords)
      }));
    }
    
    return [];
  }

  /**
   * 세무 지식 가져오기
   */
  private async fetchTaxKnowledge(intent: IntentAnalysis): Promise<TaxData[]> {
    // TODO: 세무 지식 베이스에서 관련 정보 가져오기
    // 임시 데이터
    const taxKnowledge: TaxData[] = [
      {
        id: '1',
        title: '소득세 신고 가이드',
        content: '개인사업자 종합소득세 신고 방법과 절차',
        category: '소득세',
        tags: ['종합소득세', '개인사업자', '신고'],
        relevanceScore: 0.8
      },
      {
        id: '2',
        title: '부가가치세 절세 전략',
        content: '합법적인 부가가치세 절세 방법',
        category: '부가가치세',
        tags: ['부가세', '절세', 'VAT'],
        relevanceScore: 0.7
      }
    ];
    
    // 의도와 관련된 지식만 필터링
    if (intent.primaryIntent === 'tax' || intent.subIntents?.includes('tax')) {
      return taxKnowledge.filter(k => 
        k.tags?.some(tag => 
          intent.keywords.some(keyword => 
            tag.toLowerCase().includes(keyword.toLowerCase())
          )
        )
      );
    }
    
    return [];
  }

  /**
   * 일반 지식 가져오기
   */
  private async fetchGeneralKnowledge(intent: IntentAnalysis): Promise<GeneralData[]> {
    // TODO: RAG 벡터 스토어에서 관련 지식 가져오기
    return [];
  }

  /**
   * 템플릿 가져오기
   */
  private async fetchTemplates(intent: IntentAnalysis): Promise<TemplateData[]> {
    // TODO: 템플릿 라이브러리에서 관련 템플릿 가져오기
    if (intent.primaryIntent === 'document' || intent.subIntents?.includes('document')) {
      return [
        {
          id: '1',
          name: '견적서 템플릿',
          type: 'quote',
          content: '기본 견적서 템플릿',
          variables: ['client_name', 'project_name', 'amount'],
          usage: 45,
          relevanceScore: 0.9
        }
      ];
    }
    
    return [];
  }

  /**
   * 분석 데이터 가져오기
   */
  private async fetchAnalytics(userId: string): Promise<AnalyticsData> {
    // TODO: 실제 분석 데이터 계산
    return {
      revenue: {
        total: 50000000,
        monthly: [4000000, 4500000, 5000000, 5500000, 6000000],
        growth: 15
      },
      projects: {
        total: 25,
        active: 8,
        completed: 15,
        successRate: 92
      },
      clients: {
        total: 20,
        active: 12,
        retention: 85
      },
      performance: {
        avgProjectDuration: 45,
        avgProjectValue: 2000000,
        profitMargin: 35
      }
    };
  }

  /**
   * 데이터 병합 및 순위 지정
   */
  private mergeAndRank(
    dataResults: Partial<IntegratedData>[],
    intent: IntentAnalysis
  ): IntegratedData {
    const merged: IntegratedData = {};
    
    // 모든 결과 병합
    dataResults.forEach(result => {
      Object.assign(merged, result);
    });
    
    // 관련성 점수로 정렬
    if (merged.projects) {
      merged.projects.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
    if (merged.clients) {
      merged.clients.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
    if (merged.documents) {
      merged.documents.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
    if (merged.taxKnowledge) {
      merged.taxKnowledge.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
    if (merged.templates) {
      merged.templates.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
    
    return merged;
  }

  /**
   * 관련성 점수 계산
   */
  private calculateRelevance(text: string, keywords: string[]): number {
    if (!text || keywords.length === 0) return 0.5;
    
    const normalizedText = text.toLowerCase();
    let matchCount = 0;
    let weightedScore = 0;
    
    keywords.forEach((keyword, index) => {
      const normalizedKeyword = keyword.toLowerCase();
      if (normalizedText.includes(normalizedKeyword)) {
        matchCount++;
        // 앞쪽 키워드에 더 높은 가중치
        weightedScore += (1 - index * 0.1);
      }
    });
    
    const baseScore = matchCount / keywords.length;
    const finalScore = (baseScore * 0.7 + Math.min(weightedScore / keywords.length, 1) * 0.3);
    
    return Math.min(1, finalScore);
  }

  /**
   * 데이터 캐싱
   */
  private cache: Map<string, { data: IntegratedData; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5분

  /**
   * 캐시에서 데이터 가져오기
   */
  private getCachedData(key: string): IntegratedData | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * 캐시에 데이터 저장
   */
  private setCachedData(key: string, data: IntegratedData): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // 캐시 크기 제한 (최대 100개)
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export default DataIntegrationLayer;