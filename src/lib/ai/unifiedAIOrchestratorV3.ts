/**
 * 통합 AI 오케스트레이터 V3 (최종)
 * Phase 4: 캐싱, 성능 모니터링, 에러 처리 통합
 */

import { IntentAnalyzer, IntentAnalysis } from './intentAnalyzer';
import { ContextManager, EnrichedContext } from './contextManager';
import { DataIntegrationLayer, IntegratedData } from './dataIntegrationLayer';
import { ResponseGenerator } from './responseGenerator';
import { DynamicContextInjector } from './dynamicContextInjector';
import { RealtimeLearningSystem } from './learningSystem';
import { PersonalizationProfileManager } from './personalizationProfile';
import { CacheManager, CacheLayer } from './cacheSystem';
import { GlobalPerformanceMonitor } from './performanceMonitor';
import { GlobalErrorHandler, SystemError, ErrorType, RetryMechanism } from './errorHandling';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini AI 초기화는 생성자에서 처리

/**
 * 최종 AI 응답
 */
export interface AIResponseV3 {
  content: string;
  sources?: Array<{
    type: string;
    title: string;
    relevance: number;
  }>;
  suggestions?: string[];
  confidence: number;
  metadata?: {
    processingTime: number;
    tokensUsed: number;
    modelUsed: string;
    sessionId?: string;
    timestamp: Date;
    cached?: boolean;
    personalization?: {
      profileActive: boolean;
      adaptationScore: number;
    };
    learning?: {
      confidence: number;
      contextRelevance: number;
    };
    performance?: {
      cacheHit: boolean;
      responseTime: number;
      healthScore: number;
    };
  };
}

/**
 * 통합 AI 오케스트레이터 V3
 */
export class UnifiedAIOrchestratorV3 {
  private intentAnalyzer: IntentAnalyzer;
  private contextManager: ContextManager;
  private dataIntegration: DataIntegrationLayer;
  private responseGenerator: ResponseGenerator;
  private contextInjector: DynamicContextInjector;
  private learningSystem: RealtimeLearningSystem;
  private profileManager: PersonalizationProfileManager;
  private cacheManager: CacheManager;
  private performanceMonitor: GlobalPerformanceMonitor;
  private errorHandler: GlobalErrorHandler;
  private genAI: GoogleGenerativeAI | null = null;

  constructor(apiKey?: string) {
    // Gemini AI 초기화
    const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(geminiApiKey);
    }
    // Phase 1-3 시스템
    this.intentAnalyzer = new IntentAnalyzer();
    this.contextManager = new ContextManager();
    this.dataIntegration = new DataIntegrationLayer();
    this.responseGenerator = new ResponseGenerator();
    this.contextInjector = new DynamicContextInjector();
    this.learningSystem = new RealtimeLearningSystem();
    this.profileManager = new PersonalizationProfileManager();
    
    // Phase 4 시스템
    this.cacheManager = CacheManager.getInstance();
    this.performanceMonitor = GlobalPerformanceMonitor.getInstance();
    this.errorHandler = GlobalErrorHandler.getInstance();
  }

  /**
   * 메시지 처리 (최종 버전)
   */
  async processMessage(
    message: string,
    userId: string,
    sessionId?: string,
    options?: any
  ): Promise<AIResponseV3> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    // 성능 모니터링 시작
    this.performanceMonitor.getMonitor().startRequest(requestId);
    
    try {
      // 1. 캐시 체크
      const cacheKey = this.generateCacheKey(message, userId);
      const cache = this.cacheManager.getCache('ai-responses');
      const cachedResponse = await cache.get<AIResponseV3>(cacheKey);
      
      if (cachedResponse) {
        // 캐시 히트 기록
        this.performanceMonitor.getMonitor().recordCacheEvent(true);
        
        // 성능 모니터링 완료
        this.performanceMonitor.getMonitor().endRequest(requestId, true, {
          cacheHit: true
        });
        
        return {
          ...cachedResponse,
          metadata: {
            processingTime: cachedResponse.metadata?.processingTime || 0,
            tokensUsed: cachedResponse.metadata?.tokensUsed || 0,
            modelUsed: cachedResponse.metadata?.modelUsed || 'gemini-2.5-flash-lite',
            timestamp: cachedResponse.metadata?.timestamp || new Date(),
            ...cachedResponse.metadata,
            cached: true,
            performance: {
              cacheHit: true,
              responseTime: Date.now() - startTime,
              healthScore: this.performanceMonitor.getMonitor().getSummary().health
            }
          }
        };
      }
      
      // 캐시 미스 기록
      this.performanceMonitor.getMonitor().recordCacheEvent(false);
      
      // 2. 재시도 메커니즘으로 처리
      const response = await RetryMechanism.retryWithExponentialBackoff(
        async () => await this.processWithErrorHandling(
          message,
          userId,
          sessionId,
          options,
          startTime
        ),
        3, // 최대 3회 재시도
        1000, // 초기 딜레이 1초
        2 // 지수 백오프 배율
      );
      
      // 3. 캐시 저장
      await cache.set(cacheKey, response, {
        ttl: 5 * 60 * 1000, // 5분
        layer: CacheLayer.L1_MEMORY,
        tags: ['ai-response', userId]
      });
      
      // 4. 성능 모니터링 완료
      this.performanceMonitor.getMonitor().endRequest(requestId, true, {
        tokensUsed: response.metadata?.tokensUsed,
        cacheHit: false
      });
      
      return response;
      
    } catch (error) {
      // 에러 처리
      this.performanceMonitor.getMonitor().endRequest(requestId, false);
      this.performanceMonitor.getMonitor().recordError(error as Error, {
        message,
        userId,
        sessionId
      });
      
      // 폴백 응답 시도
      const fallbackResponse = await this.errorHandler.getHandler().handle<AIResponseV3>(
        error as Error,
        { message, userId, sessionId }
      );
      
      if (fallbackResponse) {
        return fallbackResponse;
      }
      
      // 최종 실패
      throw new SystemError(
        'AI 응답 생성 실패',
        ErrorType.PROCESSING,
        'HIGH' as any,
        false
      );
    }
  }

  /**
   * 에러 처리를 포함한 처리
   */
  private async processWithErrorHandling(
    message: string,
    userId: string,
    sessionId: string | undefined,
    options: any,
    startTime: number
  ): Promise<AIResponseV3> {
    try {
      // 1. 개인화 프로필 로드
      const profile = await this.profileManager.getOrCreateProfile(userId);
      this.profileManager.setActiveProfile(userId);
      
      // 2. 의도 분석
      const intent = await this.intentAnalyzer.analyze(message);
      
      // 3. 동적 컨텍스트 주입
      const context = await this.contextInjector.injectDynamicContext(
        message,
        userId,
        sessionId || 'default',
        options?.chatHistory || []
      );
      
      // 4. 데이터 통합
      const integratedData = await this.dataIntegration.fetchRelevantData(
        intent,
        userId,
        context
      );
      
      // 5. 개인화된 응답 생성
      const personalizedSettings = this.profileManager.getPersonalizedSettings(userId);
      const response = await this.generateOptimizedResponse(
        message,
        intent,
        context,
        integratedData,
        personalizedSettings
      );
      
      // 6. 학습 이벤트 기록
      this.learningSystem.recordLearningEvent({
        timestamp: new Date(),
        type: 'usage_pattern',
        userId,
        sessionId: sessionId || 'default',
        context: {
          message,
          response: response.content,
          intent: intent.primaryIntent,
          confidence: intent.confidence
        },
        metadata: {
          processingTime: Date.now() - startTime
        }
      });
      
      // 7. 행동 패턴 기록
      this.profileManager.recordBehavior(userId, {
        type: 'query',
        frequency: 1,
        lastOccurrence: new Date(),
        confidence: intent.confidence,
        data: { 
          intent: intent.primaryIntent, 
          domain: intent.subIntents?.[0] || intent.primaryIntent 
        }
      });
      
      // 8. 메타데이터 추가
      const processingTime = Date.now() - startTime;
      const healthScore = this.performanceMonitor.getMonitor().getSummary().health;
      
      return {
        ...response,
        metadata: {
          processingTime,
          tokensUsed: response.metadata?.tokensUsed || 0,
          modelUsed: response.metadata?.modelUsed || 'gemini-2.5-flash-lite',
          ...response.metadata,
          sessionId,
          timestamp: new Date(),
          personalization: {
            profileActive: true,
            adaptationScore: profile.metrics.adaptationScore
          },
          learning: {
            confidence: intent.confidence,
            contextRelevance: context.relevanceScores?.size || 0
          },
          performance: {
            cacheHit: false,
            responseTime: processingTime,
            healthScore
          }
        }
      };
    } catch (error) {
      // 에러를 상위로 전파
      throw error;
    }
  }

  /**
   * 최적화된 응답 생성
   */
  private async generateOptimizedResponse(
    message: string,
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    personalization: any
  ): Promise<AIResponseV3> {
    if (!this.genAI) {
      throw new SystemError(
        'Gemini AI가 초기화되지 않았습니다',
        ErrorType.PROCESSING,
        'CRITICAL' as any,
        false
      );
    }

    // 개인화 설정 적용
    const temperature = personalization?.responseStyle?.technicality === 'technical' ? 0.3 :
                       personalization?.responseStyle?.technicality === 'simple' ? 0.8 : 0.6;
    
    const maxTokens = personalization?.responseStyle?.length === 'brief' ? 1024 :
                     personalization?.responseStyle?.length === 'detailed' ? 4096 : 2048;

    // 프롬프트 생성
    const prompt = this.buildOptimizedPrompt(
      message,
      intent,
      context,
      data,
      personalization
    );

    // Gemini 모델 초기화 (gemini-2.5-flash-lite 고정)
    const model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: maxTokens,
      }
    });

    try {
      // 응답 생성
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      
      // 소스 추출
      const sources = this.extractSources(data);
      
      // 개인화된 제안 생성
      const suggestions = this.generateSuggestions(
        intent,
        context,
        personalization
      );
      
      // 신뢰도 계산
      const confidence = this.calculateConfidence(intent, data);
      
      return {
        content,
        sources,
        suggestions,
        confidence,
        metadata: {
          processingTime: 0,
          tokensUsed: this.estimateTokens(message, content),
          modelUsed: 'gemini-2.5-flash-lite',
          timestamp: new Date()
        }
      };
    } catch (error) {
      throw new SystemError(
        `AI 응답 생성 실패: ${error instanceof Error ? error.message : String(error)}`,
        ErrorType.API_LIMIT,
        'HIGH' as any,
        true
      );
    }
  }

  /**
   * 최적화된 프롬프트 생성
   */
  private buildOptimizedPrompt(
    message: string,
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    personalization: any
  ): string {
    let prompt = '';
    
    // 시스템 프롬프트
    prompt += this.getSystemPrompt(intent, personalization);
    prompt += '\n\n';
    
    // 컨텍스트 주입 (최적화된 크기)
    const contextLimit = personalization?.responseStyle?.length === 'brief' ? 3 : 5;
    
    if ((context.business?.projects?.length ?? 0) > 0) {
      prompt += '현재 프로젝트 정보:\n';
      context.business?.projects?.slice(0, contextLimit).forEach(project => {
        prompt += `- ${project.name}: ${project.status} (${project.progress}%)\n`;
      });
      prompt += '\n';
    }
    
    if ((context.business?.clients?.length ?? 0) > 0) {
      prompt += '클라이언트 정보:\n';
      context.business?.clients?.slice(0, contextLimit).forEach(client => {
        prompt += `- ${client.name}: ${client.projects}개 프로젝트\n`;
      });
      prompt += '\n';
    }
    
    // 사용자 메시지
    prompt += `사용자 질문: ${message}\n`;
    
    // 응답 가이드라인
    prompt += this.getResponseGuidelines(personalization);
    
    return prompt;
  }

  /**
   * 시스템 프롬프트
   */
  private getSystemPrompt(
    intent: IntentAnalysis,
    personalization: any
  ): string {
    const expertiseLevel = personalization?.domainSettings?.expertiseLevel || 'intermediate';
    const primaryDomain = personalization?.domainSettings?.primaryDomain || 'general';
    
    return `당신은 WEAVE의 AI 업무 비서입니다.
사용자 전문 수준: ${expertiseLevel}
주요 도메인: ${primaryDomain}
응답은 항상 한국어로 제공합니다.

사용자의 의도를 정확히 파악하여 맞춤형 지원을 제공합니다.`;
  }

  /**
   * 응답 가이드라인
   */
  private getResponseGuidelines(personalization: any): string {
    let guidelines = '\n응답 가이드라인:\n';
    
    if (personalization?.responseStyle?.length === 'brief') {
      guidelines += '- 간결하고 핵심적인 답변\n';
    } else if (personalization?.responseStyle?.length === 'detailed') {
      guidelines += '- 상세하고 포괄적인 답변\n';
    }
    
    if (personalization?.contentPreferences?.includeExamples) {
      guidelines += '- 구체적인 예시 포함\n';
    }
    
    if (personalization?.contentPreferences?.includeActionItems) {
      guidelines += '- 실행 가능한 액션 아이템 제공\n';
    }
    
    guidelines += '- 전문적이면서도 이해하기 쉬운 설명\n';
    
    return guidelines;
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(message: string, userId: string): string {
    return `ai_response_${userId}_${message.toLowerCase().replace(/\s+/g, '_').substring(0, 50)}`;
  }

  /**
   * 요청 ID 생성
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 소스 추출
   */
  private extractSources(data: IntegratedData): any[] {
    const sources: any[] = [];
    
    if ((data.projects?.length ?? 0) > 0) {
      data.projects?.forEach(project => {
        sources.push({
          type: 'project',
          title: project.name,
          relevance: project.relevanceScore || 0.8
        });
      });
    }
    
    if ((data.clients?.length ?? 0) > 0) {
      data.clients?.forEach(client => {
        sources.push({
          type: 'client',
          title: client.name,
          relevance: client.relevanceScore || 0.7
        });
      });
    }
    
    if ((data.taxKnowledge?.length ?? 0) > 0) {
      data.taxKnowledge?.forEach(knowledge => {
        sources.push({
          type: 'tax',
          title: knowledge.title,
          relevance: knowledge.relevanceScore || 0.9
        });
      });
    }
    
    return sources.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }

  /**
   * 제안 생성
   */
  private generateSuggestions(
    intent: IntentAnalysis,
    context: EnrichedContext,
    personalization: any
  ): string[] {
    const suggestions: string[] = [];
    const shortcuts = personalization?.workflowPreferences?.shortcuts || [];
    
    if (shortcuts.length > 0) {
      suggestions.push(...shortcuts.slice(0, 2));
    }
    
    switch (intent.primaryIntent) {
      case 'tax':
        suggestions.push('세금 계산기');
        suggestions.push('신고 일정 확인');
        break;
      case 'project':
        suggestions.push('프로젝트 상태 확인');
        suggestions.push('마일스톤 업데이트');
        break;
      default:
        suggestions.push('자주 사용하는 기능');
    }
    
    return suggestions.slice(0, 3);
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    intent: IntentAnalysis,
    data: IntegratedData
  ): number {
    let confidence = intent.confidence;
    
    const hasData = ((data.projects?.length ?? 0) > 0) ||
                   ((data.clients?.length ?? 0) > 0) ||
                   ((data.taxKnowledge?.length ?? 0) > 0);
    
    if (hasData) {
      confidence = Math.min(confidence * 1.2, 1.0);
    } else {
      confidence = confidence * 0.7;
    }
    
    return Math.round(confidence * 100) / 100;
  }

  /**
   * 토큰 추정
   */
  private estimateTokens(input: string, output: string): number {
    const totalChars = input.length + output.length;
    return Math.ceil(totalChars / 4);
  }

  /**
   * 피드백 처리
   */
  async processFeedback(
    userId: string,
    messageId: string,
    feedback: {
      rating?: number;
      correction?: string;
      suggestion?: string;
    }
  ): Promise<void> {
    const eventType = feedback.rating && feedback.rating >= 4 ? 
      'positive_feedback' : 'negative_feedback';
    
    this.learningSystem.recordLearningEvent({
      timestamp: new Date(),
      type: feedback.correction ? 'correction' : eventType,
      userId,
      sessionId: messageId,
      context: {
        message: '',
        response: '',
        intent: '',
        confidence: 0
      },
      feedback
    });
    
    // 캐시 무효화
    if (feedback.rating && feedback.rating < 3) {
      const cache = this.cacheManager.getCache('ai-responses');
      await cache.deleteByTags([userId]);
    }
  }

  /**
   * 시스템 상태 조회
   */
  getSystemStatus(): any {
    const performanceSummary = this.performanceMonitor.getMonitor().getSummary();
    const errorStats = this.errorHandler.getHandler().getErrorStats();
    const cacheStats = this.cacheManager.getAllStats();
    const learningInsights = this.learningSystem.generateInsights();
    
    return {
      health: performanceSummary.health,
      performance: performanceSummary,
      errors: errorStats,
      cache: cacheStats,
      learning: learningInsights.global,
      timestamp: new Date()
    };
  }

  /**
   * 캐시 정리
   */
  async clearCache(userId?: string): Promise<void> {
    const cache = this.cacheManager.getCache('ai-responses');
    
    if (userId) {
      await cache.deleteByTags([userId]);
    } else {
      await cache.clear();
    }
    
    this.contextManager.clearCache(userId);
    this.contextInjector.clearCache();
  }
}

export default UnifiedAIOrchestratorV3;