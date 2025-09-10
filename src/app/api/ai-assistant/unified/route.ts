/**
 * 통합 AI 어시스턴트 API 엔드포인트
 * 모든 AI 요청을 처리하는 단일 진입점
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAIOrchestratorV3 } from '@/lib/ai/unifiedAIOrchestratorV3';

// 스트리밍 응답을 위한 헤더 설정
const headers = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

/**
 * POST 요청 처리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, sessionId, stream = false } = body;

    // 필수 파라미터 검증
    if (!message || !userId) {
      return NextResponse.json(
        { error: '메시지와 사용자 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    // 통합 AI 오케스트레이터 V3 초기화 (Phase 4: 최종)
    const orchestrator = new UnifiedAIOrchestratorV3();

    // 스트리밍 응답 처리
    if (stream) {
      const encoder = new TextEncoder();
      
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            // 의도 분석 시작 알림
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'status', 
                content: 'analyzing' 
              })}\n\n`)
            );

            // 메시지 처리 (Phase 3: 동적 컨텍스트, 학습, 개인화)
            const response = await orchestrator.processMessage(
              message,
              userId,
              sessionId,
              { stream: true, chatHistory: [] }
            );

            // 소스 정보 전송
            if (response.sources && response.sources.length > 0) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'sources', 
                  content: response.sources 
                })}\n\n`)
              );
            }

            // 응답 내용을 청크로 분할하여 전송
            const chunks = response.content.match(/.{1,100}/g) || [];
            for (const chunk of chunks) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'content', 
                  content: chunk 
                })}\n\n`)
              );
              
              // 자연스러운 스트리밍을 위한 딜레이
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            // 제안 사항 전송
            if (response.suggestions && response.suggestions.length > 0) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'suggestions', 
                  content: response.suggestions 
                })}\n\n`)
              );
            }

            // 메타데이터 전송
            if (response.metadata) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'metadata', 
                  content: response.metadata 
                })}\n\n`)
              );
            }

            // 완료 신호
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'done', 
                content: true 
              })}\n\n`)
            );

            controller.close();
          } catch (error) {
            console.error('스트리밍 중 오류:', error);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'error', 
                content: 'AI 응답 생성 중 오류가 발생했습니다.' 
              })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(customReadable, { headers });
    }

    // 일반 응답 처리 (Phase 3: 동적 컨텍스트, 학습, 개인화)
    const response = await orchestrator.processMessage(
      message,
      userId,
      sessionId,
      { stream: false, chatHistory: [] }
    );

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI 처리 오류:', error);
    return NextResponse.json(
      { error: 'AI 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}