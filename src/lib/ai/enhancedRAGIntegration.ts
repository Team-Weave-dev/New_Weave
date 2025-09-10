/**
 * 개선된 RAG 통합 시스템
 * 세무 지식과 사용자 데이터를 자동으로 활용
 */

import { RAGPipeline } from '../rag/ragPipeline';
import { VectorStore } from '../rag/vectorStore';
import { TaxKnowledgeSearch } from './knowledgeBase/taxKnowledge';
import { ProjectService } from '../services/projectService';
import { ClientService } from '../services/clientService';

/**
 * 개선된 RAG 컨텍스트
 */
export interface EnhancedRAGContext {
  taxKnowledge?: string[];
  projectContext?: string[];
  clientContext?: string[];
  documentContext?: string[];
  historicalContext?: string[];
  metadata?: {
    sources: string[];
    confidence: number;
    timestamp: Date;
  };
}

/**
 * RAG 쿼리 타입
 */
export type RAGQueryType = 
  | 'tax_inquiry'
  | 'project_status'
  | 'client_info'
  | 'document_search'
  | 'general_knowledge';

/**
 * 개선된 RAG 통합 클래스
 */
export class EnhancedRAGIntegration {
  private ragPipeline: RAGPipeline;
  private vectorStore: VectorStore;
  private taxKnowledge: TaxKnowledgeSearch;
  private isInitialized: boolean = false;

  constructor() {
    this.ragPipeline = new RAGPipeline({
      maxContextChunks: 7,
      minSimilarityScore: 0.65,
      useHybridSearch: true,
      includeMetadata: true,
      contextWindow: 6000
    });
    
    this.vectorStore = new VectorStore();
    this.taxKnowledge = new TaxKnowledgeSearch();
  }

  /**
   * 시스템 초기화
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 세무 지식 벡터화 및 인덱싱
      await this.indexTaxKnowledge();
      
      // 사용자 프로젝트 데이터 인덱싱
      await this.indexUserProjects(userId);
      
      // 사용자 클라이언트 데이터 인덱싱
      await this.indexUserClients(userId);
      
      this.isInitialized = true;
      console.log('Enhanced RAG system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG system:', error);
      throw error;
    }
  }

  /**
   * 세무 지식 인덱싱
   */
  private async indexTaxKnowledge(): Promise<void> {
    const categories = this.taxKnowledge.getAllCategories();
    
    for (const category of categories) {
      const knowledgeItems = this.taxKnowledge.searchByCategory(category);
      
      for (const item of knowledgeItems) {
        const content = `
제목: ${item.title}
카테고리: ${item.category}
내용: ${item.content}
${item.examples ? '예시: ' + item.examples.join(', ') : ''}
${item.warnings ? '주의사항: ' + item.warnings.join(', ') : ''}
키워드: ${item.keywords.join(', ')}
        `.trim();

        await this.vectorStore.indexDocument(content, {
          source: 'tax_knowledge',
          category: item.category,
          timestamp: new Date(),
          tags: [item.id, 'knowledge']
        });
      }
    }
  }

  /**
   * 사용자 프로젝트 데이터 인덱싱
   */
  private async indexUserProjects(userId: string): Promise<void> {
    const projects = await ProjectService.getProjectsByUserId(userId);
    
    for (const project of projects) {
      const content = `
프로젝트명: ${project.name}
클라이언트: ${project.clientName}
상태: ${project.status}
우선순위: ${project.priority}
진행률: ${project.progress}%
마감일: ${project.dueDate}
예산: ${project.budget.estimated}원 (사용: ${project.budget.spent}원)
팀 규모: ${project.teamSize}명
태스크: 전체 ${project.taskCount.total}개, 완료 ${project.taskCount.completed}개
      `.trim();

      await this.vectorStore.indexDocument(content, {
        source: 'project',
        userId,
        projectId: project.id,
        timestamp: new Date(),
        tags: ['project']
      });
    }
  }

  /**
   * 사용자 클라이언트 데이터 인덱싱
   */
  private async indexUserClients(userId: string): Promise<void> {
    const clients = await ClientService.getClientsByUserId(userId);
    
    for (const client of clients) {
      const content = `
클라이언트명: ${client.name}
유형: ${client.type}
상태: ${client.status}
연락처: ${client.email || ''} ${client.phone || ''}
활성 프로젝트: ${client.activeProjects}개
총 매출: ${client.totalRevenue}원
마지막 연락: ${client.lastContact ? new Date(client.lastContact).toLocaleDateString('ko-KR') : '없음'}
      `.trim();

      await this.vectorStore.indexDocument(content, {
        source: 'client',
        userId,
        timestamp: new Date(),
        tags: [client.id, 'client']
      });
    }
  }

  /**
   * 쿼리 타입 판단
   */
  private determineQueryType(query: string): RAGQueryType {
    const taxKeywords = ['세금', '세무', '소득세', '부가세', 'VAT', '신고', '공제', '절세'];
    const projectKeywords = ['프로젝트', '진행', '마일스톤', '일정', '태스크'];
    const clientKeywords = ['클라이언트', '고객', '거래처', '연락'];
    const documentKeywords = ['문서', '계약서', '견적서', '인보이스', '템플릿'];

    const lowerQuery = query.toLowerCase();

    if (taxKeywords.some(k => lowerQuery.includes(k))) {
      return 'tax_inquiry';
    } else if (projectKeywords.some(k => lowerQuery.includes(k))) {
      return 'project_status';
    } else if (clientKeywords.some(k => lowerQuery.includes(k))) {
      return 'client_info';
    } else if (documentKeywords.some(k => lowerQuery.includes(k))) {
      return 'document_search';
    }

    return 'general_knowledge';
  }

  /**
   * 통합 컨텍스트 생성
   */
  async generateEnhancedContext(
    query: string,
    userId: string
  ): Promise<EnhancedRAGContext> {
    // 시스템 초기화 확인
    if (!this.isInitialized) {
      await this.initialize(userId);
    }

    const queryType = this.determineQueryType(query);
    const context: EnhancedRAGContext = {
      metadata: {
        sources: [],
        confidence: 0,
        timestamp: new Date()
      }
    };

    // 쿼리 타입별 컨텍스트 수집
    switch (queryType) {
      case 'tax_inquiry':
        context.taxKnowledge = await this.getTaxContext(query);
        context.metadata!.sources.push('tax_knowledge');
        break;
        
      case 'project_status':
        context.projectContext = await this.getProjectContext(query, userId);
        context.metadata!.sources.push('projects');
        break;
        
      case 'client_info':
        context.clientContext = await this.getClientContext(query, userId);
        context.metadata!.sources.push('clients');
        break;
        
      case 'document_search':
        context.documentContext = await this.getDocumentContext(query, userId);
        context.metadata!.sources.push('documents');
        break;
        
      default:
        // 일반 지식은 모든 소스에서 검색
        const results = await this.vectorStore.search(query, 5, { userId });
        context.historicalContext = results.map(r => r.chunk.content);
        context.metadata!.sources.push('all');
    }

    // 신뢰도 계산
    const hasResults = 
      (context.taxKnowledge?.length || 0) +
      (context.projectContext?.length || 0) +
      (context.clientContext?.length || 0) +
      (context.documentContext?.length || 0) +
      (context.historicalContext?.length || 0);
    
    context.metadata!.confidence = Math.min(hasResults * 0.2, 1);

    return context;
  }

  /**
   * 세무 컨텍스트 수집
   */
  private async getTaxContext(query: string): Promise<string[]> {
    // 키워드 추출
    const keywords = query.split(/\s+/).filter(w => w.length > 2);
    
    // 세무 지식 검색
    const taxResults = this.taxKnowledge.searchByKeywords(keywords);
    
    // 벡터 스토어에서도 검색
    const vectorResults = await this.vectorStore.search(query, 3, {
      category: 'tax'
    });

    const context: string[] = [];

    // 세무 지식 추가
    taxResults.slice(0, 3).forEach(item => {
      context.push(`[${item.title}]\n${item.content}`);
    });

    // 벡터 검색 결과 추가
    vectorResults.forEach(result => {
      if (result.similarity > 0.7) {
        context.push(result.chunk.content);
      }
    });

    return context;
  }

  /**
   * 프로젝트 컨텍스트 수집
   */
  private async getProjectContext(query: string, userId: string): Promise<string[]> {
    const projects = await ProjectService.searchProjects(query, userId);
    const context: string[] = [];

    for (const project of projects.slice(0, 3)) {
      const detail = await ProjectService.getProjectById(project.id);
      if (detail) {
        const projectInfo = `
프로젝트: ${detail.name}
클라이언트: ${detail.clientName}
상태: ${detail.status} (${detail.progress}% 완료)
마감일: ${detail.dueDate}
예산: ${detail.budget.estimated}원 중 ${detail.budget.spent}원 사용
${detail.milestones.length > 0 ? '마일스톤: ' + detail.milestones.map(m => `${m.title} (${m.progress}%)`).join(', ') : ''}
${detail.tasks.length > 0 ? '태스크: ' + detail.tasks.length + '개' : ''}
        `.trim();
        
        context.push(projectInfo);
      }
    }

    return context;
  }

  /**
   * 클라이언트 컨텍스트 수집
   */
  private async getClientContext(query: string, userId: string): Promise<string[]> {
    const clients = await ClientService.searchClients(query, userId);
    const context: string[] = [];

    for (const client of clients.slice(0, 3)) {
      const detail = await ClientService.getClientById(client.id);
      if (detail) {
        const clientInfo = `
클라이언트: ${detail.name}
상태: ${detail.status}
업종: ${detail.industry || '미지정'}
프로젝트: 활성 ${detail.activeProjectCount}개, 완료 ${detail.completedProjectCount}개
총 매출: ${detail.totalRevenue}원
미수금: ${detail.outstanding}원
마지막 연락: ${detail.lastContact ? new Date(detail.lastContact).toLocaleDateString('ko-KR') : '없음'}
${detail.notes ? '메모: ' + detail.notes : ''}
        `.trim();
        
        context.push(clientInfo);
      }
    }

    return context;
  }

  /**
   * 문서 컨텍스트 수집
   */
  private async getDocumentContext(query: string, userId: string): Promise<string[]> {
    // 벡터 스토어에서 문서 관련 검색
    const results = await this.vectorStore.search(query, 5, {
      userId,
      category: 'document'
    });

    return results
      .filter(r => r.similarity > 0.65)
      .map(r => r.chunk.content);
  }

  /**
   * 스트리밍 응답 생성
   */
  async *generateStreamingResponse(
    query: string,
    userId: string,
    chatHistory: any[] = []
  ): AsyncGenerator<string, void, unknown> {
    // 컨텍스트 생성
    const context = await this.generateEnhancedContext(query, userId);
    
    // 컨텍스트를 프롬프트에 포함
    let contextPrompt = '';
    
    if (context.taxKnowledge?.length) {
      contextPrompt += '세무 정보:\n' + context.taxKnowledge.join('\n\n') + '\n\n';
    }
    if (context.projectContext?.length) {
      contextPrompt += '프로젝트 정보:\n' + context.projectContext.join('\n\n') + '\n\n';
    }
    if (context.clientContext?.length) {
      contextPrompt += '클라이언트 정보:\n' + context.clientContext.join('\n\n') + '\n\n';
    }

    // RAG 파이프라인을 통한 응답 생성
    const fullQuery = contextPrompt ? `${contextPrompt}\n질문: ${query}` : query;
    
    yield* this.ragPipeline.generateStreamingResponse(
      fullQuery,
      userId,
      chatHistory
    );
  }

  /**
   * 일반 응답 생성
   */
  async generateResponse(
    query: string,
    userId: string,
    chatHistory: any[] = []
  ) {
    // 컨텍스트 생성
    const context = await this.generateEnhancedContext(query, userId);
    
    // 컨텍스트를 프롬프트에 포함
    let contextPrompt = '';
    
    if (context.taxKnowledge?.length) {
      contextPrompt += '세무 정보:\n' + context.taxKnowledge.join('\n\n') + '\n\n';
    }
    if (context.projectContext?.length) {
      contextPrompt += '프로젝트 정보:\n' + context.projectContext.join('\n\n') + '\n\n';
    }
    if (context.clientContext?.length) {
      contextPrompt += '클라이언트 정보:\n' + context.clientContext.join('\n\n') + '\n\n';
    }

    // RAG 파이프라인을 통한 응답 생성
    const fullQuery = contextPrompt ? `${contextPrompt}\n질문: ${query}` : query;
    
    const response = await this.ragPipeline.generateResponse(
      fullQuery,
      userId,
      chatHistory
    );

    // 메타데이터 추가
    return {
      ...response,
      contextUsed: context.metadata
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.isInitialized = false;
    // 벡터 스토어 캐시 정리는 필요시 구현
  }

  /**
   * 특정 데이터 재인덱싱
   */
  async reindexData(
    userId: string,
    dataType: 'projects' | 'clients' | 'tax' | 'all'
  ): Promise<void> {
    switch (dataType) {
      case 'projects':
        await this.indexUserProjects(userId);
        break;
      case 'clients':
        await this.indexUserClients(userId);
        break;
      case 'tax':
        await this.indexTaxKnowledge();
        break;
      case 'all':
        await this.initialize(userId);
        break;
    }
  }
}

export default EnhancedRAGIntegration;