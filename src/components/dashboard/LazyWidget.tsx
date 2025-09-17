'use client';

import { ReactElement, useRef } from 'react';
import { useLazyLoad } from '@/hooks/useIntersectionObserver';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

interface LazyWidgetProps {
  children: ReactElement;
  height?: number | string;
  placeholder?: ReactElement;
  className?: string;
}

export function LazyWidget({ 
  children, 
  height = 300,
  placeholder,
  className = ''
}: LazyWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useLazyLoad(ref);

  return (
    <div ref={ref} className={className} style={{ minHeight: height }}>
      {isVisible ? (
        children
      ) : (
        placeholder || (
          <Card className="h-full flex items-center justify-center animate-pulse">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto" />
              <Typography variant="caption" className="text-gray-400">
                위젯 로딩 중...
              </Typography>
            </div>
          </Card>
        )
      )}
    </div>
  );
}