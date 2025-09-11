import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock 사용자 데이터 (실제로는 데이터베이스 사용)
const mockUsers = [
  {
    id: '1',
    email: 'test@example.com',
    password: 'password123', // 실제로는 해시된 비밀번호 사용
    name: '테스트 사용자',
    role: 'user'
  },
  {
    id: '2',
    email: 'admin@example.com',
    password: 'admin123',
    name: '관리자',
    role: 'admin'
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 간단한 인증 로직 (실제로는 보안 강화 필요)
    const user = mockUsers.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 세션 생성 (실제로는 JWT 또는 세션 토큰 사용)
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일
    };

    // 쿠키 설정
    const cookieStore = await cookies();
    cookieStore.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7일
    });

    // 사용자 정보 반환 (비밀번호 제외)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      message: '로그인 성공'
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}