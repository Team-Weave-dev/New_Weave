/**
 * 개인화 프로필 시스템
 * Phase 3: 사용자별 맞춤 AI 경험 제공
 */

import { UserLearningProfile } from './learningSystem';

/**
 * 개인화 설정
 */
export interface PersonalizationSettings {
  // 응답 스타일
  responseStyle: {
    length: 'brief' | 'moderate' | 'detailed';
    tone: 'formal' | 'friendly' | 'professional';
    technicality: 'simple' | 'balanced' | 'technical';
    formatting: 'plain' | 'structured' | 'rich';
  };
  
  // 콘텐츠 선호
  contentPreferences: {
    includeExamples: boolean;
    includeVisuals: boolean;
    includeReferences: boolean;
    includeSummary: boolean;
    includeActionItems: boolean;
  };
  
  // 도메인 설정
  domainSettings: {
    primaryDomain: string;
    expertiseLevel: 'novice' | 'intermediate' | 'advanced' | 'expert';
    industryContext: string;
    regionalSettings: string;
  };
  
  // 워크플로우 선호
  workflowPreferences: {
    autoSuggestions: boolean;
    proactiveHelp: boolean;
    contextualTips: boolean;
    quickActions: boolean;
    shortcuts: string[];
  };
}

/**
 * 행동 패턴
 */
export interface BehaviorPattern {
  patternId: string;
  type: 'query' | 'navigation' | 'interaction' | 'preference';
  frequency: number;
  lastOccurrence: Date;
  confidence: number;
  data: any;
}

/**
 * 컨텍스트 히스토리
 */
export interface ContextHistory {
  sessionId: string;
  timestamp: Date;
  context: string;
  outcome: 'successful' | 'failed' | 'partial';
  feedback?: number;
}

/**
 * 개인화 메트릭
 */
export interface PersonalizationMetrics {
  adaptationScore: number;
  userSatisfaction: number;
  taskCompletionRate: number;
  averageInteractionTime: number;
  preferenceMatchRate: number;
}

/**
 * 개인화 프로필
 */
export interface PersonalizationProfile {
  userId: string;
  createdAt: Date;
  lastUpdated: Date;
  settings: PersonalizationSettings;
  patterns: BehaviorPattern[];
  contextHistory: ContextHistory[];
  metrics: PersonalizationMetrics;
  learningProfile?: UserLearningProfile;
  customData?: Record<string, any>;
}

/**
 * 프로필 템플릿
 */
export const ProfileTemplates = {
  BUSINESS_OWNER: {
    responseStyle: {
      length: 'moderate' as const,
      tone: 'professional' as const,
      technicality: 'balanced' as const,
      formatting: 'structured' as const
    },
    contentPreferences: {
      includeExamples: true,
      includeVisuals: false,
      includeReferences: true,
      includeSummary: true,
      includeActionItems: true
    },
    domainSettings: {
      primaryDomain: 'business',
      expertiseLevel: 'intermediate' as const,
      industryContext: 'general',
      regionalSettings: 'ko-KR'
    },
    workflowPreferences: {
      autoSuggestions: true,
      proactiveHelp: true,
      contextualTips: true,
      quickActions: true,
      shortcuts: []
    }
  },
  
  TAX_PROFESSIONAL: {
    responseStyle: {
      length: 'detailed' as const,
      tone: 'formal' as const,
      technicality: 'technical' as const,
      formatting: 'structured' as const
    },
    contentPreferences: {
      includeExamples: true,
      includeVisuals: false,
      includeReferences: true,
      includeSummary: false,
      includeActionItems: true
    },
    domainSettings: {
      primaryDomain: 'tax',
      expertiseLevel: 'expert' as const,
      industryContext: 'accounting',
      regionalSettings: 'ko-KR'
    },
    workflowPreferences: {
      autoSuggestions: false,
      proactiveHelp: false,
      contextualTips: true,
      quickActions: true,
      shortcuts: ['tax-calc', 'filing-deadline', 'deduction-check']
    }
  },
  
  PROJECT_MANAGER: {
    responseStyle: {
      length: 'brief',
      tone: 'friendly',
      technicality: 'simple',
      formatting: 'structured'
    },
    contentPreferences: {
      includeExamples: false,
      includeVisuals: true,
      includeReferences: false,
      includeSummary: true,
      includeActionItems: true
    },
    domainSettings: {
      primaryDomain: 'project',
      expertiseLevel: 'advanced',
      industryContext: 'general',
      regionalSettings: 'ko-KR'
    },
    workflowPreferences: {
      autoSuggestions: true,
      proactiveHelp: true,
      contextualTips: false,
      quickActions: true,
      shortcuts: ['status-update', 'task-assign', 'milestone-check']
    }
  }
};

/**
 * 개인화 프로필 관리자
 */
export class PersonalizationProfileManager {
  private profiles: Map<string, PersonalizationProfile>;
  private activeProfile: PersonalizationProfile | null = null;

  constructor() {
    this.profiles = new Map();
  }

  /**
   * 프로필 생성 또는 가져오기
   */
  async getOrCreateProfile(
    userId: string,
    template?: keyof typeof ProfileTemplates
  ): Promise<PersonalizationProfile> {
    if (this.profiles.has(userId)) {
      return this.profiles.get(userId)!;
    }

    const newProfile = await this.createProfile(userId, template);
    this.profiles.set(userId, newProfile);
    return newProfile;
  }

  /**
   * 프로필 생성
   */
  private async createProfile(
    userId: string,
    template?: keyof typeof ProfileTemplates
  ): Promise<PersonalizationProfile> {
    const baseSettings = template ? 
      ProfileTemplates[template] : 
      ProfileTemplates.BUSINESS_OWNER;

    const profile: PersonalizationProfile = {
      userId,
      createdAt: new Date(),
      lastUpdated: new Date(),
      settings: { ...baseSettings } as PersonalizationSettings,
      patterns: [],
      contextHistory: [],
      metrics: {
        adaptationScore: 0.7,
        userSatisfaction: 4.0,
        taskCompletionRate: 0.8,
        averageInteractionTime: 120,
        preferenceMatchRate: 0.75
      }
    };

    // 초기 행동 패턴 설정
    this.initializeBehaviorPatterns(profile);

    return profile;
  }

  /**
   * 초기 행동 패턴 설정
   */
  private initializeBehaviorPatterns(profile: PersonalizationProfile): void {
    // 도메인 기반 기본 패턴
    const domain = profile.settings.domainSettings.primaryDomain;
    
    const basePatterns: BehaviorPattern[] = [
      {
        patternId: `default_query_${domain}`,
        type: 'query',
        frequency: 0,
        lastOccurrence: new Date(),
        confidence: 0.5,
        data: { domain }
      }
    ];

    profile.patterns = basePatterns;
  }

  /**
   * 프로필 업데이트
   */
  updateProfile(
    userId: string,
    updates: Partial<PersonalizationSettings>
  ): void {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    // 설정 병합
    profile.settings = {
      ...profile.settings,
      ...updates,
      responseStyle: {
        ...profile.settings.responseStyle,
        ...(updates.responseStyle || {})
      },
      contentPreferences: {
        ...profile.settings.contentPreferences,
        ...(updates.contentPreferences || {})
      },
      domainSettings: {
        ...profile.settings.domainSettings,
        ...(updates.domainSettings || {})
      },
      workflowPreferences: {
        ...profile.settings.workflowPreferences,
        ...(updates.workflowPreferences || {})
      }
    };

    profile.lastUpdated = new Date();
    this.profiles.set(userId, profile);
  }

  /**
   * 행동 패턴 기록
   */
  recordBehavior(
    userId: string,
    pattern: Omit<BehaviorPattern, 'patternId'>
  ): void {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    const behaviorPattern: BehaviorPattern = {
      ...pattern,
      patternId: this.generatePatternId()
    };

    // 유사 패턴 찾기
    const existingPattern = profile.patterns.find(p => 
      p.type === pattern.type && 
      JSON.stringify(p.data) === JSON.stringify(pattern.data)
    );

    if (existingPattern) {
      // 기존 패턴 업데이트
      existingPattern.frequency++;
      existingPattern.lastOccurrence = new Date();
      existingPattern.confidence = Math.min(
        existingPattern.confidence * 1.1, 
        1.0
      );
    } else {
      // 새 패턴 추가
      profile.patterns.push(behaviorPattern);
    }

    // 패턴 정리 (최대 100개 유지)
    if (profile.patterns.length > 100) {
      profile.patterns = profile.patterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 100);
    }

    this.updateMetrics(profile);
  }

  /**
   * 컨텍스트 기록
   */
  recordContext(
    userId: string,
    context: Omit<ContextHistory, 'sessionId'>
  ): void {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    const contextEntry: ContextHistory = {
      ...context,
      sessionId: this.generateSessionId()
    };

    profile.contextHistory.push(contextEntry);

    // 히스토리 정리 (최대 50개 유지)
    if (profile.contextHistory.length > 50) {
      profile.contextHistory = profile.contextHistory.slice(-50);
    }

    this.updateMetrics(profile);
  }

  /**
   * 메트릭 업데이트
   */
  private updateMetrics(profile: PersonalizationProfile): void {
    // 적응 점수 계산
    const recentPatterns = profile.patterns
      .filter(p => {
        const daysSince = (Date.now() - p.lastOccurrence.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < 7;
      });
    
    profile.metrics.adaptationScore = Math.min(
      recentPatterns.length / 10,
      1.0
    );

    // 태스크 완료율 계산
    const recentContexts = profile.contextHistory.slice(-20);
    const successfulTasks = recentContexts.filter(c => c.outcome === 'successful').length;
    profile.metrics.taskCompletionRate = 
      recentContexts.length > 0 ? successfulTasks / recentContexts.length : 0.8;

    // 사용자 만족도 계산
    const feedbackContexts = recentContexts.filter(c => c.feedback !== undefined);
    if (feedbackContexts.length > 0) {
      const avgFeedback = feedbackContexts.reduce((sum, c) => sum + (c.feedback || 0), 0) / 
                         feedbackContexts.length;
      profile.metrics.userSatisfaction = avgFeedback;
    }

    // 선호도 매치율 계산
    profile.metrics.preferenceMatchRate = this.calculatePreferenceMatch(profile);
  }

  /**
   * 선호도 매치율 계산
   */
  private calculatePreferenceMatch(profile: PersonalizationProfile): number {
    const patterns = profile.patterns;
    const settings = profile.settings;
    
    // 도메인 매치
    const domainPatterns = patterns.filter(p => 
      p.data?.domain === settings.domainSettings.primaryDomain
    );
    const domainMatch = patterns.length > 0 ? 
      domainPatterns.length / patterns.length : 0.5;

    // 스타일 매치 (최근 피드백 기반)
    const positiveFeedback = profile.contextHistory
      .filter(c => c.feedback && c.feedback >= 4).length;
    const totalFeedback = profile.contextHistory
      .filter(c => c.feedback).length;
    const styleMatch = totalFeedback > 0 ? 
      positiveFeedback / totalFeedback : 0.7;

    return (domainMatch + styleMatch) / 2;
  }

  /**
   * 개인화된 응답 생성 설정
   */
  getPersonalizedSettings(userId: string): PersonalizationSettings | null {
    const profile = this.profiles.get(userId);
    return profile?.settings || null;
  }

  /**
   * 추천 생성
   */
  generateRecommendations(userId: string): string[] {
    const profile = this.profiles.get(userId);
    if (!profile) return [];

    const recommendations: string[] = [];

    // 메트릭 기반 추천
    if (profile.metrics.taskCompletionRate < 0.6) {
      recommendations.push('작업을 더 작은 단위로 나누어 진행해보세요');
    }

    if (profile.metrics.userSatisfaction < 3.5) {
      recommendations.push('응답 스타일을 변경해보시겠어요? 설정에서 조정 가능합니다');
    }

    // 패턴 기반 추천
    const frequentPatterns = profile.patterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    frequentPatterns.forEach(pattern => {
      if (pattern.type === 'query' && pattern.data?.domain === 'tax') {
        recommendations.push('세무 캘린더 구독으로 중요 일정을 놓치지 마세요');
      }
      if (pattern.type === 'navigation' && pattern.frequency > 10) {
        recommendations.push(`자주 사용하는 기능을 단축키로 설정해보세요`);
      }
    });

    // 설정 기반 추천
    if (!profile.settings.contentPreferences.includeActionItems) {
      recommendations.push('액션 아이템을 포함하면 작업 관리가 더 쉬워집니다');
    }

    return recommendations.slice(0, 5);
  }

  /**
   * 프로필 내보내기
   */
  exportProfile(userId: string): string | null {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    return JSON.stringify(profile, null, 2);
  }

  /**
   * 프로필 가져오기
   */
  importProfile(profileData: string): boolean {
    try {
      const profile = JSON.parse(profileData) as PersonalizationProfile;
      
      // 날짜 복원
      profile.createdAt = new Date(profile.createdAt);
      profile.lastUpdated = new Date(profile.lastUpdated);
      profile.patterns.forEach(p => {
        p.lastOccurrence = new Date(p.lastOccurrence);
      });
      profile.contextHistory.forEach(c => {
        c.timestamp = new Date(c.timestamp);
      });

      this.profiles.set(profile.userId, profile);
      return true;
    } catch (error) {
      console.error('Failed to import profile:', error);
      return false;
    }
  }

  /**
   * 활성 프로필 설정
   */
  setActiveProfile(userId: string): void {
    const profile = this.profiles.get(userId);
    if (profile) {
      this.activeProfile = profile;
    }
  }

  /**
   * 활성 프로필 가져오기
   */
  getActiveProfile(): PersonalizationProfile | null {
    return this.activeProfile;
  }

  // 유틸리티 메서드
  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 프로필 통계
   */
  getProfileStats(userId: string): any {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    return {
      userId: profile.userId,
      createdAt: profile.createdAt,
      lastUpdated: profile.lastUpdated,
      totalPatterns: profile.patterns.length,
      frequentPatterns: profile.patterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map(p => ({ type: p.type, frequency: p.frequency })),
      contextHistorySize: profile.contextHistory.length,
      metrics: profile.metrics,
      primaryDomain: profile.settings.domainSettings.primaryDomain,
      expertiseLevel: profile.settings.domainSettings.expertiseLevel
    };
  }
}

export default PersonalizationProfileManager;