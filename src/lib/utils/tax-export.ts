import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';

/**
 * 거래 데이터를 Excel 파일로 내보내기
 */
export function exportTransactionsToExcel(
  transactions: Transaction[],
  filename?: string
): void {
  // 데이터 준비
  const data = transactions.map(t => ({
    '거래일': format(new Date(t.transaction_date), 'yyyy-MM-dd', { locale: ko }),
    '구분': t.transaction_type === 'sales' ? '매출' : '매입',
    '거래처명': t.supplier_name,
    '사업자번호': t.supplier_business_number || '',
    '공급가액': Number(t.supply_amount),
    '부가세': Number(t.vat_amount),
    '합계': Number(t.total_amount),
    '결제상태': getPaymentStatusLabel(t.payment_status),
    '계산서번호': t.invoice_number || '',
    '프로젝트': t.project_id || '',
    '메모': t.notes || ''
  }));

  // 워크시트 생성
  const ws = XLSX.utils.json_to_sheet(data);

  // 컬럼 너비 설정
  const colWidths = [
    { wch: 12 }, // 거래일
    { wch: 8 },  // 구분
    { wch: 20 }, // 거래처명
    { wch: 15 }, // 사업자번호
    { wch: 15 }, // 공급가액
    { wch: 12 }, // 부가세
    { wch: 15 }, // 합계
    { wch: 10 }, // 결제상태
    { wch: 15 }, // 계산서번호
    { wch: 15 }, // 프로젝트
    { wch: 30 }  // 메모
  ];
  ws['!cols'] = colWidths;

  // 워크북 생성
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '거래내역');

  // 파일명 생성
  const exportFilename = filename || 
    `거래내역_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  // 파일 다운로드
  XLSX.writeFile(wb, exportFilename);
}

/**
 * 거래 데이터를 CSV 파일로 내보내기
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  filename?: string
): void {
  // CSV 헤더
  const headers = [
    '거래일',
    '구분',
    '거래처명',
    '사업자번호',
    '공급가액',
    '부가세',
    '합계',
    '결제상태',
    '계산서번호',
    '프로젝트',
    '메모'
  ];

  // CSV 데이터 준비
  const rows = transactions.map(t => [
    format(new Date(t.transaction_date), 'yyyy-MM-dd', { locale: ko }),
    t.transaction_type === 'sales' ? '매출' : '매입',
    t.supplier_name,
    t.supplier_business_number || '',
    Number(t.supply_amount).toString(),
    Number(t.vat_amount).toString(),
    Number(t.total_amount).toString(),
    getPaymentStatusLabel(t.payment_status),
    t.invoice_number || '',
    t.project_id || '',
    t.notes || ''
  ]);

  // CSV 문자열 생성 (BOM 추가로 한글 깨짐 방지)
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        // 쉼표나 줄바꿈이 포함된 경우 따옴표로 감싸기
        if (cell.includes(',') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  // Blob 생성
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 다운로드 링크 생성
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || 
    `거래내역_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 월별 요약 보고서 Excel 내보내기
 */
export function exportMonthlySummaryToExcel(
  transactions: Transaction[],
  year: number,
  month: number
): void {
  // 월별 데이터 필터링
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.transaction_date);
    return date >= startDate && date <= endDate;
  });

  // 요약 데이터 계산
  const summary = {
    totalSales: monthlyTransactions
      .filter(t => t.transaction_type === 'sales')
      .reduce((sum, t) => sum + Number(t.total_amount), 0),
    totalPurchases: monthlyTransactions
      .filter(t => t.transaction_type === 'purchase')
      .reduce((sum, t) => sum + Number(t.total_amount), 0),
    totalVat: monthlyTransactions
      .reduce((sum, t) => sum + Number(t.vat_amount), 0),
    transactionCount: monthlyTransactions.length
  };

  // 워크북 생성
  const wb = XLSX.utils.book_new();

  // 요약 시트
  const summaryData = [
    ['월별 세무 요약 보고서'],
    [''],
    ['기간', `${year}년 ${month}월`],
    [''],
    ['구분', '금액'],
    ['총 매출', summary.totalSales],
    ['총 매입', summary.totalPurchases],
    ['순이익', summary.totalSales - summary.totalPurchases],
    ['총 부가세', summary.totalVat],
    ['거래 건수', summary.transactionCount],
    [''],
    ['일평균 매출', Math.round(summary.totalSales / 30)],
    ['일평균 매입', Math.round(summary.totalPurchases / 30)]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, '요약');

  // 상세 거래 시트
  const detailData = monthlyTransactions.map(t => ({
    '거래일': format(new Date(t.transaction_date), 'yyyy-MM-dd'),
    '구분': t.transaction_type === 'sales' ? '매출' : '매입',
    '거래처': t.supplier_name,
    '공급가액': Number(t.supply_amount),
    '부가세': Number(t.vat_amount),
    '합계': Number(t.total_amount),
    '결제상태': getPaymentStatusLabel(t.payment_status)
  }));

  const detailSheet = XLSX.utils.json_to_sheet(detailData);
  detailSheet['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 20 },
    { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 10 }
  ];
  XLSX.utils.book_append_sheet(wb, detailSheet, '상세내역');

  // 파일 다운로드
  const filename = `세무보고서_${year}년${month}월_${format(new Date(), 'yyyyMMdd')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 부가세 신고용 데이터 내보내기
 */
export function exportVATReport(
  transactions: Transaction[],
  year: number,
  quarter: number
): void {
  // 분기별 기간 계산
  const startMonth = (quarter - 1) * 3;
  const endMonth = quarter * 3 - 1;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth + 1, 0);

  const quarterTransactions = transactions.filter(t => {
    const date = new Date(t.transaction_date);
    return date >= startDate && date <= endDate;
  });

  // 매출/매입 분리
  const sales = quarterTransactions.filter(t => t.transaction_type === 'sales');
  const purchases = quarterTransactions.filter(t => t.transaction_type === 'purchase');

  // 워크북 생성
  const wb = XLSX.utils.book_new();

  // 매출 시트
  const salesData = sales.map(t => ({
    '거래일': format(new Date(t.transaction_date), 'yyyy-MM-dd'),
    '거래처': t.supplier_name,
    '사업자번호': t.supplier_business_number || '',
    '공급가액': Number(t.supply_amount),
    '부가세': Number(t.vat_amount),
    '합계': Number(t.total_amount),
    '계산서번호': t.invoice_number || ''
  }));

  if (salesData.length > 0) {
    const salesSheet = XLSX.utils.json_to_sheet(salesData);
    salesSheet['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, salesSheet, '매출');
  }

  // 매입 시트
  const purchasesData = purchases.map(t => ({
    '거래일': format(new Date(t.transaction_date), 'yyyy-MM-dd'),
    '거래처': t.supplier_name,
    '사업자번호': t.supplier_business_number || '',
    '공급가액': Number(t.supply_amount),
    '부가세': Number(t.vat_amount),
    '합계': Number(t.total_amount),
    '계산서번호': t.invoice_number || ''
  }));

  if (purchasesData.length > 0) {
    const purchasesSheet = XLSX.utils.json_to_sheet(purchasesData);
    purchasesSheet['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, purchasesSheet, '매입');
  }

  // 요약 시트
  const summaryData = [
    ['부가가치세 신고 자료'],
    [''],
    ['신고 기간', `${year}년 ${quarter}분기`],
    ['기간', `${format(startDate, 'yyyy-MM-dd')} ~ ${format(endDate, 'yyyy-MM-dd')}`],
    [''],
    ['구분', '건수', '공급가액', '부가세', '합계'],
    [
      '매출',
      sales.length,
      sales.reduce((sum, t) => sum + Number(t.supply_amount), 0),
      sales.reduce((sum, t) => sum + Number(t.vat_amount), 0),
      sales.reduce((sum, t) => sum + Number(t.total_amount), 0)
    ],
    [
      '매입',
      purchases.length,
      purchases.reduce((sum, t) => sum + Number(t.supply_amount), 0),
      purchases.reduce((sum, t) => sum + Number(t.vat_amount), 0),
      purchases.reduce((sum, t) => sum + Number(t.total_amount), 0)
    ],
    [''],
    [
      '납부세액',
      '',
      '',
      sales.reduce((sum, t) => sum + Number(t.vat_amount), 0) - 
      purchases.reduce((sum, t) => sum + Number(t.vat_amount), 0),
      ''
    ]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, summarySheet, '요약');

  // 파일 다운로드
  const filename = `부가세신고_${year}년${quarter}분기_${format(new Date(), 'yyyyMMdd')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// 결제 상태 라벨 헬퍼
function getPaymentStatusLabel(status?: string): string {
  switch (status) {
    case 'paid':
      return '완료';
    case 'pending':
      return '대기';
    case 'overdue':
      return '연체';
    default:
      return '대기';
  }
}