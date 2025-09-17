/**
 * RealtimeTestWidget - 실시간 업데이트 테스트용 위젯
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { useWidgetRealtime } from '@/lib/dashboard/realtime/useRealtime';
import { RealtimeEvent, ConnectionState } from '@/lib/dashboard/realtime/RealtimeManager';
import { Activity, WifiOff, Wifi, RefreshCw } from 'lucide-react';
import type { WidgetProps } from '@/types/dashboard';

interface UpdateData {
  value: number;
  message?: string;
  timestamp: number;
}

export function RealtimeTestWidget({ id: widgetId }: WidgetProps) {
  const [updates, setUpdates] = useState<UpdateData[]>([]);
  const [updateCount, setUpdateCount] = useState(0);
  
  const {
    isConnected,
    connectionState,
    lastUpdate,
    subscribe,
    broadcast,
    connect,
    disconnect
  } = useWidgetRealtime<any>(widgetId);

  // 실시간 업데이트 구독
  useEffect(() => {
    const unsubscribe = subscribe('update', (event: RealtimeEvent<any>) => {
      console.log('Received realtime update:', event);
      
      // widgetId가 일치하는 업데이트만 처리
      if (event.payload?.widgetId === widgetId && event.payload?.data) {
        const updateData = event.payload.data as UpdateData;
        setUpdates(prev => [...prev.slice(-4), updateData]);
        setUpdateCount(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [subscribe, widgetId]);

  // 테스트 업데이트 전송
  const sendTestUpdate = () => {
    const testData: UpdateData = {
      value: Math.floor(Math.random() * 100),
      message: `Test update ${updateCount + 1}`,
      timestamp: Date.now()
    };
    
    broadcast(testData);
  };

  // 연결 상태에 따른 아이콘
  const ConnectionIcon = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return <Wifi className="h-4 w-4 text-[var(--color-status-success)]" />;
      case ConnectionState.RECONNECTING:
        return <RefreshCw className="h-4 w-4 text-[var(--color-status-warning)] animate-spin" />;
      case ConnectionState.ERROR:
      case ConnectionState.DISCONNECTED:
        return <WifiOff className="h-4 w-4 text-[var(--color-status-error)]" />;
      default:
        return <Activity className="h-4 w-4 text-[var(--color-text-secondary)]" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--color-brand-primary)]" />
            <Typography variant="h6">실시간 업데이트 테스트</Typography>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionIcon />
            <Typography 
              variant="caption" 
              className={`${
                connectionState === ConnectionState.CONNECTED ? 'text-[var(--color-status-success)]' :
                connectionState === ConnectionState.RECONNECTING ? 'text-[var(--color-status-warning)]' :
                connectionState === ConnectionState.ERROR ? 'text-[var(--color-status-error)]' :
                'text-[var(--color-text-secondary)]'
              }`}
            >
              {connectionState}
            </Typography>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {/* 연결 상태 정보 */}
        <div className="p-3 rounded-lg bg-[var(--color-surface-elevated)]">
          <Typography variant="caption" className="text-[var(--color-text-secondary)]">
            위젯 ID: {widgetId}
          </Typography>
          <Typography variant="body2" className="mt-1">
            총 업데이트: {updateCount}회
          </Typography>
          {lastUpdate && (
            <Typography variant="caption" className="text-[var(--color-text-secondary)] mt-1">
              마지막 업데이트: {new Date(lastUpdate.timestamp || Date.now()).toLocaleTimeString()}
            </Typography>
          )}
        </div>

        {/* 업데이트 목록 */}
        <div className="space-y-2">
          <Typography variant="body2" className="font-medium">
            최근 업데이트
          </Typography>
          {updates.length === 0 ? (
            <div className="p-3 rounded-lg bg-[var(--color-surface)] text-center">
              <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                아직 업데이트가 없습니다
              </Typography>
            </div>
          ) : (
            <div className="space-y-2">
              {updates.map((update, index) => (
                <div 
                  key={index}
                  className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]"
                >
                  <div className="flex justify-between items-center">
                    <Typography variant="body2">
                      값: {update.value}
                    </Typography>
                    <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </Typography>
                  </div>
                  {update.message && (
                    <Typography variant="caption" className="text-[var(--color-text-secondary)] mt-1">
                      {update.message}
                    </Typography>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="p-4 border-t border-[var(--color-border)] space-y-2">
        <Button 
          onClick={sendTestUpdate}
          disabled={!isConnected}
          className="w-full"
        >
          테스트 업데이트 전송
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={connect}
            disabled={isConnected}
            className="flex-1"
          >
            연결
          </Button>
          <Button 
            variant="outline"
            onClick={disconnect}
            disabled={!isConnected}
            className="flex-1"
          >
            연결 해제
          </Button>
        </div>
      </div>
    </Card>
  );
}