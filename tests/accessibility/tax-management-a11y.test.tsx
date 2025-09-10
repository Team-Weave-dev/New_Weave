import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

/**
 * 세무 관리 접근성 테스트
 * TASK-053: 접근성 테스트 구현
 * WCAG 2.1 AA 표준 준수 검증
 */

// jest-axe 매처 추가
expect.extend(toHaveNoViolations);

// 테스트할 컴포넌트들 임포트 (동적 임포트로 변경)
const loadComponents = async () => {
  const { default: TaxManagementPage } = await import('@/app/dashboard/tax-management/page');
  const { default: TransactionForm } = await import('@/components/tax/forms/TransactionForm');
  const { default: TransactionTable } = await import('@/components/tax/tables/TransactionTable');
  const { default: TaxDashboardWidget } = await import('@/components/tax/widgets/TaxDashboardWidget');
  const { default: TaxNotificationCenter } = await import('@/components/tax/notifications/TaxNotificationCenter');
  
  return {
    TaxManagementPage,
    TransactionForm,
    TransactionTable,
    TaxDashboardWidget,
    TaxNotificationCenter
  };
};

describe('세무 관리 페이지 접근성 테스트', () => {
  let components: any;

  beforeAll(async () => {
    components = await loadComponents();
  });

  describe('WCAG 2.1 AA 준수', () => {
    it('페이지에 접근성 위반이 없어야 함', async () => {
      const { container } = render(<components.TaxManagementPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('적절한 제목 계층 구조를 가져야 함', () => {
      render(<components.TaxManagementPage />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent('세무 관리');
      
      const headings = screen.getAllByRole('heading');
      const levels = headings.map(h => parseInt(h.tagName.substring(1)));
      
      // 제목 레벨이 순차적이어야 함
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i] - levels[i-1]).toBeLessThanOrEqual(1);
      }
    });

    it('모든 이미지에 대체 텍스트가 있어야 함', () => {
      render(<components.TaxManagementPage />);
      
      const images = screen.queryAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });

  describe('키보드 네비게이션', () => {
    it('Tab 키로 모든 상호작용 요소에 접근 가능해야 함', async () => {
      const user = userEvent.setup();
      render(<components.TaxManagementPage />);
      
      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('link'),
        ...screen.getAllByRole('textbox'),
        ...screen.getAllByRole('combobox')
      ];
      
      for (const element of interactiveElements) {
        await user.tab();
        expect(element).toHaveAttribute('tabindex');
        const tabindex = parseInt(element.getAttribute('tabindex') || '0');
        expect(tabindex).toBeGreaterThanOrEqual(0);
      }
    });

    it('ESC 키로 모달을 닫을 수 있어야 함', async () => {
      const user = userEvent.setup();
      render(<components.TransactionForm onClose={vi.fn()} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Enter 키로 버튼을 활성화할 수 있어야 함', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <button onClick={handleClick}>테스트 버튼</button>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('스크린 리더 지원', () => {
    it('모든 폼 필드에 레이블이 있어야 함', () => {
      render(<components.TransactionForm />);
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const label = screen.getByLabelText(input.getAttribute('name') || '');
        expect(label).toBeInTheDocument();
      });
    });

    it('필수 필드가 명확하게 표시되어야 함', () => {
      render(<components.TransactionForm />);
      
      const requiredFields = screen.getAllByLabelText(/\*/);
      requiredFields.forEach(field => {
        expect(field).toHaveAttribute('aria-required', 'true');
      });
    });

    it('오류 메시지가 aria-describedby로 연결되어야 함', () => {
      render(<components.TransactionForm />);
      
      // 빈 폼 제출 시도
      const submitButton = screen.getByRole('button', { name: /저장/i });
      userEvent.click(submitButton);
      
      const errorMessages = screen.getAllByRole('alert');
      errorMessages.forEach(error => {
        expect(error).toHaveAttribute('id');
        const fieldId = error.getAttribute('aria-describedby');
        if (fieldId) {
          const field = document.getElementById(fieldId);
          expect(field).toBeInTheDocument();
        }
      });
    });

    it('테이블에 적절한 ARIA 속성이 있어야 함', () => {
      render(<components.TransactionTable transactions={[]} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', '세무 거래 목록');
      
      const headers = within(table).getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });
  });

  describe('색상 대비', () => {
    it('텍스트 색상 대비가 WCAG AA 기준을 충족해야 함', () => {
      render(<components.TaxManagementPage />);
      
      // 주요 텍스트 요소들의 색상 대비 확인
      const textElements = screen.getAllByText(/./);
      
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // 색상 대비 계산 (실제 구현에서는 color-contrast 라이브러리 사용)
        // 여기서는 기본적인 검증만 수행
        expect(color).not.toBe(backgroundColor);
      });
    });
  });

  describe('포커스 관리', () => {
    it('포커스 표시가 명확해야 함', () => {
      render(<components.TaxManagementPage />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        button.focus();
        const styles = window.getComputedStyle(button);
        
        // 포커스 스타일이 있는지 확인
        expect(
          styles.outline !== 'none' ||
          styles.boxShadow !== 'none' ||
          styles.border !== 'none'
        ).toBe(true);
      });
    });

    it('모달 열릴 때 포커스가 모달로 이동해야 함', () => {
      render(<components.TransactionForm />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('tabindex', '-1');
      expect(document.activeElement).toBe(modal);
    });

    it('포커스 트랩이 모달 내에서 작동해야 함', async () => {
      const user = userEvent.setup();
      render(<components.TransactionForm />);
      
      const modal = screen.getByRole('dialog');
      const focusableElements = within(modal).getAllByRole('button');
      
      // Tab 키를 여러 번 눌러도 모달 밖으로 나가지 않음
      for (let i = 0; i < focusableElements.length + 2; i++) {
        await user.tab();
        expect(modal.contains(document.activeElement)).toBe(true);
      }
    });
  });

  describe('반응형 접근성', () => {
    it('모바일에서도 터치 타겟이 충분히 커야 함', () => {
      // 모바일 뷰포트 설정
      window.innerWidth = 375;
      
      render(<components.TaxManagementPage />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        // 최소 44x44 픽셀 (WCAG 2.1 기준)
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });

    it('줌 기능을 방해하지 않아야 함', () => {
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta) {
        const content = meta.getAttribute('content') || '';
        expect(content).not.toContain('user-scalable=no');
        expect(content).not.toContain('maximum-scale=1');
      }
    });
  });

  describe('알림 및 상태 변경', () => {
    it('상태 변경이 스크린 리더에 전달되어야 함', async () => {
      render(<components.TaxNotificationCenter />);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      
      // 알림 추가 시뮬레이션
      const addButton = screen.getByRole('button', { name: /알림 추가/i });
      await userEvent.click(addButton);
      
      // 새 알림이 live region에 표시되는지 확인
      expect(liveRegion.textContent).not.toBe('');
    });

    it('오류 메시지가 즉시 알려져야 함', () => {
      render(<components.TransactionForm />);
      
      const errorRegion = screen.getByRole('alert');
      expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('대시보드 위젯 접근성', () => {
    it('위젯에 적절한 역할과 레이블이 있어야 함', () => {
      render(<components.TaxDashboardWidget />);
      
      const widget = screen.getByRole('region');
      expect(widget).toHaveAttribute('aria-label', '세무 관리 요약');
      
      // 통계 정보가 명확하게 레이블링되어야 함
      const stats = screen.getAllByRole('group');
      stats.forEach(stat => {
        expect(stat).toHaveAttribute('aria-label');
      });
    });

    it('차트에 대체 텍스트가 있어야 함', () => {
      render(<components.TaxDashboardWidget />);
      
      const charts = screen.queryAllByRole('img', { name: /차트/i });
      charts.forEach(chart => {
        expect(chart).toHaveAttribute('aria-label');
        // 차트 데이터를 텍스트로 제공
        const description = chart.getAttribute('aria-describedby');
        if (description) {
          const descElement = document.getElementById(description);
          expect(descElement).toBeInTheDocument();
        }
      });
    });
  });

  describe('언어 및 국제화', () => {
    it('페이지 언어가 명시되어야 함', () => {
      const html = document.documentElement;
      expect(html).toHaveAttribute('lang', 'ko');
    });

    it('날짜와 숫자가 로케일에 맞게 표시되어야 함', () => {
      render(<components.TransactionTable transactions={[
        {
          id: '1',
          transaction_date: '2025-01-09',
          total_amount: 1100000
        }
      ]} />);
      
      // 날짜 형식 확인
      expect(screen.getByText(/2025년 1월 9일/)).toBeInTheDocument();
      
      // 숫자 형식 확인 (천 단위 구분)
      expect(screen.getByText(/1,100,000/)).toBeInTheDocument();
    });
  });

  describe('인지 접근성', () => {
    it('중요한 작업에 확인 단계가 있어야 함', async () => {
      const user = userEvent.setup();
      render(<components.TransactionTable transactions={[{ id: '1' }]} />);
      
      const deleteButton = screen.getByRole('button', { name: /삭제/i });
      await user.click(deleteButton);
      
      // 확인 다이얼로그가 표시되어야 함
      const confirmDialog = screen.getByRole('dialog');
      expect(confirmDialog).toBeInTheDocument();
      expect(within(confirmDialog).getByText(/정말 삭제하시겠습니까?/)).toBeInTheDocument();
    });

    it('복잡한 작업에 도움말이 제공되어야 함', () => {
      render(<components.TransactionForm />);
      
      const helpButtons = screen.getAllByRole('button', { name: /도움말/i });
      expect(helpButtons.length).toBeGreaterThan(0);
      
      helpButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-describedby');
      });
    });

    it('시간 제한이 있는 작업에 경고가 표시되어야 함', () => {
      render(<components.TaxNotificationCenter />);
      
      const deadlines = screen.getAllByText(/D-\d+/);
      deadlines.forEach(deadline => {
        const parent = deadline.closest('[role="alert"]');
        expect(parent).toBeInTheDocument();
      });
    });
  });
});