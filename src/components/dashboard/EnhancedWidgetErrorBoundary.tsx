'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Bug, Home } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  widgetId?: string
  widgetType?: string
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  enableReporting?: boolean
  className?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
  isRecovering: boolean
}

// 에러 로깅 서비스 (실제 프로덕션에서는 Sentry 등 사용)
const logErrorToService = (error: Error, errorInfo: React.ErrorInfo, context: any) => {
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션 환경에서 에러 로깅 서비스로 전송
    console.error('Logging to error service:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context
    })
  } else {
    // 개발 환경에서는 콘솔에 상세 정보 출력
    console.group('🔴 Widget Error Boundary Caught Error')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Context:', context)
    console.groupEnd()
  }
}

export class EnhancedWidgetErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { widgetId, widgetType, onError, enableReporting = true } = this.props

    // 에러 정보 저장
    this.setState({
      errorInfo
    })

    // 에러 컨텍스트 생성
    const errorContext = {
      widgetId,
      widgetType,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    }

    // 에러 로깅
    if (enableReporting) {
      logErrorToService(error, errorInfo, errorContext)
    }

    // 커스텀 에러 핸들러 실행
    if (onError) {
      onError(error, errorInfo)
    }

    // 자동 복구 시도 (단순 렌더링 에러인 경우)
    if (this.state.retryCount < this.maxRetries && this.shouldAutoRetry(error)) {
      this.scheduleAutoRetry()
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  shouldAutoRetry(error: Error): boolean {
    // 네트워크 에러나 청크 로딩 실패 등 일시적인 에러인 경우 자동 재시도
    const temporaryErrors = [
      'ChunkLoadError',
      'NetworkError',
      'TimeoutError',
      'Failed to fetch'
    ]
    
    return temporaryErrors.some(errorType => 
      error.message.includes(errorType) || 
      error.name.includes(errorType)
    )
  }

  scheduleAutoRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000) // Exponential backoff
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry()
    }, delay)
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRecovering: true
    }))

    // 복구 상태를 잠시 후 해제
    setTimeout(() => {
      this.setState({ isRecovering: false })
    }, 100)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    })
  }

  render() {
    const { hasError, error, errorInfo, retryCount, isRecovering } = this.state
    const { children, fallback, widgetType, className } = this.props

    // 복구 중인 경우 로딩 표시
    if (isRecovering) {
      return (
        <div className={cn(
          "flex items-center justify-center h-full p-6 bg-gray-50 rounded-lg",
          "animate-pulse",
          className
        )}>
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      )
    }

    // 에러 발생 시
    if (hasError && error) {
      // 커스텀 fallback이 제공된 경우
      if (fallback) {
        return <>{fallback}</>
      }

      // 기본 에러 UI
      return (
        <div className={cn(
          "flex flex-col items-center justify-center h-full p-6",
          "bg-white rounded-lg border-2 border-red-100",
          "min-h-[200px]",
          className
        )}>
          <div className="text-center max-w-sm">
            {/* 에러 아이콘 */}
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-red-50 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>

            {/* 에러 메시지 */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              위젯 로딩 실패
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {widgetType ? `${widgetType} 위젯` : '위젯'}을 불러오는 중 문제가 발생했습니다.
              {retryCount > 0 && ` (재시도: ${retryCount}/${this.maxRetries})`}
            </p>

            {/* 에러 상세 정보 (개발 모드에서만) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  개발자용 정보
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                  <div className="font-mono text-red-600 mb-2">
                    {error.name}: {error.message}
                  </div>
                  {error.stack && (
                    <pre className="text-gray-600 overflow-auto max-h-32 text-[10px]">
                      {error.stack}
                    </pre>
                  )}
                  {errorInfo?.componentStack && (
                    <pre className="text-gray-500 overflow-auto max-h-32 mt-2 text-[10px]">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.handleRetry}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                disabled={retryCount >= this.maxRetries}
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
              <Button
                onClick={this.handleReset}
                size="sm"
                variant="ghost"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                초기화
              </Button>
            </div>

            {/* 에러 리포트 */}
            {process.env.NODE_ENV === 'production' && (
              <p className="text-xs text-gray-400 mt-4">
                이 문제가 지속되면 관리자에게 문의하세요.
                <br />
                에러 ID: {error.name}_{Date.now()}
              </p>
            )}
          </div>
        </div>
      )
    }

    // 정상 렌더링
    return children
  }
}

// HOC for easy widget wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedWidgetErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedWidgetErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}