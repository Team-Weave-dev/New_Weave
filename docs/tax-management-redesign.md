# 세무 관리 시스템 개편 설계서

## 📋 개요

세무 관리 시스템을 사용자 친화적이고 실무 중심적인 인터페이스로 개편합니다.

### 핵심 목표
- ✅ 탭 구조 단순화 (5개 → 3개)
- ✅ 매입매출 상세 관리 기능 구현
- ✅ 프로젝트 연동 데이터 통합
- ✅ 반응형 디자인 (데스크톱/모바일 최적화)

## 🏗️ 시스템 아키텍처

### 1. 데이터베이스 스키마 확장

#### 1.1 매입매출 거래 테이블 (tax_transactions)
```sql
CREATE TABLE tax_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 거래 기본 정보
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('매입', '매출')),
    
    -- 프로젝트/클라이언트 연동
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- 거래처 정보
    supplier_name VARCHAR(255) NOT NULL,  -- 공급자명/클라이언트명
    business_number VARCHAR(50),          -- 사업자번호
    
    -- 금액 정보
    supply_amount DECIMAL(15, 2) NOT NULL,     -- 공급가액
    vat_amount DECIMAL(15, 2) DEFAULT 0,       -- 부가세 (10%)
    withholding_tax_3_3 DECIMAL(15, 2) DEFAULT 0,  -- 원천세 3.3%
    withholding_tax_6_8 DECIMAL(15, 2) DEFAULT 0,  -- 원천세 6.8%
    total_amount DECIMAL(15, 2) NOT NULL,      -- 합계(입금액)
    
    -- 분류 및 상태
    category VARCHAR(100),                     -- 거래 카테고리
    description TEXT,                          -- 상세 설명
    status VARCHAR(50) DEFAULT 'active',      -- 상태
    
    -- 증빙 자료
    document_url TEXT,                        -- 세금계산서/영수증 URL
    document_type VARCHAR(50),                -- 문서 유형
    
    -- 메타데이터
    metadata JSONB,
    
    -- 인덱스
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_user_date (user_id, transaction_date)
);
```

#### 1.2 월별 매출 집계 테이블 (tax_monthly_summary)
```sql
CREATE TABLE tax_monthly_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- 매출 정보
    total_sales DECIMAL(15, 2) DEFAULT 0,      -- 총 매출
    total_purchases DECIMAL(15, 2) DEFAULT 0,  -- 총 매입
    vat_payable DECIMAL(15, 2) DEFAULT 0,      -- 납부할 부가세
    
    -- 원천세 정보
    withholding_tax_collected DECIMAL(15, 2) DEFAULT 0,  -- 징수 원천세
    withholding_tax_paid DECIMAL(15, 2) DEFAULT 0,       -- 납부 원천세
    
    -- 집계 정보
    transaction_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, year, month)
);
```

### 2. UI/UX 컴포넌트 구조

#### 2.1 페이지 구조
```
/tax-management
├── 개요 (Overview)
│   ├── 연간 매출 예상 카드
│   ├── 당월 매출 예상 카드
│   └── 월별 매출 트렌드 차트
│
├── 매입매출 상세 (Transactions)
│   ├── 필터 툴바
│   ├── 엑셀형 데이터 테이블 (Desktop)
│   ├── 카드형 리스트 (Mobile)
│   └── 상세 페이지 모달
│
└── 세무 신고 (Tax Filing)
    └── 서비스 준비중 안내
```

#### 2.2 컴포넌트 계층 구조
```typescript
src/components/tax/
├── TaxOverview.tsx           // 개요 탭 컴포넌트
│   ├── SalesProjectionCard   // 매출 예상 카드
│   ├── MonthlyTrendChart     // 월별 트렌드 차트
│   └── TaxSummaryCards       // 요약 통계 카드
│
├── TaxTransactions.tsx        // 매입매출 상세 탭
│   ├── TransactionFilter     // 필터링 컴포넌트
│   ├── TransactionTable      // 데스크톱 테이블
│   ├── TransactionCards      // 모바일 카드 뷰
│   └── TransactionDetail     // 상세 모달
│
├── TaxFiling.tsx             // 세무 신고 탭
│   └── ComingSoonPlaceholder // 준비중 안내
│
└── shared/
    ├── TaxCalculator.tsx     // 세금 계산 유틸
    └── TaxFormatter.tsx      // 금액 포맷팅
```

### 3. API 서비스 레이어

#### 3.1 확장된 Tax Service
```typescript
// src/lib/services/supabase/tax-transactions.service.ts

export class TaxTransactionService {
  // 매입매출 거래 CRUD
  async createTransaction(data: TransactionInput): Promise<Transaction>
  async getTransactions(filters: TransactionFilters): Promise<Transaction[]>
  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction>
  async deleteTransaction(id: string): Promise<void>
  
  // 프로젝트 연동
  async linkToProject(transactionId: string, projectId: string): Promise<void>
  async getProjectTransactions(projectId: string): Promise<Transaction[]>
  
  // 집계 및 통계
  async getMonthlyStatistics(year: number, month: number): Promise<MonthlyStats>
  async getYearlyProjection(year: number): Promise<YearlyProjection>
  async getTransactionsByDateRange(start: Date, end: Date): Promise<Transaction[]>
  
  // 대량 작업
  async bulkImportTransactions(data: Transaction[]): Promise<ImportResult>
  async exportToExcel(filters: TransactionFilters): Promise<Blob>
}
```

### 4. 상태 관리 (Zustand)

```typescript
// src/store/taxStore.ts

interface TaxStore {
  // 거래 상태
  transactions: Transaction[]
  filters: TransactionFilters
  selectedTransaction: Transaction | null
  
  // 통계 상태
  monthlyStats: MonthlyStats | null
  yearlyProjection: YearlyProjection | null
  
  // 액션
  loadTransactions: (filters?: TransactionFilters) => Promise<void>
  createTransaction: (data: TransactionInput) => Promise<void>
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  setFilters: (filters: TransactionFilters) => void
  refreshStatistics: () => Promise<void>
}
```

## 📱 반응형 디자인 전략

### 1. 브레이크포인트
- **Mobile**: < 768px (카드 뷰)
- **Tablet**: 768px - 1024px (간소화된 테이블)
- **Desktop**: > 1024px (전체 기능 테이블)

### 2. 모바일 최적화
- 스와이프 제스처로 거래 삭제/편집
- 하단 시트 모달로 상세 정보 표시
- 플로팅 액션 버튼으로 거래 추가
- 무한 스크롤 페이지네이션

### 3. 데스크톱 최적화
- 엑셀형 인라인 편집
- 키보드 단축키 지원
- 다중 선택 및 일괄 작업
- 드래그 앤 드롭 파일 업로드

## 🔄 프로젝트 연동 시스템

### 1. 자동 연동 규칙
```typescript
interface AutoLinkingRule {
  // 클라이언트 기반 자동 매칭
  matchByClient: boolean
  
  // 날짜 범위 기반 매칭
  matchByDateRange: boolean
  
  // 금액 기반 매칭
  matchByAmount: boolean
  
  // 수동 확인 필요 여부
  requireConfirmation: boolean
}
```

### 2. 연동 워크플로우
1. 거래 입력 시 클라이언트 자동 감지
2. 진행 중인 프로젝트와 자동 매칭
3. 사용자 확인 후 연동
4. 프로젝트 수익성 분석에 반영

## 🚀 개발 로드맵

### Phase 1: 기본 구조 구현 (Week 1)
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 기본 API 서비스 구현
- [ ] 탭 구조 변경 및 라우팅 설정

### Phase 2: 개요 탭 구현 (Week 1-2)
- [ ] 매출 예상 계산 로직
- [ ] 차트 컴포넌트 구현
- [ ] 실시간 데이터 업데이트

### Phase 3: 매입매출 상세 구현 (Week 2-3)
- [ ] 데이터 테이블 컴포넌트
- [ ] 모바일 카드 뷰
- [ ] 필터링 및 검색 기능
- [ ] 상세 페이지 모달

### Phase 4: 프로젝트 연동 (Week 3-4)
- [ ] 자동 매칭 알고리즘
- [ ] 연동 UI 구현
- [ ] 프로젝트별 수익 분석

### Phase 5: 고급 기능 (Week 4-5)
- [ ] 엑셀 임포트/익스포트
- [ ] 대량 편집 기능
- [ ] 세무 신고 알림
- [ ] 보고서 생성

### Phase 6: 최적화 및 테스트 (Week 5-6)
- [ ] 성능 최적화
- [ ] 접근성 개선
- [ ] E2E 테스트
- [ ] 사용자 피드백 반영

## 🎨 UI 디자인 가이드라인

### 1. 색상 체계
```css
/* 세무 관리 전용 색상 */
--tax-income: #10B981;    /* 매출 - 녹색 */
--tax-expense: #EF4444;   /* 매입 - 빨간색 */
--tax-vat: #3B82F6;       /* 부가세 - 파란색 */
--tax-withholding: #F59E0B; /* 원천세 - 주황색 */
```

### 2. 데이터 시각화
- 도넛 차트: 매출/매입 비율
- 라인 차트: 월별 트렌드
- 바 차트: 프로젝트별 수익
- 히트맵: 일별 거래 빈도

### 3. 인터랙션 패턴
- 호버 시 상세 정보 툴팁
- 클릭으로 빠른 편집
- 드래그로 날짜 변경
- 스와이프로 삭제/완료

## 🔒 보안 고려사항

### 1. 데이터 접근 제어
- Row Level Security (RLS) 적용
- 사용자별 데이터 격리
- 역할 기반 권한 관리

### 2. 민감 정보 보호
- 사업자번호 마스킹
- 금액 정보 암호화
- 증빙 자료 보안 저장

### 3. 감사 로그
- 모든 거래 변경 이력 기록
- 삭제된 데이터 복구 가능
- 접근 로그 모니터링

## 📊 성능 목표

### 1. 로딩 성능
- 초기 로드: < 2초
- 데이터 페칭: < 500ms
- 검색 응답: < 200ms

### 2. 최적화 전략
- 가상 스크롤링 (대량 데이터)
- 지연 로딩 (이미지/문서)
- 메모이제이션 (복잡한 계산)
- 인덱싱 (데이터베이스)

## 🧪 테스트 전략

### 1. 단위 테스트
- 세금 계산 로직
- 데이터 변환 함수
- 필터링 알고리즘

### 2. 통합 테스트
- API 엔드포인트
- 데이터베이스 트랜잭션
- 프로젝트 연동

### 3. E2E 테스트
- 거래 생성/편집/삭제
- 필터링 및 검색
- 엑셀 임포트/익스포트

## 📝 마이그레이션 계획

### 1. 기존 데이터 이전
- tax_records → tax_transactions 매핑
- 클라이언트 연결 유지
- 금액 정보 검증

### 2. 점진적 롤아웃
- 카나리 배포 (10% → 50% → 100%)
- 롤백 계획 수립
- 사용자 피드백 수집

## 🎯 성공 지표

### 1. 사용성 지표
- 거래 입력 시간: 50% 단축
- 오류율: 30% 감소
- 사용자 만족도: 4.5/5.0

### 2. 기술 지표
- 페이지 로드 시간: < 2초
- API 응답 시간: < 500ms
- 에러율: < 0.1%

### 3. 비즈니스 지표
- 세무 신고 정확도 향상
- 프로젝트 수익성 가시성 증대
- 세무 관리 시간 절감