'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  children: ReactNode
  widgetId?: string
  widgetType?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Widget loading error:', {
      widgetId: this.props.widgetId,
      widgetType: this.props.widgetType,
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    // 페이지를 새로고침하지 않고 위젯만 다시 로드
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            위젯 로딩 실패
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
            {this.props.widgetType ? `${this.props.widgetType} 위젯을` : '위젯을'} 불러오는 중 문제가 발생했습니다.
          </p>
          {this.state.error && (
            <details className="mb-4 text-xs text-gray-500 dark:text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                오류 상세 정보
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-left overflow-auto max-w-full">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <Button
            onClick={this.handleRetry}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}