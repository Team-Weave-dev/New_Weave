/**
 * 응답 생성기
 * AI 응답을 생성하고 포맷팅
 */

import { IntentAnalysis } from './intentAnalyzer';
import { EnrichedContext } from './contextManager';
import { IntegratedData } from './dataIntegrationLayer';

/**
 * 응답 스타일
 */
export type ResponseStyle = 'concise' | 'detailed' | 'balanced' | 'technical' | 'casual';

/**
 * 응답 포맷
 */
export type ResponseFormat = 'text' | 'markdown' | 'html' | 'json';

/**
 * 생성된 응답
 */
export interface GeneratedResponse {
  content: string;
  format: ResponseFormat;
  suggestions?: string[];
  actions?: SuggestedAction[];
  metadata?: ResponseMetadata;
}

/**
 * 제안된 액션
 */
export interface SuggestedAction {
  type: 'navigate' | 'create' | 'update' | 'view' | 'download';
  label: string;
  target?: string;
  params?: Record<string, any>;
}

/**
 * 응답 메타데이터
 */
export interface ResponseMetadata {
  style: ResponseStyle;
  wordCount: number;
  readingTime: number; // 초
  complexity: 'low' | 'medium' | 'high';
  sentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * 응답 생성기 클래스
 */
export class ResponseGenerator {
  /**
   * 응답 생성
   */
  generateResponse(
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    style?: ResponseStyle
  ): GeneratedResponse {
    // 응답 스타일 결정
    const responseStyle = style || this.determineStyle(intent, context);
    
    // 응답 포맷 결정
    const format = this.determineFormat(intent);
    
    // 응답 내용 생성
    let content = '';
    switch (intent.primaryIntent) {
      case 'tax':
        content = this.generateTaxResponse(intent, context, data, responseStyle);
        break;
      case 'project':
        content = this.generateProjectResponse(intent, context, data, responseStyle);
        break;
      case 'document':
        content = this.generateDocumentResponse(intent, context, data, responseStyle);
        break;
      case 'analysis':
        content = this.generateAnalysisResponse(intent, context, data, responseStyle);
        break;
      default:
        content = this.generateGeneralResponse(intent, context, data, responseStyle);
    }
    
    // 포맷 적용
    content = this.applyFormat(content, format);
    
    // 제안 생성
    const suggestions = this.generateSuggestions(intent, context, data);
    
    // 액션 생성
    const actions = this.generateActions(intent, context, data);
    
    // 메타데이터 생성
    const metadata = this.generateMetadata(content, responseStyle);
    
    return {
      content,
      format,
      suggestions,
      actions,
      metadata
    };
  }

  /**
   * 응답 스타일 결정
   */
  private determineStyle(
    intent: IntentAnalysis,
    context: EnrichedContext
  ): ResponseStyle {
    // 사용자 선호도 확인
    if (context.user?.preferences?.responseStyle) {
      return context.user.preferences.responseStyle as ResponseStyle;
    }
    
    // 의도별 기본 스타일
    switch (intent.primaryIntent) {
      case 'tax':
        return 'technical'; // 세무는 정확성이 중요
      case 'analysis':
        return 'detailed'; // 분석은 상세한 설명 필요
      case 'document':
        return 'balanced'; // 문서는 균형잡힌 설명
      default:
        return 'balanced';
    }
  }

  /**
   * 응답 포맷 결정
   */
  private determineFormat(intent: IntentAnalysis): ResponseFormat {
    switch (intent.primaryIntent) {
      case 'analysis':
        return 'markdown'; // 분석은 마크다운으로 구조화
      case 'document':
        return 'markdown'; // 문서도 마크다운
      default:
        return 'text';
    }
  }

  /**
   * 세무 응답 생성
   */
  private generateTaxResponse(
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    style: ResponseStyle
  ): string {
    let response = '';
    
    // 세무 지식이 있는 경우
    if (data.taxKnowledge && data.taxKnowledge.length > 0) {
      const topKnowledge = data.taxKnowledge[0];
      
      if (style === 'concise') {
        response = `${topKnowledge.title}\n\n${this.summarize(topKnowledge.content, 100)}`;
      } else if (style === 'detailed' || style === 'technical') {
        response = `## ${topKnowledge.title}\n\n${topKnowledge.content}\n\n`;
        
        // 관련 프로젝트 정보 추가
        if (data.projects && data.projects.length > 0) {
          response += `### 관련 프로젝트\n`;
          data.projects.slice(0, 3).forEach(p => {
            response += `- ${p.name}: ${p.status} (${p.progress}% 완료)\n`;
          });
        }
        
        // 주의사항 추가
        response += `\n⚠️ **주의**: 중요한 세무 결정은 반드시 전문 세무사와 상담하시기 바랍니다.`;
      } else {
        response = `${topKnowledge.title}\n\n${topKnowledge.content}`;
      }
    } else {
      response = '죄송합니다. 요청하신 세무 정보를 찾을 수 없습니다. 구체적인 질문을 다시 해주시면 도움을 드리겠습니다.';
    }
    
    return response;
  }

  /**
   * 프로젝트 응답 생성
   */
  private generateProjectResponse(
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    style: ResponseStyle
  ): string {
    let response = '';
    
    if (data.projects && data.projects.length > 0) {
      if (style === 'concise') {
        const project = data.projects[0];
        response = `${project.name}: ${project.status} (${project.progress}% 완료)`;
      } else if (style === 'detailed') {
        response = '## 프로젝트 현황\n\n';
        data.projects.slice(0, 5).forEach(p => {
          response += `### ${p.name}\n`;
          response += `- 상태: ${p.status}\n`;
          response += `- 진행률: ${p.progress}%\n`;
          if (p.clientName) response += `- 클라이언트: ${p.clientName}\n`;
          if (p.dueDate) response += `- 마감일: ${this.formatDate(p.dueDate)}\n`;
          response += '\n';
        });
      } else {
        response = '현재 진행 중인 프로젝트:\n\n';
        data.projects.slice(0, 3).forEach(p => {
          response += `• ${p.name} (${p.status}, ${p.progress}% 완료)\n`;
        });
      }
      
      // 관련 클라이언트 정보
      if (data.clients && data.clients.length > 0 && style !== 'concise') {
        response += `\n관련 클라이언트: ${data.clients.map(c => c.name).join(', ')}`;
      }
    } else {
      response = '현재 등록된 프로젝트가 없습니다. 새 프로젝트를 생성하시겠습니까?';
    }
    
    return response;
  }

  /**
   * 문서 응답 생성
   */
  private generateDocumentResponse(
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    style: ResponseStyle
  ): string {
    let response = '';
    
    // 템플릿이 있는 경우
    if (data.templates && data.templates.length > 0) {
      const template = data.templates[0];
      
      if (style === 'concise') {
        response = `"${template.name}" 템플릿을 사용하실 수 있습니다.`;
      } else {
        response = `## 추천 템플릿: ${template.name}\n\n`;
        response += `타입: ${template.type}\n`;
        response += `사용 횟수: ${template.usage}회\n\n`;
        
        if (template.variables && template.variables.length > 0) {
          response += `필요한 정보:\n`;
          template.variables.forEach(v => {
            response += `- ${this.humanizeVariable(v)}\n`;
          });
        }
      }
    }
    
    // 최근 문서
    if (data.documents && data.documents.length > 0 && style !== 'concise') {
      response += '\n## 최근 문서\n';
      data.documents.slice(0, 3).forEach(d => {
        response += `- ${d.title} (${d.type}) - ${this.formatDate(d.createdAt)}\n`;
      });
    }
    
    if (!data.templates && !data.documents) {
      response = '문서 작성을 도와드리겠습니다. 어떤 종류의 문서가 필요하신가요?';
    }
    
    return response;
  }

  /**
   * 분석 응답 생성
   */
  private generateAnalysisResponse(
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    style: ResponseStyle
  ): string {
    let response = '';
    
    if (data.analytics) {
      const { revenue, projects, clients, performance } = data.analytics;
      
      if (style === 'concise') {
        response = `총 매출: ${this.formatCurrency(revenue.total)} | `;
        response += `프로젝트: ${projects.active}/${projects.total} | `;
        response += `성공률: ${projects.successRate}%`;
      } else if (style === 'detailed') {
        response = '# 📊 비즈니스 분석 리포트\n\n';
        
        response += '## 💰 재무 현황\n';
        response += `- **총 매출**: ${this.formatCurrency(revenue.total)}\n`;
        response += `- **월 평균**: ${this.formatCurrency(revenue.total / 12)}\n`;
        response += `- **성장률**: ${revenue.growth}%\n\n`;
        
        response += '## 📋 프로젝트 현황\n';
        response += `- **전체**: ${projects.total}개\n`;
        response += `- **진행중**: ${projects.active}개\n`;
        response += `- **완료**: ${projects.completed}개\n`;
        response += `- **성공률**: ${projects.successRate}%\n\n`;
        
        response += '## 👥 클라이언트 현황\n';
        response += `- **전체**: ${clients.total}명\n`;
        response += `- **활성**: ${clients.active}명\n`;
        response += `- **유지율**: ${clients.retention}%\n\n`;
        
        response += '## 📈 성과 지표\n';
        response += `- **평균 프로젝트 기간**: ${performance.avgProjectDuration}일\n`;
        response += `- **평균 프로젝트 가치**: ${this.formatCurrency(performance.avgProjectValue)}\n`;
        response += `- **수익률**: ${performance.profitMargin}%\n`;
      } else {
        response = '## 비즈니스 요약\n\n';
        response += `총 매출: ${this.formatCurrency(revenue.total)} (성장률 ${revenue.growth}%)\n`;
        response += `활성 프로젝트: ${projects.active}개 (성공률 ${projects.successRate}%)\n`;
        response += `활성 클라이언트: ${clients.active}명 (유지율 ${clients.retention}%)\n`;
      }
    } else {
      response = '분석할 데이터를 수집 중입니다. 잠시만 기다려주세요.';
    }
    
    return response;
  }

  /**
   * 일반 응답 생성
   */
  private generateGeneralResponse(
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData,
    style: ResponseStyle
  ): string {
    let response = '무엇을 도와드릴까요?\n\n';
    
    if (data.projects && data.projects.length > 0) {
      response += `현재 ${data.projects.filter(p => p.status === 'in_progress').length}개의 프로젝트가 진행 중입니다.\n`;
    }
    
    if (data.generalKnowledge && data.generalKnowledge.length > 0) {
      const knowledge = data.generalKnowledge[0];
      response += `\n${knowledge.content}`;
    }
    
    return response;
  }

  /**
   * 포맷 적용
   */
  private applyFormat(content: string, format: ResponseFormat): string {
    switch (format) {
      case 'markdown':
        return content; // 이미 마크다운
      case 'html':
        return this.markdownToHtml(content);
      case 'json':
        return JSON.stringify({ content });
      default:
        return content;
    }
  }

  /**
   * 제안 생성
   */
  private generateSuggestions(
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData
  ): string[] {
    const suggestions: string[] = [];
    
    switch (intent.primaryIntent) {
      case 'tax':
        suggestions.push('세금 계산기 사용하기');
        suggestions.push('세무 일정 확인하기');
        if (data.taxKnowledge && data.taxKnowledge.length > 1) {
          suggestions.push('관련 세무 정보 더 보기');
        }
        break;
        
      case 'project':
        suggestions.push('새 프로젝트 만들기');
        if (data.projects && data.projects.some(p => p.status === 'in_progress')) {
          suggestions.push('진행 중인 프로젝트 보기');
        }
        suggestions.push('프로젝트 타임라인 보기');
        break;
        
      case 'document':
        suggestions.push('템플릿 라이브러리 보기');
        suggestions.push('새 문서 작성하기');
        if (data.documents && data.documents.length > 0) {
          suggestions.push('최근 문서 편집하기');
        }
        break;
        
      case 'analysis':
        suggestions.push('대시보드 보기');
        suggestions.push('상세 리포트 생성');
        suggestions.push('데이터 내보내기');
        break;
        
      default:
        suggestions.push('도움말 보기');
        suggestions.push('프로젝트 보기');
        suggestions.push('대시보드로 이동');
    }
    
    return suggestions.slice(0, 3);
  }

  /**
   * 액션 생성
   */
  private generateActions(
    intent: IntentAnalysis,
    context: EnrichedContext,
    data: IntegratedData
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];
    
    switch (intent.primaryIntent) {
      case 'project':
        if (data.projects && data.projects.length > 0) {
          actions.push({
            type: 'view',
            label: '프로젝트 상세 보기',
            target: `/projects/${data.projects[0].id}`
          });
        }
        actions.push({
          type: 'create',
          label: '새 프로젝트',
          target: '/projects/new'
        });
        break;
        
      case 'document':
        if (data.templates && data.templates.length > 0) {
          actions.push({
            type: 'create',
            label: '템플릿으로 문서 작성',
            target: '/documents/new',
            params: { templateId: data.templates[0].id }
          });
        }
        break;
        
      case 'analysis':
        actions.push({
          type: 'navigate',
          label: '대시보드로 이동',
          target: '/dashboard'
        });
        break;
    }
    
    return actions;
  }

  /**
   * 메타데이터 생성
   */
  private generateMetadata(content: string, style: ResponseStyle): ResponseMetadata {
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 분당 200단어 기준
    
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    if (wordCount < 50) complexity = 'low';
    else if (wordCount > 200) complexity = 'high';
    
    return {
      style,
      wordCount,
      readingTime,
      complexity
    };
  }

  /**
   * 텍스트 요약
   */
  private summarize(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 날짜 포맷팅
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  /**
   * 통화 포맷팅
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  }

  /**
   * 변수명 인간화
   */
  private humanizeVariable(variable: string): string {
    const map: Record<string, string> = {
      'client_name': '클라이언트명',
      'project_name': '프로젝트명',
      'amount': '금액',
      'due_date': '마감일',
      'description': '설명'
    };
    
    return map[variable] || variable.replace(/_/g, ' ');
  }

  /**
   * 마크다운을 HTML로 변환
   */
  private markdownToHtml(markdown: string): string {
    // 간단한 마크다운 변환 (실제로는 라이브러리 사용 권장)
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
}

export default ResponseGenerator;