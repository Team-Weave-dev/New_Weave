'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Bell,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Smartphone,
  Settings,
  X,
  ChevronRight,
  AlertTriangle,
  Info,
  Loader2,
  BellOff
} from 'lucide-react';
import {
  getTaxDeadlines,
  detectAnomalies,
  getNotificationSettings,
  saveNotificationSettings,
  acknowledgeNotification,
  completeNotification,
  getNotificationHistory,
  type TaxNotification,
  type NotificationSettings,
  type AnomalyDetectionResult
} from '@/lib/services/supabase/tax-notification.service';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function TaxNotificationCenter() {
  const [notifications, setNotifications] = useState<TaxNotification[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetectionResult[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    pushEnabled: false,
    advanceDays: 7,
    reminderFrequency: 'daily',
    emailRecipients: []
  });
  const [history, setHistory] = useState<TaxNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'anomalies' | 'history'>('upcoming');
  const [emailInput, setEmailInput] = useState('');

  // 초기 데이터 로드
  useEffect(() => {
    loadNotifications();
    loadSettings();
    loadHistory();
    checkAnomalies();
  }, []);

  // 알림 로드
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const deadlines = getTaxDeadlines(now.getFullYear(), now.getMonth() + 1);
      setNotifications(deadlines);
    } catch (error) {
      console.error('알림 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 설정 로드
  const loadSettings = async () => {
    try {
      const savedSettings = await getNotificationSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  // 히스토리 로드
  const loadHistory = async () => {
    try {
      const historyData = await getNotificationHistory(20);
      setHistory(historyData);
    } catch (error) {
      console.error('히스토리 로드 실패:', error);
    }
  };

  // 이상 거래 감지
  const checkAnomalies = async () => {
    try {
      const now = new Date();
      const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
      
      const detected = await detectAnomalies(startDate, endDate);
      setAnomalies(detected);
    } catch (error) {
      console.error('이상 거래 감지 실패:', error);
    }
  };

  // 설정 저장
  const handleSaveSettings = async () => {
    try {
      await saveNotificationSettings(settings);
      alert('설정이 저장되었습니다.');
      setSettingsDialog(false);
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

  // 이메일 추가
  const addEmailRecipient = () => {
    if (emailInput && !settings.emailRecipients.includes(emailInput)) {
      setSettings({
        ...settings,
        emailRecipients: [...settings.emailRecipients, emailInput]
      });
      setEmailInput('');
    }
  };

  // 이메일 제거
  const removeEmailRecipient = (email: string) => {
    setSettings({
      ...settings,
      emailRecipients: settings.emailRecipients.filter(e => e !== email)
    });
  };

  // 알림 확인
  const handleAcknowledge = async (notificationId: string) => {
    try {
      await acknowledgeNotification(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, status: 'acknowledged' } : n
      ));
    } catch (error) {
      console.error('알림 확인 실패:', error);
    }
  };

  // 알림 완료
  const handleComplete = async (notificationId: string) => {
    try {
      await completeNotification(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, status: 'completed' } : n
      ));
    } catch (error) {
      console.error('알림 완료 처리 실패:', error);
    }
  };

  // 우선순위별 아이콘과 색상
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' };
      case 'high':
        return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'medium':
        return { icon: Info, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'low':
        return { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' };
      default:
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  // 심각도별 색상
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-weave-primary animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-weave-primary-light rounded-lg">
                <Bell className="w-6 h-6 text-weave-primary" />
              </div>
              <div>
                <Typography variant="h2" className="text-xl font-bold">
                  세무 신고 알림 센터
                </Typography>
                <Typography variant="body2" className="text-txt-secondary">
                  세무 신고 일정과 이상 거래를 관리합니다
                </Typography>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsDialog(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              알림 설정
            </Button>
          </div>

          {/* 탭 */}
          <div className="flex items-center gap-2 border-b border-border-light">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'text-weave-primary border-b-2 border-weave-primary'
                  : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              예정된 신고 ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('anomalies')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'anomalies'
                  ? 'text-weave-primary border-b-2 border-weave-primary'
                  : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              이상 거래 ({anomalies.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-weave-primary border-b-2 border-weave-primary'
                  : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              알림 히스토리
            </button>
          </div>

          {/* 예정된 신고 */}
          {activeTab === 'upcoming' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <Typography variant="body1" className="text-txt-secondary">
                    예정된 세무 신고가 없습니다
                  </Typography>
                </div>
              ) : (
                notifications.map(notification => {
                  const style = getPriorityStyle(notification.priority);
                  const Icon = style.icon;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${style.bg} border-opacity-50`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${style.color}`} />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <Typography variant="body1" className="font-semibold">
                                {notification.title}
                              </Typography>
                              <Typography variant="body2" className="text-txt-secondary mt-1">
                                {notification.message}
                              </Typography>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4 text-txt-tertiary" />
                                  <Typography variant="body2" className="text-sm">
                                    마감일: {format(notification.dueDate, 'yyyy년 MM월 dd일', { locale: ko })}
                                  </Typography>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-txt-tertiary" />
                                  <Typography variant="body2" className="text-sm font-medium">
                                    D-{notification.daysRemaining}
                                  </Typography>
                                </div>
                              </div>
                            </div>
                            
                            {notification.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleAcknowledge(notification.id)}
                                  className="px-3 py-1 text-sm bg-white rounded hover:bg-gray-50"
                                >
                                  확인
                                </button>
                                <button
                                  onClick={() => handleComplete(notification.id)}
                                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  완료
                                </button>
                              </div>
                            )}
                            
                            {notification.status === 'acknowledged' && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                                확인됨
                              </span>
                            )}
                            
                            {notification.status === 'completed' && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                완료
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 이상 거래 */}
          {activeTab === 'anomalies' && (
            <div className="space-y-3">
              {anomalies.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                  <Typography variant="body1" className="text-txt-secondary">
                    이상 거래가 감지되지 않았습니다
                  </Typography>
                </div>
              ) : (
                anomalies.map((anomaly, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getSeverityStyle(anomaly.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 mt-0.5" />
                      <div className="flex-1">
                        <Typography variant="body1" className="font-semibold">
                          {anomaly.type === 'duplicate' && '중복 거래'}
                          {anomaly.type === 'unusual_amount' && '비정상 금액'}
                          {anomaly.type === 'missing_vat' && '부가세 누락'}
                          {anomaly.type === 'date_anomaly' && '날짜 이상'}
                          {anomaly.type === 'pattern_change' && '패턴 변화'}
                        </Typography>
                        <Typography variant="body2" className="mt-1">
                          {anomaly.message}
                        </Typography>
                        {anomaly.suggestion && (
                          <Typography variant="body2" className="text-sm mt-2 italic">
                            💡 {anomaly.suggestion}
                          </Typography>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        anomaly.severity === 'high' ? 'bg-red-200 text-red-800' :
                        anomaly.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {anomaly.severity === 'high' ? '높음' :
                         anomaly.severity === 'medium' ? '중간' : '낮음'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 알림 히스토리 */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <Typography variant="body1" className="text-txt-secondary">
                    알림 히스토리가 없습니다
                  </Typography>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="p-3 bg-bg-secondary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography variant="body2" className="font-medium">
                          {item.title}
                        </Typography>
                        <Typography variant="body2" className="text-xs text-txt-secondary mt-1">
                          {format(item.createdAt, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                        </Typography>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.status === 'completed' ? 'bg-green-100 text-green-700' :
                        item.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status === 'completed' ? '완료' :
                         item.status === 'acknowledged' ? '확인' :
                         item.status === 'sent' ? '발송됨' : '대기'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 설정 다이얼로그 */}
      {settingsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h3" className="text-lg font-semibold">
                알림 설정
              </Typography>
              <button
                onClick={() => setSettingsDialog(false)}
                className="p-1 hover:bg-bg-secondary rounded"
              >
                <X className="w-5 h-5 text-txt-tertiary" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 알림 방법 */}
              <div>
                <Typography variant="body2" className="font-medium mb-2">
                  알림 방법
                </Typography>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={settings.emailEnabled}
                    onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <Mail className="w-4 h-4 text-txt-tertiary" />
                  <Typography variant="body2">이메일 알림</Typography>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.pushEnabled}
                    onChange={(e) => setSettings({ ...settings, pushEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <Smartphone className="w-4 h-4 text-txt-tertiary" />
                  <Typography variant="body2">푸시 알림</Typography>
                </label>
              </div>

              {/* 알림 시기 */}
              <div>
                <Typography variant="body2" className="font-medium mb-2">
                  알림 시기
                </Typography>
                <select
                  value={settings.advanceDays}
                  onChange={(e) => setSettings({ ...settings, advanceDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border-light rounded-lg"
                >
                  <option value={1}>1일 전</option>
                  <option value={3}>3일 전</option>
                  <option value={7}>7일 전</option>
                  <option value={14}>14일 전</option>
                  <option value={30}>30일 전</option>
                </select>
              </div>

              {/* 알림 빈도 */}
              <div>
                <Typography variant="body2" className="font-medium mb-2">
                  알림 빈도
                </Typography>
                <select
                  value={settings.reminderFrequency}
                  onChange={(e) => setSettings({ ...settings, reminderFrequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border-light rounded-lg"
                >
                  <option value="once">한 번만</option>
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                </select>
              </div>

              {/* 이메일 수신자 */}
              {settings.emailEnabled && (
                <div>
                  <Typography variant="body2" className="font-medium mb-2">
                    이메일 수신자
                  </Typography>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="이메일 주소"
                      className="flex-1 px-3 py-2 border border-border-light rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addEmailRecipient}
                    >
                      추가
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {settings.emailRecipients.map(email => (
                      <div key={email} className="flex items-center justify-between p-2 bg-bg-secondary rounded">
                        <Typography variant="body2" className="text-sm">
                          {email}
                        </Typography>
                        <button
                          onClick={() => removeEmailRecipient(email)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSettingsDialog(false)}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveSettings}
                >
                  저장
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}