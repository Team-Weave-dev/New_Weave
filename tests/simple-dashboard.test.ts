import { test } from '@playwright/test';

test('Dashboard Console Check', async ({ page }) => {
  // Console 메시지 캡처
  page.on('console', msg => {
    console.log(`[브라우저]: ${msg.text()}`);
  });

  // 로그인
  console.log('1. 로그인 페이지 접속...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'test123456');
  await page.click('button[type="submit"]');
  
  // 대시보드 로드
  console.log('2. 대시보드 로드 대기...');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('3. 페이지 구조 확인...');
  
  // 템플릿 모달 확인
  const modalTitle = await page.locator('text="대시보드 템플릿 선택"').isVisible();
  if (modalTitle) {
    console.log('   - 템플릿 모달 발견, 닫기 시도');
    const closeButton = page.locator('button').filter({ hasText: '×' });
    if (await closeButton.isVisible()) {
      await closeButton.click();
      console.log('   - 모달 닫음');
    }
  }
  
  await page.waitForTimeout(2000);
  
  // DOM 구조 확인
  const hasBeautifulDnd = await page.locator('[data-rbd-droppable-id]').count();
  console.log(`4. BeautifulDnd 요소 개수: ${hasBeautifulDnd}`);
  
  const hasGrid = await page.locator('.grid').count();
  console.log(`5. Grid 요소 개수: ${hasGrid}`);
  
  const widgets = await page.locator('.relative.transition-all').count();
  console.log(`6. 위젯 개수: ${widgets}`);
  
  // Long Press 시도
  console.log('7. Long Press 테스트...');
  if (widgets > 0) {
    const firstWidget = page.locator('.relative.transition-all').first();
    const box = await firstWidget.boundingBox();
    
    if (box) {
      console.log(`   - 위젯 위치: x=${box.x}, y=${box.y}`);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      console.log('   - Mouse down');
      await page.waitForTimeout(1500);
      console.log('   - 1.5초 대기 완료');
      await page.mouse.up();
      console.log('   - Mouse up');
      
      await page.waitForTimeout(1000);
      
      // 편집 모드 확인
      const editToolbar = await page.locator('.fixed.top-16').isVisible();
      console.log(`8. 편집 툴바 표시: ${editToolbar}`);
    }
  }
  
  // 페이지 스크린샷
  await page.screenshot({ path: 'final-state.png', fullPage: true });
  console.log('9. 스크린샷 저장: final-state.png');
});