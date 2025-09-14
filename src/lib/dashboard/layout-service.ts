/**
 * Layout Service for Dashboard Widget System
 * Manages dashboard layouts and widgets with mock data (will be replaced with Supabase)
 */

import {
  DashboardLayout,
  DashboardWidget,
  UserSettings,
  mockLayouts,
  mockWidgets,
  mockUserSettings,
  generateId,
  getCurrentTimestamp,
  simulateApiDelay,
  STORAGE_KEYS
} from './mock-data';
// WidgetPosition과 WidgetConfig 타입 정의
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  title?: string;
  [key: string]: any;
}

class LayoutService {
  private static instance: LayoutService;
  
  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): LayoutService {
    if (!LayoutService.instance) {
      LayoutService.instance = new LayoutService();
    }
    return LayoutService.instance;
  }

  /**
   * 초기 목 데이터를 LocalStorage에 설정
   */
  private initializeMockData(): void {
    // 이미 데이터가 있으면 스킵
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem(STORAGE_KEYS.LAYOUTS)) {
      localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(mockLayouts));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.WIDGETS)) {
      localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(mockWidgets));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(mockUserSettings));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_LAYOUT)) {
      const defaultLayout = mockLayouts.find(l => l.is_default);
      if (defaultLayout) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_LAYOUT, defaultLayout.id);
      }
    }
  }

  /**
   * 모든 레이아웃 조회
   */
  async getLayouts(): Promise<DashboardLayout[]> {
    await simulateApiDelay();
    const layouts = localStorage.getItem(STORAGE_KEYS.LAYOUTS);
    return layouts ? JSON.parse(layouts) : [];
  }

  /**
   * 특정 레이아웃 조회
   */
  async getLayout(layoutId: string): Promise<DashboardLayout | null> {
    await simulateApiDelay();
    const layouts = await this.getLayouts();
    return layouts.find(l => l.id === layoutId) || null;
  }

  /**
   * 기본 레이아웃 조회
   */
  async getDefaultLayout(): Promise<DashboardLayout | null> {
    await simulateApiDelay();
    const layouts = await this.getLayouts();
    return layouts.find(l => l.is_default) || layouts[0] || null;
  }

  /**
   * 현재 활성 레이아웃 ID 조회
   */
  getCurrentLayoutId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_LAYOUT);
  }

  /**
   * 현재 활성 레이아웃 설정
   */
  setCurrentLayoutId(layoutId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_LAYOUT, layoutId);
  }

  /**
   * 새 레이아웃 생성
   */
  async createLayout(
    name: string,
    gridSize: '3x3' | '4x4' = '3x3',
    isDefault: boolean = false
  ): Promise<DashboardLayout> {
    await simulateApiDelay();
    
    const layouts = await this.getLayouts();
    
    // 기본 레이아웃 설정 시 기존 기본 레이아웃 해제
    if (isDefault) {
      layouts.forEach(l => l.is_default = false);
    }
    
    const newLayout: DashboardLayout = {
      id: generateId(),
      user_id: 'mock-user-123',
      name,
      grid_size: gridSize,
      is_default: isDefault,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    
    layouts.push(newLayout);
    localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(layouts));
    
    return newLayout;
  }

  /**
   * 레이아웃 업데이트
   */
  async updateLayout(
    layoutId: string,
    updates: Partial<Pick<DashboardLayout, 'name' | 'grid_size' | 'is_default'>>
  ): Promise<DashboardLayout | null> {
    await simulateApiDelay();
    
    const layouts = await this.getLayouts();
    const layoutIndex = layouts.findIndex(l => l.id === layoutId);
    
    if (layoutIndex === -1) return null;
    
    // 기본 레이아웃 설정 시 다른 레이아웃의 기본 설정 해제
    if (updates.is_default) {
      layouts.forEach(l => l.is_default = false);
    }
    
    layouts[layoutIndex] = {
      ...layouts[layoutIndex],
      ...updates,
      updated_at: getCurrentTimestamp()
    };
    
    localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(layouts));
    
    return layouts[layoutIndex];
  }

  /**
   * 레이아웃 삭제
   */
  async deleteLayout(layoutId: string): Promise<boolean> {
    await simulateApiDelay();
    
    const layouts = await this.getLayouts();
    const filteredLayouts = layouts.filter(l => l.id !== layoutId);
    
    if (filteredLayouts.length === layouts.length) return false;
    
    // 연관된 위젯도 삭제
    const widgets = await this.getWidgets(layoutId);
    const remainingWidgets = widgets.filter(w => w.layout_id !== layoutId);
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(remainingWidgets));
    
    localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(filteredLayouts));
    
    return true;
  }

  /**
   * 특정 레이아웃의 위젯 조회
   */
  async getWidgets(layoutId: string): Promise<DashboardWidget[]> {
    await simulateApiDelay();
    const widgets = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    const allWidgets: DashboardWidget[] = widgets ? JSON.parse(widgets) : [];
    return allWidgets.filter(w => w.layout_id === layoutId);
  }

  /**
   * 위젯 추가
   */
  async addWidget(
    layoutId: string,
    widgetType: string,
    position: WidgetPosition,
    config: WidgetConfig = {}
  ): Promise<DashboardWidget> {
    await simulateApiDelay();
    
    const widgets = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    const allWidgets: DashboardWidget[] = widgets ? JSON.parse(widgets) : [];
    
    const newWidget: DashboardWidget = {
      id: generateId(),
      layout_id: layoutId,
      widget_type: widgetType,
      position,
      config,
      is_locked: false,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    
    allWidgets.push(newWidget);
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(allWidgets));
    
    return newWidget;
  }

  /**
   * 위젯 업데이트
   */
  async updateWidget(
    widgetId: string,
    updates: Partial<Pick<DashboardWidget, 'position' | 'config' | 'is_locked'>>
  ): Promise<DashboardWidget | null> {
    await simulateApiDelay();
    
    const widgets = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    const allWidgets: DashboardWidget[] = widgets ? JSON.parse(widgets) : [];
    
    const widgetIndex = allWidgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return null;
    
    allWidgets[widgetIndex] = {
      ...allWidgets[widgetIndex],
      ...updates,
      updated_at: getCurrentTimestamp()
    };
    
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(allWidgets));
    
    return allWidgets[widgetIndex];
  }

  /**
   * 여러 위젯 일괄 업데이트 (위치 변경 시 유용)
   */
  async updateWidgets(
    updates: Array<{ id: string; position: WidgetPosition }>
  ): Promise<DashboardWidget[]> {
    await simulateApiDelay();
    
    const widgets = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    const allWidgets: DashboardWidget[] = widgets ? JSON.parse(widgets) : [];
    
    const updatedWidgets: DashboardWidget[] = [];
    
    updates.forEach(update => {
      const widgetIndex = allWidgets.findIndex(w => w.id === update.id);
      if (widgetIndex !== -1) {
        allWidgets[widgetIndex] = {
          ...allWidgets[widgetIndex],
          position: update.position,
          updated_at: getCurrentTimestamp()
        };
        updatedWidgets.push(allWidgets[widgetIndex]);
      }
    });
    
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(allWidgets));
    
    return updatedWidgets;
  }

  /**
   * 위젯 삭제
   */
  async deleteWidget(widgetId: string): Promise<boolean> {
    await simulateApiDelay();
    
    const widgets = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    const allWidgets: DashboardWidget[] = widgets ? JSON.parse(widgets) : [];
    
    const filteredWidgets = allWidgets.filter(w => w.id !== widgetId);
    
    if (filteredWidgets.length === allWidgets.length) return false;
    
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(filteredWidgets));
    
    return true;
  }

  /**
   * 사용자 설정 조회
   */
  async getUserSettings(): Promise<UserSettings> {
    await simulateApiDelay();
    const settings = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    return settings ? JSON.parse(settings) : mockUserSettings;
  }

  /**
   * 사용자 설정 업데이트
   */
  async updateUserSettings(
    updates: Partial<Pick<UserSettings, 'has_seen_onboarding' | 'preferred_theme' | 'auto_save_enabled'>>
  ): Promise<UserSettings> {
    await simulateApiDelay();
    
    const currentSettings = await this.getUserSettings();
    
    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...updates,
      updated_at: getCurrentTimestamp()
    };
    
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updatedSettings));
    
    return updatedSettings;
  }

  /**
   * 템플릿 적용
   */
  async applyTemplate(
    layoutId: string,
    templateWidgets: Array<{
      widgetType: string;
      position: WidgetPosition;
      config: WidgetConfig;
    }>
  ): Promise<DashboardWidget[]> {
    await simulateApiDelay();
    
    // 기존 위젯 삭제
    const widgets = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    const allWidgets: DashboardWidget[] = widgets ? JSON.parse(widgets) : [];
    const remainingWidgets = allWidgets.filter(w => w.layout_id !== layoutId);
    
    // 새 위젯 추가
    const newWidgets: DashboardWidget[] = templateWidgets.map(tw => ({
      id: generateId(),
      layout_id: layoutId,
      widget_type: tw.widgetType,
      position: tw.position,
      config: tw.config,
      is_locked: false,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    }));
    
    const finalWidgets = [...remainingWidgets, ...newWidgets];
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(finalWidgets));
    
    return newWidgets;
  }

  /**
   * 레이아웃 내보내기 (JSON)
   */
  async exportLayout(layoutId: string): Promise<{
    layout: DashboardLayout;
    widgets: DashboardWidget[];
  } | null> {
    await simulateApiDelay();
    
    const layout = await this.getLayout(layoutId);
    if (!layout) return null;
    
    const widgets = await this.getWidgets(layoutId);
    
    return { layout, widgets };
  }

  /**
   * 레이아웃 가져오기 (JSON)
   */
  async importLayout(
    data: {
      layout: Omit<DashboardLayout, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
      widgets: Array<Omit<DashboardWidget, 'id' | 'layout_id' | 'created_at' | 'updated_at'>>;
    }
  ): Promise<{ layout: DashboardLayout; widgets: DashboardWidget[] }> {
    await simulateApiDelay();
    
    // 새 레이아웃 생성
    const newLayout = await this.createLayout(
      data.layout.name,
      data.layout.grid_size,
      false // 가져온 레이아웃은 기본값 아님
    );
    
    // 위젯 추가
    const newWidgets = await Promise.all(
      data.widgets.map(w => 
        this.addWidget(newLayout.id, w.widget_type, w.position, w.config)
      )
    );
    
    return { layout: newLayout, widgets: newWidgets };
  }

  /**
   * 모든 데이터 초기화 (개발용)
   */
  async resetAllData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.LAYOUTS);
    localStorage.removeItem(STORAGE_KEYS.WIDGETS);
    localStorage.removeItem(STORAGE_KEYS.USER_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_LAYOUT);
    this.initializeMockData();
  }
}

export const layoutService = LayoutService.getInstance();