'use client'

import React from 'react';

export function IOSStyleDashboardMinimal() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">iOS 스타일 대시보드 (임시)</h1>
        <p className="text-muted-foreground mt-2">
          무한 루프 문제를 해결하기 위한 최소 버전입니다.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 테스트 위젯 1 */}
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold mb-2">위젯 1</h3>
          <p className="text-sm text-muted-foreground">통계 대시보드</p>
          <div className="mt-4 h-24 bg-muted/20 rounded flex items-center justify-center">
            <span className="text-muted-foreground">내용</span>
          </div>
        </div>
        
        {/* 테스트 위젯 2 */}
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold mb-2">위젯 2</h3>
          <p className="text-sm text-muted-foreground">차트</p>
          <div className="mt-4 h-24 bg-muted/20 rounded flex items-center justify-center">
            <span className="text-muted-foreground">내용</span>
          </div>
        </div>
        
        {/* 테스트 위젯 3 */}
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold mb-2">위젯 3</h3>
          <p className="text-sm text-muted-foreground">알림</p>
          <div className="mt-4 h-24 bg-muted/20 rounded flex items-center justify-center">
            <span className="text-muted-foreground">내용</span>
          </div>
        </div>
        
        {/* 테스트 위젯 4 */}
        <div className="bg-card rounded-lg p-4 shadow-sm border col-span-1 md:col-span-2">
          <h3 className="font-semibold mb-2">위젯 4</h3>
          <p className="text-sm text-muted-foreground">캘린더</p>
          <div className="mt-4 h-32 bg-muted/20 rounded flex items-center justify-center">
            <span className="text-muted-foreground">캘린더 내용</span>
          </div>
        </div>
        
        {/* 테스트 위젯 5 */}
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold mb-2">위젯 5</h3>
          <p className="text-sm text-muted-foreground">상태</p>
          <div className="mt-4 h-32 bg-muted/20 rounded flex items-center justify-center">
            <span className="text-muted-foreground">상태 정보</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm">
          <strong>참고:</strong> 이것은 무한 루프 문제를 디버깅하기 위한 임시 버전입니다. 
          문제가 해결되면 전체 기능이 있는 iOS 스타일 대시보드로 복원됩니다.
        </p>
      </div>
    </div>
  );
}