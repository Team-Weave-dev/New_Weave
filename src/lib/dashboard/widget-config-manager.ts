/**
 * WidgetConfigManager - 위젯 설정 관리 시스템
 * 
 * 위젯 설정의 저장, 복원, 검증, 프리셋 관리를 담당합니다.
 */

import { 
  WidgetConfig, 
  PresetData, 
  ConfigValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
  ExportOptions,
  ImportOptions,
  ConfigChangeEvent,
  WidgetSettings,
  WidgetSettingsSchema
} from './widget-config-types';
import { widgetEventBus, WidgetEventTypes, emitWidgetEvent } from './widget-event-bus';

interface StorageAdapter {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any | null>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

// 로컬스토리지 어댑터
class LocalStorageAdapter implements StorageAdapter {
  private prefix = 'weave_widget_';

  async save(key: string, data: any): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw new Error('Storage quota exceeded or localStorage unavailable');
    }
  }

  async load(key: string): Promise<any | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys: string[] = [];
    const searchPrefix = this.prefix + (prefix || '');
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(searchPrefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    
    return keys;
  }
}

export class WidgetConfigManager {
  private storage: StorageAdapter;
  private configCache: Map<string, WidgetConfig> = new Map();
  private presetCache: Map<string, PresetData> = new Map();
  private changeHistory: ConfigChangeEvent[] = [];
  private maxHistorySize = 50;
  private validators: Map<string, (config: any) => ConfigValidationResult> = new Map();

  constructor(storage?: StorageAdapter) {
    this.storage = storage || new LocalStorageAdapter();
    this.initializeEventListeners();
    this.registerDefaultValidators();
  }

  /**
   * 위젯 설정 저장
   */
  async saveConfig(widgetId: string, config: WidgetConfig): Promise<void> {
    // 유효성 검증
    const validation = await this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid config: ${validation.errors?.[0]?.message}`);
    }

    // 이전 설정 백업
    const previousConfig = await this.loadConfig(widgetId);

    // 메타데이터 업데이트
    config.metadata = {
      ...config.metadata,
      updatedAt: new Date().toISOString()
    };

    // 저장
    await this.storage.save(`config_${widgetId}`, config);
    
    // 캐시 업데이트
    this.configCache.set(widgetId, config);

    // 변경 이벤트 발행
    if (previousConfig) {
      const changeEvent: ConfigChangeEvent = {
        widgetId,
        changes: this.getConfigDiff(previousConfig, config),
        previousConfig,
        timestamp: Date.now(),
        source: 'user'
      };
      
      this.addToHistory(changeEvent);
      
      emitWidgetEvent(
        WidgetEventTypes.STATE_CHANGE,
        'ConfigManager',
        {
          widgetId,
          oldState: previousConfig,
          newState: config
        }
      );
    }
  }

  /**
   * 위젯 설정 로드
   */
  async loadConfig(widgetId: string): Promise<WidgetConfig | null> {
    // 캐시 확인
    if (this.configCache.has(widgetId)) {
      return this.configCache.get(widgetId)!;
    }

    // 스토리지에서 로드
    const config = await this.storage.load(`config_${widgetId}`);
    
    if (config) {
      this.configCache.set(widgetId, config);
      return config;
    }

    return null;
  }

  /**
   * 위젯 설정 삭제
   */
  async deleteConfig(widgetId: string): Promise<void> {
    await this.storage.delete(`config_${widgetId}`);
    this.configCache.delete(widgetId);
    
    // 일반 이벤트 발행
    widgetEventBus.emit({
      type: WidgetEventTypes.DESTROY,
      source: 'ConfigManager',
      data: { widgetId }
    });
  }

  /**
   * 모든 위젯 설정 로드
   */
  async loadAllConfigs(): Promise<Map<string, WidgetConfig>> {
    const configs = new Map<string, WidgetConfig>();
    const keys = await this.storage.list('config_');
    
    for (const key of keys) {
      const widgetId = key.replace('config_', '');
      const config = await this.loadConfig(widgetId);
      if (config) {
        configs.set(widgetId, config);
      }
    }
    
    return configs;
  }

  /**
   * 프리셋 저장
   */
  async savePreset(preset: PresetData): Promise<void> {
    // 메타데이터 업데이트
    preset.metadata = {
      ...preset.metadata,
      updatedAt: new Date().toISOString()
    };

    await this.storage.save(`preset_${preset.id}`, preset);
    this.presetCache.set(preset.id, preset);
  }

  /**
   * 프리셋 삭제
   */
  async deletePreset(presetId: string): Promise<void> {
    await this.storage.delete(`preset_${presetId}`);
    this.presetCache.delete(presetId);
  }

  /**
   * 프리셋 로드
   */
  async loadPreset(presetId: string): Promise<PresetData | null> {
    if (this.presetCache.has(presetId)) {
      return this.presetCache.get(presetId)!;
    }

    const preset = await this.storage.load(`preset_${presetId}`);
    
    if (preset) {
      this.presetCache.set(presetId, preset);
      return preset;
    }

    return null;
  }

  /**
   * 모든 프리셋 로드
   */
  async loadAllPresets(): Promise<PresetData[]> {
    const presets: PresetData[] = [];
    const keys = await this.storage.list('preset_');
    
    for (const key of keys) {
      const presetId = key.replace('preset_', '');
      const preset = await this.loadPreset(presetId);
      if (preset) {
        presets.push(preset);
      }
    }
    
    return presets;
  }

  /**
   * 프리셋 적용
   */
  async applyPreset(presetId: string): Promise<void> {
    const preset = await this.loadPreset(presetId);
    if (!preset) {
      throw new Error(`Preset ${presetId} not found`);
    }

    // 각 위젯 설정 적용
    for (const widgetConfig of preset.widgets) {
      await this.saveConfig(widgetConfig.id, widgetConfig);
    }

    // 레이아웃 정보가 있으면 이벤트 발행
    if (preset.layout) {
      emitWidgetEvent(
        WidgetEventTypes.LAYOUT_CHANGE,
        'ConfigManager',
        {
          widgetId: 'dashboard',
          layout: preset.layout
        }
      );
    }
  }

  /**
   * 프리셋으로 내보내기
   */
  async exportPreset(
    name: string, 
    widgetIds: string[], 
    options?: ExportOptions
  ): Promise<PresetData> {
    const widgets: WidgetConfig[] = [];
    
    for (const widgetId of widgetIds) {
      let config = await this.loadConfig(widgetId);
      if (config) {
        // 자격 증명 제거 옵션
        if (!options?.includeCredentials) {
          config = this.removeCredentials(config);
        }
        widgets.push(config);
      }
    }

    const preset: PresetData = {
      id: this.generateId(),
      name,
      widgets,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false
      }
    };

    // 레이아웃 포함 옵션
    if (options?.includeLayout) {
      // 현재 레이아웃 정보 가져오기 (구현 필요)
      // preset.layout = await this.getCurrentLayout();
    }

    // 압축 옵션
    if (options?.compress) {
      // 데이터 압축 (구현 필요)
    }

    return preset;
  }

  /**
   * 프리셋 가져오기
   */
  async importPreset(
    presetData: PresetData | string, 
    options?: ImportOptions
  ): Promise<void> {
    let preset: PresetData;
    
    // 문자열인 경우 JSON 파싱
    if (typeof presetData === 'string') {
      try {
        preset = JSON.parse(presetData);
      } catch (error) {
        throw new Error('Invalid preset data format');
      }
    } else {
      preset = presetData;
    }

    // 유효성 검증 옵션
    if (options?.validateBeforeImport) {
      for (const widget of preset.widgets) {
        const validation = await this.validateConfig(widget);
        if (!validation.isValid) {
          throw new Error(`Invalid widget config: ${widget.id}`);
        }
      }
    }

    // ID 보존/재생성 옵션
    if (!options?.preserveIds) {
      preset.id = this.generateId();
      preset.widgets = preset.widgets.map(w => ({
        ...w,
        id: this.generateId()
      }));
    }

    // 병합/덮어쓰기 옵션
    if (options?.merge) {
      // 기존 설정과 병합
      for (const widget of preset.widgets) {
        const existing = await this.loadConfig(widget.id);
        if (existing) {
          widget.settings = { ...existing.settings, ...widget.settings };
        }
      }
    }

    // 프리셋 저장 및 적용
    await this.savePreset(preset);
    
    if (!options || options.overwrite !== false) {
      await this.applyPreset(preset.id);
    }
  }

  /**
   * 설정 유효성 검증
   */
  async validateConfig(config: WidgetConfig): Promise<ConfigValidationResult> {
    const errors: ConfigValidationError[] = [];
    const warnings: ConfigValidationWarning[] = [];

    // 필수 필드 검증
    if (!config.id) {
      errors.push({
        field: 'id',
        message: 'Widget ID is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!config.type) {
      errors.push({
        field: 'type',
        message: 'Widget type is required',
        code: 'REQUIRED_FIELD'
      });
    }

    // 메타데이터 검증
    if (!config.metadata?.version) {
      warnings.push({
        field: 'metadata.version',
        message: 'Version is recommended for compatibility',
        suggestion: 'Add version field to metadata'
      });
    }

    // 위젯 타입별 커스텀 검증
    const validator = this.validators.get(config.type);
    if (validator) {
      const customValidation = validator(config);
      if (customValidation.errors) {
        errors.push(...customValidation.errors);
      }
      if (customValidation.warnings) {
        warnings.push(...customValidation.warnings);
      }
    }

    // 설정 스키마 검증
    this.validateSettings(config.settings, config.type, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * 설정 스키마 검증
   */
  private validateSettings(
    settings: WidgetSettings, 
    widgetType: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    // 공통 설정 검증
    const commonSchema = WidgetSettingsSchema.common;
    
    if (settings.refreshInterval !== undefined) {
      if (settings.refreshInterval < commonSchema.refreshInterval.min ||
          settings.refreshInterval > commonSchema.refreshInterval.max) {
        errors.push({
          field: 'settings.refreshInterval',
          message: `Refresh interval must be between ${commonSchema.refreshInterval.min} and ${commonSchema.refreshInterval.max}`,
          code: 'OUT_OF_RANGE'
        });
      }
    }

    // 위젯별 커스텀 설정 검증
    const widgetSchema = (WidgetSettingsSchema as any)[widgetType];
    if (widgetSchema && settings.customSettings) {
      this.validateCustomSettings(settings.customSettings, widgetSchema, errors);
    }
  }

  /**
   * 커스텀 설정 검증
   */
  private validateCustomSettings(
    customSettings: Record<string, any>,
    schema: any,
    errors: ConfigValidationError[]
  ): void {
    for (const [key, value] of Object.entries(customSettings)) {
      const fieldSchema = schema[key];
      if (!fieldSchema) continue;

      if (fieldSchema.type === 'enum') {
        if (!fieldSchema.values.includes(value)) {
          errors.push({
            field: `customSettings.${key}`,
            message: `Invalid value. Must be one of: ${fieldSchema.values.join(', ')}`,
            code: 'INVALID_ENUM_VALUE'
          });
        }
      } else if (fieldSchema.type === 'number') {
        if (typeof value !== 'number') {
          errors.push({
            field: `customSettings.${key}`,
            message: 'Value must be a number',
            code: 'TYPE_MISMATCH'
          });
        } else if (fieldSchema.min !== undefined && value < fieldSchema.min) {
          errors.push({
            field: `customSettings.${key}`,
            message: `Value must be at least ${fieldSchema.min}`,
            code: 'OUT_OF_RANGE'
          });
        } else if (fieldSchema.max !== undefined && value > fieldSchema.max) {
          errors.push({
            field: `customSettings.${key}`,
            message: `Value must be at most ${fieldSchema.max}`,
            code: 'OUT_OF_RANGE'
          });
        }
      } else if (fieldSchema.type === 'boolean') {
        if (typeof value !== 'boolean') {
          errors.push({
            field: `customSettings.${key}`,
            message: 'Value must be a boolean',
            code: 'TYPE_MISMATCH'
          });
        }
      }
    }
  }

  /**
   * 커스텀 검증자 등록
   */
  registerValidator(
    widgetType: string, 
    validator: (config: any) => ConfigValidationResult
  ): void {
    this.validators.set(widgetType, validator);
  }

  /**
   * 설정 변경 히스토리 조회
   */
  getHistory(widgetId?: string, limit?: number): ConfigChangeEvent[] {
    let history = [...this.changeHistory];
    
    if (widgetId) {
      history = history.filter(event => event.widgetId === widgetId);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  /**
   * 설정 롤백
   */
  async rollback(widgetId: string, steps: number = 1): Promise<void> {
    const history = this.getHistory(widgetId);
    
    if (history.length < steps) {
      throw new Error('Not enough history to rollback');
    }
    
    const targetEvent = history[history.length - steps];
    await this.saveConfig(widgetId, targetEvent.previousConfig);
  }

  /**
   * 설정 리셋
   */
  async resetToDefault(widgetId: string): Promise<void> {
    const defaultConfig = await this.getDefaultConfig(widgetId);
    if (defaultConfig) {
      await this.saveConfig(widgetId, defaultConfig);
    }
  }

  /**
   * 기본 설정 가져오기
   */
  private async getDefaultConfig(widgetId: string): Promise<WidgetConfig | null> {
    // 위젯 타입에 따른 기본 설정 반환
    // 실제 구현에서는 위젯 레지스트리에서 가져와야 함
    return null;
  }

  /**
   * 설정 차이 계산
   */
  private getConfigDiff(
    oldConfig: WidgetConfig, 
    newConfig: WidgetConfig
  ): Partial<WidgetConfig> {
    const diff: Partial<WidgetConfig> = {};
    
    // 간단한 얕은 비교 (실제로는 deep diff 필요)
    for (const key in newConfig) {
      if (JSON.stringify(oldConfig[key as keyof WidgetConfig]) !== 
          JSON.stringify(newConfig[key as keyof WidgetConfig])) {
        (diff as any)[key] = newConfig[key as keyof WidgetConfig];
      }
    }
    
    return diff;
  }

  /**
   * 자격 증명 제거
   */
  private removeCredentials(config: WidgetConfig): WidgetConfig {
    const cleaned = { ...config };
    
    // customSettings에서 민감한 정보 제거
    if (cleaned.settings.customSettings) {
      const sensitive = ['apiKey', 'password', 'token', 'secret'];
      for (const key of sensitive) {
        delete cleaned.settings.customSettings[key];
      }
    }
    
    return cleaned;
  }

  /**
   * 히스토리에 추가
   */
  private addToHistory(event: ConfigChangeEvent): void {
    this.changeHistory.push(event);
    
    // 히스토리 크기 제한
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory = this.changeHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * ID 생성
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 이벤트 리스너 초기화
   */
  private initializeEventListeners(): void {
    // 위젯 설정 요청 이벤트 처리
    widgetEventBus.subscribe(WidgetEventTypes.DATA_REQUEST, async (data: any) => {
      if (data.query?.type === 'config') {
        const config = await this.loadConfig(data.widgetId);
        
        emitWidgetEvent(
          WidgetEventTypes.DATA_RESPONSE,
          'ConfigManager',
          {
            widgetId: data.widgetId,
            requestId: data.requestId,
            data: config,
            error: config ? undefined : 'Config not found'
          }
        );
      }
    });
  }

  /**
   * 기본 검증자 등록
   */
  private registerDefaultValidators(): void {
    // 차트 위젯 검증자
    this.registerValidator('chart', (config) => {
      const errors: ConfigValidationError[] = [];
      const warnings: ConfigValidationWarning[] = [];
      
      if (!config.settings.customSettings?.dataSource) {
        errors.push({
          field: 'settings.customSettings.dataSource',
          message: 'Data source is required for chart widget',
          code: 'REQUIRED_FIELD'
        });
      }
      
      return { isValid: errors.length === 0, errors, warnings };
    });

    // KPI 위젯 검증자
    this.registerValidator('kpi', (config) => {
      const errors: ConfigValidationError[] = [];
      const warnings: ConfigValidationWarning[] = [];
      
      if (!config.settings.customSettings?.kpiType) {
        errors.push({
          field: 'settings.customSettings.kpiType',
          message: 'KPI type is required',
          code: 'REQUIRED_FIELD'
        });
      }
      
      if (config.settings.customSettings?.targetValue === undefined) {
        warnings.push({
          field: 'settings.customSettings.targetValue',
          message: 'Target value is recommended for KPI tracking',
          suggestion: 'Set a target value for better visualization'
        });
      }
      
      return { isValid: errors.length === 0, errors, warnings };
    });
  }

  /**
   * 정리 및 리소스 해제
   */
  dispose(): void {
    this.configCache.clear();
    this.presetCache.clear();
    this.changeHistory = [];
    this.validators.clear();
    widgetEventBus.unsubscribeAll();
  }
}

// 싱글톤 인스턴스
export const widgetConfigManager = new WidgetConfigManager();

export default widgetConfigManager;