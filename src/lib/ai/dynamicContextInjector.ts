/**
 * 동적 컨텍스트 주입 시스템
 * Phase 3: 대화 중 실시간으로 필요한 컨텍스트를 동적으로 주입
 */

import { IntentAnalyzer, IntentAnalysis } from './intentAnalyzer';
import { ContextManager, EnrichedContext } from './contextManager';
import { EnhancedRAGIntegration } from './enhancedRAGIntegration';

/**
 * 컨텍스트 트리거
 */
export interface ContextTrigger {
  pattern: RegExp;
  contextType: 'project' | 'client' | 'tax' | 'document' | 'financial';
  priority: number;
  requiredData?: string[];
}

/**
 * 동적 컨텍스트 상태
 */
export interface DynamicContextState {
  activeContexts: Map<string, any>;
  contextHistory: ContextHistoryEntry[];
  relevanceScores: Map<string, number>;
  lastUpdate: Date;
}

/**
 * 컨텍스트 히스토리 엔트리
 */
export interface ContextHistoryEntry {
  timestamp: Date;
  contextType: string;
  trigger: string;
  data: any;
  relevance: number;
}

/**
 * 컨텍스트 우선순위 규칙
 */
export interface ContextPriorityRule {
  condition: (message: string, history: any[]) => boolean;
  contextTypes: string[];
  weight: number;
}

/**
 * 동적 컨텍스트 주입기
 */
export class DynamicContextInjector {
  private intentAnalyzer: IntentAnalyzer;
  private contextManager: ContextManager;
  private ragIntegration: EnhancedRAGIntegration;
  private contextState: DynamicContextState;
  private triggers: ContextTrigger[];
  private priorityRules: ContextPriorityRule[];

  constructor() {
    this.intentAnalyzer = new IntentAnalyzer();
    this.contextManager = new ContextManager();
    this.ragIntegration = new EnhancedRAGIntegration();
    
    this.contextState = {
      activeContexts: new Map(),
      contextHistory: [],
      relevanceScores: new Map(),
      lastUpdate: new Date()
    };

    // 컨텍스트 트리거 초기화
    this.triggers = this.initializeTriggers();
    
    // 우선순위 규칙 초기화
    this.priorityRules = this.initializePriorityRules();
  }

  /**
   * 트리거 초기화
   */
  private initializeTriggers(): ContextTrigger[] {
    return [
      // 프로젝트 관련 트리거
      {
        pattern: /프로젝트|일정|마일스톤|진행|태스크/i,
        contextType: 'project',
        priority: 8,
        requiredData: ['projects', 'milestones', 'tasks']
      },
      
      // 클라이언트 관련 트리거
      {
        pattern: /클라이언트|고객|거래처|연락|미팅/i,
        contextType: 'client',
        priority: 7,
        requiredData: ['clients', 'contacts', 'meetings']
      },
      
      // 세무 관련 트리거
      {
        pattern: /세금|세무|부가세|소득세|신고|공제|절세/i,
        contextType: 'tax',
        priority: 9,
        requiredData: ['taxRules', 'deadlines', 'calculations']
      },
      
      // 문서 관련 트리거
      {
        pattern: /문서|계약|견적|인보이스|템플릿|보고서/i,
        contextType: 'document',
        priority: 6,
        requiredData: ['documents', 'templates']
      },
      
      // 재무 관련 트리거
      {
        pattern: /매출|수익|비용|수익률|예산|현금흐름/i,
        contextType: 'financial',
        priority: 8,
        requiredData: ['revenue', 'expenses', 'cashflow']
      }
    ];
  }

  /**
   * 우선순위 규칙 초기화
   */
  private initializePriorityRules(): ContextPriorityRule[] {
    return [
      // 최근 대화 연관성
      {
        condition: (message, history) => {
          const recentMessages = history.slice(-3);
          return recentMessages.some(m => 
            m.content.includes('프로젝트') || m.content.includes('진행')
          );
        },
        contextTypes: ['project'],
        weight: 1.5
      },
      
      // 긴급 세무 이슈
      {
        condition: (message, history) => {
          const urgentKeywords = ['긴급', '마감', '오늘', '내일', '즉시'];
          const taxKeywords = ['신고', '납부', '세금'];
          return urgentKeywords.some(k => message.includes(k)) && 
                 taxKeywords.some(k => message.includes(k));
        },
        contextTypes: ['tax'],
        weight: 2.0
      },
      
      // 복합 쿼리
      {
        condition: (message, history) => {
          const entities = message.split(/[,，、와과및]/).length;
          return entities > 2;
        },
        contextTypes: ['project', 'client', 'financial'],
        weight: 1.3
      }
    ];
  }

  /**
   * 동적 컨텍스트 주입
   */
  async injectDynamicContext(
    message: string,
    userId: string,
    sessionId: string,
    chatHistory: any[] = []
  ): Promise<EnrichedContext> {
    // 1. 의도 분석
    const intent = this.intentAnalyzer.analyze(message);
    
    // 2. 트리거 매칭
    const matchedTriggers = this.matchTriggers(message);
    
    // 3. 우선순위 계산
    const prioritizedContexts = this.calculatePriorities(
      message, 
      chatHistory, 
      matchedTriggers
    );
    
    // 4. 기본 컨텍스트 수집
    const baseContext = await this.contextManager.gatherContext(
      intent,
      userId,
      sessionId
    );
    
    // 5. 동적 컨텍스트 추가
    const enrichedContext = await this.enrichWithDynamicContext(
      baseContext,
      prioritizedContexts,
      userId
    );
    
    // 6. 상태 업데이트
    this.updateContextState(enrichedContext, matchedTriggers);
    
    // 7. 컨텍스트 최적화
    return this.optimizeContext(enrichedContext);
  }

  /**
   * 트리거 매칭
   */
  private matchTriggers(message: string): ContextTrigger[] {
    return this.triggers
      .filter(trigger => trigger.pattern.test(message))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 우선순위 계산
   */
  private calculatePriorities(
    message: string,
    history: any[],
    triggers: ContextTrigger[]
  ): Map<string, number> {
    const priorities = new Map<string, number>();
    
    // 트리거 기반 우선순위
    triggers.forEach(trigger => {
      const current = priorities.get(trigger.contextType) || 0;
      priorities.set(trigger.contextType, current + trigger.priority);
    });
    
    // 규칙 기반 가중치 적용
    this.priorityRules.forEach(rule => {
      if (rule.condition(message, history)) {
        rule.contextTypes.forEach(type => {
          const current = priorities.get(type) || 0;
          priorities.set(type, current * rule.weight);
        });
      }
    });
    
    return priorities;
  }

  /**
   * 동적 컨텍스트로 보강
   */
  private async enrichWithDynamicContext(
    baseContext: EnrichedContext,
    priorities: Map<string, number>,
    userId: string
  ): Promise<EnrichedContext> {
    const enriched = { ...baseContext };
    
    // 우선순위가 높은 컨텍스트부터 추가
    const sortedPriorities = Array.from(priorities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // 상위 3개만
    
    for (const [contextType, priority] of sortedPriorities) {
      if (priority > 5) { // 임계값 이상만 추가
        const additionalContext = await this.fetchAdditionalContext(
          contextType,
          userId
        );
        
        // 컨텍스트 병합
        if (additionalContext) {
          this.mergeContext(enriched, additionalContext, contextType);
        }
      }
    }
    
    return enriched;
  }

  /**
   * 추가 컨텍스트 가져오기
   */
  private async fetchAdditionalContext(
    contextType: string,
    userId: string
  ): Promise<any> {
    switch (contextType) {
      case 'project':
        const { ProjectService } = await import('../services/projectService');
        return {
          recentProjects: await ProjectService.getProjectsByUserId(userId, 3),
          projectStats: await ProjectService.getProjectStatistics(userId)
        };
      
      case 'client':
        const { ClientService } = await import('../services/clientService');
        const allClients = await ClientService.getClientsByUserId(userId);
        return {
          activeClients: allClients.filter(c => c.status === 'active'),
          recentContacts: await ClientService.getClientsNeedingFollowUp(userId)
        };
      
      case 'tax':
        const { taxKnowledgeDB } = await import('./knowledgeBase/taxKnowledge');
        const currentMonth = new Date().getMonth();
        return {
          currentTaxDeadlines: taxKnowledgeDB
            .filter(item => item.category === '세무신고')
            .slice(0, 3),
          relevantRules: taxKnowledgeDB
            .filter(item => item.category === '종합소득세' || item.category === '부가가치세')
            .slice(0, 5)
        };
      
      case 'financial':
        // TODO: 재무 서비스 연동
        return {
          summary: {
            monthlyRevenue: 0,
            monthlyExpenses: 0,
            profitMargin: 0
          }
        };
      
      default:
        return null;
    }
  }

  /**
   * 컨텍스트 병합
   */
  private mergeContext(
    target: EnrichedContext,
    source: any,
    contextType: string
  ): void {
    if (!target.business) {
      target.business = {};
    }
    
    switch (contextType) {
      case 'project':
        if (source.recentProjects) {
          target.business.projects = [
            ...(target.business.projects || []),
            ...source.recentProjects
          ].slice(0, 5);
        }
        break;
      
      case 'client':
        if (source.activeClients) {
          target.business.clients = [
            ...(target.business.clients || []),
            ...source.activeClients
          ].slice(0, 5);
        }
        break;
      
      case 'tax':
        if (!target.knowledge) {
          target.knowledge = {};
        }
        if (source.currentTaxDeadlines) {
          target.knowledge.taxRules = [
            ...(target.knowledge.taxRules || []),
            ...source.currentTaxDeadlines
          ];
        }
        break;
    }
  }

  /**
   * 컨텍스트 상태 업데이트
   */
  private updateContextState(
    context: EnrichedContext,
    triggers: ContextTrigger[]
  ): void {
    // 활성 컨텍스트 업데이트
    triggers.forEach(trigger => {
      this.contextState.activeContexts.set(
        trigger.contextType,
        {
          timestamp: new Date(),
          priority: trigger.priority
        }
      );
    });
    
    // 히스토리 추가
    triggers.forEach(trigger => {
      this.contextState.contextHistory.push({
        timestamp: new Date(),
        contextType: trigger.contextType,
        trigger: trigger.pattern.source,
        data: context,
        relevance: trigger.priority / 10
      });
    });
    
    // 관련성 점수 업데이트
    if (context.relevanceScores) {
      context.relevanceScores.forEach((score, key) => {
        this.contextState.relevanceScores.set(key, score);
      });
    }
    
    this.contextState.lastUpdate = new Date();
    
    // 히스토리 정리 (최대 50개 유지)
    if (this.contextState.contextHistory.length > 50) {
      this.contextState.contextHistory = 
        this.contextState.contextHistory.slice(-50);
    }
  }

  /**
   * 컨텍스트 최적화
   */
  private optimizeContext(context: EnrichedContext): EnrichedContext {
    // 중복 제거
    if (context.business?.projects) {
      const uniqueProjects = new Map();
      context.business.projects.forEach(p => {
        if (!uniqueProjects.has(p.id)) {
          uniqueProjects.set(p.id, p);
        }
      });
      context.business.projects = Array.from(uniqueProjects.values());
    }
    
    if (context.business?.clients) {
      const uniqueClients = new Map();
      context.business.clients.forEach(c => {
        if (!uniqueClients.has(c.id)) {
          uniqueClients.set(c.id, c);
        }
      });
      context.business.clients = Array.from(uniqueClients.values());
    }
    
    // 관련성 기준 정렬
    if (context.relevanceScores) {
      const sortByRelevance = (items: any[], prefix: string) => {
        return items.sort((a, b) => {
          const scoreA = context.relevanceScores?.get(`${prefix}_${a.id}`) || 0;
          const scoreB = context.relevanceScores?.get(`${prefix}_${b.id}`) || 0;
          return scoreB - scoreA;
        });
      };
      
      if (context.business?.projects) {
        context.business.projects = sortByRelevance(
          context.business.projects, 
          'project'
        );
      }
      
      if (context.business?.clients) {
        context.business.clients = sortByRelevance(
          context.business.clients,
          'client'
        );
      }
    }
    
    return context;
  }

  /**
   * 컨텍스트 상태 가져오기
   */
  getContextState(): DynamicContextState {
    return this.contextState;
  }

  /**
   * 컨텍스트 예측
   */
  async predictNextContext(
    currentMessage: string,
    history: any[]
  ): Promise<string[]> {
    const predictions: string[] = [];
    
    // 패턴 분석
    const patterns = this.analyzeConversationPatterns(history);
    
    // 다음 가능한 컨텍스트 예측
    if (patterns.includes('project_discussion')) {
      predictions.push('task_details', 'timeline', 'budget');
    }
    
    if (patterns.includes('tax_inquiry')) {
      predictions.push('calculation', 'deadline', 'documentation');
    }
    
    if (patterns.includes('client_management')) {
      predictions.push('contact_info', 'project_history', 'revenue');
    }
    
    return predictions;
  }

  /**
   * 대화 패턴 분석
   */
  private analyzeConversationPatterns(history: any[]): string[] {
    const patterns: string[] = [];
    const recentMessages = history.slice(-5);
    
    // 프로젝트 논의 패턴
    if (recentMessages.some(m => 
      /프로젝트|마일스톤|태스크/.test(m.content)
    )) {
      patterns.push('project_discussion');
    }
    
    // 세무 문의 패턴
    if (recentMessages.some(m => 
      /세금|세무|신고|공제/.test(m.content)
    )) {
      patterns.push('tax_inquiry');
    }
    
    // 클라이언트 관리 패턴
    if (recentMessages.some(m => 
      /클라이언트|고객|거래처/.test(m.content)
    )) {
      patterns.push('client_management');
    }
    
    return patterns;
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.contextState.activeContexts.clear();
    this.contextState.contextHistory = [];
    this.contextState.relevanceScores.clear();
    this.contextManager.clearCache();
  }
}

export default DynamicContextInjector;