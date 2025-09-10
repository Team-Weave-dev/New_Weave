/**
 * 의도 분석기
 * 사용자 메시지를 분석하여 의도와 엔티티를 추출
 */

/**
 * 의도 분석 결과 인터페이스
 */
export interface IntentAnalysis {
  primaryIntent: 'tax' | 'project' | 'document' | 'analysis' | 'general';
  confidence: number;
  entities: Entity[];
  requiredContext: string[];
  message: string;
  keywords: string[];
  subIntents?: string[];
}

/**
 * 엔티티 인터페이스
 */
export interface Entity {
  type: 'project' | 'client' | 'date' | 'money' | 'tax_type' | 'document_type' | 'person' | 'other';
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

/**
 * 의도 분석기 클래스
 */
export class IntentAnalyzer {
  // 의도별 패턴 정의
  private patterns = {
    tax: {
      keywords: [
        '세금', '세무', '소득세', '부가세', 'VAT', '원천징수', '신고', 
        '공제', '절세', '종합소득세', '사업소득', '근로소득', '4대보험',
        '세액', '과세', '면세', '영세율', '세율', '납부', '환급',
        '경비', '비용처리', '손금', '익금', '세무조사', '가산세'
      ],
      regex: [
        /세[금무]/,
        /소득세|법인세|부가[가치]*세/,
        /원천징수|신고|납부|환급/,
        /공제|절세|감면/,
        /4대[ ]?보험/,
        /종합소득|사업소득|근로소득/,
        /세무[ ]?조사|세무[ ]?신고/
      ]
    },
    project: {
      keywords: [
        '프로젝트', '일정', '마일스톤', '진행', '상황', '납기', '계약',
        '클라이언트', '고객', '거래처', '업무', '작업', '태스크', '할일',
        '진척', '완료', '시작', '종료', '기한', '데드라인', '팀'
      ],
      regex: [
        /프로젝트|과제|업무/,
        /일정|스케[쥴줄]/,
        /마일스톤|이정표/,
        /진행[ ]?상황|진척[ ]?률/,
        /클라이언트|고객|거래처/,
        /납기|기한|데드라인/
      ]
    },
    document: {
      keywords: [
        '문서', '보고서', '견적서', '계약서', '인보이스', '청구서',
        '작성', '생성', '만들', '템플릿', '양식', '서류', '제안서',
        '명세서', '계산서', '영수증', '증빙', '첨부'
      ],
      regex: [
        /문서|서류|양식/,
        /견적서|계약서|제안서/,
        /인보이스|청구서|계산서/,
        /보고서|리포트/,
        /작성|생성|만[들드]/,
        /템플릿|양식|포맷/
      ]
    },
    analysis: {
      keywords: [
        '분석', '통계', '차트', '그래프', '리포트', '현황', '추이',
        '수익', '지출', '매출', '비용', '손익', '수입', '지표',
        '실적', '성과', '예산', '비교', '추세', '예측'
      ],
      regex: [
        /분석|통계|집계/,
        /차트|그래프|도표/,
        /리포트|보고|현황/,
        /수익|매출|수입/,
        /지출|비용|손실/,
        /실적|성과|결과/,
        /예산|예측|전망/
      ]
    }
  };

  // 엔티티 패턴 정의
  private entityPatterns = {
    project: /(?:프로젝트|과제|업무)[\s]*(?:명|이름)?[\s]*[:：]?[\s]*([가-힣A-Za-z0-9\s\-_]+)/,
    client: /(?:클라이언트|고객|거래처)[\s]*(?:명|이름)?[\s]*[:：]?[\s]*([가-힣A-Za-z0-9\s\-_]+)/,
    date: /(\d{4}년[\s]?\d{1,2}월[\s]?\d{1,2}일|\d{4}-\d{2}-\d{2}|\d{4}\/\d{2}\/\d{2})/,
    money: /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:원|만원|억원|달러|\$|₩)/,
    tax_type: /(소득세|법인세|부가세|종합소득세|원천세|취득세|재산세)/,
    document_type: /(견적서|계약서|인보이스|청구서|보고서|제안서|명세서)/,
    person: /(?:담당자|직원|매니저)[\s]*[:：]?[\s]*([가-힣A-Za-z\s]+)/
  };

  /**
   * 메시지 분석
   */
  analyze(message: string): IntentAnalysis {
    // 1. 전처리
    const normalizedMessage = this.normalizeMessage(message);
    
    // 2. 키워드 추출
    const keywords = this.extractKeywords(normalizedMessage);
    
    // 3. 의도 매칭
    const intentScores = this.matchIntents(normalizedMessage, keywords);
    
    // 4. 엔티티 추출
    const entities = this.extractEntities(message);
    
    // 5. 주요 의도 선택
    const primaryIntent = this.selectPrimaryIntent(intentScores);
    
    // 6. 필요 컨텍스트 분석
    const requiredContext = this.analyzeContextNeeds(primaryIntent, entities);
    
    // 7. 서브 의도 추출
    const subIntents = this.extractSubIntents(intentScores);
    
    // 8. 신뢰도 계산
    const confidence = this.calculateConfidence(intentScores, primaryIntent);
    
    return {
      primaryIntent,
      confidence,
      entities,
      requiredContext,
      message,
      keywords,
      subIntents
    };
  }

  /**
   * 메시지 정규화
   */
  private normalizeMessage(message: string): string {
    return message
      .toLowerCase()
      .replace(/[.,!?;]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 키워드 추출
   */
  private extractKeywords(message: string): string[] {
    const stopWords = new Set([
      '은', '는', '이', '가', '을', '를', '의', '에', '와', '과',
      '로', '으로', '에서', '부터', '까지', '에게', '한테', '께',
      '하고', '이고', '이며', '및', '와', '과', '그리고', '또한'
    ]);
    
    const words = message.split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word));
    
    return [...new Set(words)];
  }

  /**
   * 의도 매칭
   */
  private matchIntents(message: string, keywords: string[]): Map<string, number> {
    const scores = new Map<string, number>();
    
    for (const [intent, patterns] of Object.entries(this.patterns)) {
      let score = 0;
      
      // 키워드 매칭
      for (const keyword of keywords) {
        if (patterns.keywords.some(k => k.includes(keyword) || keyword.includes(k))) {
          score += 1;
        }
      }
      
      // 정규식 매칭
      for (const regex of patterns.regex) {
        if (regex.test(message)) {
          score += 2; // 정규식 매칭에 더 높은 가중치
        }
      }
      
      // 정규화 점수 (0~1)
      scores.set(intent, score / (patterns.keywords.length + patterns.regex.length * 2));
    }
    
    return scores;
  }

  /**
   * 엔티티 추출
   */
  private extractEntities(message: string): Entity[] {
    const entities: Entity[] = [];
    
    for (const [type, pattern] of Object.entries(this.entityPatterns)) {
      const matches = message.matchAll(new RegExp(pattern, 'g'));
      
      for (const match of matches) {
        if (match[1]) {
          entities.push({
            type: type as Entity['type'],
            value: match[1].trim(),
            confidence: 0.8,
            position: {
              start: match.index || 0,
              end: (match.index || 0) + match[0].length
            }
          });
        }
      }
    }
    
    // 중복 제거 및 정렬
    return entities
      .filter((entity, index, self) => 
        index === self.findIndex(e => e.type === entity.type && e.value === entity.value)
      )
      .sort((a, b) => a.position.start - b.position.start);
  }

  /**
   * 주요 의도 선택
   */
  private selectPrimaryIntent(
    intentScores: Map<string, number>
  ): IntentAnalysis['primaryIntent'] {
    let maxScore = 0;
    let primaryIntent: IntentAnalysis['primaryIntent'] = 'general';
    
    for (const [intent, score] of intentScores.entries()) {
      if (score > maxScore) {
        maxScore = score;
        primaryIntent = intent as IntentAnalysis['primaryIntent'];
      }
    }
    
    // 임계값 이하면 일반 의도로
    if (maxScore < 0.1) {
      return 'general';
    }
    
    return primaryIntent;
  }

  /**
   * 컨텍스트 필요성 분석
   */
  private analyzeContextNeeds(
    intent: IntentAnalysis['primaryIntent'],
    entities: Entity[]
  ): string[] {
    const requiredContext: string[] = [];
    
    // 의도별 기본 컨텍스트
    const intentContext: Record<string, string[]> = {
      tax: ['tax_knowledge', 'user_business_info', 'recent_transactions'],
      project: ['projects', 'clients', 'tasks', 'milestones'],
      document: ['templates', 'recent_documents', 'client_info'],
      analysis: ['projects', 'financial_data', 'performance_metrics'],
      general: ['user_preferences', 'chat_history']
    };
    
    requiredContext.push(...(intentContext[intent] || []));
    
    // 엔티티 기반 추가 컨텍스트
    if (entities.some(e => e.type === 'project')) {
      requiredContext.push('project_details');
    }
    if (entities.some(e => e.type === 'client')) {
      requiredContext.push('client_details');
    }
    if (entities.some(e => e.type === 'date')) {
      requiredContext.push('calendar_events');
    }
    if (entities.some(e => e.type === 'money')) {
      requiredContext.push('financial_records');
    }
    
    return [...new Set(requiredContext)];
  }

  /**
   * 서브 의도 추출
   */
  private extractSubIntents(intentScores: Map<string, number>): string[] {
    const subIntents: string[] = [];
    const threshold = 0.2; // 서브 의도 임계값
    
    for (const [intent, score] of intentScores.entries()) {
      if (score >= threshold) {
        subIntents.push(intent);
      }
    }
    
    return subIntents.slice(0, 3); // 최대 3개까지
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    intentScores: Map<string, number>,
    primaryIntent: IntentAnalysis['primaryIntent']
  ): number {
    const primaryScore = intentScores.get(primaryIntent) || 0;
    
    // 일반 의도는 낮은 신뢰도
    if (primaryIntent === 'general') {
      return 0.5;
    }
    
    // 점수 기반 신뢰도
    let confidence = Math.min(primaryScore * 2, 1); // 0~1 범위로 정규화
    
    // 다른 의도와의 차이가 클수록 신뢰도 증가
    const otherScores = Array.from(intentScores.entries())
      .filter(([intent]) => intent !== primaryIntent)
      .map(([, score]) => score);
    
    if (otherScores.length > 0) {
      const maxOtherScore = Math.max(...otherScores);
      const scoreDiff = primaryScore - maxOtherScore;
      confidence = confidence * 0.7 + scoreDiff * 0.3;
    }
    
    return Math.max(0.3, Math.min(1, confidence));
  }

  /**
   * 의도 설명 생성
   */
  getIntentDescription(intent: IntentAnalysis['primaryIntent']): string {
    const descriptions: Record<IntentAnalysis['primaryIntent'], string> = {
      tax: '세무 관련 문의 및 상담',
      project: '프로젝트 관리 및 진행 상황',
      document: '문서 작성 및 템플릿 활용',
      analysis: '데이터 분석 및 리포트 생성',
      general: '일반적인 업무 지원'
    };
    
    return descriptions[intent];
  }
}

export default IntentAnalyzer;