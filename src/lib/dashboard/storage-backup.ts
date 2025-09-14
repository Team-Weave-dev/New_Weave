/**
 * LocalStorage Backup System for Dashboard Widget System
 * Provides offline backup and recovery capabilities
 */

import { DashboardLayout, DashboardWidget, UserSettings, STORAGE_KEYS } from './mock-data';

interface BackupData {
  version: string;
  timestamp: string;
  layouts: DashboardLayout[];
  widgets: DashboardWidget[];
  userSettings: UserSettings;
  currentLayoutId: string | null;
}

interface BackupMetadata {
  id: string;
  timestamp: string;
  size: number;
  description?: string;
}

const BACKUP_VERSION = '1.0.0';
const BACKUP_KEY_PREFIX = 'dashboard_backup_';
const BACKUP_METADATA_KEY = 'dashboard_backup_metadata';
const MAX_BACKUPS = 5; // 최대 백업 개수

class StorageBackupManager {
  private static instance: StorageBackupManager;

  private constructor() {}

  static getInstance(): StorageBackupManager {
    if (!StorageBackupManager.instance) {
      StorageBackupManager.instance = new StorageBackupManager();
    }
    return StorageBackupManager.instance;
  }

  /**
   * 현재 상태를 백업
   */
  createBackup(description?: string): string | null {
    try {
      // 현재 데이터 수집
      const layouts = this.getFromStorage<DashboardLayout[]>(STORAGE_KEYS.LAYOUTS) || [];
      const widgets = this.getFromStorage<DashboardWidget[]>(STORAGE_KEYS.WIDGETS) || [];
      const userSettings = this.getFromStorage<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
      const currentLayoutId = localStorage.getItem(STORAGE_KEYS.CURRENT_LAYOUT);

      if (!userSettings) {
        console.error('No user settings found for backup');
        return null;
      }

      // 백업 데이터 생성
      const backupData: BackupData = {
        version: BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        layouts,
        widgets,
        userSettings,
        currentLayoutId
      };

      // 백업 ID 생성
      const backupId = `backup_${Date.now()}`;
      const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;

      // 백업 저장
      const backupJson = JSON.stringify(backupData);
      localStorage.setItem(backupKey, backupJson);

      // 메타데이터 업데이트
      this.updateBackupMetadata(backupId, backupJson.length, description);

      // 오래된 백업 정리
      this.cleanupOldBackups();

      console.log(`Backup created: ${backupId}`);
      return backupId;

    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  /**
   * 자동 백업 생성 (변경사항이 있을 때만)
   */
  createAutoBackup(): string | null {
    try {
      // 최근 백업과 비교하여 변경사항이 있는지 확인
      const latestBackup = this.getLatestBackup();
      
      if (latestBackup) {
        const currentData = this.getCurrentDataHash();
        const backupData = this.getBackupDataHash(latestBackup);
        
        if (currentData === backupData) {
          console.log('No changes detected, skipping auto-backup');
          return null;
        }
      }

      return this.createBackup('Auto-backup');
    } catch (error) {
      console.error('Failed to create auto-backup:', error);
      return null;
    }
  }

  /**
   * 백업에서 복원
   */
  restoreFromBackup(backupId: string): boolean {
    try {
      const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;
      const backupJson = localStorage.getItem(backupKey);

      if (!backupJson) {
        console.error(`Backup not found: ${backupId}`);
        return false;
      }

      const backupData: BackupData = JSON.parse(backupJson);

      // 버전 호환성 확인
      if (!this.isVersionCompatible(backupData.version)) {
        console.error(`Incompatible backup version: ${backupData.version}`);
        return false;
      }

      // 현재 상태를 백업 (복원 실패 시 롤백용)
      const rollbackId = this.createBackup('Pre-restore backup');

      try {
        // 데이터 복원
        localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(backupData.layouts));
        localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(backupData.widgets));
        localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(backupData.userSettings));
        
        if (backupData.currentLayoutId) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_LAYOUT, backupData.currentLayoutId);
        }

        console.log(`Successfully restored from backup: ${backupId}`);
        return true;

      } catch (restoreError) {
        console.error('Restore failed, attempting rollback:', restoreError);
        
        // 롤백 시도
        if (rollbackId) {
          this.restoreFromBackup(rollbackId);
        }
        
        return false;
      }

    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * 모든 백업 목록 조회
   */
  listBackups(): BackupMetadata[] {
    try {
      const metadataJson = localStorage.getItem(BACKUP_METADATA_KEY);
      
      if (!metadataJson) {
        return [];
      }

      const metadata: BackupMetadata[] = JSON.parse(metadataJson);
      
      // 타임스탬프 기준 내림차순 정렬
      return metadata.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * 특정 백업 조회
   */
  getBackup(backupId: string): BackupData | null {
    try {
      const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;
      const backupJson = localStorage.getItem(backupKey);

      if (!backupJson) {
        return null;
      }

      return JSON.parse(backupJson);

    } catch (error) {
      console.error('Failed to get backup:', error);
      return null;
    }
  }

  /**
   * 최신 백업 조회
   */
  getLatestBackup(): BackupData | null {
    const backups = this.listBackups();
    
    if (backups.length === 0) {
      return null;
    }

    return this.getBackup(backups[0].id);
  }

  /**
   * 백업 삭제
   */
  deleteBackup(backupId: string): boolean {
    try {
      const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;
      
      // 백업 데이터 삭제
      localStorage.removeItem(backupKey);

      // 메타데이터 업데이트
      const metadata = this.listBackups();
      const updatedMetadata = metadata.filter(m => m.id !== backupId);
      localStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(updatedMetadata));

      console.log(`Backup deleted: ${backupId}`);
      return true;

    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * 모든 백업 삭제
   */
  deleteAllBackups(): boolean {
    try {
      const backups = this.listBackups();
      
      backups.forEach(backup => {
        const backupKey = `${BACKUP_KEY_PREFIX}${backup.id}`;
        localStorage.removeItem(backupKey);
      });

      localStorage.removeItem(BACKUP_METADATA_KEY);

      console.log('All backups deleted');
      return true;

    } catch (error) {
      console.error('Failed to delete all backups:', error);
      return false;
    }
  }

  /**
   * 백업 내보내기 (JSON 파일로 다운로드)
   */
  exportBackup(backupId: string): void {
    const backup = this.getBackup(backupId);
    
    if (!backup) {
      console.error(`Backup not found: ${backupId}`);
      return;
    }

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-backup-${backupId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * 백업 가져오기 (JSON 파일에서)
   */
  async importBackup(file: File): Promise<string | null> {
    try {
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);

      // 버전 호환성 확인
      if (!this.isVersionCompatible(backupData.version)) {
        throw new Error(`Incompatible backup version: ${backupData.version}`);
      }

      // 새 백업 ID 생성
      const backupId = `imported_${Date.now()}`;
      const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;

      // 백업 저장
      localStorage.setItem(backupKey, text);

      // 메타데이터 업데이트
      this.updateBackupMetadata(
        backupId,
        text.length,
        `Imported from ${file.name}`
      );

      // 오래된 백업 정리
      this.cleanupOldBackups();

      console.log(`Backup imported: ${backupId}`);
      return backupId;

    } catch (error) {
      console.error('Failed to import backup:', error);
      return null;
    }
  }

  /**
   * Storage에서 데이터 가져오기
   */
  private getFromStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get ${key} from storage:`, error);
      return null;
    }
  }

  /**
   * 백업 메타데이터 업데이트
   */
  private updateBackupMetadata(
    backupId: string,
    size: number,
    description?: string
  ): void {
    try {
      const metadata = this.listBackups();
      
      metadata.push({
        id: backupId,
        timestamp: new Date().toISOString(),
        size,
        description
      });

      localStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(metadata));

    } catch (error) {
      console.error('Failed to update backup metadata:', error);
    }
  }

  /**
   * 오래된 백업 정리
   */
  private cleanupOldBackups(): void {
    try {
      const backups = this.listBackups();
      
      if (backups.length <= MAX_BACKUPS) {
        return;
      }

      // 가장 오래된 백업들 삭제
      const toDelete = backups.slice(MAX_BACKUPS);
      
      toDelete.forEach(backup => {
        this.deleteBackup(backup.id);
      });

      console.log(`Cleaned up ${toDelete.length} old backups`);

    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * 버전 호환성 확인
   */
  private isVersionCompatible(version: string): boolean {
    // 간단한 메이저 버전 체크
    const [major] = version.split('.');
    const [currentMajor] = BACKUP_VERSION.split('.');
    
    return major === currentMajor;
  }

  /**
   * 현재 데이터의 해시 생성 (변경 감지용)
   */
  private getCurrentDataHash(): string {
    const layouts = this.getFromStorage(STORAGE_KEYS.LAYOUTS);
    const widgets = this.getFromStorage(STORAGE_KEYS.WIDGETS);
    const settings = this.getFromStorage(STORAGE_KEYS.USER_SETTINGS);
    
    return this.generateHash({ layouts, widgets, settings });
  }

  /**
   * 백업 데이터의 해시 생성
   */
  private getBackupDataHash(backup: BackupData): string {
    return this.generateHash({
      layouts: backup.layouts,
      widgets: backup.widgets,
      settings: backup.userSettings
    });
  }

  /**
   * 간단한 해시 생성
   */
  private generateHash(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString();
  }

  /**
   * 스토리지 사용량 계산
   */
  getStorageUsage(): {
    totalSize: number;
    backupsSize: number;
    dataSize: number;
    percentage: number;
  } {
    let totalSize = 0;
    let backupsSize = 0;
    let dataSize = 0;

    // 모든 localStorage 항목 크기 계산
    for (const key in localStorage) {
      const value = localStorage.getItem(key);
      if (value) {
        const size = value.length + key.length;
        totalSize += size;

        if (key.startsWith(BACKUP_KEY_PREFIX)) {
          backupsSize += size;
        } else if (Object.values(STORAGE_KEYS).includes(key as any)) {
          dataSize += size;
        }
      }
    }

    // localStorage 최대 크기 (대략 5MB)
    const maxSize = 5 * 1024 * 1024;
    const percentage = (totalSize / maxSize) * 100;

    return {
      totalSize,
      backupsSize,
      dataSize,
      percentage
    };
  }
}

export const storageBackupManager = StorageBackupManager.getInstance();