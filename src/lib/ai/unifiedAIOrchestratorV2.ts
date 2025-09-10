/**
 * 통합 AI 오케스트레이터 V2
 * Phase 3: 동적 컨텍스트, 학습 시스템, 개인화 통합
 */

import { IntentAnalyzer, IntentAnalysis } from './intentAnalyzer';
import { ContextManager, EnrichedContext } from './contextManager';
import { DataIntegrationLayer, IntegratedData } from './dataIntegrationLayer';
import { ResponseGenerator } from './responseGenerator';
import { DynamicContextInjector } from './dynamicContextInjector';
import { RealtimeLearningSystem } from './learningSystem';
import { PersonalizationProfileManager } from './personalizationProfile';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini AI 초기화
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * 처리 옵션
 */
export interface ProcessingOptions {
  stream?: boolean;
  chatHistory?: any[];
  maxTokens?: number;
  temperature?: number;
  personalization?: any;
}

/**
 * 스트림 청크
 */
export interface StreamChunk {
  type: 'content' | 'sources' | 'suggestions' | 'done';
  content: string;
  metadata?: any;
}

/**
 * AI 응답 V2
 */
export interface AIResponseV2 {
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
    personalization?: {
      profileActive: boolean;
      adaptationScore: number;
    };
    learning?: {
      confidence: number;
      contextRelevance: number;
    };
  };
}

/**
 * 통합 AI 오케스트레이터 V2
 */
export class UnifiedAIOrchestratorV2 {
  private intentAnalyzer: IntentAnalyzer;
  private contextManager: ContextManager;
  private dataIntegration: DataIntegrationLayer;
  private responseGenerator: ResponseGenerator;
  private contextInjector: DynamicContextInjector;
  private learningSystem: RealtimeLearningSystem;
  private profileManager: PersonalizationProfileManager;

  constructor() {
    this.intentAnalyzer = new IntentAnalyzer();
    this.contextManager = new ContextManager();
    this.dataIntegration = new DataIntegrationLayer();
    this.responseGenerator = new ResponseGenerator();
    this.contextInjector = new DynamicContextInjector();
    this.learningSystem = new RealtimeLearningSystem();
    this.profileManager = new PersonalizationProfileManager();
  }

  /**
   * 메시지 처리 (Phase 3 통합)
   */
  async processMessage(
    message: string,
    userId: string,
    sessionId?: string,
    options?: ProcessingOptions
  ): Promise<AIResponseV2> {
    try {
      const startTime = Date.now();

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
      const response = await this.generatePersonalizedResponse(
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
      
      // 8. 컨텍스트 기록
      this.profileManager.recordContext(userId, {
        timestamp: new Date(),
        context: message,
        outcome: 'successful',
        feedback: undefined
      });
      
      // 9. 메타데이터 추가
      return {
        ...response,
        metadata: {
          processingTime: Date.now() - startTime,
          tokensUsed: response.metadata?.tokensUsed || 0,
          modelUsed: response.metadata?.modelUsed || 'gemini-2.5-flash-lite',
          sessionId,
          timestamp: new Date(),
          personalization: {
            profileActive: true,
            adaptationScore: profile.metrics.adaptationScore
          },
          learning: {
            confidence: intent.confidence,
            contextRelevance: context.relevanceScores?.size || 0
          }
        }
      };
    } catch (error) {
      console.error('Message processing error:', error);
      
      // 실패 기록
      this.learningSystem.recordLearningEvent({
        timestamp: new Date(),
        type: 'negative_feedback',
        userId,
        sessionId: sessionId || 'default',
        context: {
          message,
          response: '',
          intent: '',
          confidence: 0
        },
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
      
      throw error;
    }
  }

  /**
   * 스트리밍 응답
   */
  async *streamResponse(
    message: string,
    userId: string,
    sessionId?: string,
    options?: ProcessingOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
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
      
      // 5. 개인화 설정
      const personalizedSettings = this.profileManager.getPersonalizedSettings(userId);
      
      // 6. 스트리밍 응답 생성
      yield* this.generateStreamingResponse(
        message,
        intent,
        context,
        integratedData,
        personalizedSettings
      );
      
      // 7. 학습 이벤트 기록 (스트리밍 완료 후)
      this.learningSystem.recordLearningEvent({
        timestamp: new Date(),
        type: 'usage_pattern',
        userId,
        sessionId: sessionId || 'default',
        context: {
          message,
          response: '[streaming]',
          intent: intent.primaryIntent,
          confidence: intent.confidence
        },
        metadata: { streaming: true }
      });
    } catch (error) {
      console.error('Stream processing error:', error);
      throw error;
    }
  }

  /**
   * 개인화된 응답 생성
   */
  private async generatePersonalizedResponse(
    message: string,
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    personalization: any
  ): Promise<AIResponseV2> {
    if (!genAI) {
      throw new Error('Gemini AI가 초기화되지 않았습니다.');
    }

    // 개인화 설정 적용
    const temperature = personalization?.responseStyle?.technicality === 'technical' ? 0.3 :
                       personalization?.responseStyle?.technicality === 'simple' ? 0.8 : 0.6;
    
    const maxTokens = personalization?.responseStyle?.length === 'brief' ? 1024 :
                     personalization?.responseStyle?.length === 'detailed' ? 4096 : 2048;

    // 프롬프트 생성 (개인화 적용)
    const prompt = this.buildPersonalizedPrompt(
      message,
      intent,
      context,
      data,
      personalization
    );

    // Gemini 모델 초기화 (gemini-2.5-flash-lite 고정)
    const model = genAI.getGenerativeModel({ 
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
      const suggestions = this.generatePersonalizedSuggestions(
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
      console.error('응답 생성 오류:', error);
      throw new Error('AI 응답 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * 스트리밍 응답 생성
   */
  private async *generateStreamingResponse(
    message: string,
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    personalization: any
  ): AsyncGenerator<StreamChunk, void, unknown> {
    if (!genAI) {
      throw new Error('Gemini AI가 초기화되지 않았습니다.');
    }

    const prompt = this.buildPersonalizedPrompt(
      message,
      intent,
      context,
      data,
      personalization
    );

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite'
    });

    try {
      const result = await model.generateContentStream(prompt);
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield {
            type: 'content',
            content: text
          };
        }
      }
      
      // 소스 전송
      const sources = this.extractSources(data);
      if (sources.length > 0) {
        yield {
          type: 'sources',
          content: JSON.stringify(sources)
        };
      }
      
      // 제안 전송
      const suggestions = this.generatePersonalizedSuggestions(
        intent,
        context,
        personalization
      );
      if (suggestions.length > 0) {
        yield {
          type: 'suggestions',
          content: JSON.stringify(suggestions)
        };
      }
      
      // 완료 신호
      yield {
        type: 'done',
        content: ''
      };
    } catch (error) {
      console.error('스트리밍 오류:', error);
      throw error;
    }
  }

  /**
   * 개인화된 프롬프트 생성
   */
  private buildPersonalizedPrompt(
    message: string,
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    personalization: any
  ): string {
    let prompt = '';
    
    // 시스템 프롬프트 (개인화 적용)
    prompt += this.getPersonalizedSystemPrompt(intent, personalization);
    prompt += '\n\n';
    
    // 컨텍스트 주입
    if ((context.business?.projects?.length ?? 0) > 0) {
      prompt += '현재 프로젝트 정보:\n';
      context.business?.projects?.forEach(project => {
        prompt += `- ${project.name}: ${project.status} (진행률: ${project.progress}%)\n`;
      });
      prompt += '\n';
    }
    
    if ((context.business?.clients?.length ?? 0) > 0) {
      prompt += '클라이언트 정보:\n';
      context.business?.clients?.forEach(client => {
        prompt += `- ${client.name}: ${client.projects}개 프로젝트\n`;
      });
      prompt += '\n';
    }
    
    // 지식 베이스 (개인화된 상세도)
    if ((context.knowledge?.chunks?.length ?? 0) > 0) {
      const includeDetails = personalization?.contentPreferences?.includeExamples;
      prompt += '관련 정보:\n';
      context.knowledge?.chunks?.slice(0, includeDetails ? 5 : 3).forEach(chunk => {
        prompt += `- ${chunk.content}\n`;
      });
      prompt += '\n';
    }
    
    // 사용자 메시지
    prompt += `사용자 질문: ${message}\n`;
    
    // 개인화된 응답 가이드라인
    prompt += '\n응답 스타일:\n';
    
    if (personalization?.responseStyle?.length === 'brief') {
      prompt += '- 간결하고 핵심적인 답변 (1-2 문단)\n';
    } else if (personalization?.responseStyle?.length === 'detailed') {
      prompt += '- 상세하고 포괄적인 답변 (단계별 설명 포함)\n';
    }
    
    if (personalization?.responseStyle?.tone === 'formal') {
      prompt += '- 공식적이고 전문적인 어조\n';
    } else if (personalization?.responseStyle?.tone === 'friendly') {
      prompt += '- 친근하고 대화적인 어조\n';
    }
    
    if (personalization?.contentPreferences?.includeExamples) {
      prompt += '- 구체적인 예시 포함\n';
    }
    
    if (personalization?.contentPreferences?.includeActionItems) {
      prompt += '- 실행 가능한 액션 아이템 제공\n';
    }
    
    return prompt;
  }

  /**
   * 개인화된 시스템 프롬프트
   */
  private getPersonalizedSystemPrompt(
    intent: IntentAnalysis,
    personalization: any
  ): string {
    const expertiseLevel = personalization?.domainSettings?.expertiseLevel || 'intermediate';
    const primaryDomain = personalization?.domainSettings?.primaryDomain || 'general';
    
    let basePrompt = `당신은 WEAVE의 AI 업무 비서입니다.
사용자의 전문 수준: ${expertiseLevel}
주요 도메인: ${primaryDomain}`;

    if (intent.primaryIntent === 'tax' || primaryDomain === 'tax') {
      basePrompt += '\n\n한국 세무 전문 지식을 바탕으로 ';
      
      if (expertiseLevel === 'expert') {
        basePrompt += '전문적이고 기술적인 세무 자문을 제공합니다.';
      } else if (expertiseLevel === 'novice') {
        basePrompt += '이해하기 쉬운 세무 안내를 제공합니다.';
      } else {
        basePrompt += '실무 적용 가능한 세무 조언을 제공합니다.';
      }
    } else {
      basePrompt += '\n\n맞춤형 업무 지원을 제공합니다.';
    }

    return basePrompt;
  }

  /**
   * 개인화된 제안 생성
   */
  private generatePersonalizedSuggestions(
    intent: IntentAnalysis,
    context: EnrichedContext,
    personalization: any
  ): string[] {
    const suggestions: string[] = [];
    const shortcuts = personalization?.workflowPreferences?.shortcuts || [];
    
    // 사용자 단축키 기반 제안
    if (shortcuts.length > 0) {
      suggestions.push(...shortcuts.slice(0, 2));
    }
    
    // 의도 기반 제안
    switch (intent.primaryIntent) {
      case 'tax':
        if (personalization?.domainSettings?.expertiseLevel === 'expert') {
          suggestions.push('세법 개정사항 확인');
          suggestions.push('절세 시뮬레이션');
        } else {
          suggestions.push('세금 계산기');
          suggestions.push('신고 일정 확인');
        }
        break;
      
      case 'project':
        suggestions.push('프로젝트 상태 업데이트');
        suggestions.push('마일스톤 확인');
        break;
      
      default:
        suggestions.push('자주 사용하는 기능');
    }
    
    return suggestions.slice(0, 3);
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
    // 학습 시스템에 피드백 기록
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
    
    // 프로필 컨텍스트 업데이트
    this.profileManager.recordContext(userId, {
      timestamp: new Date(),
      context: messageId,
      outcome: feedback.rating && feedback.rating >= 4 ? 'successful' : 'partial',
      feedback: feedback.rating
    });
  }

  /**
   * 사용자 선호도 업데이트
   */
  async updateUserPreferences(
    userId: string,
    preferences: any
  ): Promise<void> {
    this.profileManager.updateProfile(userId, preferences);
    
    this.learningSystem.recordLearningEvent({
      timestamp: new Date(),
      type: 'preference',
      userId,
      sessionId: 'preference_update',
      context: {
        message: '',
        response: '',
        intent: 'preference_change',
        confidence: 1.0
      },
      metadata: preferences
    });
  }

  /**
   * 학습 인사이트 가져오기
   */
  async getLearningInsights(userId?: string): Promise<any> {
    const insights = this.learningSystem.generateInsights(userId);
    const contextState = this.contextInjector.getContextState();
    const profileStats = userId ? 
      this.profileManager.getProfileStats(userId) : null;
    
    return {
      learning: insights,
      context: {
        activeContexts: Array.from(contextState.activeContexts.entries()),
        recentHistory: contextState.contextHistory.slice(-10)
      },
      profile: profileStats,
      recommendations: userId ? 
        this.profileManager.generateRecommendations(userId) : [],
      improvements: this.learningSystem.getImprovementSuggestions()
    };
  }

  /**
   * 캐시 정리
   */
  clearCache(userId?: string): void {
    this.contextManager.clearCache(userId);
    this.contextInjector.clearCache();
  }
}

export default UnifiedAIOrchestratorV2;