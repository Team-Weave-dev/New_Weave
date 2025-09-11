import { test, expect } from '@playwright/test';

test.describe('대시보드 컨텐츠 테스트', () => {
  test('대시보드 데이터 카드가 로딩중이 아닌 실제 데이터를 표시하는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 스크린샷 촬영
    await page.screenshot({ path: 'tests/screenshots/dashboard-content.png', fullPage: true });
    
    // 결제 지연 청구서 카드 확인
    const overdueCard = page.locator('text=결제 지연 청구서').first();
    await expect(overdueCard).toBeVisible();
    
    // "로딩중..." 텍스트가 없는지 확인
    const loadingTexts = page.locator('text=로딩중...');
    const loadingCount = await loadingTexts.count();
    console.log(`로딩중 텍스트 개수: ${loadingCount}`);
    
    if (loadingCount > 0) {
      const loadingElements = await loadingTexts.all();
      for (let i = 0; i < loadingElements.length; i++) {
        const text = await loadingElements[i].textContent();
        console.log(`로딩중 텍스트 발견: "${text}"`);
      }
    }
    
    // 실제 데이터 확인
    const cardValues = await page.locator('[class*="insights"] [class*="value"], [class*="card"] [class*="value"]').allTextContents();
    console.log('대시보드 카드 값들:', cardValues);
    
    // 마감 임박 프로젝트 카드 확인
    const deadlineCard = page.locator('text=마감 임박 프로젝트').first();
    await expect(deadlineCard).toBeVisible();
    
    // 이번달 발행 vs 입금 카드 확인  
    const financialCard = page.locator('text=이번 달 발행 vs 입금').first();
    await expect(financialCard).toBeVisible();
    
    // 상위 고객 기여도 카드 확인
    const clientCard = page.locator('text=상위 고객 기여도').first();
    await expect(clientCard).toBeVisible();
    
    // 모든 주요 요소가 로딩 상태가 아닌지 확인
    expect(loadingCount).toBeLessThanOrEqual(0);
    
    console.log('✅ 대시보드 모든 카드가 정상적으로 로드됨');
  });
  
  test('대시보드 Mock 데이터 내용 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // Mock 데이터 값 확인
    const pageContent = await page.textContent('body');
    
    // Mock 데이터에서 예상되는 값들 확인
    const expectedValues = [
      '3건', // 결제 지연 청구서 건수
      '2건', // 마감 임박 프로젝트 건수  
      '㈜테크스타트', // 상위 고객명
      '1,250만원' // 월 발행액
    ];
    
    let foundValues = 0;
    for (const expectedValue of expectedValues) {
      if (pageContent && pageContent.includes(expectedValue)) {
        console.log(`✅ Mock 데이터 값 발견: "${expectedValue}"`);
        foundValues++;
      } else {
        console.log(`❌ Mock 데이터 값 누락: "${expectedValue}"`);
      }
    }
    
    console.log(`Mock 데이터 값 확인: ${foundValues}/${expectedValues.length}개 발견`);
    
    // 최소 50% 이상의 예상 값이 발견되어야 함
    expect(foundValues).toBeGreaterThanOrEqual(Math.ceil(expectedValues.length * 0.5));
  });
});