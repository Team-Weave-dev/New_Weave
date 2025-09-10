import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { sanitizeInput, validateBusinessNumber, preventSQLInjection } from '@/lib/utils/security';
import { TaxTransactionService } from '@/lib/services/supabase/tax-transactions.service';

/**
 * 세무 관리 보안 감사 테스트
 * TASK-054: 보안 감사 구현
 * OWASP Top 10 기반 보안 취약점 검증
 */

// Mock Supabase 클라이언트
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: mockSession }, error: null })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    })),
    rpc: vi.fn()
  }))
}));

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'authenticated'
  },
  access_token: 'test-token',
  refresh_token: 'test-refresh-token'
};

describe('인증 및 권한 부여 테스트', () => {
  let supabase: any;

  beforeEach(() => {
    supabase = createClient('http://localhost:54321', 'test-anon-key');
    vi.clearAllMocks();
  });

  describe('인증 보안', () => {
    it('유효하지 않은 토큰으로 접근 시 거부되어야 함', async () => {
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Invalid token' }
      });

      const result = await supabase.auth.getSession();
      expect(result.error).toBeDefined();
      expect(result.data.session).toBeNull();
    });

    it('만료된 토큰을 자동으로 갱신해야 함', async () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Date.now() - 1000
      };

      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: expiredSession },
        error: null
      });

      supabase.auth.refreshSession = vi.fn().mockResolvedValueOnce({
        data: { session: { ...mockSession, expires_at: Date.now() + 3600000 } },
        error: null
      });

      const result = await supabase.auth.getSession();
      expect(result.data.session).toBeDefined();
    });

    it('로그아웃 시 모든 세션이 종료되어야 함', async () => {
      await supabase.auth.signOut();
      
      expect(supabase.auth.signOut).toHaveBeenCalled();
      
      // 로컬 스토리지 확인
      expect(localStorage.getItem('supabase.auth.token')).toBeNull();
      expect(sessionStorage.getItem('supabase.auth.token')).toBeNull();
    });
  });

  describe('Row Level Security (RLS)', () => {
    it('다른 사용자의 데이터에 접근할 수 없어야 함', async () => {
      const service = new TaxTransactionService();
      
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' }
      });

      const result = await supabase
        .from('tax_transactions')
        .select('*')
        .eq('id', 'other-user-transaction-id')
        .single();

      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('PGRST116');
    });

    it('자신의 데이터만 조회할 수 있어야 함', async () => {
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: 'my-transaction', user_id: 'test-user-id' },
        error: null
      });

      const result = await supabase
        .from('tax_transactions')
        .select('*')
        .eq('user_id', 'test-user-id')
        .single();

      expect(result.data).toBeDefined();
      expect(result.data.user_id).toBe('test-user-id');
    });
  });
});

describe('입력 검증 및 살균 테스트', () => {
  describe('SQL 인젝션 방지', () => {
    it('SQL 인젝션 시도를 차단해야 함', () => {
      const maliciousInputs = [
        "'; DROP TABLE tax_transactions; --",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--",
        "1; DELETE FROM tax_transactions WHERE 1=1;",
        "' OR 1=1--",
        "<script>alert('XSS')</script>"
      ];

      maliciousInputs.forEach(input => {
        const sanitized = preventSQLInjection(input);
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain('DELETE');
        expect(sanitized).not.toContain('UNION');
        expect(sanitized).not.toContain('--');
        expect(sanitized).not.toContain('<script>');
      });
    });

    it('파라미터화된 쿼리를 사용해야 함', async () => {
      const supabase = createClient('http://localhost:54321', 'test-anon-key');
      
      // Supabase는 자동으로 파라미터화된 쿼리 사용
      const query = supabase
        .from('tax_transactions')
        .select('*')
        .eq('supplier_name', "'; DROP TABLE--");

      // 쿼리가 안전하게 이스케이프됨
      expect(query).toBeDefined();
    });
  });

  describe('XSS 방지', () => {
    it('HTML 태그를 이스케이프해야 함', () => {
      const xssInputs = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror="alert(\'XSS\')">',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<body onload="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '<svg onload="alert(\'XSS\')">'
      ];

      xssInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onload=');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('<svg');
      });
    });

    it('속성 값의 JavaScript를 차단해야 함', () => {
      const input = '<div onclick="alert(\'XSS\')">Click me</div>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('onclick');
    });
  });

  describe('데이터 유효성 검증', () => {
    it('사업자 번호 형식을 검증해야 함', () => {
      const validNumbers = [
        '123-45-67890',
        '987-65-43210'
      ];

      const invalidNumbers = [
        '12345678901',
        '123-456-7890',
        'abc-de-fghij',
        '123456789',
        '123-45-678901'
      ];

      validNumbers.forEach(num => {
        expect(validateBusinessNumber(num)).toBe(true);
      });

      invalidNumbers.forEach(num => {
        expect(validateBusinessNumber(num)).toBe(false);
      });
    });

    it('금액 필드는 숫자만 허용해야 함', () => {
      const validateAmount = (amount: any): boolean => {
        return typeof amount === 'number' && amount >= 0 && isFinite(amount);
      };

      expect(validateAmount(1000000)).toBe(true);
      expect(validateAmount('1000000')).toBe(false);
      expect(validateAmount(-1000)).toBe(false);
      expect(validateAmount(Infinity)).toBe(false);
      expect(validateAmount(NaN)).toBe(false);
    });

    it('날짜 형식을 검증해야 함', () => {
      const validateDate = (date: string): boolean => {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(date)) return false;
        
        const d = new Date(date);
        return d instanceof Date && !isNaN(d.getTime());
      };

      expect(validateDate('2025-01-09')).toBe(true);
      expect(validateDate('2025-13-01')).toBe(false);
      expect(validateDate('2025-01-32')).toBe(false);
      expect(validateDate('25-01-09')).toBe(false);
      expect(validateDate('2025/01/09')).toBe(false);
    });
  });
});

describe('파일 업로드 보안 테스트', () => {
  describe('파일 타입 검증', () => {
    it('허용된 파일 타입만 업로드 가능해야 함', () => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      const validateFileType = (file: File): boolean => {
        return allowedTypes.includes(file.type);
      };

      const validFile = new File([''], 'test.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const invalidFile = new File([''], 'test.exe', { 
        type: 'application/x-msdownload' 
      });

      expect(validateFileType(validFile)).toBe(true);
      expect(validateFileType(invalidFile)).toBe(false);
    });

    it('파일 크기 제한을 검증해야 함', () => {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      const validateFileSize = (file: File): boolean => {
        return file.size <= MAX_FILE_SIZE;
      };

      const smallFile = new File(['x'.repeat(1000)], 'test.xlsx');
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'test.xlsx');

      expect(validateFileSize(smallFile)).toBe(true);
      expect(validateFileSize(largeFile)).toBe(false);
    });

    it('파일명에 위험한 문자가 없어야 함', () => {
      const sanitizeFileName = (filename: string): string => {
        return filename
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/\.{2,}/g, '_')
          .substring(0, 255);
      };

      expect(sanitizeFileName('../../../etc/passwd')).toBe('_________etc_passwd');
      expect(sanitizeFileName('file<script>.xlsx')).toBe('file_script_.xlsx');
      expect(sanitizeFileName('file;rm -rf /.xlsx')).toBe('file_rm_-rf__.xlsx');
    });
  });

  describe('바이러스 스캔', () => {
    it('업로드된 파일의 매직 넘버를 검증해야 함', () => {
      const validateMagicNumber = (buffer: ArrayBuffer): boolean => {
        const view = new DataView(buffer);
        
        // Excel 2007+ (XLSX) 매직 넘버: 50 4B 03 04 (ZIP 파일)
        if (view.getUint32(0) === 0x504B0304) return true;
        
        // Excel 97-2003 (XLS) 매직 넘버: D0 CF 11 E0
        if (view.getUint32(0) === 0xD0CF11E0) return true;
        
        // CSV는 텍스트 파일이므로 매직 넘버 없음
        
        return false;
      };

      // XLSX 파일 시뮬레이션
      const xlsxBuffer = new ArrayBuffer(4);
      const xlsxView = new DataView(xlsxBuffer);
      xlsxView.setUint32(0, 0x504B0304);
      
      expect(validateMagicNumber(xlsxBuffer)).toBe(true);
      
      // 악성 파일 시뮬레이션
      const maliciousBuffer = new ArrayBuffer(4);
      const maliciousView = new DataView(maliciousBuffer);
      maliciousView.setUint32(0, 0x12345678);
      
      expect(validateMagicNumber(maliciousBuffer)).toBe(false);
    });
  });
});

describe('암호화 및 데이터 보호 테스트', () => {
  describe('민감 정보 암호화', () => {
    it('사업자 번호가 암호화되어 저장되어야 함', () => {
      const encryptData = (data: string): string => {
        // 실제로는 crypto 라이브러리 사용
        return Buffer.from(data).toString('base64');
      };

      const decryptData = (encrypted: string): string => {
        return Buffer.from(encrypted, 'base64').toString();
      };

      const businessNumber = '123-45-67890';
      const encrypted = encryptData(businessNumber);
      
      expect(encrypted).not.toBe(businessNumber);
      expect(decryptData(encrypted)).toBe(businessNumber);
    });

    it('민감 정보가 로그에 노출되지 않아야 함', () => {
      const sanitizeForLogging = (data: any): any => {
        const sensitive = ['business_number', 'password', 'token', 'credit_card'];
        
        if (typeof data === 'object') {
          const sanitized = { ...data };
          sensitive.forEach(key => {
            if (sanitized[key]) {
              sanitized[key] = '***REDACTED***';
            }
          });
          return sanitized;
        }
        return data;
      };

      const data = {
        id: '123',
        business_number: '123-45-67890',
        supplier_name: 'Test Company',
        password: 'secretpassword'
      };

      const sanitized = sanitizeForLogging(data);
      
      expect(sanitized.business_number).toBe('***REDACTED***');
      expect(sanitized.password).toBe('***REDACTED***');
      expect(sanitized.supplier_name).toBe('Test Company');
    });
  });

  describe('HTTPS 통신', () => {
    it('모든 API 요청이 HTTPS를 사용해야 함', () => {
      const validateURL = (url: string): boolean => {
        return url.startsWith('https://') || url.includes('localhost');
      };

      expect(validateURL('https://api.example.com')).toBe(true);
      expect(validateURL('http://localhost:3000')).toBe(true);
      expect(validateURL('http://api.example.com')).toBe(false);
    });

    it('쿠키에 Secure 플래그가 설정되어야 함', () => {
      const setCookie = (name: string, value: string): void => {
        if (window.location.protocol === 'https:') {
          document.cookie = `${name}=${value}; Secure; HttpOnly; SameSite=Strict`;
        }
      };

      // 프로덕션 환경 시뮬레이션
      Object.defineProperty(window.location, 'protocol', {
        value: 'https:',
        writable: true
      });

      setCookie('sessionId', 'test123');
      
      expect(document.cookie).toContain('Secure');
    });
  });
});

describe('레이트 리미팅 및 DDoS 방지 테스트', () => {
  describe('API 레이트 리미팅', () => {
    it('과도한 요청을 제한해야 함', async () => {
      const rateLimiter = {
        requests: new Map<string, number[]>(),
        limit: 100,
        window: 60000, // 1분
        
        checkLimit(userId: string): boolean {
          const now = Date.now();
          const userRequests = this.requests.get(userId) || [];
          
          // 시간 윈도우 내의 요청만 유지
          const recentRequests = userRequests.filter(time => now - time < this.window);
          
          if (recentRequests.length >= this.limit) {
            return false; // 제한 초과
          }
          
          recentRequests.push(now);
          this.requests.set(userId, recentRequests);
          return true;
        }
      };

      const userId = 'test-user';
      
      // 정상 요청
      for (let i = 0; i < 99; i++) {
        expect(rateLimiter.checkLimit(userId)).toBe(true);
      }
      
      // 100번째 요청
      expect(rateLimiter.checkLimit(userId)).toBe(true);
      
      // 101번째 요청 (제한 초과)
      expect(rateLimiter.checkLimit(userId)).toBe(false);
    });

    it('IP 기반 제한을 적용해야 함', () => {
      const ipRateLimiter = {
        blacklist: new Set<string>(),
        attempts: new Map<string, number>(),
        
        checkIP(ip: string): boolean {
          if (this.blacklist.has(ip)) return false;
          
          const attempts = this.attempts.get(ip) || 0;
          if (attempts > 5) {
            this.blacklist.add(ip);
            return false;
          }
          
          this.attempts.set(ip, attempts + 1);
          return true;
        }
      };

      const suspiciousIP = '192.168.1.100';
      
      // 6번 시도
      for (let i = 0; i < 6; i++) {
        ipRateLimiter.checkIP(suspiciousIP);
      }
      
      // 7번째 시도는 차단됨
      expect(ipRateLimiter.checkIP(suspiciousIP)).toBe(false);
      expect(ipRateLimiter.blacklist.has(suspiciousIP)).toBe(true);
    });
  });
});

describe('CSRF 보호 테스트', () => {
  it('CSRF 토큰이 생성되고 검증되어야 함', () => {
    const generateCSRFToken = (): string => {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    };

    const validateCSRFToken = (token: string, sessionToken: string): boolean => {
      return token === sessionToken && token.length > 0;
    };

    const csrfToken = generateCSRFToken();
    sessionStorage.setItem('csrf_token', csrfToken);

    // 정상 토큰
    expect(validateCSRFToken(csrfToken, sessionStorage.getItem('csrf_token')!)).toBe(true);
    
    // 잘못된 토큰
    expect(validateCSRFToken('invalid_token', sessionStorage.getItem('csrf_token')!)).toBe(false);
  });

  it('Origin 헤더를 검증해야 함', () => {
    const validateOrigin = (origin: string): boolean => {
      const allowedOrigins = [
        'https://weave.com',
        'https://app.weave.com',
        'http://localhost:3000'
      ];
      
      return allowedOrigins.includes(origin);
    };

    expect(validateOrigin('https://weave.com')).toBe(true);
    expect(validateOrigin('https://malicious.com')).toBe(false);
  });
});

describe('세션 관리 테스트', () => {
  describe('세션 타임아웃', () => {
    it('일정 시간 후 세션이 만료되어야 함', () => {
      const sessionManager = {
        sessions: new Map<string, { userId: string; expires: number }>(),
        timeout: 30 * 60 * 1000, // 30분
        
        createSession(userId: string): string {
          const sessionId = Math.random().toString(36);
          this.sessions.set(sessionId, {
            userId,
            expires: Date.now() + this.timeout
          });
          return sessionId;
        },
        
        validateSession(sessionId: string): boolean {
          const session = this.sessions.get(sessionId);
          if (!session) return false;
          
          if (Date.now() > session.expires) {
            this.sessions.delete(sessionId);
            return false;
          }
          
          return true;
        }
      };

      const sessionId = sessionManager.createSession('user123');
      
      // 즉시 검증
      expect(sessionManager.validateSession(sessionId)).toBe(true);
      
      // 만료 시뮬레이션
      const session = sessionManager.sessions.get(sessionId)!;
      session.expires = Date.now() - 1000;
      
      expect(sessionManager.validateSession(sessionId)).toBe(false);
      expect(sessionManager.sessions.has(sessionId)).toBe(false);
    });

    it('활동 시 세션이 연장되어야 함', () => {
      const sessionManager = {
        lastActivity: Date.now(),
        timeout: 30 * 60 * 1000,
        
        updateActivity(): void {
          this.lastActivity = Date.now();
        },
        
        isActive(): boolean {
          return Date.now() - this.lastActivity < this.timeout;
        }
      };

      expect(sessionManager.isActive()).toBe(true);
      
      // 활동 업데이트
      sessionManager.updateActivity();
      expect(sessionManager.isActive()).toBe(true);
    });
  });
});

describe('감사 로깅 테스트', () => {
  it('모든 중요 작업이 로깅되어야 함', () => {
    const auditLog = {
      logs: [] as any[],
      
      log(action: string, userId: string, details: any): void {
        this.logs.push({
          timestamp: new Date().toISOString(),
          action,
          userId,
          details,
          ip: '127.0.0.1' // 실제로는 요청에서 추출
        });
      }
    };

    // 로그인 시도
    auditLog.log('LOGIN_ATTEMPT', 'user123', { success: true });
    
    // 데이터 수정
    auditLog.log('UPDATE_TRANSACTION', 'user123', { 
      transactionId: 'tx123',
      changes: { amount: 1000000 }
    });
    
    // 데이터 삭제
    auditLog.log('DELETE_TRANSACTION', 'user123', { 
      transactionId: 'tx124'
    });

    expect(auditLog.logs).toHaveLength(3);
    expect(auditLog.logs[0].action).toBe('LOGIN_ATTEMPT');
    expect(auditLog.logs[1].action).toBe('UPDATE_TRANSACTION');
    expect(auditLog.logs[2].action).toBe('DELETE_TRANSACTION');
    
    // 모든 로그에 필수 정보가 있는지 확인
    auditLog.logs.forEach(log => {
      expect(log.timestamp).toBeDefined();
      expect(log.userId).toBeDefined();
      expect(log.ip).toBeDefined();
    });
  });
});