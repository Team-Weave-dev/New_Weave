/**
 * AI 시스템 상태 API 엔드포인트
 * 성능 모니터링 및 시스템 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAIOrchestratorV3 } from '@/lib/ai/unifiedAIOrchestratorV3';

/**
 * GET 요청 처리 - 시스템 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    const orchestrator = new UnifiedAIOrchestratorV3();
    const status = orchestrator.getSystemStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('시스템 상태 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '시스템 상태를 조회할 수 없습니다.'
      },
      { status: 500 }
    );
  }
}

/**
 * POST 요청 처리 - 캐시 정리 등 관리 작업
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;
    
    const orchestrator = new UnifiedAIOrchestratorV3();
    
    switch (action) {
      case 'clear-cache':
        await orchestrator.clearCache(userId);
        return NextResponse.json({
          success: true,
          message: '캐시가 정리되었습니다.'
        });
        
      case 'get-status':
        const status = orchestrator.getSystemStatus();
        return NextResponse.json({
          success: true,
          status
        });
        
      default:
        return NextResponse.json(
          {
            success: false,
            error: '알 수 없는 작업입니다.'
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('시스템 관리 작업 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '작업을 수행할 수 없습니다.'
      },
      { status: 500 }
    );
  }
}