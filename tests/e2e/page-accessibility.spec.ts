import { test, expect } from '@playwright/test';

const pages = [
  { name: '랜딩 페이지', path: '/' },
  { name: '홈 페이지', path: '/home' },
  { name: '대시보드', path: '/dashboard' },
  { name: '프로젝트 목록', path: '/projects' },
  { name: '프로젝트 상세', path: '/projects/WEAVE_001' },
  { name: 'AI 업무비서', path: '/ai-assistant' },
  { name: 'AI 채팅', path: '/ai-assistant/chat' },
  { name: 'AI 문서 분석', path: '/ai-assistant/document' },
  { name: '리마인더', path: '/reminder' },
  { name: '사업자 조회', path: '/business-lookup' },
  { name: '설정', path: '/settings' },
];

test.describe('페이지 접근성 테스트', () => {
  for (const page of pages) {
    test(`${page.name} (${page.path}) 접근 가능 여부`, async ({ page: browserPage }) => {
      console.log(`\n테스트 중: ${page.name} (${page.path})`);
      
      try {
        // 페이지로 이동
        const response = await browserPage.goto(`http://localhost:3000${page.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        // 응답 상태 확인
        const status = response?.status() || 0;
        console.log(`- HTTP 상태 코드: ${status}`);
        
        // 페이지 제목 확인
        const title = await browserPage.title();
        console.log(`- 페이지 제목: ${title}`);
        
        // 에러 메시지 캡처
        const errorMessages: string[] = [];
        browserPage.on('console', msg => {
          if (msg.type() === 'error') {
            errorMessages.push(msg.text());
          }
        });
        
        // 페이지 로드 대기
        await browserPage.waitForTimeout(2000);
        
        // body 요소 확인
        const bodyExists = await browserPage.$('body') !== null;
        expect(bodyExists).toBe(true);
        
        // 에러 표시 확인
        const errorElement = await browserPage.$('[class*="error"], [id*="error"]');
        if (errorElement) {
          const errorText = await errorElement.textContent();
          console.log(`- ⚠️ 에러 요소 발견: ${errorText}`);
        }
        
        // 콘솔 에러 출력
        if (errorMessages.length > 0) {
          console.log(`- ❌ 콘솔 에러:`, errorMessages);
        }
        
        // 스크린샷 저장
        await browserPage.screenshot({ 
          path: `tests/screenshots/${page.path.replace(/\//g, '_') || 'root'}.png`,
          fullPage: true 
        });
        
        console.log(`✅ ${page.name} 접근 성공`);
        
      } catch (error) {
        console.error(`❌ ${page.name} 접근 실패:`, error);
        
        // 실패 시 스크린샷 저장
        try {
          await browserPage.screenshot({ 
            path: `tests/screenshots/error_${page.path.replace(/\//g, '_') || 'root'}.png`,
            fullPage: true 
          });
        } catch (screenshotError) {
          console.error('스크린샷 저장 실패:', screenshotError);
        }
        
        throw error;
      }
    });
  }
});

// 네비게이션 버튼 클릭 테스트
test.describe('네비게이션 버튼 테스트', () => {
  test('랜딩 페이지에서 시작하기 버튼 클릭', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // 시작하기 버튼 찾기
    const startButton = await page.getByRole('button', { name: /시작하기|Get Started/i });
    if (startButton) {
      console.log('시작하기 버튼 발견');
      await startButton.click();
      await page.waitForTimeout(2000);
      
      // 현재 URL 확인
      const currentUrl = page.url();
      console.log(`클릭 후 URL: ${currentUrl}`);
      
      // 스크린샷
      await page.screenshot({ path: 'tests/screenshots/after_start_button.png' });
    }
  });
  
  test('홈 페이지 네비게이션 메뉴 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/home');
    await page.waitForTimeout(2000);
    
    // 네비게이션 메뉴 항목들 확인
    const navItems = [
      { text: '대시보드', expectedUrl: '/dashboard' },
      { text: '프로젝트', expectedUrl: '/projects' },
      { text: 'AI 업무비서', expectedUrl: '/ai-assistant' },
      { text: '리마인더', expectedUrl: '/reminder' },
      { text: '사업자 조회', expectedUrl: '/business-lookup' },
      { text: '설정', expectedUrl: '/settings' },
    ];
    
    for (const item of navItems) {
      const link = await page.getByRole('link', { name: item.text });
      if (link) {
        console.log(`${item.text} 링크 발견`);
        const href = await link.getAttribute('href');
        console.log(`- href: ${href}`);
        expect(href).toContain(item.expectedUrl);
      } else {
        console.log(`❌ ${item.text} 링크를 찾을 수 없음`);
      }
    }
  });
});