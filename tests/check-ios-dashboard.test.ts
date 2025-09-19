import { test, expect } from '@playwright/test';

test('iOS 대시보드 편집 모드 확인', async ({ page }) => {
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'test123456');
  await page.click('button[type="submit"]');
  
  // 2. 대시보드 로드 대기
  await page.waitForURL('**/dashboard');
  await page.waitForTimeout(3000);
  
  // 3. 현재 페이지 스크린샷
  await page.screenshot({ path: 'dashboard-initial.png', fullPage: true });
  console.log('초기 대시보드 스크린샷 저장됨');
  
  // 4. 템플릿 모달이 있으면 닫기
  const closeButton = page.locator('button').filter({ hasText: '×' }).first();
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
    console.log('템플릿 모달 닫음');
    await page.waitForTimeout(1000);
  }
  
  // 5. iOS 스타일 대시보드 확인
  const iosStyleDashboard = page.locator('.w-full.min-h-screen.bg-background');
  if (await iosStyleDashboard.isVisible()) {
    console.log('iOS 스타일 대시보드가 로드됨');
    
    // 6. 위젯 확인
    const widgets = await page.locator('.relative.transition-all').all();
    console.log(`위젯 개수: ${widgets.length}`);
    
    if (widgets.length > 0) {
      // 7. 첫 번째 위젯에서 Long Press 시도
      const firstWidget = widgets[0];
      const box = await firstWidget.boundingBox();
      
      if (box) {
        console.log('첫 번째 위젯 위치:', box);
        
        // Long Press 시도 1: mousedown + 대기 + mouseup
        console.log('Long Press 시도 1: 마우스 이벤트');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(1500); // 1.5초 대기
        await page.mouse.up();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'dashboard-after-longpress1.png', fullPage: true });
        
        // 편집 툴바 확인
        let editToolbar = page.locator('.fixed.top-16.left-0.right-0.z-50');
        if (await editToolbar.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('✅ 편집 모드 활성화됨!');
        } else {
          console.log('❌ 편집 모드 활성화 실패');
          
          // Long Press 시도 2: 다른 위치에서
          console.log('Long Press 시도 2: 대시보드 배경에서');
          const dashboard = page.locator('.grid').first();
          const dashboardBox = await dashboard.boundingBox();
          
          if (dashboardBox) {
            await page.mouse.move(dashboardBox.x + 100, dashboardBox.y + 100);
            await page.mouse.down();
            await page.waitForTimeout(1500);
            await page.mouse.up();
            
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'dashboard-after-longpress2.png', fullPage: true });
            
            if (await editToolbar.isVisible({ timeout: 1000 }).catch(() => false)) {
              console.log('✅ 편집 모드 활성화됨!');
            } else {
              console.log('❌ 여전히 편집 모드 활성화 실패');
            }
          }
        }
      }
    }
  } else {
    console.log('❌ iOS 스타일 대시보드가 로드되지 않음');
    
    // 일반 대시보드 확인
    const normalDashboard = page.locator('[class*="GridContainer"]');
    if (await normalDashboard.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('일반 대시보드가 로드됨');
    }
  }
  
  // 8. 페이지 HTML 구조 확인
  const bodyHtml = await page.locator('body').innerHTML();
  if (bodyHtml.includes('BeautifulDnd')) {
    console.log('✅ BeautifulDnd 컴포넌트 발견');
  } else {
    console.log('❌ BeautifulDnd 컴포넌트 없음');
  }
  
  // 9. Console 로그 확인
  page.on('console', msg => {
    console.log('브라우저 콘솔:', msg.text());
  });
  
  await page.waitForTimeout(2000);
});