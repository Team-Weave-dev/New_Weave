/**
 * 통합 AI 오케스트레이터
 * 모든 AI 요청을 처리하는 중앙 허브
 */

import { IntentAnalyzer, IntentAnalysis } from './intentAnalyzer';
import { ContextManager, EnrichedContext } from './contextManager';
import { DataIntegrationLayer, IntegratedData } from './dataIntegrationLayer';
import { ResponseGenerator } from './responseGenerator';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini AI 초기화
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * 응답 전략 인터페이스
 */
export interface ResponseStrategy {
  intent: IntentAnalysis;
  context: EnrichedContext;
  data: IntegratedData;
  model?: 'gemini-2.5-flash-lite' | 'gemini-pro';
  temperature?: number;
  maxTokens?: number;
}

/**
 * AI 응답 인터페이스
 */
export interface AIResponse {
  content: string;
  sources?: Array<{
    type: 'project' | 'client' | 'tax' | 'document' | 'knowledge';
    title: string;
    relevance: number;
  }>;
  suggestions?: string[];
  confidence: number;
  metadata?: {
    processingTime: number;
    tokensUsed: number;
    modelUsed: string;
  };
}

/**
 * 통합 AI 오케스트레이터 클래스
 */
export class UnifiedAIOrchestrator {
  private intentAnalyzer: IntentAnalyzer;
  private contextManager: ContextManager;
  private dataIntegrationLayer: DataIntegrationLayer;
  private responseGenerator: ResponseGenerator;
  
  constructor() {
    this.intentAnalyzer = new IntentAnalyzer();
    this.contextManager = new ContextManager();
    this.dataIntegrationLayer = new DataIntegrationLayer();
    this.responseGenerator = new ResponseGenerator();
  }
  
  /**
   * 메시지 처리 및 응답 생성
   */
  async processMessage(
    message: string,
    userId: string,
    sessionId?: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // 1. 의도 분석
    const intent = await this.intentAnalyzer.analyze(message);
    console.log('Intent analyzed:', intent);
    
    // 2. 컨텍스트 수집
    const context = await this.contextManager.gatherContext(
      intent,
      userId,
      sessionId
    );
    console.log('Context gathered:', {
      hasUserContext: !!context.user,
      projectCount: context.business?.projects?.length || 0,
      knowledgeCount: context.knowledge?.chunks?.length || 0
    });
    
    // 3. 데이터 통합
    const integratedData = await this.dataIntegrationLayer.fetchRelevantData(
      intent,
      userId,
      context
    );
    console.log('Data integrated:', {
      dataTypes: Object.keys(integratedData)
    });
    
    // 4. 응답 전략 결정
    const strategy = this.determineStrategy(intent, context, integratedData);
    
    // 5. 응답 생성
    const response = await this.generateResponse(strategy);
    
    // 6. 메타데이터 추가
    response.metadata = {
      processingTime: Date.now() - startTime,
      tokensUsed: this.estimateTokens(message, response.content),
      modelUsed: strategy.model || 'gemini-2.5-flash-lite'
    };
    
    return response;
  }
  
  /**
   * 응답 전략 결정
   */
  private determineStrategy(
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData
  ): ResponseStrategy {
    let model: 'gemini-2.5-flash-lite' | 'gemini-pro' = 'gemini-2.5-flash-lite';
    let temperature = 0.7;
    let maxTokens = 2048;
    
    // 의도별 전략 조정
    switch (intent.primaryIntent) {
      case 'tax':
        // 세무 관련은 정확성이 중요
        temperature = 0.3;
        maxTokens = 3000;
        break;
        
      case 'project':
      case 'analysis':
        // 분석은 상세한 응답 필요
        model = 'gemini-pro';
        maxTokens = 4000;
        break;
        
      case 'document':
        // 문서 생성은 구조화된 응답 필요
        temperature = 0.5;
        maxTokens = 3000;
        break;
        
      case 'general':
      default:
        // 일반 대화는 자연스럽게
        temperature = 0.7;
        maxTokens = 2048;
    }
    
    // 컨텍스트 복잡도에 따른 조정
    if ((context.business?.projects?.length ?? 0) > 5 || 
        (context.knowledge?.chunks?.length ?? 0) > 10) {
      model = 'gemini-pro';
      maxTokens = Math.min(maxTokens * 1.5, 8000);
    }
    
    return {
      intent,
      context,
      data,
      model,
      temperature,
      maxTokens
    };
  }
  
  /**
   * 응답 생성
   */
  private async generateResponse(
    strategy: ResponseStrategy
  ): Promise<AIResponse> {
    if (!genAI) {
      throw new Error('Gemini AI가 초기화되지 않았습니다.');
    }
    
    // 프롬프트 생성
    const prompt = this.buildPrompt(strategy);
    
    // Gemini 모델 초기화
    const model = genAI.getGenerativeModel({ 
      model: strategy.model || 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: strategy.temperature,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: strategy.maxTokens,
      }
    });
    
    try {
      // 응답 생성
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      
      // 소스 추출
      const sources = this.extractSources(strategy.data);
      
      // 제안 생성
      const suggestions = this.generateSuggestions(
        strategy.intent,
        strategy.context
      );
      
      // 신뢰도 계산
      const confidence = this.calculateConfidence(
        strategy.intent,
        strategy.data
      );
      
      return {
        content,
        sources,
        suggestions,
        confidence
      };
    } catch (error) {
      console.error('응답 생성 오류:', error);
      throw new Error('AI 응답 생성 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 프롬프트 구성
   */
  private buildPrompt(strategy: ResponseStrategy): string {
    let prompt = '';
    
    // 시스템 프롬프트
    prompt += this.getSystemPrompt(strategy.intent);
    prompt += '\n\n';
    
    // 컨텍스트 주입
    if ((strategy.context.business?.projects?.length ?? 0) > 0) {
      prompt += '현재 프로젝트 정보:\n';
      strategy.context.business?.projects?.forEach(project => {
        prompt += `- ${project.name}: ${project.status} (진행률: ${project.progress}%)\n`;
      });
      prompt += '\n';
    }
    
    if ((strategy.context.business?.clients?.length ?? 0) > 0) {
      prompt += '클라이언트 정보:\n';
      strategy.context.business?.clients?.forEach(client => {
        prompt += `- ${client.name}: ${client.projects}개 프로젝트\n`;
      });
      prompt += '\n';
    }
    
    // 지식 베이스 정보
    if ((strategy.context.knowledge?.chunks?.length ?? 0) > 0) {
      prompt += '관련 정보:\n';
      strategy.context.knowledge?.chunks?.forEach(chunk => {
        prompt += `- ${chunk.content}\n`;
      });
      prompt += '\n';
    }
    
    // 이전 대화 컨텍스트
    if ((strategy.context.user?.history?.length ?? 0) > 0) {
      prompt += '이전 대화:\n';
      strategy.context.user?.history?.slice(-3).forEach(msg => {
        prompt += `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    
    // 사용자 메시지
    prompt += `사용자 질문: ${strategy.intent.message}\n`;
    
    // 응답 가이드라인
    prompt += '\n다음 사항을 고려하여 답변해주세요:\n';
    prompt += '1. 제공된 컨텍스트를 활용하여 구체적이고 정확한 답변\n';
    prompt += '2. 사용자의 상황에 맞는 실용적인 조언\n';
    prompt += '3. 필요시 단계별 설명이나 예시 제공\n';
    prompt += '4. 전문적이면서도 이해하기 쉬운 언어 사용\n';
    
    return prompt;
  }
  
  /**
   * 시스템 프롬프트 생성
   */
  private getSystemPrompt(intent: IntentAnalysis): string {
    const basePrompt = `당신은 WEAVE의 AI 업무 비서입니다.
사용자의 프로젝트, 클라이언트, 세무 정보를 종합적으로 활용하여 
맞춤형 조언과 지원을 제공합니다.`;
    
    switch (intent.primaryIntent) {
      case 'tax':
        return `${basePrompt}
        
한국 세무 전문 지식을 바탕으로 정확한 세무 상담을 제공합니다.
- 최신 세법과 규정 기반 정보 제공
- 절세 방안과 리스크 균형있게 안내
- 실무 적용 가능한 구체적 조언
⚠️ 중요한 세무 결정은 전문가 상담을 권고합니다.`;
        
      case 'project':
        return `${basePrompt}
        
프로젝트 관리와 클라이언트 관계를 지원합니다.
- 프로젝트 진행 상황 분석 및 조언
- 일정 관리와 마일스톤 추적
- 클라이언트 커뮤니케이션 지원`;
        
      case 'document':
        return `${basePrompt}
        
문서 작성과 템플릿 활용을 지원합니다.
- 비즈니스 문서 작성 가이드
- 템플릿 기반 빠른 문서 생성
- 문서 구조화와 최적화`;
        
      case 'analysis':
        return `${basePrompt}
        
데이터 분석과 인사이트를 제공합니다.
- 비즈니스 메트릭 분석
- 트렌드와 패턴 식별
- 실행 가능한 인사이트 도출`;
        
      default:
        return `${basePrompt}
        
업무 효율성을 높이고 문제 해결을 돕습니다.
- 맥락에 맞는 정확한 답변
- 실용적이고 구체적인 조언
- 사용자 상황에 최적화된 지원`;
    }
  }
  
  /**
   * 소스 추출
   */
  private extractSources(data: IntegratedData): AIResponse['sources'] {
    const sources: AIResponse['sources'] = [];
    
    // 각 데이터 타입별로 소스 추출
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
    
    // 관련성 순으로 정렬
    sources.sort((a, b) => b.relevance - a.relevance);
    
    // 상위 5개만 반환
    return sources.slice(0, 5);
  }
  
  /**
   * 제안 생성
   */
  private generateSuggestions(
    intent: IntentAnalysis,
    context: EnrichedContext
  ): string[] {
    const suggestions: string[] = [];
    
    // 의도별 제안
    switch (intent.primaryIntent) {
      case 'tax':
        suggestions.push('세금 계산기 사용하기');
        suggestions.push('세무 일정 확인하기');
        suggestions.push('절세 팁 더 보기');
        break;
        
      case 'project':
        suggestions.push('프로젝트 타임라인 보기');
        suggestions.push('마일스톤 업데이트');
        suggestions.push('팀 현황 확인');
        break;
        
      case 'document':
        suggestions.push('템플릿 라이브러리 보기');
        suggestions.push('문서 내보내기');
        suggestions.push('버전 관리');
        break;
        
      case 'analysis':
        suggestions.push('대시보드 보기');
        suggestions.push('상세 리포트 생성');
        suggestions.push('데이터 내보내기');
        break;
        
      default:
        suggestions.push('도움말 보기');
        suggestions.push('자주 묻는 질문');
        suggestions.push('지원 요청');
    }
    
    // 컨텍스트 기반 추가 제안
    if (context.business?.projects?.some(p => p.status === 'on_hold' || p.status === 'cancelled')) {
      suggestions.push('보류 또는 취소된 프로젝트 확인');
    }
    
    if (context.business?.invoices?.some(i => i.status === 'overdue' || i.status === 'sent')) {
      suggestions.push('미결제 인보이스 확인');
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
    
    // 데이터 가용성에 따른 조정
    const hasProjectData = (data.projects?.length ?? 0) > 0;
    const hasClientData = (data.clients?.length ?? 0) > 0;
    const hasKnowledgeData = (data.taxKnowledge?.length ?? 0) > 0 || 
                            (data.generalKnowledge?.length ?? 0) > 0;
    
    if (hasProjectData && hasClientData) {
      confidence = Math.min(confidence * 1.2, 1.0);
    }
    
    if (hasKnowledgeData) {
      confidence = Math.min(confidence * 1.1, 1.0);
    }
    
    // 데이터가 전혀 없으면 신뢰도 감소
    if (!hasProjectData && !hasClientData && !hasKnowledgeData) {
      confidence = confidence * 0.7;
    }
    
    return Math.round(confidence * 100) / 100;
  }
  
  /**
   * 토큰 추정
   */
  private estimateTokens(input: string, output: string): number {
    // 간단한 토큰 추정 (실제로는 tokenizer 사용)
    const totalChars = input.length + output.length;
    return Math.ceil(totalChars / 4); // 평균 4자 = 1토큰
  }
}

export default UnifiedAIOrchestrator;