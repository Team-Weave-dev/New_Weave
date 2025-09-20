/**
 * Feature Flag Service
 * Feature Flag 관리를 위한 서비스
 */

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Map<string, boolean> = new Map();
  
  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }
  
  /**
   * Feature Flag 활성화 여부 확인
   */
  isEnabled(flagName: string): boolean {
    // 캐시 확인
    if (this.flags.has(flagName)) {
      return this.flags.get(flagName)!;
    }
    
    // iOS 스타일 대시보드 특별 처리
    if (flagName === 'ios_style_dashboard') {
      const envEnabled = process.env.NEXT_PUBLIC_IOS_STYLE_ENABLED === 'true';
      const localOverride = typeof window !== 'undefined' 
        ? localStorage.getItem('weave-ios-override') 
        : null;
      
      const isEnabled = localOverride !== null 
        ? localOverride === 'true' 
        : envEnabled;
      
      this.flags.set(flagName, isEnabled);
      return isEnabled;
    }
    
    // 일반 Feature Flag
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem(`feature_${flagName}`) === 'true';
      this.flags.set(flagName, value);
      return value;
    }
    
    return false;
  }
  
  /**
   * Feature Flag 활성화
   */
  enable(flagName: string): void {
    this.flags.set(flagName, true);
    
    if (typeof window !== 'undefined') {
      if (flagName === 'ios_style_dashboard') {
        localStorage.setItem('weave-ios-override', 'true');
      } else {
        localStorage.setItem(`feature_${flagName}`, 'true');
      }
      
      // 이벤트 발생
      window.dispatchEvent(new CustomEvent('featureFlagChanged', { 
        detail: { flag: flagName, enabled: true } 
      }));
    }
  }
  
  /**
   * Feature Flag 비활성화
   */
  disable(flagName: string): void {
    this.flags.set(flagName, false);
    
    if (typeof window !== 'undefined') {
      if (flagName === 'ios_style_dashboard') {
        localStorage.setItem('weave-ios-override', 'false');
      } else {
        localStorage.setItem(`feature_${flagName}`, 'false');
      }
      
      // 이벤트 발생
      window.dispatchEvent(new CustomEvent('featureFlagChanged', { 
        detail: { flag: flagName, enabled: false } 
      }));
    }
  }
  
  /**
   * 모든 Feature Flag 가져오기
   */
  getAllFlags(): Record<string, boolean> {
    const allFlags: Record<string, boolean> = {};
    
    // 캐시된 플래그들
    this.flags.forEach((value, key) => {
      allFlags[key] = value;
    });
    
    // localStorage에서 추가 플래그 확인
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('feature_')) {
          const flagName = key.replace('feature_', '');
          if (!allFlags[flagName]) {
            allFlags[flagName] = localStorage.getItem(key) === 'true';
          }
        }
      }
      
      // iOS 스타일 대시보드 확인
      if (!allFlags['ios_style_dashboard']) {
        allFlags['ios_style_dashboard'] = this.isEnabled('ios_style_dashboard');
      }
    }
    
    return allFlags;
  }
  
  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.flags.clear();
  }
}

// 전역 인스턴스
export const featureFlagService = FeatureFlagService.getInstance();