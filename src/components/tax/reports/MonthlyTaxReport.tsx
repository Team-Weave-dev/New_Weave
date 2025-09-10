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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Printer
} from 'lucide-react';
import {
  generateMonthlyReport,
  generateMonthlyReportPDF,
  sendReportByEmail,
  type MonthlyReport
} from '@/lib/services/supabase/tax-report.service';
import { format, parseISO } from 'date-fns';
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MonthlyTaxReportProps {
  initialYear?: number;
  initialMonth?: number;
}

export default function MonthlyTaxReport({
  initialYear = new Date().getFullYear(),
  initialMonth = new Date().getMonth() + 1
}: MonthlyTaxReportProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // 보고서 로드
  const loadReport = async () => {
    setLoading(true);
    try {
      const reportData = await generateMonthlyReport(year, month);
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
  }, [year, month]);

  // PDF 다운로드
  const downloadPDF = () => {
    if (!report) return;
    
    const blob = generateMonthlyReportPDF(report);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `세무보고서_${year}년_${month}월.pdf`;
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
      const blob = generateMonthlyReportPDF(report);
      const success = await sendReportByEmail(
        recipientEmail,
        'monthly',
        blob,
        `${year}-${month.toString().padStart(2, '0')}`
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

  // 월 변경
  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (month === 1) {
        setMonth(12);
        setYear(year - 1);
      } else {
        setMonth(month - 1);
      }
    } else {
      if (month === 12) {
        setMonth(1);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
    }
  };

  // 차트 색상
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // 일별 데이터 준비
  const dailyChartData = report?.dailyBreakdown.map(d => ({
    date: format(parseISO(d.date), 'dd일'),
    매입: d.purchase,
    매출: d.sale,
    순액: d.netAmount
  })) || [];

  // 거래처 분포 데이터
  const supplierPieData = report?.topSuppliers.map((s, index) => ({
    name: s.name || `거래처 ${index + 1}`,
    value: s.amount,
    percentage: report.summary.totalPurchase > 0 
      ? ((s.amount / report.summary.totalPurchase) * 100).toFixed(1)
      : '0'
  })) || [];

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
                onClick={() => changeMonth('prev')}
                className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-txt-secondary" />
              </button>
              
              <div>
                <Typography variant="h2" className="text-xl font-bold">
                  {year}년 {month}월 세무 보고서
                </Typography>
                <Typography variant="body2" className="text-txt-secondary">
                  {report.startDate} ~ {report.endDate}
                </Typography>
              </div>
              
              <button
                onClick={() => changeMonth('next')}
                className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
                disabled={year === new Date().getFullYear() && month >= new Date().getMonth() + 1}
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

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="text-blue-600 font-medium">
                  총 매출액
                </Typography>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold text-blue-700">
                {report.summary.totalSale.toLocaleString()}원
              </Typography>
              <Typography variant="body2" className="text-xs text-blue-600 mt-1">
                VAT: {report.summary.saleVat.toLocaleString()}원
              </Typography>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="text-red-600 font-medium">
                  총 매입액
                </Typography>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold text-red-700">
                {report.summary.totalPurchase.toLocaleString()}원
              </Typography>
              <Typography variant="body2" className="text-xs text-red-600 mt-1">
                VAT: {report.summary.purchaseVat.toLocaleString()}원
              </Typography>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="text-green-600 font-medium">
                  부가세 차액
                </Typography>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold text-green-700">
                {report.summary.netVat.toLocaleString()}원
              </Typography>
              <Typography variant="body2" className="text-xs text-green-600 mt-1">
                {report.summary.netVat > 0 ? '납부 예정' : '환급 예정'}
              </Typography>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="text-purple-600 font-medium">
                  총 거래 건수
                </Typography>
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold text-purple-700">
                {report.summary.totalTransactions}건
              </Typography>
              <Typography variant="body2" className="text-xs text-purple-600 mt-1">
                일평균: {Math.round(report.summary.totalTransactions / 30)}건
              </Typography>
            </div>
          </div>

          {/* 일별 추이 차트 */}
          <div className="p-4 bg-bg-secondary rounded-lg">
            <Typography variant="h3" className="text-lg font-semibold mb-4">
              일별 거래 추이
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()}원`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="매출" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="매입" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="순액" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 주요 거래처 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 bg-bg-secondary rounded-lg">
              <Typography variant="h3" className="text-lg font-semibold mb-4">
                주요 매입처 TOP 5
              </Typography>
              <div className="space-y-3">
                {report.topSuppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold`}
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <Typography variant="body2" className="font-medium">
                          {supplier.name || '미등록 거래처'}
                        </Typography>
                        <Typography variant="body2" className="text-xs text-txt-secondary">
                          {supplier.businessNumber || '사업자번호 없음'}
                        </Typography>
                      </div>
                    </div>
                    <div className="text-right">
                      <Typography variant="body2" className="font-semibold">
                        {supplier.amount.toLocaleString()}원
                      </Typography>
                      <Typography variant="body2" className="text-xs text-txt-secondary">
                        {supplier.transactionCount}건
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-bg-secondary rounded-lg">
              <Typography variant="h3" className="text-lg font-semibold mb-4">
                거래처 분포
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={supplierPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {supplierPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()}원`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      {/* 이메일 전송 다이얼로그 */}
      {emailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <Typography variant="h3" className="text-lg font-semibold mb-4">
              보고서 이메일 전송
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