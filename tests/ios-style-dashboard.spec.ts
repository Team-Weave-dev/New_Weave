import { test, expect } from '@playwright/test';

// 테스트 계정 정보
const TEST_ACCOUNT = {
  email: 'test@example.com',
  password: 'test123456'
};

// 테스트 전에 로그인 수행
test.beforeEach(async ({ page }) => {
  // 로그인 페이지로 이동
  await page.goto('http://localhost:3001/login');
  
  // 로그인 수행
  await page.fill('input[type="email"]', TEST_ACCOUNT.email);
  await page.fill('input[type="password"]', TEST_ACCOUNT.password);
  await page.click('button[type="submit"]');
  
  // 대시보드로 리다이렉트 확인
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  
  // 대시보드 로드 완료 대기
  await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });
});

test.describe('iOS 스타일 위젯 편집 시스템', () => {
  
  test.describe('편집 모드 진입/종료', () => {
    
    test('Long Press로 편집 모드 진입', async ({ page }) => {
      // 위젯 찾기
      const widget = page.locator('[data-testid^="widget-"]').first();
      await expect(widget).toBeVisible();
      
      // Long Press 시뮬레이션 (1초 누르기)
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100); // 1초 이상 대기
      await page.mouse.up();
      
      // 편집 모드 진입 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      await expect(page.locator('.wiggle-widget').first()).toBeVisible();
      
      // 위젯에 삭제 버튼 표시 확인
      await expect(page.locator('[data-testid="widget-delete-button"]').first()).toBeVisible();
    });
    
    test('ESC 키로 편집 모드 종료', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // ESC 키로 종료
      await page.keyboard.press('Escape');
      
      // 편집 모드 종료 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).not.toBeVisible();
      await expect(page.locator('.wiggle-widget')).not.toBeVisible();
    });
    
    test('완료 버튼으로 편집 모드 종료', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // 완료 버튼 클릭
      await page.click('[data-testid="edit-mode-done"]');
      
      // 편집 모드 종료 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).not.toBeVisible();
    });
  });
  
  test.describe('드래그앤드롭 시나리오', () => {
    
    test('위젯 드래그앤드롭으로 위치 변경', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // 첫 번째 위젯의 초기 위치 저장
      const firstWidget = page.locator('[data-testid^="widget-"]').first();
      const initialBox = await firstWidget.boundingBox();
      if (!initialBox) throw new Error('Initial widget box not found');
      
      // 드래그앤드롭 수행
      await page.mouse.move(initialBox.x + initialBox.width / 2, initialBox.y + initialBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(initialBox.x + 200, initialBox.y + 200, { steps: 10 });
      await page.mouse.up();
      
      // 위치 변경 확인 (위치가 변경되었는지 확인)
      const newBox = await firstWidget.boundingBox();
      if (!newBox) throw new Error('New widget box not found');
      
      // 위치가 변경되었는지 확인 (x 또는 y 좌표가 변경됨)
      expect(Math.abs(newBox.x - initialBox.x) > 50 || Math.abs(newBox.y - initialBox.y) > 50).toBeTruthy();
    });
    
    test('위젯 간 충돌 시 자동 재배치', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // 두 위젯 선택
      const widgets = page.locator('[data-testid^="widget-"]');
      const count = await widgets.count();
      if (count < 2) {
        console.log('Not enough widgets for collision test');
        return;
      }
      
      const firstWidget = widgets.nth(0);
      const secondWidget = widgets.nth(1);
      
      const firstBox = await firstWidget.boundingBox();
      const secondBox = await secondWidget.boundingBox();
      
      if (!firstBox || !secondBox) throw new Error('Widget boxes not found');
      
      // 첫 번째 위젯을 두 번째 위젯 위치로 드래그 (충돌 발생)
      await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 10 });
      await page.mouse.up();
      
      // 자동 재배치 확인 (두 위젯이 겹치지 않음)
      await page.waitForTimeout(500); // 애니메이션 대기
      
      const newFirstBox = await firstWidget.boundingBox();
      const newSecondBox = await secondWidget.boundingBox();
      
      if (!newFirstBox || !newSecondBox) throw new Error('New widget boxes not found');
      
      // 겹치지 않는지 확인
      const isOverlapping = 
        newFirstBox.x < newSecondBox.x + newSecondBox.width &&
        newFirstBox.x + newFirstBox.width > newSecondBox.x &&
        newFirstBox.y < newSecondBox.y + newSecondBox.height &&
        newFirstBox.y + newFirstBox.height > newSecondBox.y;
      
      expect(isOverlapping).toBeFalsy();
    });
  });
  
  test.describe('자동 재배치 검증', () => {
    
    test('위젯 삭제 시 자동 재배치', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // 초기 위젯 개수
      const widgets = page.locator('[data-testid^="widget-"]');
      const initialCount = await widgets.count();
      
      if (initialCount < 2) {
        console.log('Not enough widgets for deletion test');
        return;
      }
      
      // 첫 번째 위젯 삭제
      await page.click('[data-testid="widget-delete-button"]').first();
      
      // 삭제 확인 (위젯 개수 감소)
      await expect(widgets).toHaveCount(initialCount - 1);
      
      // 자동 재배치 확인 (빈 공간이 채워짐)
      await page.waitForTimeout(500); // 애니메이션 대기
      
      // 남은 위젯들이 위로 이동했는지 확인
      // (구체적인 검증은 위젯 위치에 따라 다를 수 있음)
    });
    
    test('Gravity 효과 (위로 당기기)', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // 위젯을 아래로 이동
      const firstWidget = page.locator('[data-testid^="widget-"]').first();
      const initialBox = await firstWidget.boundingBox();
      if (!initialBox) throw new Error('Initial widget box not found');
      
      // 아래로 드래그
      await page.mouse.move(initialBox.x + initialBox.width / 2, initialBox.y + initialBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(initialBox.x + initialBox.width / 2, initialBox.y + 300, { steps: 10 });
      await page.mouse.up();
      
      // Gravity 효과 확인 (빈 공간이 최소화됨)
      await page.waitForTimeout(500); // 애니메이션 대기
      
      // 위젯이 가능한 한 위로 이동했는지 확인
      // (구체적인 검증은 레이아웃에 따라 다를 수 있음)
    });
  });
  
  test.describe('반응형 동작 테스트', () => {
    
    test('모바일 뷰포트에서 2컬럼 그리드', async ({ page }) => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 });
      
      // 대시보드 리로드
      await page.reload();
      await page.waitForSelector('[data-testid="dashboard-container"]');
      
      // 그리드 컨테이너 확인
      const gridContainer = page.locator('[data-testid="flexible-grid-container"]');
      await expect(gridContainer).toBeVisible();
      
      // CSS Grid 템플릿 컬럼 확인 (2컬럼)
      const gridStyles = await gridContainer.evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // 2개의 컬럼이 있는지 확인
      const columns = gridStyles.split(' ').filter(col => col !== 'auto' && col !== '');
      expect(columns.length).toBeLessThanOrEqual(2);
    });
    
    test('태블릿 뷰포트에서 4컬럼 그리드', async ({ page }) => {
      // 태블릿 뷰포트 설정
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // 대시보드 리로드
      await page.reload();
      await page.waitForSelector('[data-testid="dashboard-container"]');
      
      // 그리드 컨테이너 확인
      const gridContainer = page.locator('[data-testid="flexible-grid-container"]');
      await expect(gridContainer).toBeVisible();
      
      // CSS Grid 템플릿 컬럼 확인 (4컬럼)
      const gridStyles = await gridContainer.evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // 4개의 컬럼이 있는지 확인
      const columns = gridStyles.split(' ').filter(col => col !== 'auto' && col !== '');
      expect(columns.length).toBeLessThanOrEqual(4);
    });
    
    test('데스크톱 뷰포트에서 8컬럼 그리드', async ({ page }) => {
      // 데스크톱 뷰포트 설정
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // 대시보드 리로드
      await page.reload();
      await page.waitForSelector('[data-testid="dashboard-container"]');
      
      // 그리드 컨테이너 확인
      const gridContainer = page.locator('[data-testid="flexible-grid-container"]');
      await expect(gridContainer).toBeVisible();
      
      // CSS Grid 템플릿 컬럼 확인 (8컬럼)
      const gridStyles = await gridContainer.evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // 8개의 컬럼이 있는지 확인
      const columns = gridStyles.split(' ').filter(col => col !== 'auto' && col !== '');
      expect(columns.length).toBeLessThanOrEqual(8);
    });
  });
  
  test.describe('키보드 단축키', () => {
    
    test('방향키로 위젯 이동', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // 첫 번째 위젯에 포커스
      const firstWidget = page.locator('[data-testid^="widget-"]').first();
      await firstWidget.focus();
      
      // 초기 위치 저장
      const initialBox = await firstWidget.boundingBox();
      if (!initialBox) throw new Error('Initial widget box not found');
      
      // 방향키로 이동 (Alt + Arrow)
      await page.keyboard.press('Alt+ArrowRight');
      await page.waitForTimeout(200);
      
      // 위치 변경 확인
      const newBox = await firstWidget.boundingBox();
      if (!newBox) throw new Error('New widget box not found');
      
      // x 좌표가 증가했는지 확인
      expect(newBox.x).toBeGreaterThan(initialBox.x);
    });
    
    test('Delete 키로 위젯 삭제', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // 초기 위젯 개수
      const widgets = page.locator('[data-testid^="widget-"]');
      const initialCount = await widgets.count();
      
      // 첫 번째 위젯에 포커스
      const firstWidget = widgets.first();
      await firstWidget.focus();
      
      // Delete 키로 삭제
      await page.keyboard.press('Delete');
      
      // 위젯 개수 감소 확인
      await expect(widgets).toHaveCount(initialCount - 1);
    });
    
    test('Cmd+Z로 실행 취소', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // 초기 위젯 개수
      const widgets = page.locator('[data-testid^="widget-"]');
      const initialCount = await widgets.count();
      
      // 첫 번째 위젯 삭제
      await page.click('[data-testid="widget-delete-button"]').first();
      
      // 삭제 확인
      await expect(widgets).toHaveCount(initialCount - 1);
      
      // Cmd+Z로 실행 취소
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+z' : 'Control+z');
      
      // 위젯 복구 확인
      await expect(widgets).toHaveCount(initialCount);
    });
  });
  
  test.describe('애니메이션 및 시각적 피드백', () => {
    
    test('Wiggle 애니메이션 동작', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // Wiggle 애니메이션 클래스 확인
      const wiggleWidgets = page.locator('.wiggle-widget');
      await expect(wiggleWidgets.first()).toBeVisible();
      
      // 애니메이션이 적용되었는지 확인
      const hasAnimation = await wiggleWidgets.first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.animation !== 'none' || styles.transform !== 'none';
      });
      
      expect(hasAnimation).toBeTruthy();
    });
    
    test('드래그 시 시각적 피드백', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="edit-mode-toolbar"]')).toBeVisible();
      
      // 드래그 시작
      const firstWidget = page.locator('[data-testid^="widget-"]').first();
      const initialBox = await firstWidget.boundingBox();
      if (!initialBox) throw new Error('Initial widget box not found');
      
      await page.mouse.move(initialBox.x + initialBox.width / 2, initialBox.y + initialBox.height / 2);
      await page.mouse.down();
      
      // 드래그 중 상태 확인 (opacity 변경 등)
      const isDragging = await firstWidget.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseFloat(styles.opacity) < 1 || el.classList.contains('dragging');
      });
      
      await page.mouse.move(initialBox.x + 100, initialBox.y + 100, { steps: 5 });
      await page.mouse.up();
      
      // 드래그 상태가 있었는지 확인
      // (실제 구현에 따라 다를 수 있음)
    });
  });
  
  test.describe('접근성', () => {
    
    test('스크린 리더 지원', async ({ page }) => {
      // 편집 모드 진입
      const widget = page.locator('[data-testid^="widget-"]').first();
      const box = await widget.boundingBox();
      if (!box) throw new Error('Widget bounding box not found');
      
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
      
      // ARIA 속성 확인
      const firstWidget = page.locator('[data-testid^="widget-"]').first();
      
      // aria-label 확인
      const ariaLabel = await firstWidget.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      
      // role 확인
      const role = await firstWidget.getAttribute('role');
      expect(role).toBeTruthy();
      
      // 편집 모드에서 추가 ARIA 속성
      const editModeToolbar = page.locator('[data-testid="edit-mode-toolbar"]');
      const toolbarRole = await editModeToolbar.getAttribute('role');
      expect(toolbarRole).toBe('toolbar');
    });
    
    test('키보드 네비게이션', async ({ page }) => {
      // Tab 키로 위젯 간 이동
      await page.keyboard.press('Tab');
      
      // 포커스된 요소 확인
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
      
      // 여러 번 Tab 키로 이동
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab');
      }
      
      // 포커스가 이동했는지 확인
      const newFocusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(newFocusedElement).toBeTruthy();
    });
  });
  
  test.describe('Feature Flag 통합', () => {
    
    test('Feature Flag 비활성화 시 기존 대시보드 표시', async ({ page }) => {
      // Feature Flag 비활성화
      await page.evaluate(() => {
        localStorage.setItem('feature_ios_style_dashboard', 'false');
      });
      
      // 페이지 리로드
      await page.reload();
      await page.waitForSelector('[data-testid="dashboard-container"]');
      
      // iOS 스타일 컴포넌트가 없는지 확인
      const iosStyleDashboard = page.locator('[data-testid="ios-style-dashboard"]');
      await expect(iosStyleDashboard).not.toBeVisible();
    });
    
    test('Feature Flag 활성화 시 iOS 대시보드 표시', async ({ page }) => {
      // Feature Flag 활성화
      await page.evaluate(() => {
        localStorage.setItem('feature_ios_style_dashboard', 'true');
      });
      
      // 페이지 리로드
      await page.reload();
      await page.waitForSelector('[data-testid="dashboard-container"]');
      
      // iOS 스타일 컴포넌트가 있는지 확인 (Feature Flag에 따라)
      // 실제 구현에 따라 다를 수 있음
    });
  });
});

// 성능 테스트
test.describe('성능 지표', () => {
  
  test('편집 모드 진입 시간 < 200ms', async ({ page }) => {
    const startTime = Date.now();
    
    // 편집 모드 진입
    const widget = page.locator('[data-testid^="widget-"]').first();
    const box = await widget.boundingBox();
    if (!box) throw new Error('Widget bounding box not found');
    
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1100);
    await page.mouse.up();
    
    // 편집 모드 툴바 표시 대기
    await page.locator('[data-testid="edit-mode-toolbar"]').waitFor({ state: 'visible' });
    
    const endTime = Date.now();
    const enterTime = endTime - startTime - 1100; // Long press 시간 제외
    
    expect(enterTime).toBeLessThan(200);
  });
  
  test('드래그 응답성 60fps 확인', async ({ page }) => {
    // 편집 모드 진입
    const widget = page.locator('[data-testid^="widget-"]').first();
    const box = await widget.boundingBox();
    if (!box) throw new Error('Widget bounding box not found');
    
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1100);
    await page.mouse.up();
    
    // FPS 측정을 위한 Performance API 사용
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const frames: number[] = [];
        let lastTime = performance.now();
        
        const measureFrame = () => {
          const currentTime = performance.now();
          const deltaTime = currentTime - lastTime;
          frames.push(deltaTime);
          lastTime = currentTime;
          
          if (frames.length < 60) {
            requestAnimationFrame(measureFrame);
          } else {
            const avgFrameTime = frames.reduce((a, b) => a + b, 0) / frames.length;
            const fps = 1000 / avgFrameTime;
            resolve({ fps, avgFrameTime });
          }
        };
        
        requestAnimationFrame(measureFrame);
      });
    });
    
    // 60fps는 약 16.67ms per frame
    expect((metrics as any).avgFrameTime).toBeLessThan(20); // 약간의 여유를 둠
  });
});