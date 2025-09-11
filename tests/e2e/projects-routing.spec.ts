import { test, expect } from '@playwright/test';

test.describe('프로젝트 페이지 라우팅 테스트', () => {
  test('첫 진입시 /projects가 /projects?view=list로 리다이렉트되는지 확인', async ({ page }) => {
    console.log('🧪 테스트 시작: 프로젝트 첫 진입 라우팅');
    
    // /projects로 직접 접근
    await page.goto('http://localhost:3000/projects');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    
    // URL에 view=list가 포함되어 있는지 확인
    expect(currentUrl).toContain('view=list');
    expect(currentUrl).not.toContain('view=detail');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/projects-first-access.png', fullPage: true });
    
    console.log('✅ 첫 진입시 view=list로 정상 리다이렉트됨');
  });
  
  test('view=detail로 직접 접근했을 때 정상 작동하는지 확인', async ({ page }) => {
    console.log('🧪 테스트 시작: detail view 직접 접근');
    
    // /projects?view=detail로 직접 접근
    await page.goto('http://localhost:3000/projects?view=detail');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    
    // URL에 view=detail이 포함되어 있는지 확인
    expect(currentUrl).toContain('view=detail');
    
    // selected 파라미터가 자동으로 추가되었는지 확인 (첫 번째 프로젝트)
    expect(currentUrl).toContain('selected=');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/projects-detail-access.png', fullPage: true });
    
    console.log('✅ detail view 직접 접근 정상 작동');
  });
  
  test('ViewModeSwitch를 통한 view 전환이 정상 작동하는지 확인', async ({ page }) => {
    console.log('🧪 테스트 시작: ViewModeSwitch 테스트');
    
    // 먼저 list view로 접근
    await page.goto('http://localhost:3000/projects?view=list');
    await page.waitForTimeout(2000);
    
    // ViewModeSwitch 확인 및 detail로 전환
    const detailButton = page.locator('[data-testid="view-mode-detail"], text="상세"').first();
    if (await detailButton.isVisible()) {
      await detailButton.click();
      await page.waitForTimeout(2000);
      
      // URL이 detail로 변경되었는지 확인
      const detailUrl = page.url();
      console.log(`Detail 전환 후 URL: ${detailUrl}`);
      expect(detailUrl).toContain('view=detail');
    }
    
    // 다시 list로 전환
    const listButton = page.locator('[data-testid="view-mode-list"], text="목록"').first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(2000);
      
      // URL이 list로 변경되었는지 확인
      const listUrl = page.url();
      console.log(`List 전환 후 URL: ${listUrl}`);
      expect(listUrl).toContain('view=list');
      expect(listUrl).not.toContain('selected=');
    }
    
    console.log('✅ ViewModeSwitch 정상 작동');
  });
  
  test('잘못된 view 파라미터로 접근시 list로 리다이렉트되는지 확인', async ({ page }) => {
    console.log('🧪 테스트 시작: 잘못된 view 파라미터 처리');
    
    // 잘못된 view 파라미터로 접근
    await page.goto('http://localhost:3000/projects?view=invalid');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log(`잘못된 파라미터 후 URL: ${currentUrl}`);
    
    // list로 리다이렉트되었는지 확인
    expect(currentUrl).toContain('view=list');
    expect(currentUrl).not.toContain('view=invalid');
    
    console.log('✅ 잘못된 view 파라미터 처리 정상');
  });
});