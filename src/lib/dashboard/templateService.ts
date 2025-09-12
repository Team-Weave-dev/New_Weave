import { useDashboardStore } from '@/lib/stores/useDashboardStore';
import { dashboardTemplates, type DashboardTemplate } from '@/components/dashboard/templates/dashboardTemplates';
import type { DashboardLayout, Widget } from '@/types/dashboard';

export interface TemplateApplicationOptions {
  preserveExisting?: boolean; // 기존 위젯 유지 여부
  merge?: boolean; // 템플릿과 기존 레이아웃 병합
  backup?: boolean; // 적용 전 백업 생성
}

class TemplateService {
  private backupLayout: DashboardLayout | null = null;

  /**
   * 템플릿을 현재 대시보드에 적용
   */
  async applyTemplate(
    templateId: string,
    options: TemplateApplicationOptions = {}
  ): Promise<boolean> {
    const {
      preserveExisting = false,
      merge = false,
      backup = true
    } = options;

    try {
      // 템플릿 찾기
      const template = dashboardTemplates.find(t => t.id === templateId);
      if (!template) {
        console.error(`Template not found: ${templateId}`);
        return false;
      }

      const store = useDashboardStore.getState();
      const { currentLayout, setCurrentLayout, createLayout, addWidget, updateLayout } = store;

      // 백업 생성
      if (backup && currentLayout) {
        this.backupLayout = { ...currentLayout };
        this.saveBackupToLocalStorage();
      }

      // 레이아웃이 없으면 새로 생성
      if (!currentLayout) {
        const newLayout = createLayout(
          template.name,
          template.layout.gridSize || '3x3'
        );
        setCurrentLayout(newLayout);
      } else {
        // 그리드 크기 업데이트
        if (template.layout.gridSize) {
          updateLayout(currentLayout.id, { gridSize: template.layout.gridSize });
        }
      }

      // 기존 위젯 처리
      if (!preserveExisting && !merge) {
        // 모든 기존 위젯 제거
        this.clearAllWidgets();
      }

      // 템플릿 위젯 추가
      if (template.layout.widgets) {
        for (const widget of template.layout.widgets) {
          if (merge) {
            // 병합 모드: 충돌 체크 후 추가
            if (!this.hasConflict(widget)) {
              addWidget(widget);
            }
          } else {
            // 일반 모드: 모든 위젯 추가
            addWidget(widget);
          }
        }
      }

      // 성공 로그
      console.log(`Template "${template.name}" applied successfully`);
      this.saveTemplateHistory(templateId);
      
      return true;
    } catch (error) {
      console.error('Failed to apply template:', error);
      
      // 백업이 있으면 복원
      if (this.backupLayout) {
        this.restoreBackup();
      }
      
      return false;
    }
  }

  /**
   * 템플릿 미리보기 (실제 적용하지 않고 레이아웃 반환)
   */
  previewTemplate(templateId: string): Partial<DashboardLayout> | null {
    const template = dashboardTemplates.find(t => t.id === templateId);
    return template ? template.layout : null;
  }

  /**
   * 현재 레이아웃을 템플릿으로 저장
   */
  saveAsTemplate(name: string, description: string): DashboardTemplate | null {
    const store = useDashboardStore.getState();
    const { currentLayout } = store;

    if (!currentLayout) {
      console.error('No current layout to save as template');
      return null;
    }

    const customTemplate: DashboardTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      preview: '⭐',
      category: 'minimal',
      recommendedFor: ['사용자 정의'],
      layout: {
        gridSize: currentLayout.gridSize,
        widgets: currentLayout.widgets.map(w => ({
          ...w,
          id: `${w.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
      }
    };

    // localStorage에 저장
    this.saveCustomTemplate(customTemplate);
    
    return customTemplate;
  }

  /**
   * 백업 복원
   */
  restoreBackup(): boolean {
    if (!this.backupLayout) {
      console.error('No backup available');
      return false;
    }

    const store = useDashboardStore.getState();
    const { setCurrentLayout } = store;
    
    setCurrentLayout(this.backupLayout);
    console.log('Backup restored successfully');
    
    return true;
  }

  /**
   * 템플릿 추천 (사용자 행동 기반)
   */
  getRecommendedTemplates(): DashboardTemplate[] {
    // 사용자 히스토리 기반 추천 로직
    const history = this.getTemplateHistory();
    const userType = this.detectUserType();
    
    return dashboardTemplates.filter(template => {
      // 사용자 타입과 매칭되는 템플릿 우선
      if (userType && template.recommendedFor.includes(userType)) {
        return true;
      }
      
      // 이전에 사용한 적 없는 템플릿 추천
      return !history.includes(template.id);
    }).slice(0, 3);
  }

  // Private 메서드들
  
  private clearAllWidgets(): void {
    const store = useDashboardStore.getState();
    const { currentLayout, removeWidget } = store;
    
    if (currentLayout && currentLayout.widgets) {
      const widgetIds = currentLayout.widgets.map(w => w.id);
      widgetIds.forEach(id => removeWidget(id));
    }
  }

  private hasConflict(newWidget: Omit<Widget, 'id'>): boolean {
    const store = useDashboardStore.getState();
    const { currentLayout } = store;
    
    if (!currentLayout) return false;
    
    // 위치 충돌 체크
    return currentLayout.widgets.some(existing => {
      const existingEnd = {
        x: existing.position.x + existing.position.width,
        y: existing.position.y + existing.position.height
      };
      
      const newEnd = {
        x: newWidget.position.x + newWidget.position.width,
        y: newWidget.position.y + newWidget.position.height
      };
      
      return !(
        newWidget.position.x >= existingEnd.x ||
        newEnd.x <= existing.position.x ||
        newWidget.position.y >= existingEnd.y ||
        newEnd.y <= existing.position.y
      );
    });
  }

  private saveBackupToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    if (this.backupLayout) {
      localStorage.setItem('dashboard-backup', JSON.stringify(this.backupLayout));
    }
  }

  private saveCustomTemplate(template: DashboardTemplate): void {
    if (typeof window === 'undefined') return;
    
    const customTemplates = this.getCustomTemplates();
    customTemplates.push(template);
    localStorage.setItem('custom-templates', JSON.stringify(customTemplates));
  }

  private getCustomTemplates(): DashboardTemplate[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem('custom-templates');
    return stored ? JSON.parse(stored) : [];
  }

  private saveTemplateHistory(templateId: string): void {
    if (typeof window === 'undefined') return;
    
    const history = this.getTemplateHistory();
    history.push(templateId);
    
    // 최근 10개만 유지
    const recentHistory = history.slice(-10);
    localStorage.setItem('template-history', JSON.stringify(recentHistory));
  }

  private getTemplateHistory(): string[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem('template-history');
    return stored ? JSON.parse(stored) : [];
  }

  private detectUserType(): string | null {
    // 간단한 사용자 타입 감지 로직
    const store = useDashboardStore.getState();
    const { currentLayout } = store;
    
    if (!currentLayout) return null;
    
    const widgetTypes = currentLayout.widgets.map(w => w.type);
    
    if (widgetTypes.includes('tax-deadline' as any) || widgetTypes.includes('tax-calculator' as any)) {
      return '세무사';
    }
    
    if (widgetTypes.includes('project-summary' as any) || widgetTypes.includes('task-tracker' as any)) {
      return '프로젝트 매니저';
    }
    
    return null;
  }
}

// 싱글톤 인스턴스
export const templateService = new TemplateService();

// 편의 함수들
export const applyTemplate = (templateId: string, options?: TemplateApplicationOptions) => 
  templateService.applyTemplate(templateId, options);

export const previewTemplate = (templateId: string) => 
  templateService.previewTemplate(templateId);

export const saveAsTemplate = (name: string, description: string) => 
  templateService.saveAsTemplate(name, description);

export const restoreBackup = () => 
  templateService.restoreBackup();

export const getRecommendedTemplates = () => 
  templateService.getRecommendedTemplates();