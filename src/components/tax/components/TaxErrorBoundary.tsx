'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TaxErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Tax component error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-red-100 rounded-full inline-flex mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <Typography variant="h3" className="text-xl font-semibold text-txt-primary mb-2">
              오류가 발생했습니다
            </Typography>
            
            <Typography variant="body1" className="text-txt-secondary mb-4">
              세무 데이터를 불러오는 중 문제가 발생했습니다.
              잠시 후 다시 시도해주세요.
            </Typography>

            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-txt-tertiary hover:text-txt-secondary">
                  오류 상세 정보
                </summary>
                <pre className="mt-2 p-3 bg-bg-secondary rounded text-xs text-txt-tertiary overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <Button
              variant="primary"
              onClick={this.handleReset}
              className="mx-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * 에러 상태 컴포넌트
 */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  error?: Error | string;
}

export function ErrorState({
  title = '오류가 발생했습니다',
  message = '데이터를 불러오는 중 문제가 발생했습니다.',
  onRetry,
  showDetails = false,
  error
}: ErrorStateProps) {
  return (
    <Card className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="p-4 bg-orange-100 rounded-full inline-flex mb-4">
          <AlertCircle className="w-8 h-8 text-orange-600" />
        </div>
        
        <Typography variant="h3" className="text-xl font-semibold text-txt-primary mb-2">
          {title}
        </Typography>
        
        <Typography variant="body1" className="text-txt-secondary mb-4">
          {message}
        </Typography>

        {showDetails && error && (
          <div className="mb-4 p-3 bg-bg-secondary rounded text-left">
            <Typography variant="body2" className="text-txt-tertiary text-xs font-mono">
              {typeof error === 'string' ? error : error.message}
            </Typography>
          </div>
        )}

        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        )}
      </div>
    </Card>
  );
}