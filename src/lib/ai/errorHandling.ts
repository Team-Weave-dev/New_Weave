/**
 * 에러 처리 및 복구 시스템
 * Phase 4: 강건한 에러 처리와 자동 복구
 */

/**
 * 에러 타입
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  API_LIMIT = 'API_LIMIT',
  INVALID_INPUT = 'INVALID_INPUT',
  PROCESSING = 'PROCESSING',
  CACHE = 'CACHE',
  DATABASE = 'DATABASE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 에러 심각도
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * 시스템 에러
 */
export class SystemError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  context?: any;
  timestamp: Date;
  retryable: boolean;
  retryCount: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    retryable: boolean = true
  ) {
    super(message);
    this.name = 'SystemError';
    this.type = type;
    this.severity = severity;
    this.retryable = retryable;
    this.timestamp = new Date();
    this.retryCount = 0;
  }
}

/**
 * 복구 전략
 */
export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation';
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  fallbackAction?: () => Promise<any>;
  circuitBreakerThreshold?: number;
}

/**
 * 서킷 브레이커 상태
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * 서킷 브레이커
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly successThreshold: number;

  constructor(
    threshold: number = 5,
    timeout: number = 60000, // 1분
    successThreshold: number = 3
  ) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.successThreshold = successThreshold;
  }

  /**
   * 요청 실행
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    // 서킷이 열려있는지 체크
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
      } else {
        if (fallback) {
          return fallback();
        }
        throw new SystemError(
          '서킷 브레이커가 열려있습니다',
          ErrorType.PROCESSING,
          ErrorSeverity.HIGH,
          false
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      // 에러가 발생했으므로 그대로 throw
      // fallback은 Circuit이 이미 OPEN 상태일 때만 사용 (위에서 처리됨)
      throw error;
    }
  }

  /**
   * 성공 처리
   */
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  /**
   * 실패 처리
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.successCount = 0;
    
    if (this.failureCount >= this.threshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  /**
   * 리셋 시도 여부
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const elapsed = Date.now() - this.lastFailureTime.getTime();
    return elapsed >= this.timeout;
  }

  /**
   * 상태 조회
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * 수동 리셋
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}

/**
 * 재시도 메커니즘
 */
export class RetryMechanism {
  /**
   * 지수 백오프로 재시도
   */
  static async retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
    multiplier: number = 2,
    maxDelay: number = 30000
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // SystemError이고 재시도 불가능한 경우
        if (error instanceof SystemError && !error.retryable) {
          throw error;
        }

        // 재시도 대기
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // 다음 딜레이 계산
        delay = Math.min(delay * multiplier, maxDelay);
      }
    }

    throw lastError || new Error('재시도 실패');
  }

  /**
   * 즉시 재시도
   */
  static async retryImmediate<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        if (error instanceof SystemError && !error.retryable) {
          throw error;
        }
      }
    }

    throw lastError || new Error('재시도 실패');
  }
}

/**
 * 에러 핸들러
 */
export class ErrorHandler {
  private circuitBreakers: Map<string, CircuitBreaker>;
  private errorLog: SystemError[];
  private recoveryStrategies: Map<ErrorType, RecoveryStrategy>;

  constructor() {
    this.circuitBreakers = new Map();
    this.errorLog = [];
    this.recoveryStrategies = this.initializeStrategies();
  }

  /**
   * 복구 전략 초기화
   */
  private initializeStrategies(): Map<ErrorType, RecoveryStrategy> {
    const strategies = new Map<ErrorType, RecoveryStrategy>();

    // 네트워크 에러 전략
    strategies.set(ErrorType.NETWORK, {
      type: 'retry',
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    });

    // API 제한 전략
    strategies.set(ErrorType.API_LIMIT, {
      type: 'circuit_breaker',
      circuitBreakerThreshold: 3,
      fallbackAction: async () => {
        // 캐시된 응답 반환
        return { cached: true, message: 'API 제한으로 캐시된 응답 사용' };
      }
    });

    // 타임아웃 전략
    strategies.set(ErrorType.TIMEOUT, {
      type: 'retry',
      maxRetries: 2,
      retryDelay: 500
    });

    // 처리 에러 전략
    strategies.set(ErrorType.PROCESSING, {
      type: 'fallback',
      fallbackAction: async () => {
        // 간단한 대체 응답
        return { fallback: true, message: '처리 중 오류가 발생했습니다' };
      }
    });

    // 기본 전략
    strategies.set(ErrorType.UNKNOWN, {
      type: 'graceful_degradation'
    });

    return strategies;
  }

  /**
   * 에러 처리
   */
  async handle<T>(
    error: Error | SystemError,
    context?: any
  ): Promise<T | null> {
    // SystemError로 변환
    const systemError = this.toSystemError(error);
    systemError.context = context;

    // 로그 기록
    this.logError(systemError);

    // 복구 전략 선택
    const strategy = this.recoveryStrategies.get(systemError.type);
    if (!strategy) {
      throw systemError;
    }

    // 전략 실행
    return await this.executeStrategy(systemError, strategy);
  }

  /**
   * SystemError로 변환
   */
  private toSystemError(error: Error | SystemError): SystemError {
    if (error instanceof SystemError) {
      return error;
    }

    // 에러 타입 추론
    const type = this.inferErrorType(error);
    const severity = this.inferSeverity(error);
    
    return new SystemError(
      error.message,
      type,
      severity
    );
  }

  /**
   * 에러 타입 추론
   */
  private inferErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('rate limit') || message.includes('quota')) {
      return ErrorType.API_LIMIT;
    }
    if (message.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }
    if (message.includes('invalid') || message.includes('validation')) {
      return ErrorType.INVALID_INPUT;
    }
    if (message.includes('database') || message.includes('db')) {
      return ErrorType.DATABASE;
    }
    if (message.includes('cache')) {
      return ErrorType.CACHE;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * 심각도 추론
   */
  private inferSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    if (message.includes('error') || message.includes('fail')) {
      return ErrorSeverity.HIGH;
    }
    if (message.includes('warning')) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * 전략 실행
   */
  private async executeStrategy<T>(
    error: SystemError,
    strategy: RecoveryStrategy
  ): Promise<T | null> {
    switch (strategy.type) {
      case 'retry':
        if (error.retryable && strategy.maxRetries) {
          // 재시도는 호출자가 처리
          throw error;
        }
        return null;

      case 'fallback':
        if (strategy.fallbackAction) {
          return await strategy.fallbackAction();
        }
        return null;

      case 'circuit_breaker':
        const breaker = this.getOrCreateCircuitBreaker(error.type);
        if (breaker.getState() === CircuitBreakerState.OPEN) {
          if (strategy.fallbackAction) {
            return await strategy.fallbackAction();
          }
        }
        throw error;

      case 'graceful_degradation':
        // 기본 응답 반환
        return { degraded: true, message: '서비스가 제한된 모드로 실행 중입니다' } as any;

      default:
        throw error;
    }
  }

  /**
   * 서킷 브레이커 가져오기/생성
   */
  private getOrCreateCircuitBreaker(key: string): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker());
    }
    return this.circuitBreakers.get(key)!;
  }

  /**
   * 에러 로그 기록
   */
  private logError(error: SystemError): void {
    this.errorLog.push(error);

    // 최근 1000개만 유지
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-1000);
    }

    // 심각한 에러는 콘솔에 출력
    if (error.severity === ErrorSeverity.HIGH || 
        error.severity === ErrorSeverity.CRITICAL) {
      console.error(`[${error.type}] ${error.message}`, error);
    }
  }

  /**
   * 에러 통계 조회
   */
  getErrorStats(): any {
    const stats: any = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.errorLog.slice(-10)
    };

    // 타입별 집계
    for (const error of this.errorLog) {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    }

    return stats;
  }

  /**
   * 서킷 브레이커 상태 조회
   */
  getCircuitBreakerStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    
    this.circuitBreakers.forEach((breaker, key) => {
      states[key] = breaker.getState();
    });

    return states;
  }

  /**
   * 모든 서킷 브레이커 리셋
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.forEach(breaker => breaker.reset());
  }
}

/**
 * 전역 에러 핸들러 (싱글톤)
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private handler: ErrorHandler;

  private constructor() {
    this.handler = new ErrorHandler();
  }

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  getHandler(): ErrorHandler {
    return this.handler;
  }
}

export default GlobalErrorHandler;