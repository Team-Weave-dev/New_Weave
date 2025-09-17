'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { User, Users, Clock, Calendar, CheckCircle, AlertCircle, Coffee, Video } from 'lucide-react';
import { useWidgetRealtime } from '@/lib/dashboard/realtime/useRealtime';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away' | 'meeting';
  currentTask?: string;
  nextMeeting?: {
    title: string;
    time: string;
  };
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  lastSeen?: Date;
  productivity?: number; // 0-100
}

interface TeamStatusWidgetProps {
  teamMembers?: TeamMember[];
}

export default function TeamStatusWidget() {
  const teamMembers: TeamMember[] = [];
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'busy' | 'away' | 'meeting'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // 실시간 업데이트 연결
  useWidgetRealtime('team-status');

  // Mock 데이터 초기화
  useEffect(() => {
    if (teamMembers.length > 0) {
      setMembers(teamMembers);
    } else {
      // Mock 데이터 생성
      const mockMembers: TeamMember[] = [
        {
          id: '1',
          name: '김민수',
          role: 'Frontend Developer',
          status: 'online',
          currentTask: 'Dashboard UI 개선 작업',
          nextMeeting: {
            title: '주간 스탠드업',
            time: '오전 10:00'
          },
          workingHours: {
            start: '09:00',
            end: '18:00',
            timezone: 'Asia/Seoul'
          },
          productivity: 85
        },
        {
          id: '2',
          name: '이수진',
          role: 'Backend Developer',
          status: 'busy',
          currentTask: 'API 성능 최적화',
          nextMeeting: {
            title: '기술 리뷰',
            time: '오후 2:00'
          },
          workingHours: {
            start: '09:00',
            end: '18:00',
            timezone: 'Asia/Seoul'
          },
          productivity: 92
        },
        {
          id: '3',
          name: '박지영',
          role: 'UI/UX Designer',
          status: 'meeting',
          currentTask: '디자인 시스템 업데이트',
          nextMeeting: {
            title: '디자인 리뷰 미팅',
            time: '진행 중'
          },
          workingHours: {
            start: '10:00',
            end: '19:00',
            timezone: 'Asia/Seoul'
          },
          productivity: 78
        },
        {
          id: '4',
          name: '최현우',
          role: 'Project Manager',
          status: 'online',
          currentTask: '프로젝트 일정 관리',
          nextMeeting: {
            title: '클라이언트 미팅',
            time: '오후 4:00'
          },
          workingHours: {
            start: '08:00',
            end: '17:00',
            timezone: 'Asia/Seoul'
          },
          productivity: 90
        },
        {
          id: '5',
          name: '정하은',
          role: 'QA Engineer',
          status: 'away',
          currentTask: '테스트 케이스 작성',
          lastSeen: new Date(Date.now() - 1000 * 60 * 15), // 15분 전
          workingHours: {
            start: '09:00',
            end: '18:00',
            timezone: 'Asia/Seoul'
          },
          productivity: 75
        },
        {
          id: '6',
          name: '강준호',
          role: 'DevOps Engineer',
          status: 'offline',
          lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
          workingHours: {
            start: '11:00',
            end: '20:00',
            timezone: 'Asia/Seoul'
          },
          productivity: 88
        }
      ];
      setMembers(mockMembers);
    }
  }, [teamMembers]);

  // 필터링된 멤버 목록
  const filteredMembers = filter === 'all' 
    ? members 
    : members.filter(member => member.status === filter);

  // 상태별 통계
  const statusCounts = {
    online: members.filter(m => m.status === 'online').length,
    busy: members.filter(m => m.status === 'busy').length,
    meeting: members.filter(m => m.status === 'meeting').length,
    away: members.filter(m => m.status === 'away').length,
    offline: members.filter(m => m.status === 'offline').length
  };

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'meeting': return 'bg-purple-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'busy': return <AlertCircle className="w-4 h-4" />;
      case 'meeting': return <Video className="w-4 h-4" />;
      case 'away': return <Coffee className="w-4 h-4" />;
      case 'offline': return <Clock className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return '온라인';
      case 'busy': return '바쁨';
      case 'meeting': return '회의 중';
      case 'away': return '자리 비움';
      case 'offline': return '오프라인';
      default: return '알 수 없음';
    }
  };

  const formatLastSeen = (lastSeen?: Date) => {
    if (!lastSeen) return '';
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="h-full">
      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <Typography variant="h3">팀원 상태</Typography>
          </div>
          <div className="flex items-center gap-2">
            {/* 뷰 전환 */}
            <div className="flex gap-1">
              <Button
                variant={view === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('grid')}
              >
                격자
              </Button>
              <Button
                variant={view === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('list')}
              >
                목록
              </Button>
            </div>
          </div>
        </div>

        {/* 상태 요약 */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-[var(--color-text-secondary)]">{statusCounts.online}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-[var(--color-text-secondary)]">{statusCounts.busy}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-xs text-[var(--color-text-secondary)]">{statusCounts.meeting}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-[var(--color-text-secondary)]">{statusCounts.away}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-xs text-[var(--color-text-secondary)]">{statusCounts.offline}</span>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'online', 'busy', 'meeting', 'away', 'offline'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? '전체' : getStatusText(status)}
            </Button>
          ))}
        </div>

        {/* 팀원 목록 */}
        <div className={view === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className={`${
                view === 'grid'
                  ? 'p-3 border border-[var(--color-border)] rounded-lg'
                  : 'p-2 border-b border-[var(--color-border)] last:border-b-0'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* 아바타 */}
                <div className="relative">
                  <div className="w-10 h-10 bg-[var(--color-primary)] bg-opacity-10 rounded-full flex items-center justify-center">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full" />
                    ) : (
                      <span className="text-sm font-semibold text-[var(--color-primary)]">
                        {getInitials(member.name)}
                      </span>
                    )}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${getStatusColor(member.status)} border-2 border-white`}></div>
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <Typography variant="body2" className="font-semibold">{member.name}</Typography>
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        {member.role}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(member.status)}
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        {getStatusText(member.status)}
                      </Typography>
                    </div>
                  </div>

                  {/* 현재 작업 */}
                  {member.currentTask && (
                    <div className="mt-2">
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        현재 작업: {member.currentTask}
                      </Typography>
                    </div>
                  )}

                  {/* 다음 미팅 */}
                  {member.nextMeeting && (
                    <div className="mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[var(--color-text-secondary)]" />
                      <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                        {member.nextMeeting.title} - {member.nextMeeting.time}
                      </Typography>
                    </div>
                  )}

                  {/* 마지막 접속 */}
                  {member.status === 'offline' && member.lastSeen && (
                    <Typography variant="caption" className="text-[var(--color-text-secondary)] mt-1">
                      마지막 접속: {formatLastSeen(member.lastSeen)}
                    </Typography>
                  )}

                  {/* 생산성 */}
                  {member.productivity !== undefined && view === 'list' && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                          생산성
                        </Typography>
                        <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                          {member.productivity}%
                        </Typography>
                      </div>
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-primary)] transition-all"
                          style={{ width: `${member.productivity}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-2 opacity-50" />
            <Typography variant="body2" className="text-[var(--color-text-secondary)]">
              팀원이 없습니다
            </Typography>
          </div>
        )}
      </div>
    </Card>
  );
}