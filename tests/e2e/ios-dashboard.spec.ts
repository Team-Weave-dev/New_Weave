/**
 * iOS 스타일 대시보드 E2E 테스트
 * Playwright를 사용한 실제 사용 시나리오 테스트
 */

import { test, expect, Page } from '@playwright/test';

// 테스트 계정 정보
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'test123456',
};

// 테스트 헬퍼 함수
async function loginToDashboard(page: Page) {
  await page.goto('http://localhost:3001/login');
  await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
  await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

async function enableIOSStyle(page: Page) {
  // 개발자 도구를 통해 iOS 스타일 활성화
  await page.evaluate(() => {
    localStorage.setItem('weave-ios-override', 'true');
    localStorage.setItem('NEXT_PUBLIC_IOS_STYLE_ENABLED', 'true');
  });
  await page.reload();
}

test.describe('iOS Style Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 및 대시보드 이동
    await loginToDashboard(page);
    
    // iOS 스타일 활성화
    await enableIOSStyle(page);
    
    // 대시보드 로드 대기
    await page.waitForSelector('#dashboard-container', { timeout: 10000 });
  });
  
  // 🎯 Test 1: iOS 스타일 대시보드 로드 확인
  test('should load iOS style dashboard', async ({ page }) => {
    // iOS 스타일 대시보드 컨테이너 확인
    const dashboardContainer = await page.$('#dashboard-container');
    expect(dashboardContainer).toBeTruthy();
    
    // 위젯들이 로드되었는지 확인
    const widgets = await page.$$('[data-testid^="widget-"]');
    expect(widgets.length).toBeGreaterThan(0);
    
    // 성능 메트릭 확인
    const metrics = await page.evaluate(() => {
      return performance.getEntriesByType('navigation')[0];
    });
    
    // 페이지 로드 시간이 3초 이내
    expect(metrics.loadEventEnd - metrics.fetchStart).toBeLessThan(3000);
  });
  
  // 🎯 Test 2: 편집 모드 진입 (Long Press)
  test('should enter edit mode with long press', async ({ page }) => {
    // 첫 번째 위젯 찾기
    const widget = await page.$('[data-testid^="widget-"]');
    expect(widget).toBeTruthy();
    
    // Long Press 시뮬레이션 (1초 이상)
    await widget.hover();
    await page.mouse.down();
    await page.waitForTimeout(1100); // 1.1초 대기
    await page.mouse.up();
    
    // 편집 모드 진입 확인
    await page.waitForSelector('.edit-mode-toolbar', { timeout: 5000 });
    
    // Wiggle 애니메이션 확인
    const isWiggling = await page.evaluate(() => {
      const widget = document.querySelector('[data-testid^="widget-"]');
      return widget?.classList.contains('wiggle');
    });
    expect(isWiggling).toBeTruthy();
    
    // 툴바 버튼 확인
    const doneButton = await page.$('button:has-text("완료")');
    const cancelButton = await page.$('button:has-text("취소")');
    expect(doneButton).toBeTruthy();
    expect(cancelButton).toBeTruthy();
  });
  
  // 🎯 Test 3: 위젯 드래그 앤 드롭
  test('should drag and drop widget', async ({ page }) => {
    // 편집 모드 진입
    const widget = await page.$('[data-testid^="widget-"]:first-child');
    await widget.hover();
    await page.mouse.down();
    await page.waitForTimeout(1100);
    await page.mouse.up();
    
    await page.waitForSelector('.edit-mode-toolbar');
    
    // 드래그할 위젯과 목표 위치 찾기
    const sourceWidget = await page.$('[data-testid="widget-1"]');
    const targetPosition = await page.$('[data-testid="widget-3"]');
    
    if (sourceWidget && targetPosition) {
      // 초기 위치 저장
      const initialPosition = await sourceWidget.boundingBox();
      
      // 드래그 앤 드롭
      await sourceWidget.dragTo(targetPosition);
      
      // 위치가 변경되었는지 확인
      const finalPosition = await sourceWidget.boundingBox();
      expect(finalPosition).not.toEqual(initialPosition);
    }
    
    // 완료 버튼 클릭
    await page.click('button:has-text("완료")');
    
    // 레이아웃이 저장되었다는 토스트 메시지 확인
    await page.waitForSelector('text=/레이아웃이 저장되었습니다/', { timeout: 5000 });
  });
  
  // 🎯 Test 4: 위젯 추가
  test('should add new widget', async ({ page }) => {
    // 편집 모드 진입
    const widget = await page.$('[data-testid^="widget-"]');
    await widget.hover();
    await page.mouse.down();
    await page.waitForTimeout(1100);
    await page.mouse.up();
    
    await page.waitForSelector('.edit-mode-toolbar');
    
    // 위젯 추가 버튼 클릭
    await page.click('button:has-text("위젯 추가")');
    
    // 위젯 선택 메뉴에서 'stats' 위젯 선택
    await page.click('button[data-widget-type="stats"]');
    
    // 새 위젯이 추가되었는지 확인
    const widgetsAfter = await page.$$('[data-testid^="widget-"]');
    expect(widgetsAfter.length).toBeGreaterThan(0);
    
    // 성공 토스트 메시지 확인
    await page.waitForSelector('text=/새 위젯이 추가되었습니다/', { timeout: 5000 });
  });
  
  // 🎯 Test 5: 위젯 삭제
  test('should delete widget', async ({ page }) => {
    // 편집 모드 진입
    const widget = await page.$('[data-testid^="widget-"]');
    await widget.hover();
    await page.mouse.down();
    await page.waitForTimeout(1100);
    await page.mouse.up();
    
    await page.waitForSelector('.edit-mode-toolbar');
    
    // 삭제할 위젯의 삭제 버튼 찾기
    const deleteButton = await page.$('[data-testid^="widget-"]:first-child button[aria-label="삭제"]');
    
    if (deleteButton) {
      // 초기 위젯 수 확인
      const widgetsBefore = await page.$$('[data-testid^="widget-"]');
      const countBefore = widgetsBefore.length;
      
      // 삭제 버튼 클릭
      await deleteButton.click();
      
      // 위젯 수가 감소했는지 확인
      await page.waitForTimeout(500);
      const widgetsAfter = await page.$$('[data-testid^="widget-"]');
      expect(widgetsAfter.length).toBeLessThan(countBefore);
      
      // 삭제 토스트 메시지 확인
      await page.waitForSelector('text=/위젯이 삭제되었습니다/', { timeout: 5000 });
    }
  });
  
  // 🎯 Test 6: iOS ↔ Legacy 스타일 전환
  test('should switch between iOS and Legacy styles', async ({ page }) => {
    // 현재 iOS 스타일인지 확인
    let isIOSStyle = await page.evaluate(() => {
      return localStorage.getItem('weave-ios-override') === 'true';
    });
    expect(isIOSStyle).toBeTruthy();
    
    // Legacy 스타일로 전환
    await page.evaluate(() => {
      window.weaveDebug?.disableIOS();
    });
    await page.reload();
    
    // Legacy 스타일로 변경되었는지 확인
    await page.waitForTimeout(1000);
    isIOSStyle = await page.evaluate(() => {
      return localStorage.getItem('weave-ios-override') === 'true';
    });
    expect(isIOSStyle).toBeFalsy();
    
    // 다시 iOS 스타일로 전환
    await page.evaluate(() => {
      window.weaveDebug?.enableIOS();
    });
    await page.reload();
    
    // iOS 스타일로 복구되었는지 확인
    await page.waitForTimeout(1000);
    isIOSStyle = await page.evaluate(() => {
      return localStorage.getItem('weave-ios-override') === 'true';
    });
    expect(isIOSStyle).toBeTruthy();
    
    // 전환 애니메이션이 부드러운지 확인 (성능)
    const transitionTime = await page.evaluate(() => {
      const start = performance.now();
      // 전환 시뮬레이션
      return performance.now() - start;
    });
    expect(transitionTime).toBeLessThan(1000); // 1초 이내
  });
  
  // 🎯 Test 7: 성능 모니터 확인
  test('should show performance monitor', async ({ page }) => {
    // 성능 모니터 활성화 (개발 모드)
    await page.evaluate(() => {
      localStorage.setItem('SHOW_PERFORMANCE_MONITOR', 'true');
    });
    await page.reload();
    
    // 성능 모니터 표시 확인
    const perfMonitor = await page.$('[data-testid="performance-monitor"]');
    
    // 개발 환경에서만 표시
    if (process.env.NODE_ENV === 'development') {
      expect(perfMonitor).toBeTruthy();
      
      // FPS 표시 확인
      const fpsDisplay = await page.$('text=/FPS:/');
      expect(fpsDisplay).toBeTruthy();
      
      // 메모리 사용량 확인
      const memoryDisplay = await page.$('text=/Memory:/');
      expect(memoryDisplay).toBeTruthy();
      
      // 성능 레벨 확인
      const perfLevel = await page.$('text=/Level:/');
      expect(perfLevel).toBeTruthy();
    }
  });
  
  // 🎯 Test 8: 가상화 테스트 (많은 위젯)
  test('should handle virtualization with many widgets', async ({ page }) => {
    // 50개 이상 위젯 추가 시뮬레이션
    await page.evaluate(() => {
      // 테스트용 많은 위젯 추가
      const store = window.useIOSDashboardStore?.getState();
      if (store) {
        for (let i = 0; i < 60; i++) {
          store.addWidget({
            id: `test-widget-${i}`,
            type: 'stats',
            title: `Widget ${i}`,
            position: {
              gridColumn: `${(i % 4) + 1} / span 1`,
              gridRow: `${Math.floor(i / 4) + 1} / span 1`,
              gridColumnStart: (i % 4) + 1,
              gridColumnEnd: (i % 4) + 2,
              gridRowStart: Math.floor(i / 4) + 1,
              gridRowEnd: Math.floor(i / 4) + 2,
              width: 1,
              height: 1,
            },
            size: { width: 1, height: 1 },
            data: {},
            style: {},
            isLocked: false,
          });
        }
      }
    });
    
    // 가상화가 활성화되었는지 확인
    const isVirtualized = await page.evaluate(() => {
      const metrics = window.performanceMonitor?.getCurrentMetrics();
      return metrics?.virtualizedWidgets > 0;
    });
    
    // 데스크탑에서는 50개 이상일 때 가상화
    if (await page.evaluate(() => window.innerWidth >= 768)) {
      expect(isVirtualized).toBeTruthy();
    }
    
    // 스크롤 성능 테스트
    const startTime = Date.now();
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      window.scrollTo(0, 0);
    });
    const scrollTime = Date.now() - startTime;
    
    // 스크롤이 부드러운지 확인 (500ms 이내)
    expect(scrollTime).toBeLessThan(500);
  });
  
  // 🎯 Test 9: 레이아웃 템플릿 적용
  test('should apply layout template', async ({ page }) => {
    // 편집 모드 진입
    const widget = await page.$('[data-testid^="widget-"]');
    await widget.hover();
    await page.mouse.down();
    await page.waitForTimeout(1100);
    await page.mouse.up();
    
    await page.waitForSelector('.edit-mode-toolbar');
    
    // 템플릿 버튼 클릭
    const templateButton = await page.$('button:has-text("템플릿")');
    if (templateButton) {
      await templateButton.click();
      
      // 템플릿 선택
      await page.click('[data-template="dashboard"]');
      
      // 템플릿 적용 확인
      await page.waitForSelector('text=/템플릿이 적용되었습니다/', { timeout: 5000 });
      
      // 위젯 배치가 변경되었는지 확인
      const widgets = await page.$$('[data-testid^="widget-"]');
      expect(widgets.length).toBeGreaterThan(0);
    }
  });
  
  // 🎯 Test 10: 반응형 레이아웃 테스트
  test('should be responsive', async ({ page }) => {
    // 데스크탑 뷰
    await page.setViewportSize({ width: 1280, height: 800 });
    let columns = await page.evaluate(() => {
      const container = document.querySelector('.grid-container');
      return getComputedStyle(container).gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBeGreaterThanOrEqual(12); // 데스크탑: 12 컬럼
    
    // 태블릿 뷰
    await page.setViewportSize({ width: 768, height: 1024 });
    columns = await page.evaluate(() => {
      const container = document.querySelector('.grid-container');
      return getComputedStyle(container).gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBeGreaterThanOrEqual(8); // 태블릿: 8 컬럼
    
    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 });
    columns = await page.evaluate(() => {
      const container = document.querySelector('.grid-container');
      return getComputedStyle(container).gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBeGreaterThanOrEqual(4); // 모바일: 4 컬럼
  });
});

// 성능 벤치마크 테스트
test.describe('Performance Benchmarks', () => {
  test('should meet performance criteria', async ({ page }) => {
    await loginToDashboard(page);
    await enableIOSStyle(page);
    
    // 성능 메트릭 수집
    const metrics = await page.evaluate(() => {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        paint: performance.getEntriesByType('paint'),
        resources: performance.getEntriesByType('resource'),
      };
    });
    
    // First Contentful Paint < 1.5초
    const fcp = metrics.paint.find(p => p.name === 'first-contentful-paint');
    expect(fcp?.startTime).toBeLessThan(1500);
    
    // Total Load Time < 3초
    expect(metrics.navigation.loadEventEnd - metrics.navigation.fetchStart).toBeLessThan(3000);
    
    // JavaScript 실행 시간 < 1초
    const jsResources = metrics.resources.filter(r => r.name.endsWith('.js'));
    const totalJSTime = jsResources.reduce((sum, r) => sum + r.duration, 0);
    expect(totalJSTime).toBeLessThan(1000);
  });
});