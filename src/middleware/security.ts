import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateOrigin, rateLimiter, validateCSRFToken } from '@/lib/utils/security';

/**
 * Next.js 보안 미들웨어
 * TASK-054: 보안 감사 - 미들웨어 레벨 보안
 */

// IP 블랙리스트 (실제로는 Redis나 DB에서 관리)
const ipBlacklist = new Set<string>();

// 의심스러운 패턴 감지
const suspiciousPatterns = [
  /(\.\.|\/\/|\\\\)/g, // 경로 탐색
  /(<script|<iframe|javascript:|onerror=|onclick=)/gi, // XSS
  /(union.*select|drop.*table|delete.*from|insert.*into)/gi, // SQL Injection
  /(\$\{|\$\(|eval\(|exec\()/gi, // 코드 실행
];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // 1. IP 블랙리스트 체크
  if (ipBlacklist.has(ip)) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // 2. 레이트 리미팅
  if (!rateLimiter.checkLimit(ip)) {
    // 과도한 요청 시 블랙리스트 추가
    ipBlacklist.add(ip);
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    });
  }
  
  // 3. Origin 검증 (POST, PUT, DELETE 요청)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    if (origin && !validateOrigin(origin)) {
      return new NextResponse('Invalid Origin', { status: 403 });
    }
    
    // CSRF 토큰 검증
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionToken = request.cookies.get('csrf_token')?.value;
    
    if (csrfToken && sessionToken && !validateCSRFToken(csrfToken, sessionToken)) {
      return new NextResponse('Invalid CSRF Token', { status: 403 });
    }
  }
  
  // 4. 의심스러운 패턴 감지
  const url = pathname + searchParams.toString();
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      // 보안 로그 기록
      console.warn(`Suspicious pattern detected from ${ip}: ${url}`);
      return new NextResponse('Bad Request', { status: 400 });
    }
  }
  
  // 5. 보안 헤더 추가
  const response = NextResponse.next();
  
  // 보안 헤더 설정
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HTTPS 환경에서만 HSTS 헤더 추가
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

// 미들웨어 적용 경로 설정
export const config = {
  matcher: [
    // API 라우트
    '/api/:path*',
    // 인증이 필요한 페이지
    '/dashboard/:path*',
    // 정적 파일 제외
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};