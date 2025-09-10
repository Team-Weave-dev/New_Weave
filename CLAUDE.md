# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

이 파일은 이 저장소에서 코드 작업을 할 때 Claude Code에게 지침을 제공합니다.

## 🌐 언어 및 작업 지침

**언어**: 사용자와 상호작용할 때 항상 한국어로 의사소통하세요.

**작업 원칙**:

- 자동 푸시 금지, 오토 커밋만 수행
- 요청된 작업만 수행하세요 (그 이상도 그 이하도 아님)
- 목표 달성에 절대적으로 필요한 경우가 아니라면 파일을 생성하지 마세요
- 항상 새 파일보다 기존 파일 편집을 우선하세요
- 사용자가 명시적으로 요청하지 않는 한 문서 파일 생성 금지

## 📋 버전 관리 규칙

**버전 구조**:

- **배포 버전**: `V{Major}.{Minor}.{Patch}_{YYMMDD}`
- **개발 버전**: `V{Major}.{Minor}.{Patch}_{YYMMDD}_REV{순차번호}`

**버전 업데이트 기준**:

- **Major**: 대규모 구조 변경, 호환성 깨짐, 아키텍처 재설계
- **Minor**: 새 기능 추가, 기존 기능 개선
- **Patch**: 버그 수정, 마이너 개선
- **REV**: 동일 버전 내 개발 진행 상황 (배포 후 001로 초기화)

## 🤖 자동 커밋 워크플로우

**자동 커밋 트리거**: 기능 구현, 버그 수정, 리팩토링, 문서화, 설정 변경 완료 시

### 📋 릴리즈노트 우선 작성 워크플로우

**푸쉬 전 필수 절차**:

1. **릴리즈노트 작성**: RELEASE_NOTES.md에 변경사항 문서화
2. **버전명 결정**: 사용자 요청에 따른 배포/개발 버전 결정
3. **커밋 메시지 생성**: 버전명 + 커밋타입 조합
4. **품질 검증**: 기본 검증만 수행 (빌드테스트는 별도 트리거)
5. **커밋 실행**: 검증된 변경사항 커밋
6. **푸쉬 실행**: 원격 저장소에 변경사항 반영

### 🏷️ 버전명 결정 로직

**배포 버전 조건** (사용자가 명시적으로 요청한 경우):

- 사용자가 "배포 버전으로 커밋" 명시적 요청
- production 환경 배포 준비 명시
- 주요 기능 완성 및 릴리즈 준비 완료 요청
- 사용자 대면 기능 릴리즈 명시

**개발 버전 조건** (기본값):

- 일반적인 개발 진행
- 기능 구현 및 개선 작업
- 버그 수정 및 리팩토링
- 별도 요청이 없는 모든 작업

### 🔄 자동 버전명 생성

**배포 버전 형식**:

```
V{Major}.{Minor}.{Patch}_{YYMMDD}
예: V1.3.0_250827
```

**개발 버전 형식**:

```
V{Major}.{Minor}.{Patch}_{YYMMDD}_REV{순차번호}
예: V1.3.0_250827_REV003
```

**REV 번호 관리**:

- 동일 날짜 내 순차적으로 증가 (001, 002, 003...)
- 배포 버전 릴리즈 후 REV001로 초기화
- 개발 진행 상황을 명확하게 추적

**커밋 메시지 형식**:

```
[type](scope): [V{버전명}] [간단한 설명]

[상세 변경 내용]

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**커밋 메시지 예시**:

**배포 버전**:

```
feat(ui): [V1.3.0_250827] implement user dashboard enhancement

- Add responsive navigation system
- Implement advanced filtering options
- Optimize mobile user experience
- Complete accessibility compliance (WCAG 2.1 AA)

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**개발 버전**:

```
fix(api): [V1.3.0_250827_REV002] resolve authentication timeout issue

- Fix JWT token refresh mechanism
- Add retry logic for network failures
- Improve error handling in auth middleware
- Update API documentation

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

## 🚀 빌드테스트 트리거 명령어

**빌드테스트 실행 키워드**:

- "빌드 테스트 실행해줘"
- "npm run build 해줘"
- "빌드 확인 필요"
- "프로덕션 빌드 테스트"
- "배포 전 검증"

**기본 개발 워크플로우**: 빌드테스트 없이 기본 검증만 수행하여 빠른 개발 진행

## 🔧 Context7 MCP 사용 정책

**사용 승인 필요**: Context7 MCP는 사용자의 명시적 허가가 있을 때만 사용합니다.

**사용 조건**:

1. **빌드 오류 발생 시**: 컴파일 실패, 타입스크립트 오류, 라이브러리 호환성 문제
2. **사용자 명시적 허가**: "--c7" 플래그 또는 직접적인 MCP 사용 요청
3. **시스템적 해결 우선**: 내장 도구와 시스템적 접근법을 먼저 시도

**시스템화 중심 문제 해결**:

- 공식 문서 참조보다 **아키텍처적 해결책** 우선
- 근본적 시스템 설계 개선을 통한 **장기적 안정성** 확보
- 임시방편보다 **구조적 개선**을 통한 문제 해결

## 📋 이슈 추적 시스템

**이슈 번호 체계**: `ISSUE-{카테고리}-{번호}` (예: ISSUE-UI-001, ISSUE-BUILD-002)

**카테고리**: UI, ACC(접근성), PERF(성능), SEC(보안), API, BUILD

**심각도**: 🚨 Critical (시스템 중단) | ⚠️ Medium (기능 장애) | 🎨 Minor (개선사항)

### 이슈 문서화 필수 요소

1. **문제 분석** (4단계): 원인→배경→시스템영향→사용자영향
2. **해결 방안**: 시스템적 접근법 우선
3. **기술 상세**: 실제 코드 변경사항
4. **검증 완료**: 구체적 테스트 결과
5. **배포 영향**: 긴급도 및 영향 범위

### 릴리즈노트 구조 (example.md 기반)

**기본 구조**: 주요개선사항 → 이슈트래킹로그 → 통계 → 품질검증

**이슈별 5단계 분석**:

1. 🔍 **문제 분석** (4단계 세분화)
2. 🎯 **해결 방안** (시스템적 접근)
3. ✅ **검증 완료** (구체적 결과)
4. 💻 **기술 상세** (코드 변경사항)
5. 🚀 **배포 영향** (긴급도/범위/성능)

## 📌 세무 관리 시스템 Task 진행 규칙

**Task 문서 위치**: `/docs/tax-management-tasks.md`

### 자동 Task 진행 워크플로우

**기본 동작**: 특별한 지시가 없으면 TASK-001부터 순차적으로 작업 진행

1. **Task 시작**: 해당 Task ID와 작업 내용 명시
2. **작업 수행**: Dependencies 확인 후 구현
3. **테스트 실행**: Test Strategy에 따른 검증
4. **Task 완료**: 체크박스 체크 및 상태 업데이트
5. **진행 보고**: 완료된 Task와 다음 Task 안내

### Task 체크박스 업데이트 규칙

**작업 완료 시 체크박스 체크**:
```markdown
- [x] **TASK-001** | 데이터베이스 마이그레이션 실행
  - **Status**: `completed` ← pending에서 변경
```

**작업 중일 때 상태 표시**:
```markdown
- [ ] **TASK-002** | 샘플 데이터 삽입
  - **Status**: `in_progress` ← 현재 작업 중
```

### Task 진행 우선순위

1. **Dependencies 우선**: 선행 작업이 있는 Task는 대기
2. **Priority 고려**: critical > high > medium > low
3. **Phase 순서**: Phase 1 → Phase 2 → ... → Phase 6

### 진행 상황 자동 보고

각 Task 완료 시 자동으로:
- Phase별 진행률 업데이트
- 완료/진행중/대기 카운트 갱신
- 다음 작업 가능한 Task 식별

## 🔄 지속적 개선 프로세스

### 6단계 이슈 처리 절차

1. **즉시 기록**: RELEASE_NOTES.md에 이슈 추가
2. **4단계 분석**: 원인→배경→시스템영향→사용자영향
3. **시스템적 해결**: 구조적 개선 우선, 임시방편 병행
4. **회귀 테스트**: 동일 이슈 재발 방지
5. **적절한 버전**: 배포/개발 버전 결정 후 REV 번호 관리
6. **의미있는 커밋**: 버전명 포함한 Conventional Commits 형식

### 🔄 개선된 워크플로우 순서

**모든 변경사항 푸쉬 시**:

1. **릴리즈노트 작성** → RELEASE_NOTES.md 업데이트
2. **버전 결정** → 사용자 요청에 따른 배포/개발 버전 결정
3. **기본 검증** → 기본적인 문법 및 구조 확인
4. **커밋 생성** → [V버전명] 포함한 메시지
5. **푸쉬 실행** → git push origin main

### 🏗️ 별도 빌드테스트 트리거

**빌드테스트 실행 조건** (사용자 명시적 요청 시에만):

- 사용자가 "빌드 테스트 실행" 명시적 요청
- "npm run build 실행해줘" 직접 명령
- "빌드 확인 필요" 또는 "프로덕션 빌드 테스트" 언급
- 배포 전 최종 검증 단계에서 요청

**빌드테스트 워크플로우**:

1. **빌드 실행** → `npm run build` 또는 `yarn build`
2. **타입체크** → TypeScript 타입 검증
3. **린트 검사** → ESLint 규칙 준수 확인
4. **테스트 실행** → Jest/Vitest 단위 테스트
5. **결과 보고** → 빌드 성공/실패 및 상세 결과 리포트
6. **문제 해결** → 빌드 실패 시 이슈 분석 및 해결 방안 제시

### 품질 게이트 체크리스트

**기본 품질 확인** (모든 커밋 시):

- [ ] Critical 이슈 완전 해결
- [ ] 기본 문법 및 구조 검증
- [ ] 코드 일관성 확인

**빌드테스트 품질 확인** (사용자 요청 시):

- [ ] 빌드 성공 확인
- [ ] TypeScript 타입 검증 통과
- [ ] ESLint 규칙 준수
- [ ] 단위 테스트 통과
- [ ] 성능 지표 측정
- [ ] 접근성 테스트 (UI 변경 시)
- [ ] 크로스 브라우저 호환성

## 📝 커밋 메시지 가이드라인

**Context7 MCP 검증**: Conventional Commits 표준 기반

### 기본 구조

```
type(scope): [V{버전명}] description

[optional body]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**버전명 포함 규칙**:

- **배포 버전**: `[V1.3.0_250827]` 형식
- **개발 버전**: `[V1.3.0_250827_REV002]` 형식
- 모든 커밋 메시지에 버전명 필수 포함
- 버전명은 대괄호로 감싸서 명확하게 구분

### 커밋 타입 (Types)

- **`fix`**: 버그 수정 (ISSUE-XXX 해결)
- **`feat`**: 새 기능 추가
- **`refactor`**: 리팩토링 (기능 변경 없는 코드 개선)
- **`test`**: 테스트 추가/수정
- **`docs`**: 문서 수정
- **`style`**: 코드 포맷팅 (세미콜론, 들여쓰기 등)
- **`perf`**: 성능 개선
- **`ci`**: CI/CD 설정 변경
- **`chore`**: 빌드 스크립트, 패키지 매니저 등

### 스코프 (Scope) 가이드

- **`ui`**: UI 컴포넌트 관련
- **`auth`**: 인증/권한 관련
- **`api`**: API 및 백엔드 관련
- **`db`**: 데이터베이스 관련
- **`config`**: 설정 파일 관련
- **`deps`**: 의존성 관련
- **`accessibility`**: 접근성 관련

### 이슈 연동 규칙

**ISSUE 해결 시 필수 포함**:

```
fix(ui): [V1.2.3_250827_REV001] resolve component page runtime error

- Add 'use client' directive to fix Server Component serialization
- Resolves ISSUE-UI-001: Event handlers cannot be passed to Client Component props
- Ensure Next.js App Router architecture compliance

Closes #ISSUE-UI-001

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 커밋 메시지 최적화 팁

1. **제목 50자 이내**: 간결하고 명확하게
2. **현재형 사용**: "Fixed" 대신 "Fix"
3. **첫 글자 소문자**: "fix:" 이후 소문자로 시작
4. **명령형 어조**: "Add feature" 형태
5. **이슈 번호 포함**: ISSUE-XXX 형식으로 추적 가능하게

### 좋은 커밋 메시지 예시

```
feat(auth): [V1.4.0_250827] implement Google OAuth single sign-on

- Replace email/password authentication with Google OAuth
- Add GoogleSignInButton component with Supabase integration
- Update authentication flow for better user experience
- Remove deprecated email verification system

Resolves ISSUE-AUTH-001

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**자동 커밋 후 안내:**

```
✅ 개발 완료 및 커밋되었습니다!
```

## 📋 WEAVE 시스템 디자인 정책

### 🎯 핵심 원칙

#### 1. 중앙화 (Centralization)

- **단일 진실의 원천(Single Source of Truth)**
- **재사용 가능한 컴포넌트 우선**
- **중복 코드 제거**

#### 2. 시스템화 (Systematization)

- **일관된 패턴 적용**
- **예측 가능한 구조**
- **명확한 책임 분리**

#### 3. 표준 준수 (Standards Compliance)

- **기존 UI 컴포넌트 사용 필수**
- **글로벌 CSS 변수 활용**
- **Tailwind 디자인 시스템 준수**

### 🏗️ 아키텍처 규칙

#### 컴포넌트 계층 구조

```
src/
├── components/
│   ├── ui/              # 재사용 가능한 기본 UI 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   ├── dashboard/       # 대시보드 전용 컴포넌트
│   └── [feature]/       # 기능별 전용 컴포넌트
├── app/                 # Next.js App Router 페이지
└── lib/                 # 유틸리티 및 헬퍼 함수
```

#### 컴포넌트 사용 우선순위

1. **기존 UI 컴포넌트 사용** (`src/components/ui/`)
   - Card, Button, Input, Typography 등
2. **기존 컴포넌트 확장**
   - 필요시 props 추가로 확장
3. **새 컴포넌트 생성** (사용자 승인 필요)
   - 기존 컴포넌트로 불가능한 경우만
   - 반드시 사용자 확인 후 진행

### 🎨 스타일링 규칙

#### 필수 사용 요소

**Typography 컴포넌트**

```tsx
// ✅ 올바른 사용
<Typography variant="h1">제목</Typography>
<Typography variant="body1">본문</Typography>

// ❌ 잘못된 사용
<h1 className="text-2xl font-bold">제목</h1>
<p className="text-sm">본문</p>
```

**Card 컴포넌트**

```tsx
// ✅ 올바른 사용
<Card className="p-6">컨텐츠</Card>

// ❌ 잘못된 사용
<div className="bg-white rounded-lg shadow-sm p-6">컨텐츠</div>
```

**Button 컴포넌트**

```tsx
// ✅ 올바른 사용
<Button variant="primary">확인</Button>
<Button variant="outline">취소</Button>

// ❌ 잘못된 사용
<button className="px-4 py-2 bg-blue-600 text-white rounded">확인</button>
```

#### 색상 시스템

**글로벌 CSS 변수 (필수 사용)**

```css
/* 배경 색상 */
--bg-primary: 기본 배경
--bg-secondary: 보조 배경
--bg-tertiary: 3차 배경

/* 텍스트 색상 */
--txt-primary: 기본 텍스트
--txt-secondary: 보조 텍스트
--txt-tertiary: 3차 텍스트

/* 브랜드 색상 */
--weave-primary: 메인 브랜드 색상
--weave-primary-light: 밝은 브랜드 색상
--weave-secondary: 보조 브랜드 색상

/* 테두리 색상 */
--border-light: 밝은 테두리
--border-dark: 어두운 테두리
```

**Tailwind 클래스 사용법**

```tsx
// ✅ 올바른 사용 - CSS 변수 활용
<div className="bg-bg-primary text-txt-primary border-border-light">

// ❌ 잘못된 사용 - 하드코딩된 색상
<div className="bg-gray-50 text-gray-900 border-gray-200">
```

### 📐 표준 레이아웃 시스템

#### 필수 레이아웃 컴포넌트 사용

**PageContainer 컴포넌트** (모든 페이지에 필수 적용)

```tsx
import { WorkspacePageContainer, DataPageContainer, FormPageContainer } from '@/components/layout/PageContainer';

// 페이지 타입별 적용
<WorkspacePageContainer>  // 대시보드, AI 업무비서, 리마인더
<DataPageContainer>       // 프로젝트 (테이블/목록 위주)
<FormPageContainer>       // 설정, 사업자 조회 (폼 위주)
```

#### 표준 H1 헤더 구조

**아이콘 + 제목 패턴** (모든 페이지 공통)

```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="p-3 bg-weave-primary-light rounded-lg">
    <NavigationIcon className="w-6 h-6 text-weave-primary" />
  </div>
  <div>
    <Typography variant="h2" className="text-2xl mb-1 text-txt-primary">
      페이지 제목
    </Typography>
    <Typography variant="body1" className="text-txt-secondary">
      페이지 설명
    </Typography>
  </div>
</div>
```

**네비게이션 아이콘 매핑** (Navigation에서 사용하는 동일한 아이콘)

- 대시보드: `LayoutDashboard`
- 프로젝트: `Briefcase`
- AI 업무비서 & 하위페이지: `BrainCircuit`
- 리마인더: `Bell`
- 사업자 조회: `Search`
- 설정: `Settings`

#### 고정 레이아웃 규칙

**여백 시스템** (자동 적용됨)

```css
/* 좌우 고정 여백 - 콘텐츠 확장형 */
padding-x: px-12 (기본) → px-8 (모바일) ~ px-24 (대형화면)

/* 상하 고정 여백 */
padding-y: py-12 (기본) → py-8 (모바일) ~ py-24 (대형화면)

/* 최대 너비 제거 - 전체 화면 활용 */
max-width: 제한 없음 (콘텐츠가 사용 가능한 공간을 최대 활용)
```

### 🚫 금지 사항

#### 절대 금지

1. ❌ 인라인 스타일 사용
2. ❌ 하드코딩된 색상값 사용
3. ❌ 중복 컴포넌트 생성
4. ❌ 글로벌 스타일 무시
5. ❌ 무단 컴포넌트 생성
6. ❌ PageContainer 미사용
7. ❌ 네비게이션과 다른 아이콘 사용
8. ❌ max-width 직접 설정

#### 예외 처리

- 불가피한 경우 반드시 사용자 승인 필요
- 승인 시 이유를 코드 주석으로 명시

### 🔄 개발 프로세스

#### 기능 구현 전 체크리스트

- [ ] 기존 UI 컴포넌트 확인
- [ ] 글로벌 스타일 변수 확인
- [ ] 유사 기능 패턴 확인
- [ ] 재사용 가능성 검토

#### 새 컴포넌트 생성 프로세스

1. **필요성 검증**

   - 기존 컴포넌트로 불가능함을 증명
   - 3개 이상의 위치에서 재사용 예정

2. **사용자 승인**

   ```
   "새로운 [컴포넌트명] 컴포넌트가 필요합니다.
   이유: [구체적 이유]
   사용 예정 위치: [최소 3곳 명시]
   승인하시겠습니까?"
   ```

3. **컴포넌트 생성**
   - `/src/components/ui/` 디렉토리에 생성
   - Props 타입 정의 필수
   - 기본값 설정 필수

## 🚀 개발 명령어

### **핵심 개발 명령어**
```bash
# 개발 서버 시작
npm run dev               # Next.js 개발 서버 (http://localhost:3000)

# 빌드 및 프로덕션
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버 시작
npm run clean            # 빌드 산출물 정리

# 코드 품질 검사
npm run lint             # ESLint 검사
npm run lint:fix         # ESLint 오류 자동 수정  
npm run type-check       # TypeScript 타입 검사

# 분석
npm run analyze          # 번들 분석 (ANALYZE=true)
```

### **유지보수 명령어**
```bash
npm run audit:fix        # 보안 취약점 수정
npm test                 # 테스트 실행 (현재 성공 반환)
```

## 🏗️ 시스템 아키텍처

### **핵심 아키텍처 패턴**

**마스터-디테일 패턴**: 통합 상태 관리를 통한 중앙화된 프로젝트 관리
- `useProjectMasterDetail` 훅이 모든 프로젝트 상호작용 관리
- `view`와 `selected` 파라미터를 이용한 URL 기반 라우팅  
- 'list'와 'detail' 뷰 간 ViewMode 전환

**중앙화된 컴포넌트 시스템**: 
- 모든 UI 컴포넌트는 `src/components/ui/`에서 제공
- 일관된 테마를 위한 글로벌 CSS 변수 활용
- 레이아웃 일관성을 위한 PageContainer 사용 필수

**타입 안전 테이블 시스템**:
- `ProjectTableColumn`과 `ProjectTableRow` 인터페이스로 테이블 구조 정의
- 가시성, 너비, 정렬, 필터링을 포함한 칼럼 설정
- 60fps 최적화된 고성능 칼럼 리사이징

### **핵심 상태 관리**

**프로젝트 테이블 설정**:
```typescript
interface ProjectTableConfig {
  columns: ProjectTableColumn[];     // 칼럼 정의
  filters: TableFilterState;         // 검색 및 필터링
  sort: TableSortState;             // 정렬 설정  
  pagination: PaginationState;       // 페이지 관리
}
```

**통합 프로젝트 상태**:
- `useProjectMasterDetail`을 통한 단일 진실의 원천
- 브라우저 네비게이션과 URL 동기화
- 컴포넌트 간 상태 공유

### **AI 통합 아키텍처**

**서비스 레이어**: `/src/lib/services/`에 모든 비즈니스 로직 포함
- `chatService.ts` - AI 대화 관리
- `supabase/` - 타입 인터페이스를 갖춘 데이터베이스 서비스 레이어
- `rag/` - 문서 처리를 위한 RAG 파이프라인

**AI 컴포넌트**: `/src/components/ai-assistant/`의 전문화된 컴포넌트
- 컨텍스트 인식 채팅 인터페이스
- 문서 업로드 및 처리
- 템플릿 생성 시스템

### **기술 스택**
- **프레임워크**: Next.js 14.2.32 (App Router 사용)
- **언어**: 엄격한 타입 검사를 갖춘 TypeScript
- **스타일링**: 커스텀 디자인 시스템을 갖춘 Tailwind CSS
- **UI 컴포넌트**: Lucide React 아이콘 + 커스텀 컴포넌트 라이브러리
- **데이터베이스**: Supabase (V2.0.0에서 계획됨)
- **AI 통합**: 다중 AI 공급자 지원
- **개발 환경**: ESLint, TypeScript, Vercel 배포
