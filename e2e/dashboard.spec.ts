import { test, expect } from '@playwright/test'

/**
 * 대시보드 E2E 테스트
 */

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/login')
    
    // 테스트 계정으로 로그인 (환경 변수 또는 테스트 계정 사용)
    // 실제 테스트에서는 환경 변수나 테스트 계정을 사용해야 합니다
    // await page.fill('input[type="email"]', process.env.TEST_EMAIL || 'test@example.com')
    // await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'testpassword')
    // await page.click('button[type="submit"]')
    
    // 대시보드 페이지로 이동
    await page.goto('/dashboard')
  })

  test('should load dashboard page', async ({ page }) => {
    // 페이지 타이틀 확인 - Weave 타이틀 확인
    await expect(page).toHaveTitle(/Weave/)
    
    // 주요 요소 확인
    await expect(page.locator('h2:has-text("대시보드")')).toBeVisible()
  })

  test('should toggle edit mode', async ({ page }) => {
    // 편집 모드 버튼 찾기 - 실제 텍스트 사용
    const editButton = page.locator('button:has-text("대시보드 편집")')
    
    // 편집 모드 활성화
    await editButton.click()
    
    // 편집 모드 UI 확인
    await expect(page.locator('text=편집 완료')).toBeVisible()
    await expect(page.locator('text=대시보드 편집 모드')).toBeVisible()
    
    // 편집 모드 비활성화
    await page.locator('button:has-text("편집 완료")').click()
    
    // 원래 상태로 복귀 확인
    await expect(page.locator('text=대시보드 편집')).toBeVisible()
  })

  test('should add a widget', async ({ page }) => {
    // 편집 모드 활성화
    await page.locator('button:has-text("대시보드 편집")').click()
    
    // 위젯 추가 버튼 클릭
    await page.locator('button:has-text("위젯 추가")').click()
    
    // 위젯 라이브러리가 열리는지 확인
    await expect(page.locator('text=위젯 라이브러리')).toBeVisible()
    
    // 프로젝트 요약 위젯 선택
    const projectWidget = page.locator('text=프로젝트 요약').first()
    await projectWidget.click()
    
    // 위젯이 추가되었는지 확인
    await expect(page.locator('[data-widget-type="project-summary"]')).toBeVisible()
  })

  test('should change grid size', async ({ page }) => {
    // 편집 모드 활성화
    await page.locator('button:has-text("대시보드 편집")').click()
    
    // 4x4 그리드 선택
    await page.locator('[title="4x4 그리드"]').click()
    
    // 그리드 크기 변경 확인
    const gridContainer = page.locator('.grid')
    await expect(gridContainer).toHaveClass(/grid-cols-4/)
  })

  test('should save and load layout', async ({ page }) => {
    // 편집 모드 활성화
    await page.locator('button:has-text("대시보드 편집")').click()
    
    // 위젯 추가
    await page.locator('button:has-text("위젯 추가")').click()
    await page.locator('text=프로젝트 요약').first().click()
    
    // 저장
    await page.locator('button:has-text("저장")').click()
    
    // 페이지 새로고침
    await page.reload()
    
    // 위젯이 유지되는지 확인
    await expect(page.locator('[data-widget-type="project-summary"]')).toBeVisible()
  })

  test('should handle template manager', async ({ page }) => {
    // 템플릿 버튼 클릭
    await page.locator('button:has-text("템플릿")').click()
    
    // 템플릿 관리자 모달 확인
    await expect(page.locator('text=템플릿 라이브러리')).toBeVisible()
    
    // ESC로 닫기
    await page.keyboard.press('Escape')
    
    // 모달이 닫혔는지 확인
    await expect(page.locator('text=템플릿 라이브러리')).not.toBeVisible()
  })

  test.skip('should export and import layout', async ({ page }) => {
    // 내보내기/가져오기 기능이 아직 구현되지 않아 건너뜀
    // 편집 모드 활성화
    await page.locator('button:has-text("대시보드 편집")').click()
    
    // 내보내기 버튼 클릭
    const downloadPromise = page.waitForEvent('download')
    await page.locator('[title="레이아웃 내보내기"]').click()
    const download = await downloadPromise
    
    // 다운로드 확인
    expect(download.suggestedFilename()).toContain('dashboard-layout')
    
    // 가져오기 테스트는 파일 업로드가 필요하므로 생략
  })

  test.skip('should share layout', async ({ page }) => {
    // 공유 기능이 구현되지 않아 건너뜀
    // 편집 모드 활성화
    await page.locator('button:has-text("대시보드 편집")').click()
    
    // 공유 버튼 클릭
    await page.locator('[title="레이아웃 공유"]').click()
    
    // 공유 모달 확인
    await expect(page.locator('text=레이아웃 공유')).toBeVisible()
    
    // 링크 복사 버튼
    await page.locator('button:has-text("복사")').click()
    
    // 복사 완료 메시지 확인
    await expect(page.locator('text=복사됨')).toBeVisible()
  })

  test('should handle responsive layout', async ({ page, viewport }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 대시보드가 반응형으로 표시되는지 확인
    const gridContainer = page.locator('.grid')
    await expect(gridContainer).toHaveClass(/grid-cols-1/)
    
    // 태블릿 뷰포트로 변경
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // 그리드 컬럼 수 변경 확인
    await expect(gridContainer).toHaveClass(/grid-cols-2/)
  })
})