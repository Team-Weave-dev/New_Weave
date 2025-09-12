import { useDashboardStore } from '@/lib/stores/useDashboardStore';
import type { DashboardLayout } from '@/types/dashboard';

interface UserVisitData {
  firstVisitDate: string;
  hasSeenOnboarding: boolean;
  skippedOnboarding: boolean;
  selectedTemplate?: string;
  visitCount: number;
  lastVisitDate: string;
  userType?: 'new' | 'returning' | 'frequent';
}

class FirstTimeUserService {
  private readonly STORAGE_KEY = 'dashboardUserData';
  private readonly ONBOARDING_KEY = 'hasSeenOnboarding';
  private readonly SKIP_KEY = 'skippedOnboarding';
  private readonly TEMPLATE_KEY = 'selectedTemplate';
  
  /**
   * 사용자 방문 데이터 가져오기
   */
  getUserData(): UserVisitData {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    const now = new Date().toISOString();
    
    if (!storedData) {
      // 첫 방문자
      const newUserData: UserVisitData = {
        firstVisitDate: now,
        hasSeenOnboarding: false,
        skippedOnboarding: false,
        visitCount: 1,
        lastVisitDate: now,
        userType: 'new'
      };
      
      this.saveUserData(newUserData);
      return newUserData;
    }
    
    // 기존 방문자
    const data = JSON.parse(storedData) as UserVisitData;
    
    // 방문 횟수 업데이트
    data.visitCount = (data.visitCount || 0) + 1;
    data.lastVisitDate = now;
    
    // 사용자 타입 결정
    if (data.visitCount >= 10) {
      data.userType = 'frequent';
    } else if (data.visitCount > 1) {
      data.userType = 'returning';
    } else {
      data.userType = 'new';
    }
    
    // 레거시 localStorage 값 마이그레이션
    if (localStorage.getItem(this.ONBOARDING_KEY)) {
      data.hasSeenOnboarding = localStorage.getItem(this.ONBOARDING_KEY) === 'true';
    }
    if (localStorage.getItem(this.SKIP_KEY)) {
      data.skippedOnboarding = localStorage.getItem(this.SKIP_KEY) === 'true';
    }
    if (localStorage.getItem(this.TEMPLATE_KEY)) {
      data.selectedTemplate = localStorage.getItem(this.TEMPLATE_KEY) || undefined;
    }
    
    this.saveUserData(data);
    return data;
  }
  
  /**
   * 사용자 데이터 저장
   */
  private saveUserData(data: UserVisitData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    
    // 레거시 키도 업데이트 (호환성 유지)
    localStorage.setItem(this.ONBOARDING_KEY, String(data.hasSeenOnboarding));
    if (data.skippedOnboarding) {
      localStorage.setItem(this.SKIP_KEY, 'true');
    }
    if (data.selectedTemplate) {
      localStorage.setItem(this.TEMPLATE_KEY, data.selectedTemplate);
    }
  }
  
  /**
   * 첫 사용자인지 확인
   */
  isFirstTimeUser(): boolean {
    const userData = this.getUserData();
    return userData.userType === 'new' && !userData.hasSeenOnboarding && !userData.skippedOnboarding;
  }
  
  /**
   * 온보딩 표시 여부 결정
   */
  shouldShowOnboarding(): boolean {
    const userData = this.getUserData();
    const store = useDashboardStore.getState();
    const { currentLayout } = store;
    
    // 이미 온보딩을 봤거나 스킵한 경우
    if (userData.hasSeenOnboarding || userData.skippedOnboarding) {
      return false;
    }
    
    // 첫 방문자인 경우
    if (userData.userType === 'new') {
      return true;
    }
    
    // 레이아웃이 없거나 위젯이 없는 경우
    if (!currentLayout || currentLayout.widgets.length === 0) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 온보딩 완료 처리
   */
  completeOnboarding(templateId?: string): void {
    const userData = this.getUserData();
    userData.hasSeenOnboarding = true;
    userData.selectedTemplate = templateId;
    this.saveUserData(userData);
  }
  
  /**
   * 온보딩 스킵 처리
   */
  skipOnboarding(): void {
    const userData = this.getUserData();
    userData.skippedOnboarding = true;
    userData.hasSeenOnboarding = false;
    this.saveUserData(userData);
  }
  
  /**
   * 사용자 타입별 추천 템플릿 가져오기
   */
  getRecommendedTemplates(): string[] {
    const userData = this.getUserData();
    
    switch (userData.userType) {
      case 'new':
        return ['minimal', 'balanced'];
      case 'returning':
        return ['balanced', 'project-focused'];
      case 'frequent':
        return ['project-focused', 'tax-focused'];
      default:
        return ['minimal'];
    }
  }
  
  /**
   * 대시보드가 비어있는지 확인
   */
  isDashboardEmpty(): boolean {
    const store = useDashboardStore.getState();
    const { currentLayout } = store;
    
    return !currentLayout || currentLayout.widgets.length === 0;
  }
  
  /**
   * 사용자의 이전 템플릿 선택 가져오기
   */
  getPreviousTemplateChoice(): string | undefined {
    const userData = this.getUserData();
    return userData.selectedTemplate;
  }
  
  /**
   * 방문 통계 가져오기
   */
  getVisitStatistics(): {
    visitCount: number;
    daysSinceFirstVisit: number;
    daysSinceLastVisit: number;
  } {
    const userData = this.getUserData();
    const now = new Date();
    const firstVisit = new Date(userData.firstVisitDate);
    const lastVisit = new Date(userData.lastVisitDate);
    
    const daysSinceFirstVisit = Math.floor((now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      visitCount: userData.visitCount,
      daysSinceFirstVisit,
      daysSinceLastVisit
    };
  }
  
  /**
   * 사용자 데이터 리셋 (테스트용)
   */
  resetUserData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ONBOARDING_KEY);
    localStorage.removeItem(this.SKIP_KEY);
    localStorage.removeItem(this.TEMPLATE_KEY);
  }
}

// 싱글톤 인스턴스
export const firstTimeUserService = new FirstTimeUserService();

// 편의 함수들
export const isFirstTimeUser = () => firstTimeUserService.isFirstTimeUser();
export const shouldShowOnboarding = () => firstTimeUserService.shouldShowOnboarding();
export const completeOnboarding = (templateId?: string) => firstTimeUserService.completeOnboarding(templateId);
export const skipOnboarding = () => firstTimeUserService.skipOnboarding();
export const getRecommendedTemplates = () => firstTimeUserService.getRecommendedTemplates();
export const isDashboardEmpty = () => firstTimeUserService.isDashboardEmpty();
export const getPreviousTemplateChoice = () => firstTimeUserService.getPreviousTemplateChoice();
export const getVisitStatistics = () => firstTimeUserService.getVisitStatistics();