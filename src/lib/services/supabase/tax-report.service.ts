import { createClient } from '@/lib/services/supabase/client';
import type { Transaction } from './tax-transactions.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

// jsPDF AutoTable 타입 확장
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface MonthlyReport {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  summary: {
    totalPurchase: number;
    totalSale: number;
    purchaseVat: number;
    saleVat: number;
    netVat: number;
    totalTransactions: number;
  };
  topSuppliers: Array<{
    name: string;
    businessNumber: string;
    amount: number;
    transactionCount: number;
  }>;
  topClients: Array<{
    name: string;
    businessNumber: string;
    amount: number;
    transactionCount: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    purchase: number;
    sale: number;
    netAmount: number;
  }>;
}

export interface QuarterlyVATReport {
  year: number;
  quarter: number;
  startDate: string;
  endDate: string;
  summary: {
    totalSales: number;
    salesVAT: number;
    totalPurchases: number;
    purchaseVAT: number;
    vatPayable: number;
    previousQuarterCarryOver: number;
    finalVATPayable: number;
  };
  monthlyBreakdown: Array<{
    month: number;
    sales: number;
    salesVAT: number;
    purchases: number;
    purchaseVAT: number;
  }>;
  taxInvoiceDetails: Array<{
    date: string;
    supplierName: string;
    businessNumber: string;
    supplyAmount: number;
    vatAmount: number;
    totalAmount: number;
    documentNumber: string;
  }>;
}

/**
 * 월별 세무 보고서 생성
 */
export async function generateMonthlyReport(
  year: number,
  month: number
): Promise<MonthlyReport> {
  const supabase = createClient();
  
  // 월의 시작일과 종료일 계산
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  
  // 거래 데이터 조회
  const { data: transactions, error } = await supabase
    .from('tax_transactions')
    .select('*')
    .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
    .lte('transaction_date', format(endDate, 'yyyy-MM-dd'))
    .order('transaction_date', { ascending: true });

  if (error) throw error;

  // 요약 계산
  const summary = transactions.reduce((acc, txn) => {
    if (txn.transaction_type === 'purchase') {
      acc.totalPurchase += Number(txn.supply_amount) || 0;
      acc.purchaseVat += Number(txn.vat_amount) || 0;
    } else {
      acc.totalSale += Number(txn.supply_amount) || 0;
      acc.saleVat += Number(txn.vat_amount) || 0;
    }
    acc.totalTransactions++;
    return acc;
  }, {
    totalPurchase: 0,
    totalSale: 0,
    purchaseVat: 0,
    saleVat: 0,
    netVat: 0,
    totalTransactions: 0
  });

  summary.netVat = summary.saleVat - summary.purchaseVat;

  // 거래처별 집계
  const supplierMap = new Map<string, any>();
  const clientMap = new Map<string, any>();

  transactions.forEach(txn => {
    const map = txn.transaction_type === 'purchase' ? supplierMap : clientMap;
    const key = txn.supplier_name || 'Unknown';
    
    if (!map.has(key)) {
      map.set(key, {
        name: txn.supplier_name,
        businessNumber: txn.supplier_business_number,
        amount: 0,
        transactionCount: 0
      });
    }
    
    const entry = map.get(key);
    entry.amount += Number(txn.total_amount) || 0;
    entry.transactionCount++;
  });

  // 상위 5개 거래처
  const topSuppliers = Array.from(supplierMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topClients = Array.from(clientMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // 일별 분석
  const dailyMap = new Map<string, any>();
  
  transactions.forEach(txn => {
    const date = txn.transaction_date;
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        purchase: 0,
        sale: 0,
        netAmount: 0
      });
    }
    
    const entry = dailyMap.get(date);
    if (txn.transaction_type === 'purchase') {
      entry.purchase += Number(txn.total_amount) || 0;
    } else {
      entry.sale += Number(txn.total_amount) || 0;
    }
    entry.netAmount = entry.sale - entry.purchase;
  });

  const dailyBreakdown = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    year,
    month,
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    summary,
    topSuppliers,
    topClients,
    dailyBreakdown
  };
}

/**
 * 분기별 부가세 신고서 생성
 */
export async function generateQuarterlyVATReport(
  year: number,
  quarter: number
): Promise<QuarterlyVATReport> {
  const supabase = createClient();
  
  // 분기 계산
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  const startDate = new Date(year, startMonth, 1);
  const endDate = endOfMonth(new Date(year, endMonth));

  // 거래 데이터 조회
  const { data: transactions, error } = await supabase
    .from('tax_transactions')
    .select('*')
    .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
    .lte('transaction_date', format(endDate, 'yyyy-MM-dd'))
    .order('transaction_date', { ascending: true });

  if (error) throw error;

  // 요약 계산
  const summary = {
    totalSales: 0,
    salesVAT: 0,
    totalPurchases: 0,
    purchaseVAT: 0,
    vatPayable: 0,
    previousQuarterCarryOver: 0, // 실제로는 이전 분기 데이터에서 가져와야 함
    finalVATPayable: 0
  };

  // 월별 분석
  const monthlyBreakdown: QuarterlyVATReport['monthlyBreakdown'] = [];
  
  for (let m = 0; m < 3; m++) {
    const monthNum = startMonth + m + 1;
    const monthTransactions = transactions.filter(txn => {
      const txnMonth = new Date(txn.transaction_date).getMonth() + 1;
      return txnMonth === monthNum;
    });

    const monthData = {
      month: monthNum,
      sales: 0,
      salesVAT: 0,
      purchases: 0,
      purchaseVAT: 0
    };

    monthTransactions.forEach(txn => {
      if (txn.transaction_type === 'sale') {
        monthData.sales += Number(txn.supply_amount) || 0;
        monthData.salesVAT += Number(txn.vat_amount) || 0;
      } else {
        monthData.purchases += Number(txn.supply_amount) || 0;
        monthData.purchaseVAT += Number(txn.vat_amount) || 0;
      }
    });

    monthlyBreakdown.push(monthData);
    
    summary.totalSales += monthData.sales;
    summary.salesVAT += monthData.salesVAT;
    summary.totalPurchases += monthData.purchases;
    summary.purchaseVAT += monthData.purchaseVAT;
  }

  summary.vatPayable = summary.salesVAT - summary.purchaseVAT;
  summary.finalVATPayable = summary.vatPayable - summary.previousQuarterCarryOver;

  // 세금계산서 상세
  const taxInvoiceDetails = transactions
    .filter(txn => txn.document_number) // 세금계산서 번호가 있는 것만
    .map(txn => ({
      date: txn.transaction_date,
      supplierName: txn.supplier_name || '',
      businessNumber: txn.supplier_business_number || '',
      supplyAmount: Number(txn.supply_amount) || 0,
      vatAmount: Number(txn.vat_amount) || 0,
      totalAmount: Number(txn.total_amount) || 0,
      documentNumber: txn.document_number || ''
    }));

  return {
    year,
    quarter,
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    summary,
    monthlyBreakdown,
    taxInvoiceDetails
  };
}

/**
 * 월별 보고서 PDF 생성
 */
export function generateMonthlyReportPDF(report: MonthlyReport): Blob {
  const doc = new jsPDF();
  
  // 한글 폰트 설정 (실제로는 폰트 파일 임베딩 필요)
  // doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
  // doc.setFont('NanumGothic');

  // 제목
  doc.setFontSize(20);
  doc.text(`${report.year}년 ${report.month}월 세무 보고서`, 105, 20, { align: 'center' });
  
  // 기간
  doc.setFontSize(10);
  doc.text(`기간: ${report.startDate} ~ ${report.endDate}`, 105, 30, { align: 'center' });

  // 요약 정보
  doc.setFontSize(14);
  doc.text('요약', 20, 45);
  
  doc.setFontSize(10);
  const summaryData = [
    ['구분', '금액'],
    ['총 매입액', `${report.summary.totalPurchase.toLocaleString()}원`],
    ['총 매출액', `${report.summary.totalSale.toLocaleString()}원`],
    ['매입 부가세', `${report.summary.purchaseVat.toLocaleString()}원`],
    ['매출 부가세', `${report.summary.saleVat.toLocaleString()}원`],
    ['부가세 차액', `${report.summary.netVat.toLocaleString()}원`],
    ['총 거래 건수', `${report.summary.totalTransactions}건`]
  ];

  doc.autoTable({
    startY: 50,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] }
  });

  // 상위 거래처
  const finalY = (doc as any).lastAutoTable.finalY;
  
  doc.setFontSize(14);
  doc.text('주요 매입처 TOP 5', 20, finalY + 15);
  
  if (report.topSuppliers.length > 0) {
    const supplierData = [
      ['거래처명', '사업자번호', '금액', '건수'],
      ...report.topSuppliers.map(s => [
        s.name || '-',
        s.businessNumber || '-',
        `${s.amount.toLocaleString()}원`,
        `${s.transactionCount}건`
      ])
    ];

    doc.autoTable({
      startY: finalY + 20,
      head: [supplierData[0]],
      body: supplierData.slice(1),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] }
    });
  }

  // 일별 추이 (새 페이지에)
  doc.addPage();
  
  doc.setFontSize(14);
  doc.text('일별 거래 추이', 20, 20);
  
  const dailyData = [
    ['날짜', '매입', '매출', '순액'],
    ...report.dailyBreakdown.map(d => [
      format(parseISO(d.date), 'MM/dd', { locale: ko }),
      `${d.purchase.toLocaleString()}`,
      `${d.sale.toLocaleString()}`,
      `${d.netAmount.toLocaleString()}`
    ])
  ];

  doc.autoTable({
    startY: 25,
    head: [dailyData[0]],
    body: dailyData.slice(1),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // 푸터
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `페이지 ${i} / ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `생성일: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      20,
      doc.internal.pageSize.height - 10
    );
  }

  return doc.output('blob');
}

/**
 * 분기별 부가세 신고서 PDF 생성
 */
export function generateQuarterlyVATReportPDF(report: QuarterlyVATReport): Blob {
  const doc = new jsPDF();
  
  // 제목
  doc.setFontSize(20);
  doc.text(`${report.year}년 ${report.quarter}분기 부가세 신고서`, 105, 20, { align: 'center' });
  
  // 기간
  doc.setFontSize(10);
  doc.text(`과세기간: ${report.startDate} ~ ${report.endDate}`, 105, 30, { align: 'center' });

  // 요약
  doc.setFontSize(14);
  doc.text('과세표준 및 매출·매입세액', 20, 45);
  
  const summaryData = [
    ['구분', '금액'],
    ['과세표준 (매출)', `${report.summary.totalSales.toLocaleString()}원`],
    ['매출세액', `${report.summary.salesVAT.toLocaleString()}원`],
    ['과세표준 (매입)', `${report.summary.totalPurchases.toLocaleString()}원`],
    ['매입세액', `${report.summary.purchaseVAT.toLocaleString()}원`],
    ['납부세액', `${report.summary.vatPayable.toLocaleString()}원`],
    ['전기 이월세액', `${report.summary.previousQuarterCarryOver.toLocaleString()}원`],
    ['차감납부세액', `${report.summary.finalVATPayable.toLocaleString()}원`]
  ];

  doc.autoTable({
    startY: 50,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [220, 53, 69] }
  });

  // 월별 내역
  const finalY = (doc as any).lastAutoTable.finalY;
  
  doc.setFontSize(14);
  doc.text('월별 세부내역', 20, finalY + 15);
  
  const monthlyData = [
    ['월', '매출액', '매출세액', '매입액', '매입세액'],
    ...report.monthlyBreakdown.map(m => [
      `${m.month}월`,
      `${m.sales.toLocaleString()}`,
      `${m.salesVAT.toLocaleString()}`,
      `${m.purchases.toLocaleString()}`,
      `${m.purchaseVAT.toLocaleString()}`
    ])
  ];

  doc.autoTable({
    startY: finalY + 20,
    head: [monthlyData[0]],
    body: monthlyData.slice(1),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [220, 53, 69] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  });

  // 세금계산서 내역 (새 페이지)
  if (report.taxInvoiceDetails.length > 0) {
    doc.addPage();
    
    doc.setFontSize(14);
    doc.text('세금계산서 발행내역', 20, 20);
    
    const invoiceData = [
      ['일자', '거래처', '사업자번호', '공급가액', '세액', '합계'],
      ...report.taxInvoiceDetails.slice(0, 30).map(inv => [
        format(parseISO(inv.date), 'MM/dd'),
        inv.supplierName.substring(0, 15),
        inv.businessNumber,
        `${inv.supplyAmount.toLocaleString()}`,
        `${inv.vatAmount.toLocaleString()}`,
        `${inv.totalAmount.toLocaleString()}`
      ])
    ];

    doc.autoTable({
      startY: 25,
      head: [invoiceData[0]],
      body: invoiceData.slice(1),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 7 },
      headStyles: { fillColor: [220, 53, 69] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });
  }

  // 푸터
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `페이지 ${i} / ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `생성일: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      20,
      doc.internal.pageSize.height - 10
    );
  }

  return doc.output('blob');
}

/**
 * 이메일로 보고서 전송
 */
export async function sendReportByEmail(
  recipientEmail: string,
  reportType: 'monthly' | 'quarterly',
  reportBlob: Blob,
  reportDate: string
): Promise<boolean> {
  // 실제 구현에서는 이메일 서비스 API 호출
  // 예: SendGrid, AWS SES, Resend 등
  
  try {
    // FormData 생성
    const formData = new FormData();
    formData.append('to', recipientEmail);
    formData.append('subject', `${reportDate} ${reportType === 'monthly' ? '월별' : '분기별'} 세무 보고서`);
    formData.append('attachment', reportBlob, `tax-report-${reportDate}.pdf`);
    
    // API 호출 (예시)
    const response = await fetch('/api/send-email', {
      method: 'POST',
      body: formData
    });
    
    return response.ok;
  } catch (error) {
    console.error('이메일 전송 실패:', error);
    return false;
  }
}

/**
 * 보고서 일정 예약
 */
export async function scheduleReportGeneration(
  reportType: 'monthly' | 'quarterly',
  dayOfMonth: number,
  recipientEmails: string[]
): Promise<void> {
  const supabase = createClient();
  
  // 스케줄 정보 저장
  const { error } = await supabase
    .from('report_schedules')
    .insert({
      report_type: reportType,
      day_of_month: dayOfMonth,
      recipient_emails: recipientEmails,
      is_active: true,
      created_at: new Date().toISOString()
    });
    
  if (error) throw error;
  
  // 실제로는 크론 작업이나 스케줄러 서비스에 등록
  // 예: Vercel Cron, AWS EventBridge, etc.
}