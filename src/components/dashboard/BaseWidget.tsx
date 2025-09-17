'use client';

import React, { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

export interface BaseWidgetProps {
  id: string;
  title?: string;
  config?: any;
  className?: string;
  onConfigChange?: (config: any) => void;
  onRemove?: () => void;
}

interface BaseWidgetContainerProps extends BaseWidgetProps {
  children: ReactNode;
  headerExtra?: ReactNode;
}

export const BaseWidget: React.FC<BaseWidgetContainerProps> = ({
  id,
  title,
  children,
  className = '',
  headerExtra,
  onRemove
}) => {
  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {title && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Typography variant="h6" className="font-semibold">
            {title}
          </Typography>
          {headerExtra && <div>{headerExtra}</div>}
        </div>
      )}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </Card>
  );
};

export default BaseWidget;