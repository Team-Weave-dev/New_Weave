/**
 * 대화 컨텍스트 빌더
 * 사용자 정보와 이전 대화를 활용한 개인화된 컨텍스트 생성
 */

export interface UserContext {
  id: string;
  name?: string;
  role?: string;
  company?: string;
  preferences?: {
    language?: string;
    tone?: 'formal' | 'casual' | 'professional';
    expertise?: string[];
  };
}

export interface ChatContext {
  mode: 'general' | 'rag' | 'tax' | 'unified';
  userContext?: UserContext;
  sessionHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  }>;
  relevantDocuments?: Array<{
    title: string;
    content: string;
    similarity?: number;
  }>;
}

export class ContextBuilder {
  /**
   * 모드별 시스템 프롬프트 생성
   */
  static getSystemPrompt(mode: 'general' | 'rag' | 'tax' | 'unified', userContext?: UserContext): string {
    const basePrompt = userContext 
      ? `당신은 ${userContext.company || '회사'}의 ${userContext.name || '사용자'}님을 위한 AI 비서입니다.`
      : '당신은 WEAVE 시스템의 AI 업무 비서입니다.';

    switch (mode) {
      case 'rag':
        return `${basePrompt}
        
업로드된 문서와 지식베이스를 활용하여 정확하고 상세한 답변을 제공합니다.
- 제공된 문서 내용을 우선적으로 참고하여 답변합니다
- 문서에 없는 내용은 일반 지식으로 보충하되, 출처를 구분합니다
- 답변 시 관련 문서를 인용하여 신뢰도를 높입니다
- 사용자의 업무 컨텍스트를 고려하여 실용적인 조언을 제공합니다`;

      case 'tax':
        return `${basePrompt}
        
한국 세무 전문 AI 비서로서 세무 관련 질문에 답변합니다.
- 최신 세법과 규정을 기반으로 정확한 정보를 제공합니다
- 복잡한 세무 용어를 쉽게 설명합니다
- 실무에 적용 가능한 구체적인 조언을 제공합니다
- 세무 리스크와 절세 방안을 균형있게 안내합니다
⚠️ 중요: 제공된 정보는 참고용이며, 중요한 세무 결정은 반드시 세무 전문가와 상담하시기 바랍니다.`;

      case 'unified':
        return `${basePrompt}
        
통합 AI 시스템으로 모든 유형의 질문에 대응합니다.
- 자동으로 질문 의도를 분석하여 최적의 답변을 제공합니다
- 세무, 문서 분석, 일반 업무 등 모든 영역을 지원합니다
- 컨텍스트 기반 개인화된 응답을 생성합니다
- 실시간 학습을 통해 지속적으로 개선됩니다`;
        
      case 'general':
      default:
        return `${basePrompt}
        
업무 효율성을 높이고 문제 해결을 돕는 AI 비서입니다.
- 친근하고 전문적인 톤으로 대화합니다
- 질문의 의도를 정확히 파악하여 맞춤형 답변을 제공합니다
- 단계별 설명과 실용적인 예시를 활용합니다
- 필요시 추가 질문을 통해 더 나은 도움을 제공합니다`;
    }
  }

  /**
   * 개인화된 컨텍스트 구축
   */
  static buildPersonalizedContext(
    message: string,
    context: ChatContext
  ): { systemPrompt: string; enhancedMessage: string } {
    const systemPrompt = this.getSystemPrompt(context.mode, context.userContext);
    
    // 사용자 선호도에 따른 메시지 향상
    let enhancedMessage = message;
    
    if (context.userContext?.preferences) {
      const { language, tone, expertise } = context.userContext.preferences;
      
      // 언어 힌트 추가
      if (language && language !== 'ko') {
        enhancedMessage += `\n(선호 언어: ${language})`;
      }
      
      // 톤 힌트 추가
      if (tone) {
        const toneMap = {
          formal: '격식있는',
          casual: '친근한',
          professional: '전문적인'
        };
        enhancedMessage += `\n(선호 톤: ${toneMap[tone]})`;
      }
      
      // 전문 분야 고려
      if (expertise && expertise.length > 0) {
        enhancedMessage += `\n(전문 분야: ${expertise.join(', ')})`;
      }
    }
    
    // RAG 모드에서 관련 문서 정보 추가
    if (context.mode === 'rag' && context.relevantDocuments) {
      const docInfo = context.relevantDocuments
        .slice(0, 3)
        .map(doc => `- ${doc.title}: ${doc.content.substring(0, 100)}...`)
        .join('\n');
      
      if (docInfo) {
        enhancedMessage += `\n\n참고 문서:\n${docInfo}`;
      }
    }
    
    return { systemPrompt, enhancedMessage };
  }

  /**
   * 대화 히스토리 요약
   */
  static summarizeHistory(
    history: Array<{ role: string; content: string }>,
    maxTokens: number = 1000
  ): string {
    if (!history || history.length === 0) return '';
    
    // 최근 대화 우선, 토큰 제한 고려
    const recentHistory = history.slice(-10);
    const summary = recentHistory
      .map(msg => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content.substring(0, 200)}`)
      .join('\n');
    
    return `이전 대화 요약:\n${summary}`;
  }

  /**
   * 학습된 사용자 패턴 적용
   */
  static applyLearnedPatterns(
    message: string,
    userContext: UserContext
  ): { patterns: string[]; suggestions: string[] } {
    const patterns: string[] = [];
    const suggestions: string[] = [];
    
    // 사용자별 자주 묻는 질문 패턴 감지
    if (message.includes('보고서') || message.includes('리포트')) {
      patterns.push('문서작성');
      suggestions.push('보고서 템플릿을 사용하시겠습니까?');
    }
    
    if (message.includes('분석') || message.includes('데이터')) {
      patterns.push('데이터분석');
      suggestions.push('차트나 그래프로 시각화하시겠습니까?');
    }
    
    if (message.includes('일정') || message.includes('스케줄')) {
      patterns.push('일정관리');
      suggestions.push('캘린더에 추가하시겠습니까?');
    }
    
    return { patterns, suggestions };
  }
}