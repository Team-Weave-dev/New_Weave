'use client';

import React from 'react';
import { Link2, Unlink, Briefcase, Building } from 'lucide-react';
import Typography from '@/components/ui/Typography';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';
import type { Project, Client } from '@/lib/services/supabase/project-matching.service';

interface ProjectConnectionIndicatorProps {
  transaction: Transaction;
  project?: Project | null;
  client?: Client | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
}

export default function ProjectConnectionIndicator({
  transaction,
  project,
  client,
  size = 'sm',
  showDetails = false,
  onClick
}: ProjectConnectionIndicatorProps) {
  // 크기별 스타일
  const sizeStyles = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // 연결 상태 확인
  const isConnected = transaction.project_id || project;
  const hasClient = transaction.client_id || client;

  if (!isConnected) {
    // 미연결 상태
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors ${sizeStyles[size]}`}
        title="프로젝트 미연결"
      >
        <Unlink className={iconSizes[size]} />
        {showDetails && <span>미연결</span>}
      </button>
    );
  }

  // 연결된 상태
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full transition-colors ${sizeStyles[size]} ${
        hasClient && project 
          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
      title={`${client?.name || '클라이언트'} - ${project?.name || '프로젝트'}`}
    >
      <Link2 className={iconSizes[size]} />
      
      {showDetails && (
        <>
          {hasClient && client && (
            <span className="flex items-center gap-1">
              <Building className={`${iconSizes[size]} opacity-70`} />
              <span className="max-w-[100px] truncate">
                {client.name}
              </span>
            </span>
          )}
          
          {project && (
            <>
              {hasClient && <span className="text-gray-400">|</span>}
              <span className="flex items-center gap-1">
                <Briefcase className={`${iconSizes[size]} opacity-70`} />
                <span className="max-w-[150px] truncate">
                  {project.name}
                </span>
              </span>
            </>
          )}
        </>
      )}
    </button>
  );
}

/**
 * 연동 상태 배지 컴포넌트
 */
export function ProjectConnectionBadge({
  connected,
  count = 0,
  size = 'sm'
}: {
  connected: boolean;
  count?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const sizeStyles = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-sm px-2.5 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (connected) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 ${sizeStyles[size]}`}>
        <Link2 className={iconSizes[size]} />
        <span className="font-medium">연결됨</span>
        {count > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-green-200 rounded-full text-xs font-semibold">
            {count}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-600 ${sizeStyles[size]}`}>
      <Unlink className={iconSizes[size]} />
      <span className="font-medium">미연결</span>
      {count > 0 && (
        <span className="ml-1 px-1.5 py-0.5 bg-gray-200 rounded-full text-xs font-semibold">
          {count}
        </span>
      )}
    </div>
  );
}

/**
 * 프로젝트 연동률 표시 컴포넌트
 */
export function ProjectConnectionStats({
  total,
  connected,
  className = ''
}: {
  total: number;
  connected: number;
  className?: string;
}) {
  const percentage = total > 0 ? Math.round((connected / total) * 100) : 0;
  
  // 색상 결정
  const getColor = () => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 20) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <Typography variant="body2" className="text-sm text-txt-secondary">
            프로젝트 연동률
          </Typography>
          <Typography variant="body2" className="text-sm font-semibold text-txt-primary">
            {connected} / {total}
          </Typography>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              percentage >= 80 ? 'bg-green-500' :
              percentage >= 60 ? 'bg-blue-500' :
              percentage >= 40 ? 'bg-yellow-500' :
              percentage >= 20 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className={`px-3 py-1.5 rounded-lg ${getColor()}`}>
        <Typography variant="body1" className="text-lg font-bold">
          {percentage}%
        </Typography>
      </div>
    </div>
  );
}

/**
 * 프로젝트 퀵 링크 컴포넌트
 */
export function ProjectQuickLink({
  project,
  client,
  onClick
}: {
  project?: Project | null;
  client?: Client | null;
  onClick?: () => void;
}) {
  if (!project) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-border-light rounded-lg hover:bg-bg-secondary transition-colors"
    >
      {client && (
        <>
          <Building className="w-4 h-4 text-txt-tertiary" />
          <Typography variant="body2" className="text-sm text-txt-secondary">
            {client.name}
          </Typography>
          <span className="text-gray-300">|</span>
        </>
      )}
      <Briefcase className="w-4 h-4 text-weave-primary" />
      <Typography variant="body2" className="text-sm font-medium text-txt-primary">
        {project.name}
      </Typography>
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
        project.status === 'completed' ? 'bg-green-100 text-green-700' :
        project.status === 'planning' ? 'bg-gray-100 text-gray-700' :
        'bg-red-100 text-red-700'
      }`}>
        {project.status === 'in_progress' ? '진행중' :
         project.status === 'completed' ? '완료' :
         project.status === 'planning' ? '계획중' : '취소'}
      </span>
    </button>
  );
}