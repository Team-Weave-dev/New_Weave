/**
 * 보안 유틸리티 함수
 * TASK-054: 보안 감사를 위한 유틸리티
 */

/**
 * SQL 인젝션 방지를 위한 입력 살균
 */
export function preventSQLInjection(input: string): string {
  if (!input) return '';
  
  // 위험한 SQL 키워드 제거
  const dangerousKeywords = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT',
    'UNION', 'CREATE', 'ALTER', 'EXEC', 'EXECUTE',
    '--', '/*', '*/', 'xp_', 'sp_', '@@', '@'
  ];
  
  let sanitized = input;
  dangerousKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  // 특수 문자 이스케이프
  sanitized = sanitized
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/\\/g, '\\\\');
  
  return sanitized;
}

/**
 * XSS 공격 방지를 위한 HTML 살균
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // HTML 태그 제거
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  
  // 이벤트 핸들러 제거
  sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // javascript: 프로토콜 제거
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // HTML 엔티티 인코딩
  const escapeHtml = (str: string): string => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };
  
  return escapeHtml(sanitized);
}

/**
 * 사업자 번호 유효성 검증
 */
export function validateBusinessNumber(businessNumber: string): boolean {
  // 형식: XXX-XX-XXXXX
  const regex = /^\d{3}-\d{2}-\d{5}$/;
  
  if (!regex.test(businessNumber)) {
    return false;
  }
  
  // 사업자 번호 체크섬 검증 (실제 알고리즘)
  const numbers = businessNumber.replace(/-/g, '').split('').map(Number);
  const checkSum = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += numbers[i] * checkSum[i];
  }
  
  sum += Math.floor((numbers[8] * 5) / 10);
  const result = (10 - (sum % 10)) % 10;
  
  return result === numbers[9];
}

/**
 * 파일 타입 검증
 */
export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/pdf' // .pdf (보고서용)
  ];
  
  return allowedTypes.includes(file.type);
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSize = maxSizeMB * 1024 * 1024; // MB to bytes
  return file.size <= maxSize;
}

/**
 * 파일명 살균
 */
export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 허용된 문자만 유지
    .replace(/\.{2,}/g, '_') // 연속된 점 제거 (경로 탐색 방지)
    .replace(/^\./, '_') // 시작 점 제거
    .substring(0, 255); // 최대 길이 제한
}

/**
 * 민감 정보 암호화 (간단한 예시)
 */
export function encryptSensitiveData(data: string, key?: string): string {
  // 실제 구현에서는 crypto-js 등의 라이브러리 사용
  // 여기서는 Base64 인코딩만 수행 (예시)
  try {
    return btoa(encodeURIComponent(data));
  } catch {
    return '';
  }
}

/**
 * 민감 정보 복호화 (간단한 예시)
 */
export function decryptSensitiveData(encrypted: string, key?: string): string {
  // 실제 구현에서는 crypto-js 등의 라이브러리 사용
  try {
    return decodeURIComponent(atob(encrypted));
  } catch {
    return '';
  }
}

/**
 * 로깅용 데이터 살균 (민감 정보 제거)
 */
export function sanitizeForLogging(data: any): any {
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'api_key',
    'business_number', 'credit_card', 'ssn', 'pin',
    'access_token', 'refresh_token', 'private_key'
  ];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  });
  
  return sanitized;
}

/**
 * CSRF 토큰 생성
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRF 토큰 검증
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length > 0;
}

/**
 * Origin 검증
 */
export function validateOrigin(origin: string): boolean {
  const allowedOrigins = [
    'https://weave.com',
    'https://app.weave.com',
    'https://www.weave.com',
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  ];
  
  return allowedOrigins.includes(origin);
}

/**
 * IP 주소 검증
 */
export function validateIPAddress(ip: string): boolean {
  // IPv4 검증
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // IPv6 검증 (간단한 버전)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
  
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  return ipv6Regex.test(ip);
}

/**
 * 레이트 리미터 클래스
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly limit: number;
  private readonly window: number;
  
  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit;
    this.window = windowMs;
  }
  
  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // 시간 윈도우 내의 요청만 유지
    const recentRequests = userRequests.filter(time => now - time < this.window);
    
    if (recentRequests.length >= this.limit) {
      return false; // 제한 초과
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
  
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
  
  resetAll(): void {
    this.requests.clear();
  }
}

/**
 * 세션 관리자 클래스
 */
export class SessionManager {
  private sessions: Map<string, { userId: string; expires: number; data?: any }> = new Map();
  private readonly timeout: number;
  
  constructor(timeoutMs: number = 30 * 60 * 1000) { // 기본 30분
    this.timeout = timeoutMs;
  }
  
  createSession(userId: string, data?: any): string {
    const sessionId = generateCSRFToken(); // 재사용
    this.sessions.set(sessionId, {
      userId,
      expires: Date.now() + this.timeout,
      data
    });
    return sessionId;
  }
  
  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    if (Date.now() > session.expires) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    return true;
  }
  
  refreshSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.expires = Date.now() + this.timeout;
    return true;
  }
  
  getSession(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session || Date.now() > session.expires) {
      return null;
    }
    return session;
  }
  
  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
  
  destroyAllSessions(userId: string): void {
    this.sessions.forEach((session, sessionId) => {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    });
  }
}

/**
 * 감사 로거 클래스
 */
export class AuditLogger {
  private logs: any[] = [];
  
  log(action: string, userId: string, details: any, ip?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details: sanitizeForLogging(details),
      ip: ip || this.getClientIP(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
    };
    
    this.logs.push(logEntry);
    
    // 실제 구현에서는 서버로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendToServer(logEntry);
    }
  }
  
  private getClientIP(): string {
    // 실제 구현에서는 서버에서 추출
    return '127.0.0.1';
  }
  
  private async sendToServer(logEntry: any): Promise<void> {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send audit log:', error);
    }
  }
  
  getLogs(): any[] {
    return [...this.logs];
  }
  
  clearLogs(): void {
    this.logs = [];
  }
}

// 싱글톤 인스턴스
export const rateLimiter = new RateLimiter();
export const sessionManager = new SessionManager();
export const auditLogger = new AuditLogger();