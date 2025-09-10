/**
 * 실시간 학습 시스템
 * Phase 3: 사용자 피드백과 상호작용을 통한 지속적 개선
 */

/**
 * 학습 이벤트 타입
 */
export type LearningEventType = 
  | 'positive_feedback'
  | 'negative_feedback'
  | 'correction'
  | 'preference'
  | 'usage_pattern'
  | 'success_metric';

/**
 * 학습 이벤트
 */
export interface LearningEvent {
  id: string;
  timestamp: Date;
  type: LearningEventType;
  userId: string;
  sessionId: string;
  context: {
    message: string;
    response: string;
    intent: string;
    confidence: number;
  };
  feedback?: {
    rating?: number;
    correction?: string;
    suggestion?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * 학습 패턴
 */
export interface LearningPattern {
  id: string;
  pattern: string;
  frequency: number;
  successRate: number;
  lastOccurrence: Date;
  examples: string[];
  recommendations: string[];
}

/**
 * 사용자 프로필
 */
export interface UserLearningProfile {
  userId: string;
  preferences: {
    responseStyle: 'concise' | 'detailed' | 'technical' | 'simple';
    language: 'formal' | 'casual' | 'professional';
    visualPreference: boolean;
    examplePreference: boolean;
  };
  expertise: {
    domains: string[];
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    frequentTopics: string[];
  };
  interaction: {
    averageSessionLength: number;
    preferredTime: string[];
    messageFrequency: number;
    responseTimeExpectation: number;
  };
  feedback: {
    totalFeedback: number;
    positiveRatio: number;
    commonCorrections: string[];
    satisfactionScore: number;
  };
}

/**
 * 학습 모델
 */
export interface LearningModel {
  version: string;
  lastUpdate: Date;
  accuracy: number;
  patterns: LearningPattern[];
  weights: Map<string, number>;
  biases: Map<string, number>;
}

/**
 * 개선 제안
 */
export interface ImprovementSuggestion {
  id: string;
  type: 'response' | 'intent' | 'context' | 'workflow';
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  examples: string[];
  implementation?: string;
}

/**
 * 실시간 학습 시스템
 */
export class RealtimeLearningSystem {
  private learningEvents: Map<string, LearningEvent[]>;
  private userProfiles: Map<string, UserLearningProfile>;
  private learningModel: LearningModel;
  private patterns: Map<string, LearningPattern>;
  private improvementQueue: ImprovementSuggestion[];

  constructor() {
    this.learningEvents = new Map();
    this.userProfiles = new Map();
    this.patterns = new Map();
    this.improvementQueue = [];
    
    this.learningModel = {
      version: '1.0.0',
      lastUpdate: new Date(),
      accuracy: 0.85,
      patterns: [],
      weights: new Map(),
      biases: new Map()
    };
    
    // 초기 가중치 설정
    this.initializeWeights();
  }

  /**
   * 초기 가중치 설정
   */
  private initializeWeights(): void {
    // 의도 가중치
    this.learningModel.weights.set('intent_tax', 0.9);
    this.learningModel.weights.set('intent_project', 0.85);
    this.learningModel.weights.set('intent_document', 0.8);
    this.learningModel.weights.set('intent_analysis', 0.85);
    this.learningModel.weights.set('intent_general', 0.7);
    
    // 컨텍스트 가중치
    this.learningModel.weights.set('context_relevance', 0.8);
    this.learningModel.weights.set('context_completeness', 0.75);
    this.learningModel.weights.set('context_timeliness', 0.7);
    
    // 응답 품질 가중치
    this.learningModel.weights.set('response_accuracy', 0.95);
    this.learningModel.weights.set('response_helpfulness', 0.9);
    this.learningModel.weights.set('response_clarity', 0.85);
  }

  /**
   * 학습 이벤트 기록
   */
  recordLearningEvent(event: Omit<LearningEvent, 'id'>): void {
    const learningEvent: LearningEvent = {
      ...event,
      id: this.generateEventId()
    };
    
    // 사용자별 이벤트 저장
    const userEvents = this.learningEvents.get(event.userId) || [];
    userEvents.push(learningEvent);
    this.learningEvents.set(event.userId, userEvents);
    
    // 실시간 학습 처리
    this.processLearningEvent(learningEvent);
    
    // 프로필 업데이트
    this.updateUserProfile(event.userId, learningEvent);
    
    // 패턴 감지
    this.detectPatterns(learningEvent);
  }

  /**
   * 학습 이벤트 처리
   */
  private processLearningEvent(event: LearningEvent): void {
    switch (event.type) {
      case 'positive_feedback':
        this.reinforcePositive(event);
        break;
      
      case 'negative_feedback':
        this.adjustForNegative(event);
        break;
      
      case 'correction':
        this.learnFromCorrection(event);
        break;
      
      case 'preference':
        this.updatePreferences(event);
        break;
      
      case 'usage_pattern':
        this.analyzeUsagePattern(event);
        break;
      
      case 'success_metric':
        this.updateSuccessMetrics(event);
        break;
    }
    
    // 모델 정확도 업데이트
    this.updateModelAccuracy();
  }

  /**
   * 긍정적 피드백 강화
   */
  private reinforcePositive(event: LearningEvent): void {
    const intentWeight = this.learningModel.weights.get(`intent_${event.context.intent}`);
    if (intentWeight) {
      // 가중치 증가 (최대 1.0)
      this.learningModel.weights.set(
        `intent_${event.context.intent}`,
        Math.min(intentWeight * 1.05, 1.0)
      );
    }
    
    // 패턴 강화
    const pattern = this.extractPattern(event.context.message);
    if (pattern) {
      const existing = this.patterns.get(pattern);
      if (existing) {
        existing.successRate = (existing.successRate * existing.frequency + 1) / 
                               (existing.frequency + 1);
        existing.frequency++;
        existing.lastOccurrence = new Date();
      } else {
        this.patterns.set(pattern, {
          id: this.generatePatternId(),
          pattern,
          frequency: 1,
          successRate: 1.0,
          lastOccurrence: new Date(),
          examples: [event.context.message],
          recommendations: []
        });
      }
    }
  }

  /**
   * 부정적 피드백 조정
   */
  private adjustForNegative(event: LearningEvent): void {
    const intentWeight = this.learningModel.weights.get(`intent_${event.context.intent}`);
    if (intentWeight) {
      // 가중치 감소 (최소 0.5)
      this.learningModel.weights.set(
        `intent_${event.context.intent}`,
        Math.max(intentWeight * 0.95, 0.5)
      );
    }
    
    // 개선 제안 생성
    const suggestion: ImprovementSuggestion = {
      id: this.generateSuggestionId(),
      type: 'response',
      description: `의도 "${event.context.intent}"에 대한 응답 개선 필요`,
      impact: event.feedback?.rating && event.feedback.rating < 2 ? 'high' : 'medium',
      confidence: 0.7,
      examples: [event.context.message],
      implementation: event.feedback?.suggestion
    };
    
    this.improvementQueue.push(suggestion);
  }

  /**
   * 수정으로부터 학습
   */
  private learnFromCorrection(event: LearningEvent): void {
    if (!event.feedback?.correction) return;
    
    // 수정 패턴 저장
    const correctionPattern = {
      original: event.context.response,
      corrected: event.feedback.correction,
      context: event.context.message,
      intent: event.context.intent
    };
    
    // 유사한 수정 패턴 찾기
    const similarCorrections = this.findSimilarCorrections(correctionPattern);
    
    if (similarCorrections.length > 2) {
      // 반복적인 수정 → 시스템적 개선 필요
      const suggestion: ImprovementSuggestion = {
        id: this.generateSuggestionId(),
        type: 'intent',
        description: `"${event.context.intent}" 의도 처리 로직 개선 필요`,
        impact: 'high',
        confidence: 0.85,
        examples: similarCorrections.map(c => c.context),
        implementation: event.feedback.correction
      };
      
      this.improvementQueue.push(suggestion);
    }
  }

  /**
   * 선호도 업데이트
   */
  private updatePreferences(event: LearningEvent): void {
    const profile = this.getUserProfile(event.userId);
    
    // 응답 스타일 분석
    if (event.metadata?.preferredStyle) {
      profile.preferences.responseStyle = event.metadata.preferredStyle;
    }
    
    // 도메인 전문성 업데이트
    if (event.context.intent) {
      const domains = profile.expertise.domains;
      if (!domains.includes(event.context.intent)) {
        domains.push(event.context.intent);
      }
      
      // 빈도 기반 주요 토픽 업데이트
      profile.expertise.frequentTopics = this.extractFrequentTopics(
        event.userId
      );
    }
    
    this.userProfiles.set(event.userId, profile);
  }

  /**
   * 사용 패턴 분석
   */
  private analyzeUsagePattern(event: LearningEvent): void {
    const profile = this.getUserProfile(event.userId);
    
    // 세션 길이 업데이트
    if (event.metadata?.sessionLength) {
      const prevAvg = profile.interaction.averageSessionLength;
      const newLength = event.metadata.sessionLength;
      profile.interaction.averageSessionLength = 
        (prevAvg * profile.feedback.totalFeedback + newLength) / 
        (profile.feedback.totalFeedback + 1);
    }
    
    // 선호 시간대 업데이트
    const hour = new Date().getHours();
    const timeSlot = `${Math.floor(hour / 4) * 4}-${Math.floor(hour / 4) * 4 + 4}`;
    if (!profile.interaction.preferredTime.includes(timeSlot)) {
      profile.interaction.preferredTime.push(timeSlot);
    }
    
    this.userProfiles.set(event.userId, profile);
  }

  /**
   * 성공 지표 업데이트
   */
  private updateSuccessMetrics(event: LearningEvent): void {
    if (event.metadata?.taskCompleted) {
      // 태스크 완료율 업데이트
      const successRate = this.calculateSuccessRate(event.userId);
      this.learningModel.accuracy = 
        (this.learningModel.accuracy * 0.9 + successRate * 0.1);
    }
  }

  /**
   * 사용자 프로필 가져오기/생성
   */
  getUserProfile(userId: string): UserLearningProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        preferences: {
          responseStyle: 'detailed',
          language: 'professional',
          visualPreference: false,
          examplePreference: true
        },
        expertise: {
          domains: [],
          level: 'intermediate',
          frequentTopics: []
        },
        interaction: {
          averageSessionLength: 10,
          preferredTime: [],
          messageFrequency: 5,
          responseTimeExpectation: 2000
        },
        feedback: {
          totalFeedback: 0,
          positiveRatio: 0.8,
          commonCorrections: [],
          satisfactionScore: 4.0
        }
      });
    }
    
    return this.userProfiles.get(userId)!;
  }

  /**
   * 사용자 프로필 업데이트
   */
  private updateUserProfile(userId: string, event: LearningEvent): void {
    const profile = this.getUserProfile(userId);
    
    // 피드백 통계 업데이트
    profile.feedback.totalFeedback++;
    
    if (event.type === 'positive_feedback') {
      profile.feedback.positiveRatio = 
        (profile.feedback.positiveRatio * (profile.feedback.totalFeedback - 1) + 1) / 
        profile.feedback.totalFeedback;
    } else if (event.type === 'negative_feedback') {
      profile.feedback.positiveRatio = 
        (profile.feedback.positiveRatio * (profile.feedback.totalFeedback - 1)) / 
        profile.feedback.totalFeedback;
    }
    
    // 만족도 점수 업데이트
    if (event.feedback?.rating) {
      profile.feedback.satisfactionScore = 
        (profile.feedback.satisfactionScore * 0.9 + event.feedback.rating * 0.1);
    }
    
    this.userProfiles.set(userId, profile);
  }

  /**
   * 패턴 감지
   */
  private detectPatterns(event: LearningEvent): void {
    const message = event.context.message.toLowerCase();
    
    // 일반적인 패턴 감지
    const patterns = [
      { regex: /언제.*마감/, type: 'deadline_inquiry' },
      { regex: /얼마.*세금/, type: 'tax_calculation' },
      { regex: /어떻게.*신고/, type: 'filing_instruction' },
      { regex: /프로젝트.*진행/, type: 'project_status' },
      { regex: /클라이언트.*연락/, type: 'client_contact' }
    ];
    
    patterns.forEach(({ regex, type }) => {
      if (regex.test(message)) {
        const pattern = this.patterns.get(type) || {
          id: this.generatePatternId(),
          pattern: type,
          frequency: 0,
          successRate: 0,
          lastOccurrence: new Date(),
          examples: [],
          recommendations: []
        };
        
        pattern.frequency++;
        pattern.lastOccurrence = new Date();
        if (!pattern.examples.includes(message)) {
          pattern.examples.push(message);
        }
        
        this.patterns.set(type, pattern);
      }
    });
  }

  /**
   * 개선 제안 가져오기
   */
  getImprovementSuggestions(
    filter?: { type?: string; impact?: string }
  ): ImprovementSuggestion[] {
    let suggestions = [...this.improvementQueue];
    
    if (filter?.type) {
      suggestions = suggestions.filter(s => s.type === filter.type);
    }
    
    if (filter?.impact) {
      suggestions = suggestions.filter(s => s.impact === filter.impact);
    }
    
    // 신뢰도와 영향도로 정렬
    return suggestions.sort((a, b) => {
      const impactScore = { low: 1, medium: 2, high: 3 };
      return (impactScore[b.impact] * b.confidence) - 
             (impactScore[a.impact] * a.confidence);
    });
  }

  /**
   * 학습 인사이트 생성
   */
  generateInsights(userId?: string): any {
    const insights = {
      global: {
        modelAccuracy: this.learningModel.accuracy,
        totalEvents: Array.from(this.learningEvents.values())
          .reduce((sum, events) => sum + events.length, 0),
        topPatterns: Array.from(this.patterns.values())
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5),
        improvementAreas: this.improvementQueue
          .filter(s => s.impact === 'high')
          .slice(0, 3)
      },
      user: userId ? {
        profile: this.getUserProfile(userId),
        recentEvents: this.learningEvents.get(userId)?.slice(-10) || [],
        personalizedRecommendations: this.generatePersonalizedRecommendations(userId)
      } : undefined
    };
    
    return insights;
  }

  /**
   * 개인화된 추천 생성
   */
  private generatePersonalizedRecommendations(userId: string): string[] {
    const profile = this.getUserProfile(userId);
    const recommendations: string[] = [];
    
    // 전문 분야 기반 추천
    if (profile.expertise.frequentTopics.includes('tax')) {
      recommendations.push('세무 캘린더 알림 설정을 통해 중요 신고일을 놓치지 마세요');
    }
    
    if (profile.expertise.frequentTopics.includes('project')) {
      recommendations.push('프로젝트 대시보드에서 진행 상황을 한눈에 확인하세요');
    }
    
    // 선호도 기반 추천
    if (profile.preferences.examplePreference) {
      recommendations.push('구체적인 예시가 필요하시면 "예시를 들어줘"라고 요청하세요');
    }
    
    // 사용 패턴 기반 추천
    if (profile.interaction.averageSessionLength < 5) {
      recommendations.push('빠른 답변을 위해 "간단히 설명해줘"라고 요청해보세요');
    }
    
    return recommendations;
  }

  // 유틸리티 메서드들
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSuggestionId(): string {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractPattern(message: string): string {
    // 간단한 패턴 추출 (실제로는 더 정교한 로직 필요)
    return message.split(' ').slice(0, 3).join('_').toLowerCase();
  }

  private findSimilarCorrections(correction: any): any[] {
    // 유사한 수정 찾기 (실제로는 더 정교한 유사도 계산 필요)
    return [];
  }

  private extractFrequentTopics(userId: string): string[] {
    const events = this.learningEvents.get(userId) || [];
    const topicCounts = new Map<string, number>();
    
    events.forEach(event => {
      const topic = event.context.intent;
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });
    
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private calculateSuccessRate(userId: string): number {
    const profile = this.getUserProfile(userId);
    return profile.feedback.positiveRatio;
  }

  private updateModelAccuracy(): void {
    // 전체 이벤트 기반 정확도 계산
    let totalEvents = 0;
    let positiveEvents = 0;
    
    this.learningEvents.forEach(events => {
      events.forEach(event => {
        totalEvents++;
        if (event.type === 'positive_feedback' || 
            event.type === 'success_metric') {
          positiveEvents++;
        }
      });
    });
    
    if (totalEvents > 0) {
      this.learningModel.accuracy = positiveEvents / totalEvents;
    }
  }

  /**
   * 모델 내보내기
   */
  exportModel(): string {
    return JSON.stringify({
      model: this.learningModel,
      patterns: Array.from(this.patterns.entries()),
      profiles: Array.from(this.userProfiles.entries())
    }, null, 2);
  }

  /**
   * 모델 가져오기
   */
  importModel(modelData: string): void {
    try {
      const data = JSON.parse(modelData);
      this.learningModel = data.model;
      this.patterns = new Map(data.patterns);
      this.userProfiles = new Map(data.profiles);
    } catch (error) {
      console.error('Failed to import model:', error);
    }
  }
}

export default RealtimeLearningSystem;