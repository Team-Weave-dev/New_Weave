import { createClient } from '@/lib/services/supabase/client';
import { addDays, differenceInDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface TaxNotification {
  id: string;
  type: 'vat_filing' | 'income_tax' | 'report_reminder' | 'anomaly_alert';
  title: string;
  message: string;
  dueDate: Date;
  daysRemaining: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'acknowledged' | 'completed';
  createdAt: Date;
  metadata?: any;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  advanceDays: number; // 며칠 전에 알림
  reminderFrequency: 'daily' | 'weekly' | 'once';
  emailRecipients: string[];
}

export interface AnomalyDetectionResult {
  type: 'duplicate' | 'unusual_amount' | 'missing_vat' | 'date_anomaly' | 'pattern_change';
  severity: 'low' | 'medium' | 'high';
  transaction: any;
  message: string;
  suggestion?: string;
}

/**
 * 세무 신고 일정 계산
 */
export function getTaxDeadlines(year: number, month: number): TaxNotification[] {
  const notifications: TaxNotification[] = [];
  const today = new Date();
  
  // 부가세 신고 (분기별)
  const quarter = Math.ceil(month / 3);
  const vatDeadlines = [
    { quarter: 1, month: 4, day: 25, period: '1분기' },
    { quarter: 2, month: 7, day: 25, period: '2분기' },
    { quarter: 3, month: 10, day: 25, period: '3분기' },
    { quarter: 4, month: 1, day: 25, period: '4분기', yearOffset: 1 }
  ];

  const currentVATDeadline = vatDeadlines.find(d => d.quarter === quarter);
  if (currentVATDeadline) {
    const dueDate = new Date(
      year + (currentVATDeadline.yearOffset || 0),
      currentVATDeadline.month - 1,
      currentVATDeadline.day
    );
    
    const daysRemaining = differenceInDays(dueDate, today);
    
    if (daysRemaining >= 0 && daysRemaining <= 30) {
      notifications.push({
        id: `vat-${year}-q${quarter}`,
        type: 'vat_filing',
        title: `${year}년 ${currentVATDeadline.period} 부가세 신고`,
        message: `부가세 신고 마감일이 ${daysRemaining}일 남았습니다.`,
        dueDate,
        daysRemaining,
        priority: daysRemaining <= 3 ? 'critical' : 
                 daysRemaining <= 7 ? 'high' : 
                 daysRemaining <= 14 ? 'medium' : 'low',
        status: 'pending',
        createdAt: new Date(),
        metadata: { year, quarter }
      });
    }
  }

  // 종합소득세 신고 (5월)
  if (month >= 4 && month <= 5) {
    const incomeTaxDeadline = new Date(year, 4, 31); // 5월 31일
    const daysRemaining = differenceInDays(incomeTaxDeadline, today);
    
    if (daysRemaining >= 0 && daysRemaining <= 60) {
      notifications.push({
        id: `income-tax-${year}`,
        type: 'income_tax',
        title: `${year}년 종합소득세 신고`,
        message: `종합소득세 신고 마감일이 ${daysRemaining}일 남았습니다.`,
        dueDate: incomeTaxDeadline,
        daysRemaining,
        priority: daysRemaining <= 7 ? 'critical' : 
                 daysRemaining <= 14 ? 'high' : 
                 daysRemaining <= 30 ? 'medium' : 'low',
        status: 'pending',
        createdAt: new Date(),
        metadata: { year }
      });
    }
  }

  // 원천세 신고 (매월 10일)
  const withholdingTaxDeadline = new Date(year, month, 10);
  if (withholdingTaxDeadline < today) {
    withholdingTaxDeadline.setMonth(withholdingTaxDeadline.getMonth() + 1);
  }
  
  const withholdingDaysRemaining = differenceInDays(withholdingTaxDeadline, today);
  if (withholdingDaysRemaining >= 0 && withholdingDaysRemaining <= 10) {
    notifications.push({
      id: `withholding-${year}-${month}`,
      type: 'income_tax',
      title: `원천세 신고 및 납부`,
      message: `원천세 신고 마감일이 ${withholdingDaysRemaining}일 남았습니다.`,
      dueDate: withholdingTaxDeadline,
      daysRemaining: withholdingDaysRemaining,
      priority: withholdingDaysRemaining <= 2 ? 'high' : 
               withholdingDaysRemaining <= 5 ? 'medium' : 'low',
      status: 'pending',
      createdAt: new Date(),
      metadata: { year, month }
    });
  }

  return notifications;
}

/**
 * 이상 거래 감지
 */
export async function detectAnomalies(
  startDate: string,
  endDate: string
): Promise<AnomalyDetectionResult[]> {
  const supabase = createClient();
  const anomalies: AnomalyDetectionResult[] = [];

  // 거래 데이터 조회
  const { data: transactions, error } = await supabase
    .from('tax_transactions')
    .select('*')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: true });

  if (error || !transactions) return anomalies;

  // 1. 중복 거래 감지
  const transactionMap = new Map<string, any[]>();
  transactions.forEach(txn => {
    const key = `${txn.supplier_name}-${txn.total_amount}-${txn.transaction_date}`;
    if (!transactionMap.has(key)) {
      transactionMap.set(key, []);
    }
    transactionMap.get(key)!.push(txn);
  });

  transactionMap.forEach((duplicates, key) => {
    if (duplicates.length > 1) {
      anomalies.push({
        type: 'duplicate',
        severity: 'medium',
        transaction: duplicates[0],
        message: `중복 거래 감지: ${duplicates[0].supplier_name}, ${duplicates[0].total_amount}원, ${duplicates.length}건`,
        suggestion: '동일한 거래가 여러 번 입력되었을 수 있습니다. 확인이 필요합니다.'
      });
    }
  });

  // 2. 비정상 금액 감지 (평균의 3배 이상)
  const amounts = transactions.map(t => Number(t.total_amount));
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) / amounts.length
  );

  transactions.forEach(txn => {
    const amount = Number(txn.total_amount);
    if (amount > avgAmount + (stdDev * 3)) {
      anomalies.push({
        type: 'unusual_amount',
        severity: 'high',
        transaction: txn,
        message: `비정상적으로 큰 금액: ${amount.toLocaleString()}원 (평균: ${Math.round(avgAmount).toLocaleString()}원)`,
        suggestion: '거래 금액이 평균보다 매우 큽니다. 입력 오류나 특별한 거래인지 확인하세요.'
      });
    }
  });

  // 3. 부가세 누락 감지
  transactions.forEach(txn => {
    if (txn.supply_amount && !txn.vat_amount) {
      anomalies.push({
        type: 'missing_vat',
        severity: 'low',
        transaction: txn,
        message: `부가세 누락: ${txn.supplier_name} - ${txn.supply_amount}원`,
        suggestion: '부가세가 입력되지 않았습니다. 면세 거래인지 확인하세요.'
      });
    }

    // 부가세 비율 확인 (10% 기준)
    if (txn.supply_amount && txn.vat_amount) {
      const expectedVat = txn.supply_amount * 0.1;
      const vatDiff = Math.abs(txn.vat_amount - expectedVat);
      if (vatDiff > expectedVat * 0.1) { // 10% 이상 차이
        anomalies.push({
          type: 'unusual_amount',
          severity: 'low',
          transaction: txn,
          message: `부가세 비율 이상: 예상 ${expectedVat.toLocaleString()}원, 실제 ${txn.vat_amount.toLocaleString()}원`,
          suggestion: '부가세 계산을 다시 확인해주세요.'
        });
      }
    }
  });

  // 4. 날짜 이상 감지 (미래 날짜, 너무 오래된 날짜)
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  transactions.forEach(txn => {
    const txnDate = new Date(txn.transaction_date);
    
    if (txnDate > today) {
      anomalies.push({
        type: 'date_anomaly',
        severity: 'medium',
        transaction: txn,
        message: `미래 날짜 거래: ${txn.transaction_date}`,
        suggestion: '거래 날짜가 미래로 설정되어 있습니다. 날짜를 확인하세요.'
      });
    }
    
    if (txnDate < sixMonthsAgo) {
      anomalies.push({
        type: 'date_anomaly',
        severity: 'low',
        transaction: txn,
        message: `오래된 거래: ${txn.transaction_date} (6개월 이상)`,
        suggestion: '6개월 이상 된 거래입니다. 정확한 거래인지 확인하세요.'
      });
    }
  });

  // 5. 패턴 변화 감지 (갑작스러운 거래량 증가/감소)
  const dailyTransactions = new Map<string, number>();
  transactions.forEach(txn => {
    const date = txn.transaction_date;
    dailyTransactions.set(date, (dailyTransactions.get(date) || 0) + 1);
  });

  const dailyCounts = Array.from(dailyTransactions.values());
  const avgDaily = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;

  dailyTransactions.forEach((count, date) => {
    if (count > avgDaily * 3) {
      anomalies.push({
        type: 'pattern_change',
        severity: 'medium',
        transaction: { transaction_date: date },
        message: `비정상적인 거래량: ${date}에 ${count}건 (평균: ${Math.round(avgDaily)}건)`,
        suggestion: '해당 날짜에 거래가 급증했습니다. 특별한 이벤트가 있었는지 확인하세요.'
      });
    }
  });

  return anomalies;
}

/**
 * 알림 설정 저장
 */
export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('notification_settings')
    .upsert({
      ...settings,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
}

/**
 * 알림 설정 조회
 */
export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .single();

  if (error) return null;
  return data;
}

/**
 * 알림 발송
 */
export async function sendNotification(
  notification: TaxNotification,
  settings: NotificationSettings
): Promise<boolean> {
  try {
    // 이메일 발송
    if (settings.emailEnabled && settings.emailRecipients.length > 0) {
      for (const email of settings.emailRecipients) {
        await sendEmailNotification(email, notification);
      }
    }

    // 푸시 알림 (브라우저 알림 API 사용)
    if (settings.pushEnabled) {
      await sendPushNotification(notification);
    }

    // 알림 상태 업데이트
    await updateNotificationStatus(notification.id, 'sent');
    
    return true;
  } catch (error) {
    console.error('알림 발송 실패:', error);
    return false;
  }
}

/**
 * 이메일 알림 발송
 */
async function sendEmailNotification(
  email: string,
  notification: TaxNotification
): Promise<void> {
  // 실제 구현에서는 이메일 서비스 API 호출
  const response = await fetch('/api/send-notification-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      subject: notification.title,
      body: notification.message,
      priority: notification.priority,
      dueDate: notification.dueDate
    })
  });

  if (!response.ok) {
    throw new Error('이메일 발송 실패');
  }
}

/**
 * 푸시 알림 발송
 */
async function sendPushNotification(
  notification: TaxNotification
): Promise<void> {
  // 브라우저 알림 권한 확인
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
        data: {
          dueDate: notification.dueDate,
          type: notification.type
        }
      });
    } else if (Notification.permission === 'default') {
      // 권한 요청
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await sendPushNotification(notification); // 재귀 호출
      }
    }
  }
}

/**
 * 알림 상태 업데이트
 */
async function updateNotificationStatus(
  notificationId: string,
  status: TaxNotification['status']
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('tax_notifications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * 알림 히스토리 조회
 */
export async function getNotificationHistory(
  limit: number = 50
): Promise<TaxNotification[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tax_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

/**
 * 알림 확인 처리
 */
export async function acknowledgeNotification(
  notificationId: string
): Promise<void> {
  await updateNotificationStatus(notificationId, 'acknowledged');
}

/**
 * 알림 완료 처리
 */
export async function completeNotification(
  notificationId: string
): Promise<void> {
  await updateNotificationStatus(notificationId, 'completed');
}

/**
 * 자동 알림 스케줄러
 */
export async function scheduleAutomaticNotifications(): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings) return;

  const now = new Date();
  const notifications = getTaxDeadlines(now.getFullYear(), now.getMonth() + 1);

  for (const notification of notifications) {
    // 설정된 사전 알림 일수 확인
    if (notification.daysRemaining <= settings.advanceDays) {
      // 알림 빈도에 따라 발송 여부 결정
      const shouldSend = await shouldSendNotification(
        notification,
        settings.reminderFrequency
      );

      if (shouldSend) {
        await sendNotification(notification, settings);
      }
    }
  }
}

/**
 * 알림 발송 여부 결정
 */
async function shouldSendNotification(
  notification: TaxNotification,
  frequency: NotificationSettings['reminderFrequency']
): Promise<boolean> {
  const supabase = createClient();
  
  // 이미 발송된 알림 확인
  const { data: existing } = await supabase
    .from('tax_notifications')
    .select('*')
    .eq('id', notification.id)
    .eq('status', 'sent')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!existing || existing.length === 0) {
    return true; // 첫 알림
  }

  const lastSent = new Date(existing[0].created_at);
  const now = new Date();
  const daysSinceLastSent = differenceInDays(now, lastSent);

  switch (frequency) {
    case 'once':
      return false; // 이미 한 번 발송됨
    case 'daily':
      return daysSinceLastSent >= 1;
    case 'weekly':
      return daysSinceLastSent >= 7;
    default:
      return false;
  }
}