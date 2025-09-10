/**
 * 세무 관련 데이터 포맷팅 유틸리티 함수
 */

/**
 * 금액을 한국식 형식으로 포맷팅
 */
export function formatKoreanCurrency(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  }
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)}천만`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만`;
  }
  return amount.toLocaleString('ko-KR');
}

/**
 * 금액을 완전한 원 단위로 포맷팅
 */
export function formatFullCurrency(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

/**
 * 백분율 포맷팅
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 날짜를 한국식 형식으로 포맷팅
 */
export function formatKoreanDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 날짜를 짧은 형식으로 포맷팅
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * 차트용 축 라벨 생성
 */
export function generateAxisLabel(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(0)}억`;
  }
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(0)}천만`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만`;
  }
  return value.toLocaleString('ko-KR');
}

/**
 * 차트 툴팁 데이터 포맷팅
 */
export interface TooltipData {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export function formatTooltipData(data: TooltipData[]): string {
  return data.map(item => {
    let text = `${item.label}: ${formatFullCurrency(item.value)}`;
    if (item.percentage !== undefined) {
      text += ` (${formatPercentage(item.percentage)})`;
    }
    return text;
  }).join('\n');
}

/**
 * 거래 유형별 색상 반환
 */
export function getTransactionTypeColor(type: '매출' | '매입'): {
  bg: string;
  text: string;
  border: string;
} {
  if (type === '매출') {
    return {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200'
    };
  }
  return {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200'
  };
}

/**
 * 월 이름 반환
 */
export function getMonthName(month: number): string {
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];
  return monthNames[month - 1] || '';
}

/**
 * 분기 이름 반환
 */
export function getQuarterName(month: number): string {
  if (month <= 3) return '1분기';
  if (month <= 6) return '2분기';
  if (month <= 9) return '3분기';
  return '4분기';
}

/**
 * D-Day 계산
 */
export function calculateDDay(targetDate: Date | string): {
  days: number;
  isOverdue: boolean;
  text: string;
} {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    days: Math.abs(days),
    isOverdue: days < 0,
    text: days === 0 ? 'D-Day' : days > 0 ? `D-${days}` : `D+${Math.abs(days)}`
  };
}

/**
 * 결제 상태별 색상 반환
 */
export function getPaymentStatusColor(status: 'pending' | 'completed' | 'failed'): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case 'completed':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: '완료'
      };
    case 'pending':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: '대기'
      };
    case 'failed':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: '실패'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        label: '알 수 없음'
      };
  }
}

/**
 * 세금 계산 헬퍼
 */
export function calculateVAT(supplyAmount: number, vatRate: number = 0.1): number {
  return Math.round(supplyAmount * vatRate);
}

export function calculateTotal(supplyAmount: number, vatAmount: number): number {
  return supplyAmount + vatAmount;
}

export function extractSupplyAmount(totalAmount: number, vatRate: number = 0.1): number {
  return Math.round(totalAmount / (1 + vatRate));
}