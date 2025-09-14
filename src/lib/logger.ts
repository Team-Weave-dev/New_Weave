/**
 * 프로덕션 로깅 시스템
 * 개발 환경에서는 console 로그를 표시하고,
 * 프로덕션 환경에서는 로그를 비활성화하거나 외부 서비스로 전송
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableInProduction: boolean;
  enableInDevelopment: boolean;
  logLevel: LogLevel;
  sendToExternalService?: (level: LogLevel, message: string, data?: any) => void;
}

const defaultConfig: LoggerConfig = {
  enableInProduction: false,
  enableInDevelopment: true,
  logLevel: 'info',
};

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return this.config.enableInDevelopment;
    }
    return this.config.enableInProduction;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  private sendToExternal(level: LogLevel, message: string, data?: any) {
    if (this.config.sendToExternalService && !this.isDevelopment) {
      try {
        this.config.sendToExternalService(level, message, data);
      } catch (error) {
        // 외부 서비스 전송 실패 시 조용히 실패
      }
    }
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      const formattedMessage = this.formatMessage('debug', message);
      if (this.isDevelopment) {
        console.log(formattedMessage, data || '');
      }
      this.sendToExternal('debug', message, data);
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      const formattedMessage = this.formatMessage('info', message);
      if (this.isDevelopment) {
        console.info(formattedMessage, data || '');
      }
      this.sendToExternal('info', message, data);
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      const formattedMessage = this.formatMessage('warn', message);
      if (this.isDevelopment) {
        console.warn(formattedMessage, data || '');
      }
      this.sendToExternal('warn', message, data);
    }
  }

  error(message: string, error?: Error | any) {
    if (this.shouldLog('error')) {
      const formattedMessage = this.formatMessage('error', message);
      if (this.isDevelopment) {
        console.error(formattedMessage, error || '');
      }
      this.sendToExternal('error', message, {
        message: error?.message,
        stack: error?.stack,
        ...error,
      });
    }
  }

  /**
   * 그룹화된 로그 (개발 환경에서만 동작)
   */
  group(label: string) {
    if (this.isDevelopment && this.config.enableInDevelopment) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDevelopment && this.config.enableInDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * 테이블 형태로 데이터 출력 (개발 환경에서만 동작)
   */
  table(data: any) {
    if (this.isDevelopment && this.config.enableInDevelopment) {
      console.table(data);
    }
  }

  /**
   * 성능 측정 시작
   */
  time(label: string) {
    if (this.isDevelopment && this.config.enableInDevelopment) {
      console.time(label);
    }
  }

  /**
   * 성능 측정 종료
   */
  timeEnd(label: string) {
    if (this.isDevelopment && this.config.enableInDevelopment) {
      console.timeEnd(label);
    }
  }
}

// 싱글톤 인스턴스 생성
const logger = new Logger({
  enableInProduction: false, // 프로덕션에서는 비활성화
  enableInDevelopment: true,  // 개발 환경에서는 활성화
  logLevel: 'info',
  // 필요시 외부 서비스 연동 가능
  // sendToExternalService: (level, message, data) => {
  //   // Sentry, LogRocket, DataDog 등 외부 서비스로 전송
  // }
});

export default logger;

// 편의 함수들
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, error?: Error | any) => logger.error(message, error),
  group: (label: string) => logger.group(label),
  groupEnd: () => logger.groupEnd(),
  table: (data: any) => logger.table(data),
  time: (label: string) => logger.time(label),
  timeEnd: (label: string) => logger.timeEnd(label),
};