import { test, expect, Page } from '@playwright/test';

test.describe('iOS Style Dashboard - Drag and Drop', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123456');
    await page.click('button[type="submit"]');
    
    // 대시보드로 이동
    await page.waitForURL('**/dashboard');
    
    // 템플릿 모달이 나타나면 닫기
    const modal = page.locator('text="대시보드 템플릿 선택"');
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      const closeButton = page.locator('button').filter({ hasText: '×' }).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
    
    await page.waitForTimeout(2000);
  });

  test('위젯 드래그 앤 드롭 테스트', async () => {
    // 1. 대시보드에 위젯들이 렌더링되는지 확인
    // BeautifulDndDashboard의 그리드 컨테이너 확인
    const dashboard = await page.locator('.grid.grid-cols-2.md\\:grid-cols-4.lg\\:grid-cols-6').first();
    await expect(dashboard).toBeVisible();
    
    // 위젯들 확인 (Card 컴포넌트 내부의 transition-all 클래스)
    const widgets = await page.locator('.relative.transition-all').all();
    console.log(`위젯 개수: ${widgets.length}`);
    expect(widgets.length).toBeGreaterThan(0);

    // 2. 편집 모드 진입 (Long Press 시뮬레이션)
    const firstWidget = widgets[0];
    const widgetBox = await firstWidget.boundingBox();
    
    if (widgetBox) {
      // Long press 시뮬레이션 (대시보드 그리드에서)
      await page.mouse.move(widgetBox.x + widgetBox.width / 2, widgetBox.y + widgetBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1200); // 1초 이상 홀드
      await page.mouse.up();
      
      // 편집 모드 툴바가 나타나는지 확인
      const editToolbar = page.locator('.fixed.top-16.left-0.right-0.z-50');
      await expect(editToolbar).toBeVisible({ timeout: 5000 });
      console.log('편집 모드 진입 성공');
      
      // 3. 위젯 드래그 테스트
      const secondWidget = widgets[1];
      const secondBox = await secondWidget.boundingBox();
      
      if (secondBox) {
        // 첫 번째 위젯 위치 저장
        const initialFirstPos = await firstWidget.boundingBox();
        const initialSecondPos = await secondWidget.boundingBox();
        
        // 두 번째 위젯을 첫 번째 위젯 위치로 드래그
        await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(initialFirstPos!.x + initialFirstPos!.width / 2, initialFirstPos!.y + initialFirstPos!.height / 2, { steps: 10 });
        await page.mouse.up();
        
        await page.waitForTimeout(1000);
        
        // 위치가 변경되었는지 확인
        const newSecondPos = await secondWidget.boundingBox();
        console.log('드래그 전 두 번째 위젯 Y:', initialSecondPos?.y);
        console.log('드래그 후 두 번째 위젯 Y:', newSecondPos?.y);
        
        // 위치가 변경되었는지 확인 (Y 좌표가 다르면 이동한 것)
        if (initialSecondPos && newSecondPos) {
          const moved = Math.abs(initialSecondPos.y - newSecondPos.y) > 10;
          console.log(`위젯 이동 여부: ${moved}`);
          expect(moved).toBeTruthy();
        }
      }
      
      // 4. 편집 모드 종료
      const doneButton = page.locator('button:has-text("완료")');
      await doneButton.click();
      
      // 편집 모드 툴바가 사라지는지 확인
      await expect(editToolbar).not.toBeVisible({ timeout: 5000 });
      console.log('편집 모드 종료 성공');
    }
  });

  test('위젯 삭제 테스트', async () => {
    // 편집 모드 진입
    const dashboard = await page.locator('.grid.grid-cols-2.md\\:grid-cols-4.lg\\:grid-cols-6');
    await dashboard.click();
    await page.mouse.down();
    await page.waitForTimeout(1100);
    await page.mouse.up();
    
    // 편집 모드 확인
    const editToolbar = page.locator('.fixed.top-16.left-0.right-0.z-50');
    await expect(editToolbar).toBeVisible({ timeout: 5000 });
    
    // 초기 위젯 개수 확인
    const initialWidgets = await page.locator('.relative.transition-all').all();
    const initialCount = initialWidgets.length;
    console.log(`초기 위젯 개수: ${initialCount}`);
    
    // 첫 번째 위젯의 삭제 버튼 클릭
    const deleteButton = page.locator('.absolute.-top-2.-left-2.z-20.rounded-full.w-7.h-7.bg-red-600').first();
    await deleteButton.click({ force: true });
    
    await page.waitForTimeout(1000);
    
    // 위젯이 삭제되었는지 확인
    const remainingWidgets = await page.locator('.relative.transition-all').all();
    const remainingCount = remainingWidgets.length;
    console.log(`삭제 후 위젯 개수: ${remainingCount}`);
    expect(remainingCount).toBe(initialCount - 1);
  });

  test('위젯 추가 테스트', async () => {
    // 편집 모드 진입
    const dashboard = await page.locator('.grid.grid-cols-2.md\\:grid-cols-4.lg\\:grid-cols-6');
    await dashboard.click();
    await page.mouse.down();
    await page.waitForTimeout(1100);
    await page.mouse.up();
    
    // 편집 모드 확인
    const editToolbar = page.locator('.fixed.top-16.left-0.right-0.z-50');
    await expect(editToolbar).toBeVisible({ timeout: 5000 });
    
    // 초기 위젯 개수 확인
    const initialWidgets = await page.locator('.relative.transition-all').all();
    const initialCount = initialWidgets.length;
    console.log(`초기 위젯 개수: ${initialCount}`);
    
    // 위젯 추가 버튼 클릭
    const addButton = page.locator('button:has-text("위젯 추가")');
    await addButton.click();
    
    await page.waitForTimeout(1000);
    
    // 위젯이 추가되었는지 확인
    const updatedWidgets = await page.locator('.relative.transition-all').all();
    const updatedCount = updatedWidgets.length;
    console.log(`추가 후 위젯 개수: ${updatedCount}`);
    expect(updatedCount).toBe(initialCount + 1);
  });
});