import { test, expect } from '@playwright/test';

// 테스트 계정 정보
const TEST_ACCOUNT = {
  email: 'test@example.com',
  password: 'test123456'
};

test('iOS 위젯 편집 시스템 기본 테스트', async ({ page }) => {
  // 1. 로그인 페이지로 이동
  console.log('1. 로그인 페이지로 이동');
  await page.goto('http://localhost:3001/login');
  
  // 2. 로그인 수행
  console.log('2. 로그인 수행');
  await page.fill('input[type="email"]', TEST_ACCOUNT.email);
  await page.fill('input[type="password"]', TEST_ACCOUNT.password);
  await page.click('button[type="submit"]');
  
  // 3. 대시보드 로드 대기
  console.log('3. 대시보드 로드 대기');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(3000); // 페이지 완전 로드 대기
  
  // 4. 템플릿 선택 모달 처리
  console.log('4. 템플릿 선택 모달 확인');
  
  // "건너뛰기" 버튼 찾기 (모달 하단)
  const skipButton = page.locator('button:has-text("건너뛰기")');
  const applyButton = page.locator('button:has-text("템플릿 적용")');
  const closeButton = page.locator('button[aria-label="Close"], button:has-text("취소")');
  
  // 건너뛰기 버튼이 보이면 클릭
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('건너뛰기 버튼 클릭');
    await skipButton.click();
    await page.waitForTimeout(2000);
  } 
  // 템플릿 적용 버튼이 보이면 클릭
  else if (await applyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('템플릿 적용 버튼 클릭');
    
    // 먼저 템플릿 선택 (첫 번째 템플릿 - 프로젝트 중심)
    const projectTemplate = page.locator('text=프로젝트 중심').first();
    if (await projectTemplate.isVisible()) {
      await projectTemplate.click();
      console.log('프로젝트 중심 템플릿 선택');
    }
    
    await applyButton.click();
    await page.waitForTimeout(2000);
  }
  // X 버튼으로 닫기
  else if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('X 버튼으로 모달 닫기');
    await closeButton.click();
    await page.waitForTimeout(2000);
  }
  
  // 모달이 닫혔는지 확인
  await page.waitForTimeout(2000);
  
  // 5. 대시보드가 제대로 로드되었는지 확인
  console.log('5. 대시보드 상태 확인');
  const dashboardContent = await page.locator('[class*="dashboard"], [class*="Dashboard"], main').first().isVisible();
  console.log(`대시보드 콘텐츠 표시됨: ${dashboardContent}`);
  
  // 현재 상태 스크린샷
  await page.screenshot({ path: 'test-after-modal.png', fullPage: true });
  console.log('모달 처리 후 스크린샷 저장됨: test-after-modal.png');
  
  // 6. 위젯 찾기
  console.log('6. 위젯 확인');
  await page.waitForTimeout(2000);
  
  // 다양한 선택자로 위젯 찾기
  const widgetSelectors = [
    '[data-testid^="widget-"]',
    '[class*="widget-card"]',
    '[class*="WidgetCard"]',
    '[class*="widget-container"]',
    'div[class*="grid-item"]',
    'div[class*="dashboard-widget"]'
  ];
  
  let widgets = null;
  let widgetCount = 0;
  
  for (const selector of widgetSelectors) {
    widgets = page.locator(selector);
    widgetCount = await widgets.count();
    if (widgetCount > 0) {
      console.log(`위젯 찾음 - 선택자: ${selector}, 개수: ${widgetCount}`);
      break;
    }
  }
  
  console.log(`총 발견된 위젯 개수: ${widgetCount}`);
  
  // 7. Long Press 테스트
  if (widgetCount > 0 && widgets) {
    console.log('7. Long Press 테스트 시작');
    const firstWidget = widgets.first();
    await firstWidget.scrollIntoViewIfNeeded();
    
    const box = await firstWidget.boundingBox();
    if (box) {
      console.log(`위젯 위치: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
      
      // Long Press 시뮬레이션
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      
      console.log(`클릭 위치: (${centerX}, ${centerY})`);
      
      // 마우스 이동 후 Long Press
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      console.log('마우스 다운 - 1.5초 Long Press 시작');
      
      // 1.5초 동안 누르기
      await page.waitForTimeout(1500);
      
      await page.mouse.up();
      console.log('마우스 업 - Long Press 완료');
      
      // 편집 모드 진입 대기
      await page.waitForTimeout(2000);
      
      // 편집 모드 확인
      const editModeIndicators = [
        '[class*="wiggle"]',
        '[class*="edit-mode"]',
        '[class*="editing"]',
        'button[aria-label*="delete"]',
        'button[aria-label*="삭제"]',
        '[data-testid="edit-mode-toolbar"]'
      ];
      
      let editModeActive = false;
      for (const indicator of editModeIndicators) {
        const count = await page.locator(indicator).count();
        if (count > 0) {
          console.log(`편집 모드 인디케이터 발견: ${indicator} (${count}개)`);
          editModeActive = true;
        }
      }
      
      console.log(`편집 모드 활성화됨: ${editModeActive}`);
      
      // 편집 모드 스크린샷
      await page.screenshot({ path: 'test-edit-mode-final.png', fullPage: true });
      console.log('편집 모드 최종 스크린샷 저장됨: test-edit-mode-final.png');
      
      // ESC로 편집 모드 종료
      if (editModeActive) {
        console.log('8. ESC 키로 편집 모드 종료');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'test-after-esc-final.png', fullPage: true });
        console.log('ESC 후 최종 스크린샷 저장됨: test-after-esc-final.png');
      }
    }
  } else {
    console.log('위젯을 찾을 수 없습니다.');
    
    // 페이지 구조 디버깅
    const pageContent = await page.content();
    console.log('페이지에 "widget" 텍스트 포함:', pageContent.includes('widget'));
    console.log('페이지에 "Widget" 텍스트 포함:', pageContent.includes('Widget'));
    
    // 모든 div 개수 확인
    const allDivs = await page.locator('div').count();
    console.log(`페이지의 총 div 개수: ${allDivs}`);
  }
  
  console.log('테스트 완료');
});