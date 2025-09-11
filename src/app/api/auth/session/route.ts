import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: '세션이 없습니다.' },
        { status: 401 }
      );
    }

    // 세션 데이터 파싱
    const sessionData = JSON.parse(sessionCookie.value);
    
    // 만료 시간 체크
    if (new Date(sessionData.expiresAt) < new Date()) {
      cookieStore.delete('session');
      return NextResponse.json(
        { error: '세션이 만료되었습니다.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      user: {
        id: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name,
        role: sessionData.role
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: '세션 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}