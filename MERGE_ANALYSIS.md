# YHdev + h1 브랜치 머지 분석 보고서

## 📋 상황 요약

**목표**: YHdev와 h1 브랜치의 성공적인 통합
**현재**: merge 브랜치 배포 실패로 제대로 된 머지 상태 불분명
**핵심 문제**: Vercel 배포 시 `ReferenceError: self is not defined` SSR 에러

## 🔍 발견된 SSR 호환성 문제점

### 1. 주요 원인: @hello-pangea/dnd
- **에러**: `ReferenceError: self is not defined`
- **원인**: 드래그앤드롭 라이브러리가 브라우저 전용 객체 참조
- **영향**: 전체 애플리케이션 SSR 실패

### 2. h1 브랜치 아키텍처 문제

#### Excel 모듈 (`src/lib/browser-modules/excel-module.ts`)
```typescript
// 브라우저 전용 아키텍처 - CDN 동적 로딩 방식
const loadExcelModule = async () => {
  if (typeof window === 'undefined') return null;
  // window, document 객체 참조
};
```

#### PDF 서비스 (`src/lib/services/supabase/tax-report.service.ts`)
```typescript
// 직접 import - SSR에서 실행됨
import jsPDF from 'jspdf';
import 'jspdf-autotable';
```

#### 문서 내보내기 (`src/utils/document-export.ts`)
```typescript
// 브라우저 전용 라이브러리 직접 import
import { Document, Packer } from 'docx';
import { saveAs } from 'file-saver';
```

### 3. 제거된 브라우저 전용 패키지
- `@hello-pangea/dnd`
- `docx`
- `file-saver` 
- `html2canvas`
- `jspdf`
- `jspdf-autotable`
- `html-docx-js-typescript`

## 📊 브랜치별 실제 상태 (검증 완료)

### YHdev 브랜치 ✅
- **빌드 상태**: **성공** (경고만 있음)
- **특징**: 기본적인 Next.js App Router, SSR 호환
- **문제점**: `@hello-pangea/dnd` 포함 → **이것이 SSR 에러 원인**
- **고유 의존성**: 드래그앤드롭 라이브러리

### h1 브랜치 ⚠️  
- **빌드 상태**: **실패** (타입 에러, Database 스키마 불일치)
- **특징**: 세무 관리 시스템, 동적 로딩 아키텍처
- **고유 의존성**: `xlsx`, `zustand`, `recharts`, 테스트 도구
- **아키텍처**: 브라우저 전용 라이브러리를 `lazy-imports.tsx`로 동적 로딩

### merge 브랜치 (현재) ⚠️ **[2025-01-11 업데이트]**
- **SSR 문제**: **✅ 해결됨** (`@hello-pangea/dnd` 제거됨)  
- **현재 상태**: **❌ 타입 오류로 빌드 실패**
- **새로운 문제**: 컴포넌트 인터페이스 불일치 (ChatInterfaceV2.tsx)
- **발견된 타입 충돌**:
  - `Toast`: `showToast` vs `addToast` props 불일치
  - `MessageList`: `currentResponse`, `reactions` props 존재하지 않음
  - `MessageInput`: `onSend` vs `onSendMessage` props 불일치  
  - `ChatHistory`: `sessions` props 존재하지 않음
- **충돌 원인**: 두 브랜치의 컴포넌트가 서로 다른 API로 발전함

## 🚀 검증 기반 해결 방안

### ✅ Phase 1: 개별 브랜치 검증 완료
- **YHdev**: 빌드 성공, SSR 호환
- **h1**: 타입 에러 있지만 동적 로딩 아키텍처 확인

### ✅ Phase 2: 의존성 분석 완료  
**핵심 발견**:
- **문제 라이브러리**: YHdev의 `@hello-pangea/dnd` (제거됨)
- **h1의 브라우저 라이브러리**: `xlsx`, `recharts` (동적 로딩됨)

### ⚠️ Phase 4: 현재 진행상황 **[2025-01-11]**
**SSR 문제 해결 완료 → 타입 오류 단계 진입**

**완료된 작업**:
- ✅ `@hello-pangea/dnd` 의존성 제거
- ✅ SSR 호환성 문제 해결
- ✅ 기본적인 프로젝트 구조 통합

**현재 진행 중**:
- 🔄 ChatInterfaceV2.tsx 타입 오류 수정
  - Toast 컴포넌트: `addToast` → `showToast` 변경 완료
  - MessageInput: `onSend` → `onSendMessage` 변경 완료  
  - MessageList: `currentResponse`, `reactions` props 제거 완료
  - **남은 문제**: ChatHistory props 불일치

**다음 단계**:
1. ChatHistory 컴포넌트 props 수정
2. 빌드 성공 확인
3. 커밋 및 푸시 진행

### 📋 Phase 3: 해결 전략
**옵션 1: YHdev 기반 통합 (권장)**
```bash
# YHdev를 기준으로 h1 기능 통합
git checkout -b merge-clean YHdev
git merge h1 --no-commit

# @hello-pangea/dnd를 동적 로딩으로 변경
# h1의 타입 에러 수정
# 빌드 테스트
```

**옵션 2: h1 기반 통합**  
```bash
# h1을 기준으로 YHdev 기능 통합
git checkout -b merge-clean-h1 h1
git merge YHdev --no-commit

# h1의 타입 에러 먼저 수정
# @hello-pangea/dnd 제거 또는 동적 로딩
```

### 🔧 구체적 수정 사항
1. **드래그앤드롭 동적 로딩화**:
```typescript
const DragDropModule = dynamic(
  () => import('@hello-pangea/dnd'),
  { ssr: false }
);
```

2. **h1 타입 에러 수정**:
   - Database 스키마 동기화
   - 누락된 API 메서드 구현

## 🔧 예상 해결 방안

### 1. 드래그앤드롭 처리
```typescript
// 동적 import로 변경
const DragDropModule = dynamic(
  () => import('@hello-pangea/dnd'),
  { ssr: false }
);
```

### 2. Excel 모듈 통합
- h1의 CDN 기반 로딩 방식 유지
- YHdev의 SSR 요구사항과 호환되도록 조건부 처리

### 3. PDF/문서 서비스
- 브라우저에서만 실행되도록 가드 추가
- 서버 사이드에서는 대체 로직 제공

## 📝 검증 체크리스트

### YHdev 브랜치 검증
- [ ] `npm install` 성공
- [ ] `npm run build` 성공
- [ ] 의존성 목록 확인
- [ ] SSR 호환성 상태 확인

### h1 브랜치 검증
- [ ] `npm install` 성공
- [ ] `npm run build` 성공
- [ ] 브라우저 전용 모듈 목록 확인
- [ ] 아키텍처 패턴 분석

### 재머지 후 검증
- [ ] 로컬 빌드 성공
- [ ] Vercel 배포 성공
- [ ] 핵심 기능 동작 확인
- [ ] 성능 영향 측정

---

**결론**: 각 브랜치를 개별 검증한 후, 아키텍처 충돌점을 파악하여 체계적으로 재머지하는 것이 가장 효율적인 해결 방안입니다.