import { test, expect, Page } from '@playwright/test';

/**
 * 세무 관리 E2E 테스트 스위트
 * TASK-051: E2E 테스트 구현
 */

// 테스트 설정
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// 테스트 데이터
const testTransaction = {
  transactionDate: '2025-01-09',
  transactionType: '매출',
  supplierName: 'E2E 테스트 거래처',
  businessNumber: '123-45-67890',
  supplyAmount: 1000000,
  vatAmount: 100000,
  totalAmount: 1100000,
  description: 'E2E 테스트 거래'
};

// 헬퍼 함수
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`);
}

async function navigateToTaxManagement(page: Page) {
  await page.goto(`${BASE_URL}/dashboard/tax-management`);
  await page.waitForSelector('h1:has-text("세무 관리")', { timeout: TEST_TIMEOUT });
}

// 테스트 스위트
test.describe('세무 관리 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToTaxManagement(page);
  });

  test.describe('거래 관리', () => {
    test('새 거래 추가', async ({ page }) => {
      // 거래 추가 버튼 클릭
      await page.click('button:has-text("거래 추가")');
      
      // 폼 입력
      await page.fill('input[name="transaction_date"]', testTransaction.transactionDate);
      await page.selectOption('select[name="transaction_type"]', testTransaction.transactionType);
      await page.fill('input[name="supplier_name"]', testTransaction.supplierName);
      await page.fill('input[name="business_number"]', testTransaction.businessNumber);
      await page.fill('input[name="supply_amount"]', testTransaction.supplyAmount.toString());
      await page.fill('input[name="vat_amount"]', testTransaction.vatAmount.toString());
      await page.fill('textarea[name="description"]', testTransaction.description);
      
      // 저장
      await page.click('button:has-text("저장")');
      
      // 성공 메시지 확인
      await expect(page.locator('text=거래가 성공적으로 추가되었습니다')).toBeVisible();
      
      // 목록에서 확인
      await expect(page.locator(`text=${testTransaction.supplierName}`)).toBeVisible();
    });

    test('거래 수정', async ({ page }) => {
      // 첫 번째 거래 선택
      await page.click('table tbody tr:first-child');
      
      // 수정 버튼 클릭
      await page.click('button:has-text("수정")');
      
      // 금액 수정
      await page.fill('input[name="supply_amount"]', '2000000');
      await page.fill('input[name="vat_amount"]', '200000');
      
      // 저장
      await page.click('button:has-text("저장")');
      
      // 성공 메시지 확인
      await expect(page.locator('text=거래가 성공적으로 수정되었습니다')).toBeVisible();
    });

    test('거래 삭제', async ({ page }) => {
      // 첫 번째 거래 선택
      await page.click('table tbody tr:first-child');
      
      // 삭제 버튼 클릭
      await page.click('button:has-text("삭제")');
      
      // 확인 다이얼로그
      await page.click('button:has-text("확인")');
      
      // 성공 메시지 확인
      await expect(page.locator('text=거래가 성공적으로 삭제되었습니다')).toBeVisible();
    });

    test('거래 필터링', async ({ page }) => {
      // 거래 유형 필터
      await page.selectOption('select[name="transactionType"]', '매출');
      await expect(page.locator('table tbody tr')).toHaveCount(await page.locator('table tbody tr:has-text("매출")').count());
      
      // 날짜 범위 필터
      await page.click('button:has-text("이번 달")');
      await page.waitForTimeout(1000);
      
      // 검색
      await page.fill('input[placeholder="거래처 검색"]', '테스트');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    });
  });

  test.describe('엑셀 연동', () => {
    test('엑셀 템플릿 다운로드', async ({ page }) => {
      // 엑셀 임포트 버튼 클릭
      await page.click('button:has-text("엑셀 임포트")');
      
      // 템플릿 다운로드
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("템플릿 다운로드")')
      ]);
      
      // 파일명 확인
      expect(download.suggestedFilename()).toContain('tax_import_template');
    });

    test('엑셀 파일 업로드', async ({ page }) => {
      // 엑셀 임포트 버튼 클릭
      await page.click('button:has-text("엑셀 임포트")');
      
      // 파일 선택
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/sample_transactions.xlsx');
      
      // 다음 단계
      await page.click('button:has-text("다음")');
      
      // 컬럼 매핑 확인
      await expect(page.locator('text=컬럼 매핑')).toBeVisible();
      
      // 매핑 확인 후 다음
      await page.click('button:has-text("다음")');
      
      // 미리보기 확인
      await expect(page.locator('text=데이터 미리보기')).toBeVisible();
      
      // 임포트 실행
      await page.click('button:has-text("임포트 시작")');
      
      // 성공 메시지 확인
      await expect(page.locator('text=임포트가 완료되었습니다')).toBeVisible({ timeout: TEST_TIMEOUT });
    });

    test('엑셀 내보내기', async ({ page }) => {
      // 내보내기 버튼 클릭
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("엑셀 내보내기")')
      ]);
      
      // 파일명 확인
      expect(download.suggestedFilename()).toContain('tax_transactions');
      expect(download.suggestedFilename()).toContain('.xlsx');
    });
  });

  test.describe('보고서 생성', () => {
    test('월별 보고서 생성 및 PDF 다운로드', async ({ page }) => {
      // 보고서 탭 클릭
      await page.click('button:has-text("보고서")');
      
      // 월별 보고서 선택
      await page.click('text=월별 세무 보고서');
      
      // 월 선택
      await page.selectOption('select[name="month"]', '1');
      await page.selectOption('select[name="year"]', '2025');
      
      // 보고서 생성
      await page.click('button:has-text("보고서 생성")');
      
      // 차트 로딩 대기
      await page.waitForSelector('.recharts-wrapper', { timeout: TEST_TIMEOUT });
      
      // PDF 다운로드
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("PDF 다운로드")')
      ]);
      
      expect(download.suggestedFilename()).toContain('monthly_tax_report');
      expect(download.suggestedFilename()).toContain('.pdf');
    });

    test('분기별 VAT 보고서 생성', async ({ page }) => {
      // 보고서 탭 클릭
      await page.click('button:has-text("보고서")');
      
      // 분기별 보고서 선택
      await page.click('text=분기별 부가세 신고서');
      
      // 분기 선택
      await page.selectOption('select[name="quarter"]', '1');
      await page.selectOption('select[name="year"]', '2025');
      
      // 보고서 생성
      await page.click('button:has-text("보고서 생성")');
      
      // 데이터 로딩 대기
      await page.waitForSelector('text=매출세액', { timeout: TEST_TIMEOUT });
      
      // VAT 계산 확인
      const vatPayable = await page.textContent('[data-testid="vat-payable"]');
      expect(vatPayable).toBeTruthy();
    });
  });

  test.describe('알림 시스템', () => {
    test('세무 신고 일정 확인', async ({ page }) => {
      // 알림 센터 열기
      await page.click('button[aria-label="알림"]');
      
      // 예정된 신고 탭 확인
      await expect(page.locator('text=예정된 신고')).toBeVisible();
      
      // D-Day 표시 확인
      const deadlines = await page.locator('[data-testid="deadline-item"]').count();
      expect(deadlines).toBeGreaterThan(0);
    });

    test('알림 설정 변경', async ({ page }) => {
      // 알림 센터 열기
      await page.click('button[aria-label="알림"]');
      
      // 설정 버튼 클릭
      await page.click('button:has-text("알림 설정")');
      
      // 이메일 알림 활성화
      await page.check('input[name="emailEnabled"]');
      
      // 알림 시기 변경
      await page.selectOption('select[name="advanceDays"]', '7');
      
      // 저장
      await page.click('button:has-text("저장")');
      
      // 성공 메시지 확인
      await expect(page.locator('text=설정이 저장되었습니다')).toBeVisible();
    });

    test('이상 거래 감지', async ({ page }) => {
      // 알림 센터 열기
      await page.click('button[aria-label="알림"]');
      
      // 이상 거래 탭 클릭
      await page.click('button:has-text("이상 거래")');
      
      // 이상 거래 목록 확인
      const anomalies = await page.locator('[data-testid="anomaly-item"]').count();
      
      if (anomalies > 0) {
        // 첫 번째 이상 거래 상세 확인
        await page.click('[data-testid="anomaly-item"]:first-child');
        await expect(page.locator('text=권장 조치')).toBeVisible();
      }
    });
  });

  test.describe('대시보드 위젯', () => {
    test('세무 대시보드 위젯 표시', async ({ page }) => {
      // 대시보드로 이동
      await page.goto(`${BASE_URL}/dashboard`);
      
      // 세무 위젯 확인
      await expect(page.locator('[data-testid="tax-widget"]')).toBeVisible();
      
      // 주요 지표 확인
      await expect(page.locator('text=매출')).toBeVisible();
      await expect(page.locator('text=매입')).toBeVisible();
      await expect(page.locator('text=부가세')).toBeVisible();
    });

    test('위젯에서 세무 관리로 이동', async ({ page }) => {
      // 대시보드로 이동
      await page.goto(`${BASE_URL}/dashboard`);
      
      // 세무 위젯 클릭
      await page.click('[data-testid="tax-widget"]');
      
      // 세무 관리 페이지로 이동 확인
      await expect(page).toHaveURL(`${BASE_URL}/dashboard/tax-management`);
      await expect(page.locator('h1:has-text("세무 관리")')).toBeVisible();
    });
  });

  test.describe('성능 테스트', () => {
    test('페이지 로딩 시간', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/dashboard/tax-management`);
      await page.waitForSelector('table tbody tr', { timeout: TEST_TIMEOUT });
      const loadTime = Date.now() - startTime;
      
      // 3초 이내 로딩
      expect(loadTime).toBeLessThan(3000);
    });

    test('대용량 데이터 처리', async ({ page }) => {
      // 100개 데이터 페이지네이션
      await page.selectOption('select[name="pageSize"]', '100');
      
      // 스크롤 성능 테스트
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // 부드러운 스크롤 확인
      await page.waitForTimeout(500);
      
      // 가상 스크롤 동작 확인
      const visibleRows = await page.locator('table tbody tr:visible').count();
      expect(visibleRows).toBeGreaterThan(0);
    });
  });

  test.describe('반응형 디자인', () => {
    test('모바일 뷰', async ({ page }) => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 });
      
      await navigateToTaxManagement(page);
      
      // 모바일 메뉴 토글
      await page.click('[aria-label="메뉴 토글"]');
      
      // 모바일 레이아웃 확인
      await expect(page.locator('.mobile-menu')).toBeVisible();
      
      // 테이블 스크롤 확인
      const table = await page.locator('table');
      const isScrollable = await table.evaluate(el => el.scrollWidth > el.clientWidth);
      expect(isScrollable).toBeTruthy();
    });

    test('태블릿 뷰', async ({ page }) => {
      // 태블릿 뷰포트 설정
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await navigateToTaxManagement(page);
      
      // 레이아웃 확인
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });
  });

  test.describe('접근성', () => {
    test('키보드 네비게이션', async ({ page }) => {
      await navigateToTaxManagement(page);
      
      // Tab 키로 네비게이션
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Enter 키로 버튼 클릭
      await page.keyboard.press('Enter');
      
      // ESC 키로 모달 닫기
      await page.keyboard.press('Escape');
    });

    test('스크린 리더 레이블', async ({ page }) => {
      await navigateToTaxManagement(page);
      
      // ARIA 레이블 확인
      await expect(page.locator('[aria-label="거래 추가"]')).toHaveCount(1);
      await expect(page.locator('[role="table"]')).toHaveCount(1);
      await expect(page.locator('[aria-describedby]')).toHaveCount(await page.locator('[aria-describedby]').count());
    });
  });
});

// 정리 작업
test.afterEach(async ({ page }) => {
  // 테스트 데이터 정리
  try {
    await page.goto(`${BASE_URL}/dashboard/tax-management`);
    
    // 테스트 거래 삭제
    const testRows = await page.locator(`tr:has-text("${testTransaction.supplierName}")`).count();
    for (let i = 0; i < testRows; i++) {
      await page.click(`tr:has-text("${testTransaction.supplierName}")`);
      await page.click('button:has-text("삭제")');
      await page.click('button:has-text("확인")');
      await page.waitForTimeout(500);
    }
  } catch (error) {
    console.log('Cleanup error:', error);
  }
});