'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { BaseWidget } from '../BaseWidget';
import type { BaseWidgetProps } from '../types';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  expiresAt: Date | null;
  createdAt: Date;
  readBy: string[]; // 읽은 사용자 ID 목록
  category: 'general' | 'update' | 'maintenance' | 'event' | 'policy';
  author: string;
}

interface AnnouncementsWidgetProps extends BaseWidgetProps {}

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 border-red-300 text-red-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  low: 'bg-gray-100 border-gray-300 text-gray-600'
};

const PRIORITY_LABELS = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음'
};

const CATEGORY_LABELS = {
  general: '일반',
  update: '업데이트',
  maintenance: '유지보수',
  event: '이벤트',
  policy: '정책'
};

export const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({
  id,
  title = '공지사항',
  config = {}
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showExpired, setShowExpired] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium' as Announcement['priority'],
    category: 'general' as Announcement['category'],
    expiresIn: '0' // 0: 무기한, 1: 1일, 7: 1주일, 30: 1개월
  });

  // 현재 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
  const currentUserId = 'user-1';

  // 로컬스토리지에서 공지사항 불러오기
  useEffect(() => {
    const loadAnnouncements = () => {
      const stored = localStorage.getItem(`announcements_${id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAnnouncements(parsed.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          expiresAt: a.expiresAt ? new Date(a.expiresAt) : null
        })));
      } else {
        // 초기 샘플 데이터
        const sampleData: Announcement[] = [
          {
            id: '1',
            title: '시스템 정기 점검 안내',
            content: '12월 15일 오전 2시부터 4시까지 시스템 정기 점검이 진행됩니다. 해당 시간 동안 서비스 이용이 제한될 수 있습니다.',
            priority: 'high',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            readBy: [],
            category: 'maintenance',
            author: '시스템 관리자'
          },
          {
            id: '2',
            title: '새로운 대시보드 기능 출시',
            content: '대시보드에 새로운 위젯들이 추가되었습니다. 캘린더, 날씨, 지출 추적 등 다양한 위젯을 활용해보세요!',
            priority: 'medium',
            expiresAt: null,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            readBy: ['user-2'],
            category: 'update',
            author: '제품팀'
          },
          {
            id: '3',
            title: '연말 송년회 안내',
            content: '12월 22일 금요일 오후 6시, 회사 연말 송년회가 개최됩니다. 많은 참여 부탁드립니다.',
            priority: 'low',
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            readBy: [],
            category: 'event',
            author: '인사팀'
          }
        ];
        setAnnouncements(sampleData);
        localStorage.setItem(`announcements_${id}`, JSON.stringify(sampleData));
      }
    };

    loadAnnouncements();
  }, [id]);

  // 공지사항 저장
  const saveAnnouncements = (data: Announcement[]) => {
    localStorage.setItem(`announcements_${id}`, JSON.stringify(data));
    setAnnouncements(data);
  };

  // 필터링된 공지사항
  const filteredAnnouncements = useMemo(() => {
    let filtered = [...announcements];
    
    // 만료된 공지 필터링
    if (!showExpired) {
      filtered = filtered.filter(a => 
        !a.expiresAt || a.expiresAt.getTime() > Date.now()
      );
    }
    
    // 우선순위 필터링
    if (filterPriority !== 'all') {
      filtered = filtered.filter(a => a.priority === filterPriority);
    }
    
    // 카테고리 필터링
    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => a.category === filterCategory);
    }
    
    // 우선순위와 날짜로 정렬
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    return filtered;
  }, [announcements, showExpired, filterPriority, filterCategory]);

  // 읽지 않은 공지 개수
  const unreadCount = filteredAnnouncements.filter(a => 
    !a.readBy.includes(currentUserId)
  ).length;

  // 공지사항 읽음 표시
  const markAsRead = (announcementId: string) => {
    const updated = announcements.map(a => {
      if (a.id === announcementId && !a.readBy.includes(currentUserId)) {
        return { ...a, readBy: [...a.readBy, currentUserId] };
      }
      return a;
    });
    saveAnnouncements(updated);
  };

  // 공지사항 추가
  const handleAddAnnouncement = () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    const expiresAt = formData.expiresIn === '0' 
      ? null 
      : new Date(Date.now() + parseInt(formData.expiresIn) * 24 * 60 * 60 * 1000);

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      category: formData.category,
      expiresAt,
      createdAt: new Date(),
      readBy: [],
      author: '관리자'
    };

    saveAnnouncements([newAnnouncement, ...announcements]);
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      category: 'general',
      expiresIn: '0'
    });
    setShowAddForm(false);
  };

  // 공지사항 삭제
  const handleDeleteAnnouncement = (announcementId: string) => {
    const updated = announcements.filter(a => a.id !== announcementId);
    saveAnnouncements(updated);
    setSelectedAnnouncement(null);
  };

  // 만료일 포맷팅
  const formatExpiry = (date: Date | null) => {
    if (!date) return '무기한';
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 0) return '만료됨';
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days === 0) return '오늘 만료';
    if (days === 1) return '내일 만료';
    return `${days}일 후 만료`;
  };

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <BaseWidget
      id={id}
      title={title}
      headerExtra={
        <div className="flex items-center gap-2 text-sm">
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {unreadCount}개 안읽음
            </span>
          )}
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '취소' : '+ 추가'}
          </Button>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        {/* 필터 영역 */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="all">모든 우선순위</option>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="all">모든 카테고리</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showExpired}
              onChange={(e) => setShowExpired(e.target.checked)}
              className="rounded"
            />
            만료된 공지 표시
          </label>
        </div>

        {/* 공지 추가 폼 */}
        {showAddForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="공지 제목"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
              
              <textarea
                placeholder="공지 내용"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg min-h-[80px]"
              />
              
              <div className="flex gap-2">
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Announcement['priority'] })}
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                >
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Announcement['category'] })}
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                
                <select
                  value={formData.expiresIn}
                  onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="0">무기한</option>
                  <option value="1">1일 후 만료</option>
                  <option value="7">1주일 후 만료</option>
                  <option value="30">1개월 후 만료</option>
                </select>
                
                <Button onClick={handleAddAnnouncement}>
                  추가
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 공지사항 목록 */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Typography variant="body2">공지사항이 없습니다</Typography>
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => {
              const isUnread = !announcement.readBy.includes(currentUserId);
              const isExpired = announcement.expiresAt && announcement.expiresAt.getTime() < Date.now();
              
              return (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    PRIORITY_COLORS[announcement.priority]
                  } ${isUnread ? 'font-semibold' : ''} ${
                    isExpired ? 'opacity-60' : ''
                  } ${
                    selectedAnnouncement?.id === announcement.id ? 'ring-2 ring-blue-400' : ''
                  }`}
                  onClick={() => {
                    setSelectedAnnouncement(announcement);
                    markAsRead(announcement.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isUnread && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                        <Typography variant="body1" className="font-medium truncate">
                          {announcement.title}
                        </Typography>
                      </div>
                      
                      <Typography variant="caption" className="text-gray-600 line-clamp-2">
                        {announcement.content}
                      </Typography>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-white/50 rounded">
                          {CATEGORY_LABELS[announcement.category]}
                        </span>
                        <span className="text-xs text-gray-600">
                          {announcement.author} · {formatDate(announcement.createdAt)}
                        </span>
                        {announcement.expiresAt && (
                          <span className={`text-xs ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                            {formatExpiry(announcement.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        isExpired ? 'bg-gray-200 text-gray-500' : ''
                      }`}>
                        {PRIORITY_LABELS[announcement.priority]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 선택된 공지 상세 모달 */}
        {selectedAnnouncement && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <div 
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    PRIORITY_COLORS[selectedAnnouncement.priority]
                  }`}>
                    {PRIORITY_LABELS[selectedAnnouncement.priority]}
                  </span>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <Typography variant="h4" className="mb-2">
                  {selectedAnnouncement.title}
                </Typography>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{CATEGORY_LABELS[selectedAnnouncement.category]}</span>
                  <span>{selectedAnnouncement.author}</span>
                  <span>{formatDate(selectedAnnouncement.createdAt)}</span>
                  {selectedAnnouncement.expiresAt && (
                    <span className={
                      selectedAnnouncement.expiresAt.getTime() < Date.now() 
                        ? 'text-red-600 font-medium' 
                        : ''
                    }>
                      {formatExpiry(selectedAnnouncement.expiresAt)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none mb-6">
                <Typography variant="body1" className="whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </Typography>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  읽은 사람: {selectedAnnouncement.readBy.length}명
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleDeleteAnnouncement(selectedAnnouncement.id);
                    }}
                  >
                    삭제
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSelectedAnnouncement(null)}
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default AnnouncementsWidget;