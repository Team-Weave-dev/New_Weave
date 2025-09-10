'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

/**
 * 카드 스켈레톤 로더
 */
export function CardSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-bg-secondary rounded-lg"></div>
        <div className="w-16 h-4 bg-bg-secondary rounded"></div>
      </div>
      <div className="h-8 bg-bg-secondary rounded mb-2"></div>
      <div className="h-4 bg-bg-secondary rounded w-2/3"></div>
      <div className="mt-4 pt-4 border-t border-border-light">
        <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
      </div>
    </Card>
  );
}

/**
 * 테이블 스켈레톤 로더
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse">
        {/* 헤더 */}
        <div className="bg-bg-secondary border-b border-border-light px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="h-4 bg-bg-tertiary rounded w-20"></div>
            <div className="h-4 bg-bg-tertiary rounded w-16"></div>
            <div className="h-4 bg-bg-tertiary rounded w-32"></div>
            <div className="h-4 bg-bg-tertiary rounded w-24 ml-auto"></div>
            <div className="h-4 bg-bg-tertiary rounded w-24"></div>
            <div className="h-4 bg-bg-tertiary rounded w-24"></div>
          </div>
        </div>

        {/* 행 */}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="border-b border-border-light px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="h-4 bg-bg-secondary rounded w-20"></div>
              <div className="h-6 bg-bg-secondary rounded-full w-12"></div>
              <div className="h-4 bg-bg-secondary rounded w-32"></div>
              <div className="h-4 bg-bg-secondary rounded w-24 ml-auto"></div>
              <div className="h-4 bg-bg-secondary rounded w-24"></div>
              <div className="h-4 bg-bg-secondary rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * 차트 스켈레톤 로더
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-bg-secondary rounded w-32"></div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-bg-secondary rounded"></div>
            <div className="h-8 w-20 bg-bg-secondary rounded"></div>
          </div>
        </div>
        <div 
          className="bg-bg-secondary rounded"
          style={{ height: `${height}px` }}
        >
          {/* 가짜 차트 바 */}
          <div className="flex items-end justify-around h-full p-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-6 bg-bg-tertiary rounded-t"
                style={{ 
                  height: `${Math.random() * 60 + 20}%`,
                  opacity: 0.5 + Math.random() * 0.5
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * 개요 페이지 스켈레톤
 */
export function TaxOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <ChartSkeleton />
    </div>
  );
}

/**
 * 거래 페이지 스켈레톤
 */
export function TaxTransactionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-bg-secondary rounded animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-bg-secondary rounded animate-pulse"></div>
          <div className="h-9 w-32 bg-bg-secondary rounded animate-pulse"></div>
          <div className="h-9 w-32 bg-bg-secondary rounded animate-pulse"></div>
        </div>
      </div>
      <TableSkeleton rows={10} />
    </div>
  );
}

/**
 * 리스트 아이템 스켈레톤
 */
export function ListItemSkeleton() {
  return (
    <div className="p-4 border-b border-border-light animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-5 bg-bg-secondary rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-bg-secondary rounded w-1/2"></div>
        </div>
        <div className="text-right">
          <div className="h-5 bg-bg-secondary rounded w-20 mb-1"></div>
          <div className="h-4 bg-bg-secondary rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}