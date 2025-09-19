# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🌐 언어 설정
**한국어로 의사소통하세요.**

## 📋 TASK 기반 개발 워크플로우

### 현재 진행 중인 프로젝트
**iOS 스타일 위젯 편집 시스템** - [`docs/ios-style-widget-edit-tasks.md`](./docs/ios-style-widget-edit-tasks.md) 참조

### TASK 작업 규칙
1. **TASK 문서 확인**: `docs/ios-style-widget-edit-tasks.md`의 태스크 목록 참조  ⚠️ **현재 작업 문서**
2. **순차적 진행**: Task ID 순서대로 작업 (IOSE-001부터 시작)
3. **완료 표시**: 각 태스크 완료 시 체크박스 `[x]` 표시
4. **E2E 테스트**: 각 태스크 완료 후 Playwright MCP로 E2E 테스트 실행
5. **빌드 테스트**: E2E 테스트 통과 후 `npm run build` 실행
6. **상태 업데이트**: Status를 `TODO` → `IN_PROGRESS` → `DONE`으로 변경

### 태스크 완료 시 자동 실행
```bash
# 1. 태스크 체크박스 완료 표시
[ ] → [x]

# 2. E2E 테스트 실행 (Playwright MCP 사용)
# - 개발 서버 실행 상태에서 테스트
# - 페이지 로드 및 기능 동작 확인
# - 오류 발견 시 즉시 수정

# 3. 빌드 테스트 자동 실행
npm run build

# 4. 빌드 성공 시 커밋
git add .
git commit -m "feat(dashboard): [태스크ID] 완료"
```

## 🔐 테스트 계정 정보

### 로그인 정보
```
ID: test@example.com
PW: test123456
```
- E2E 테스트 시 이 계정을 사용하여 로그인
- 대시보드 및 모든 기능에 접근 가능

## 🚀 개발 명령어

### 필수 명령어
```bash
npm run dev        # 개발 서버 시작 (포트 3001)
npm run build      # 프로덕션 빌드 (태스크 완료마다 자동 실행)
npm run lint       # 코드 품질 검사
npm run type-check # TypeScript 타입 검사
```

## 🏗️ 프로젝트 아키텍처

### 기술 스택
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Variables
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI API
- **UI Components**: 중앙화된 디자인 시스템

### 핵심 디렉토리
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # 대시보드 페이지
│   └── (auth)/           # 인증 관련 페이지
├── components/
│   ├── ui/               # 중앙화된 기본 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Typography.tsx
│   │   └── ...
│   ├── dashboard/        # 대시보드 위젯 시스템
│   │   ├── widgets/      # 개별 위젯 컴포넌트
│   │   ├── templates/    # 템플릿 시스템
│   │   └── ...
│   └── layout/           # 레이아웃 컴포넌트
├── lib/
│   ├── dashboard/        # 대시보드 서비스
│   ├── stores/          # Zustand 스토어
│   └── theme/           # 테마 및 디자인 토큰
└── styles/              # 글로벌 스타일
```

### 아키텍처 패턴
1. **컴포넌트 아키텍처**: Atomic Design 원칙 적용
2. **상태 관리**: Zustand를 통한 중앙화된 상태 관리
3. **데이터 흐름**: 
   - Client → API Routes → Supabase (복잡한 로직)
   - Client → Supabase RLS (단순 CRUD)
4. **위젯 시스템**: Registry Pattern + Lazy Loading
5. **디자인 시스템**: CSS Variables + Tailwind 유틸리티

## 📝 릴리즈노트 작성 규칙

### 변경사항 기록
- **위치**: `RELEASE_NOTES.md` 파일
- **시점**: 중요한 변경사항 발생 즉시
- **형식**: 버전명, 변경 내용, 이슈 해결 내역

### 버전 체계
- **배포 버전**: `V{Major}.{Minor}.{Patch}_{YYMMDD}` (일반 작업)
- **개발 버전**: `V{Major}.{Minor}.{Patch}_{YYMMDD}_REV{순차번호}` (사용자 요청 시)

## 🔐 데이터베이스 접근 전략 (하이브리드)

### 기본 원칙
**Supabase RLS는 최소화하고 API Routes를 적극 활용하는 하이브리드 전략 적용**

### 📗 RLS 직접 호출 (단순 CRUD)
```typescript
// 공개 데이터 조회
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('is_published', true);

// 개인 데이터 (RLS가 자동으로 user_id 체크)
const { data: myBookmarks } = await supabase
  .from('bookmarks')
  .select('*');
```

**사용 케이스:**
- 단순 데이터 조회 (SELECT)
- 개인 데이터 CRUD (user_id 기반)
- 공개 데이터 읽기
- 실시간 구독 (Realtime)

### 📘 API Routes 사용 (복잡한 로직)
```typescript
// 복잡한 비즈니스 로직이 필요한 경우
export async function POST(request) {
  // 1. 권한 검증
  // 2. 여러 테이블 업데이트
  // 3. 외부 API 호출
  // 4. 트랜잭션 처리
}
```

**사용 케이스:**
- 복잡한 비즈니스 로직
- 다중 테이블 트랜잭션
- 외부 API 통합
- 데이터 검증 및 변환
- 권한 체크가 복잡한 경우
- 로깅 및 감사 필요 시

### 구현 가이드라인
1. **기본적으로 API Routes 우선 고려**
2. **단순 CRUD만 RLS 직접 호출**
3. **보안이 중요한 작업은 반드시 API Routes**
4. **트랜잭션이 필요한 경우 API Routes 필수**

## ⚠️ 중요 원칙

### 작업 원칙
- ✅ 요청된 작업만 수행
- ✅ 기존 파일 편집 우선
- ✅ TASK 기반 순차 작업
- ❌ 불필요한 파일 생성 금지
- ❌ 무단 컴포넌트 생성 금지
- ❌ 자동 푸시 금지 (커밋만 수행)

### 품질 보증
- 각 태스크 완료 후 E2E 테스트 (Playwright MCP)
- E2E 테스트 통과 후 빌드 테스트
- TypeScript 타입 안전성 확보
- ESLint 규칙 준수
- 오류 발견 시 즉시 수정 후 재테스트

## 📚 참고 문서
- **현재 작업 태스크**: [`docs/ios-style-widget-edit-tasks.md`](./docs/ios-style-widget-edit-tasks.md) ⚠️ **iOS 스타일 편집 시스템 구현 중**
- **시스템 설계서**: [`docs/ios-style-widget-edit-system-design.md`](./docs/ios-style-widget-edit-system-design.md) - iOS 스타일 아키텍처 설계
- **이전 작업 태스크 (완료)**:
  - [`docs/dashboard-widget-edit-mode-improvement-tasks.md`](./docs/dashboard-widget-edit-mode-improvement-tasks.md) - 편집모드 개선
  - [`docs/dashboard-widget-improvement-tasks.md`](./docs/dashboard-widget-improvement-tasks.md) - 위젯 시스템 개선
  - [`docs/dashboard-widget-tasks.md`](./docs/dashboard-widget-tasks.md) - Phase 1-6 완료
- **시스템 설계**: [`docs/dashboard-widget-system-design.md`](./docs/dashboard-widget-system-design.md)
- **기술 스택**: Next.js 14, TypeScript, Tailwind CSS, @dnd-kit, Zustand, Framer Motion