import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './middleware/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로 (인증 없이 접근 가능)
  const publicPaths = [
    '/',           // 랜딩페이지
    '/home',       // 홈 화면
    '/login',      // 로그인
    '/signup',     // 회원가입
    '/auth/callback', // OAuth 콜백
  ];

  // 보호된 경로 (인증 필요)
  const protectedPaths = [
    '/dashboard',
    '/projects',
    '/invoices',
    '/documents',
    '/reminder',
    '/tax-management',
    '/chat',
    '/settings',
    '/ai-assistant',
    '/business-lookup',
    '/clients',
    '/payments',
    '/reminders',
    '/document-requests',
    '/templates',
  ];

  // 레거시 리다이렉트 매핑 - /clients를 /projects?tab=clients로 리다이렉트
  const redirectMap: Record<string, string> = {
    '/clients': '/projects?tab=clients', // 클라이언트 관리는 프로젝트 탭으로 통합
    '/reminders': '/reminder', // 리마인더 경로 정리
    '/document-requests': '/documents', // 문서 요청은 문서 관리로 통합
    '/templates': '/documents', // 템플릿은 문서 관리로 통합
    '/projects/settings': '/projects?tab=settings', // 프로젝트 설정도 탭으로 통합
  };

  // 레거시 경로 리다이렉트 처리
  if (redirectMap[pathname]) {
    return NextResponse.redirect(new URL(redirectMap[pathname], request.url));
  }

  // Supabase 인증 세션 업데이트
  const response = await updateSession(request);
  
  // 모의 데이터 모드에서는 모든 접근을 허용 (인증 우회)
  const isMockMode = process.env.USE_MOCK_DATA === 'true';
  
  // 세션 확인을 위해 쿠키에서 Supabase 토큰 확인
  // 모의 데이터 모드에서는 항상 세션이 있다고 간주
  const hasSession = isMockMode || request.cookies.getAll().some(cookie => 
    cookie.name.includes('sb-') && 
    cookie.name.includes('auth-token') && 
    cookie.value && 
    cookie.value !== 'null' && 
    cookie.value !== 'undefined'
  );

  // 보호된 경로에 인증 없이 접근 시 로그인 페이지로 리다이렉트
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  if (isProtectedPath && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 로그인한 사용자가 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
  if (hasSession && (pathname === '/login' || pathname === '/signup')) {
    // redirectTo 파라미터가 있으면 해당 경로로, 없으면 대시보드로
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청 경로에 매칭:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘 파일)
     * - public 폴더
     * - api 라우트
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
};