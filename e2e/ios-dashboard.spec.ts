import { test, expect, Page } from '@playwright/test';

test.describe('iOS Style Dashboard', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // 대시보드 페이지로 직접 이동 (테스트 용도)
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 대시보드가 로드될 때까지 대기
    await page.waitForTimeout(2000);
  });

  test('편집 모드 진입 및 위젯 이동 테스트', async () => {
    // 1. 현재 위젯 상태 확인
    const widgets = await page.$$('.widget-grid-item');
    console.log('현재 위젯 개수:', widgets.length);

    if (widgets.length === 0) {
      console.log('위젯이 없습니다.');
      return;
    }

    // 2. 첫 번째 위젯 찾기
    const firstWidget = widgets[0];
    const boundingBox = await firstWidget.boundingBox();
    
    if (!boundingBox) {
      console.log('위젯 위치를 찾을 수 없습니다.');
      return;
    }

    console.log('첫 번째 위젯 위치:', boundingBox);

    // 3. Long Press로 편집 모드 진입 (마우스로 시뮬레이션)
    console.log('Long Press 시작...');
    await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
    await page.mouse.down();
    
    // 1초 대기 (Long Press)
    await page.waitForTimeout(1200);
    await page.mouse.up();

    // 편집 모드 진입 확인
    await page.waitForTimeout(500);
    const editModeToolbar = await page.$('.fixed.top-16');
    const isEditMode = editModeToolbar !== null;
    console.log('편집 모드 진입:', isEditMode);

    if (!isEditMode) {
      console.log('편집 모드 진입 실패');
      return;
    }

    // 4. 위젯 wiggle 애니메이션 확인
    const wigglingWidget = await page.$('.wiggle-widget');
    console.log('Wiggle 애니메이션 활성화:', wigglingWidget !== null);

    // 5. 위젯 드래그 테스트
    console.log('위젯 드래그 시작...');
    
    // 첫 번째 위젯 다시 찾기
    const editModeWidget = await page.$('.widget-grid-item');
    const editBoundingBox = await editModeWidget?.boundingBox();
    
    if (!editBoundingBox) {
      console.log('편집 모드에서 위젯을 찾을 수 없습니다.');
      return;
    }

    // 드래그 시작
    await page.mouse.move(editBoundingBox.x + editBoundingBox.width / 2, editBoundingBox.y + editBoundingBox.height / 2);
    await page.mouse.down();
    
    // 오른쪽 아래로 200px 이동
    await page.mouse.move(editBoundingBox.x + 200, editBoundingBox.y + 200, { steps: 10 });
    await page.waitForTimeout(500);
    
    // 드래그 종료
    await page.mouse.up();
    await page.waitForTimeout(500);

    // 새 위치 확인
    const movedWidget = await page.$('.widget-grid-item');
    const newBoundingBox = await movedWidget?.boundingBox();
    
    if (newBoundingBox) {
      console.log('이동 전 위치:', editBoundingBox);
      console.log('이동 후 위치:', newBoundingBox);
      
      const moved = newBoundingBox.x !== editBoundingBox.x || newBoundingBox.y !== editBoundingBox.y;
      console.log('위젯 이동 성공:', moved);
    }

    // 6. 편집 모드 종료
    console.log('편집 모드 종료...');
    const doneButton = await page.$('button:has-text("완료")');
    if (doneButton) {
      await doneButton.click();
      await page.waitForTimeout(1000);
      
      // 편집 모드 종료 확인
      const editModeToolbarAfter = await page.$('.fixed.top-16');
      console.log('편집 모드 종료:', editModeToolbarAfter === null);
    }

    // 7. 정렬 상태 확인
    const finalWidgets = await page.$$('.widget-grid-item');
    console.log('최종 위젯 개수:', finalWidgets.length);
    
    // 각 위젯의 위치 출력
    for (let i = 0; i < finalWidgets.length; i++) {
      const box = await finalWidgets[i].boundingBox();
      if (box) {
        console.log(`위젯 ${i + 1} 위치:`, { x: box.x, y: box.y });
      }
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/ios-dashboard-final.png', fullPage: true });
  });

  test('위젯 추가 테스트', async () => {
    // Long Press로 편집 모드 진입
    const widgets = await page.$$('.widget-grid-item');
    if (widgets.length > 0) {
      const firstWidget = widgets[0];
      const boundingBox = await firstWidget.boundingBox();
      
      if (boundingBox) {
        await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(1200);
        await page.mouse.up();
        await page.waitForTimeout(500);
      }
    }

    // 위젯 추가 버튼 클릭
    const addButton = await page.$('button:has-text("위젯 추가")');
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // 드롭다운 메뉴에서 차트 선택
      const chartOption = await page.$('text=차트');
      if (chartOption) {
        await chartOption.click();
        await page.waitForTimeout(1000);
        
        // 새 위젯이 추가되었는지 확인
        const newWidgets = await page.$$('.widget-grid-item');
        console.log('위젯 추가 전:', widgets.length);
        console.log('위젯 추가 후:', newWidgets.length);
        console.log('위젯 추가 성공:', newWidgets.length > widgets.length);
      }
    }

    // 스크린샷
    await page.screenshot({ path: 'tests/screenshots/ios-dashboard-add-widget.png', fullPage: true });
  });

  test('키보드 단축키 테스트', async () => {
    // 편집 모드 진입
    const widgets = await page.$$('.widget-grid-item');
    if (widgets.length > 0) {
      const firstWidget = widgets[0];
      const boundingBox = await firstWidget.boundingBox();
      
      if (boundingBox) {
        await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(1200);
        await page.mouse.up();
        await page.waitForTimeout(500);
      }
    }

    // ESC 키로 편집 모드 종료
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // 편집 모드 종료 확인
    const editModeToolbar = await page.$('.fixed.top-16');
    console.log('ESC 키로 편집 모드 종료:', editModeToolbar === null);
  });
});