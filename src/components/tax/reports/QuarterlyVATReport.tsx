'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Calendar,
  Download,
  Mail,
  FileText,
  AlertCircle,
  DollarSign,
  Receipt,
  Calculator,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Printer,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  generateQuarterlyVATReport,
  generateQuarterlyVATReportPDF,
  sendReportByEmail,
  type QuarterlyVATReport
} from '@/lib/services/supabase/tax-report.service';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line
} from 'recharts';

interface QuarterlyVATReportProps {
  initialYear?: number;
  initialQuarter?: number;
}

export default function QuarterlyVATReportComponent({
  initialYear = new Date().getFullYear(),
  initialQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
}: QuarterlyVATReportProps) {
  const [year, setYear] = useState(initialYear);
  const [quarter, setQuarter] = useState(initialQuarter);
  const [report, setReport] = useState<QuarterlyVATReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // 분기 이름
  const getQuarterName = (q: number) => {
    const quarterNames = ['1분기', '2분기', '3분기', '4분기'];
    return quarterNames[q - 1];
  };

  // 분기 월 범위
  const getQuarterMonths = (q: number) => {
    const ranges = ['1월-3월', '4월-6월', '7월-9월', '10월-12월'];
    return ranges[q - 1];
  };

  // 신고 마감일 계산
  const getDeadline = (year: number, quarter: number) => {
    const deadlines = [
      new Date(year, 3, 25), // 1분기: 4월 25일
      new Date(year, 6, 25), // 2분기: 7월 25일
      new Date(year, 9, 25), // 3분기: 10월 25일
      new Date(year + 1, 0, 25) // 4분기: 다음해 1월 25일
    ];
    return deadlines[quarter - 1];
  };

  // 보고서 로드
  const loadReport = async () => {
    setLoading(true);
    try {
      const reportData = await generateQuarterlyVATReport(year, quarter);
      setReport(reportData);
    } catch (error) {
      console.error('보고서 생성 실패:', error);
      alert('보고서를 생성할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [year, quarter]);

  // PDF 다운로드
  const downloadPDF = () => {
    if (!report) return;
    
    const blob = generateQuarterlyVATReportPDF(report);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `부가세신고서_${year}년_${quarter}분기.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 인쇄
  const printReport = () => {
    window.print();
  };

  // 이메일 전송
  const sendEmail = async () => {
    if (!report || !recipientEmail) return;
    
    setSendingEmail(true);
    try {
      const blob = generateQuarterlyVATReportPDF(report);
      const success = await sendReportByEmail(
        recipientEmail,
        'quarterly',
        blob,
        `${year}-Q${quarter}`
      );
      
      if (success) {
        alert('이메일이 성공적으로 전송되었습니다.');
        setEmailDialog(false);
        setRecipientEmail('');
      } else {
        alert('이메일 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('이메일 전송 오류:', error);
      alert('이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setSendingEmail(false);
    }
  };

  // 분기 변경
  const changeQuarter = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (quarter === 1) {
        setQuarter(4);
        setYear(year - 1);
      } else {
        setQuarter(quarter - 1);
      }
    } else {
      if (quarter === 4) {
        setQuarter(1);
        setYear(year + 1);
      } else {
        setQuarter(quarter + 1);
      }
    }
  };

  // 월별 차트 데이터
  const monthlyChartData = report?.monthlyBreakdown.map(m => ({
    month: `${m.month}월`,
    매출: m.sales,
    매입: m.purchases,
    매출VAT: m.salesVAT,
    매입VAT: m.purchaseVAT,
    순VAT: m.salesVAT - m.purchaseVAT
  })) || [];

  // D-Day 계산
  const deadline = getDeadline(year, quarter);
  const today = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-weave-primary animate-spin" />
        </div>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="p-6">
        <Typography variant="body1" className="text-center text-txt-secondary">
          보고서를 불러올 수 없습니다.
        </Typography>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeQuarter('prev')}
                className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-txt-secondary" />
              </button>
              
              <div>
                <Typography variant="h2" className="text-xl font-bold">
                  {year}년 {getQuarterName(quarter)} 부가세 신고서
                </Typography>
                <Typography variant="body2" className="text-txt-secondary">
                  과세기간: {report.startDate} ~ {report.endDate}
                </Typography>
              </div>
              
              <button
                onClick={() => changeQuarter('next')}
                className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
                disabled={year === new Date().getFullYear() && quarter >= Math.ceil((new Date().getMonth() + 1) / 3)}
              >
                <ChevronRight className="w-5 h-5 text-txt-secondary" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={printReport}
              >
                <Printer className="w-4 h-4 mr-2" />
                인쇄
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEmailDialog(true)}
              >
                <Mail className="w-4 h-4 mr-2" />
                이메일
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={downloadPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF 다운로드
              </Button>
            </div>
          </div>

          {/* 신고 마감일 알림 */}
          <div className={`p-4 rounded-lg flex items-center justify-between ${
            daysRemaining < 0 ? 'bg-gray-50' :
            daysRemaining <= 7 ? 'bg-red-50' :
            daysRemaining <= 14 ? 'bg-yellow-50' :
            'bg-blue-50'
          }`}>
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${
                daysRemaining < 0 ? 'text-gray-600' :
                daysRemaining <= 7 ? 'text-red-600' :
                daysRemaining <= 14 ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
              <div>
                <Typography variant="body2" className={`font-medium ${
                  daysRemaining < 0 ? 'text-gray-700' :
                  daysRemaining <= 7 ? 'text-red-700' :
                  daysRemaining <= 14 ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  부가세 신고 마감일: {format(deadline, 'yyyy년 MM월 dd일', { locale: ko })}
                </Typography>
                <Typography variant="body2" className={`text-xs ${
                  daysRemaining < 0 ? 'text-gray-600' :
                  daysRemaining <= 7 ? 'text-red-600' :
                  daysRemaining <= 14 ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)}일 경과` :
                   daysRemaining === 0 ? '오늘이 마감일입니다!' :
                   `D-${daysRemaining}`}
                </Typography>
              </div>
            </div>
            {daysRemaining > 0 && daysRemaining <= 7 && (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
          </div>

          {/* 과세표준 및 세액 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="text-blue-600 font-medium">
                  매출액 (과세표준)
                </Typography>
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold text-blue-700">
                {report.summary.totalSales.toLocaleString()}원
              </Typography>
              <Typography variant="body2" className="text-xs text-blue-600 mt-1">
                매출세액: {report.summary.salesVAT.toLocaleString()}원
              </Typography>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="text-red-600 font-medium">
                  매입액 (공제세액)
                </Typography>
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold text-red-700">
                {report.summary.totalPurchases.toLocaleString()}원
              </Typography>
              <Typography variant="body2" className="text-xs text-red-600 mt-1">
                매입세액: {report.summary.purchaseVAT.toLocaleString()}원
              </Typography>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="text-green-600 font-medium">
                  납부세액
                </Typography>
                <Calculator className="w-5 h-5 text-green-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold text-green-700">
                {report.summary.vatPayable.toLocaleString()}원
              </Typography>
              <Typography variant="body2" className="text-xs text-green-600 mt-1">
                매출세액 - 매입세액
              </Typography>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="text-purple-600 font-medium">
                  차감납부세액
                </Typography>
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold text-purple-700">
                {report.summary.finalVATPayable.toLocaleString()}원
              </Typography>
              <Typography variant="body2" className="text-xs text-purple-600 mt-1">
                전기이월: {report.summary.previousQuarterCarryOver.toLocaleString()}원
              </Typography>
            </div>
          </div>

          {/* 월별 세부내역 차트 */}
          <div className="p-4 bg-bg-secondary rounded-lg">
            <Typography variant="h3" className="text-lg font-semibold mb-4">
              월별 세부내역
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()}원`} />
                <Legend />
                <Bar yAxisId="left" dataKey="매출" fill="#3B82F6" />
                <Bar yAxisId="left" dataKey="매입" fill="#EF4444" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="순VAT" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 월별 상세 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-txt-secondary">월</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-txt-secondary">매출액</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-txt-secondary">매출세액</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-txt-secondary">매입액</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-txt-secondary">매입세액</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-txt-secondary">차액</th>
                </tr>
              </thead>
              <tbody>
                {report.monthlyBreakdown.map((month, index) => (
                  <tr key={index} className="border-b border-border-light">
                    <td className="px-4 py-3 font-medium">{month.month}월</td>
                    <td className="px-4 py-3 text-right">{month.sales.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-right text-blue-600">{month.salesVAT.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-right">{month.purchases.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-right text-red-600">{month.purchaseVAT.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={month.salesVAT - month.purchaseVAT >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {(month.salesVAT - month.purchaseVAT).toLocaleString()}원
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-bg-secondary font-semibold">
                  <td className="px-4 py-3">합계</td>
                  <td className="px-4 py-3 text-right">{report.summary.totalSales.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right text-blue-600">{report.summary.salesVAT.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right">{report.summary.totalPurchases.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right text-red-600">{report.summary.purchaseVAT.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right">
                    <span className={report.summary.vatPayable >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {report.summary.vatPayable.toLocaleString()}원
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 세금계산서 발행 내역 요약 */}
          {report.taxInvoiceDetails.length > 0 && (
            <div className="p-4 bg-bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h3" className="text-lg font-semibold">
                  세금계산서 발행 내역
                </Typography>
                <Typography variant="body2" className="text-txt-secondary">
                  총 {report.taxInvoiceDetails.length}건
                </Typography>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <Typography variant="body2" className="text-sm">
                    정상 발행: {report.taxInvoiceDetails.filter(t => t.documentNumber).length}건
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <Typography variant="body2" className="text-sm">
                    미발행: {report.taxInvoiceDetails.filter(t => !t.documentNumber).length}건
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <Typography variant="body2" className="text-sm">
                    전자: {report.taxInvoiceDetails.filter(t => t.documentNumber?.startsWith('E')).length}건
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <Typography variant="body2" className="text-sm">
                    종이: {report.taxInvoiceDetails.filter(t => t.documentNumber && !t.documentNumber.startsWith('E')).length}건
                  </Typography>
                </div>
              </div>
            </div>
          )}

          {/* 신고 체크리스트 */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Typography variant="h3" className="text-lg font-semibold text-yellow-800 mb-3">
              신고 전 체크리스트
            </Typography>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <Typography variant="body2" className="text-sm">
                  모든 세금계산서가 발행/수취되었는지 확인
                </Typography>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <Typography variant="body2" className="text-sm">
                  영세율 적용 대상 거래 확인
                </Typography>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <Typography variant="body2" className="text-sm">
                  불공제 매입세액 확인
                </Typography>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <Typography variant="body2" className="text-sm">
                  신용카드 매출전표 발행 내역 확인
                </Typography>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <Typography variant="body2" className="text-sm">
                  전자세금계산서 발급 내역 국세청 전송 확인
                </Typography>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* 이메일 전송 다이얼로그 */}
      {emailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <Typography variant="h3" className="text-lg font-semibold mb-4">
              부가세 신고서 이메일 전송
            </Typography>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-1">
                  받는 사람 이메일
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary"
                  placeholder="example@email.com"
                />
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <Typography variant="body2" className="text-xs text-blue-700">
                  {year}년 {getQuarterName(quarter)} ({getQuarterMonths(quarter)}) 부가세 신고서가 PDF 파일로 전송됩니다.
                </Typography>
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailDialog(false);
                    setRecipientEmail('');
                  }}
                  disabled={sendingEmail}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={sendEmail}
                  disabled={!recipientEmail || sendingEmail}
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      전송
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}