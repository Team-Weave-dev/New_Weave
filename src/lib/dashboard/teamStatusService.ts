/**
 * 팀원 상태 관리 서비스
 * 팀원의 온라인 상태, 작업 상태, 일정 등을 관리
 */

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
  productivity?: number;
}

interface TeamActivity {
  memberId: string;
  type: 'status_change' | 'task_update' | 'meeting_start' | 'meeting_end';
  timestamp: Date;
  details?: any;
}

class TeamStatusService {
  private members: Map<string, TeamMember> = new Map();
  private activities: TeamActivity[] = [];
  private subscribers: Set<(members: TeamMember[]) => void> = new Set();
  private statusUpdateInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeMockData();
    this.startStatusSimulation();
  }

  /**
   * Mock 데이터 초기화
   */
  private initializeMockData() {
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
        status: 'online',
        currentTask: '디자인 시스템 업데이트',
        nextMeeting: {
          title: '디자인 리뷰',
          time: '오후 3:00'
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
        status: 'meeting',
        currentTask: '프로젝트 일정 관리',
        nextMeeting: {
          title: '클라이언트 미팅',
          time: '진행 중'
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
        lastSeen: new Date(Date.now() - 1000 * 60 * 15),
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
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2),
        workingHours: {
          start: '11:00',
          end: '20:00',
          timezone: 'Asia/Seoul'
        },
        productivity: 88
      }
    ];

    mockMembers.forEach(member => {
      this.members.set(member.id, member);
    });
  }

  /**
   * 상태 시뮬레이션 시작
   */
  private startStatusSimulation() {
    // 30초마다 랜덤하게 상태 업데이트
    this.statusUpdateInterval = setInterval(() => {
      this.simulateStatusChange();
    }, 30000);
  }

  /**
   * 랜덤 상태 변경 시뮬레이션
   */
  private simulateStatusChange() {
    const memberArray = Array.from(this.members.values());
    const randomMember = memberArray[Math.floor(Math.random() * memberArray.length)];
    
    if (randomMember) {
      const statuses: TeamMember['status'][] = ['online', 'busy', 'away', 'meeting', 'offline'];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      if (newStatus !== randomMember.status) {
        this.updateMemberStatus(randomMember.id, newStatus);
        
        // 작업 상태도 랜덤하게 업데이트
        if (Math.random() > 0.5) {
          const tasks = [
            '코드 리뷰 중',
            '버그 수정 중',
            '문서 작성 중',
            '테스트 실행 중',
            '미팅 준비 중',
            '기능 개발 중'
          ];
          randomMember.currentTask = tasks[Math.floor(Math.random() * tasks.length)];
        }

        // 생산성 수치 업데이트
        randomMember.productivity = Math.floor(Math.random() * 30) + 70;

        this.notifySubscribers();
      }
    }
  }

  /**
   * 팀원 목록 조회
   */
  getMembers(): TeamMember[] {
    return Array.from(this.members.values());
  }

  /**
   * 특정 팀원 조회
   */
  getMember(id: string): TeamMember | undefined {
    return this.members.get(id);
  }

  /**
   * 팀원 상태 업데이트
   */
  updateMemberStatus(id: string, status: TeamMember['status']) {
    const member = this.members.get(id);
    if (member) {
      member.status = status;
      
      if (status === 'offline') {
        member.lastSeen = new Date();
      }

      this.addActivity({
        memberId: id,
        type: 'status_change',
        timestamp: new Date(),
        details: { status }
      });

      this.members.set(id, member);
      this.notifySubscribers();
    }
  }

  /**
   * 팀원 작업 업데이트
   */
  updateMemberTask(id: string, task: string) {
    const member = this.members.get(id);
    if (member) {
      member.currentTask = task;

      this.addActivity({
        memberId: id,
        type: 'task_update',
        timestamp: new Date(),
        details: { task }
      });

      this.members.set(id, member);
      this.notifySubscribers();
    }
  }

  /**
   * 미팅 시작
   */
  startMeeting(memberIds: string[], meetingTitle: string) {
    memberIds.forEach(id => {
      const member = this.members.get(id);
      if (member) {
        member.status = 'meeting';
        member.nextMeeting = {
          title: meetingTitle,
          time: '진행 중'
        };

        this.addActivity({
          memberId: id,
          type: 'meeting_start',
          timestamp: new Date(),
          details: { meetingTitle }
        });
      }
    });

    this.notifySubscribers();
  }

  /**
   * 미팅 종료
   */
  endMeeting(memberIds: string[]) {
    memberIds.forEach(id => {
      const member = this.members.get(id);
      if (member) {
        member.status = 'online';
        member.nextMeeting = undefined;

        this.addActivity({
          memberId: id,
          type: 'meeting_end',
          timestamp: new Date()
        });
      }
    });

    this.notifySubscribers();
  }

  /**
   * 팀원 추가
   */
  addMember(member: TeamMember) {
    this.members.set(member.id, member);
    this.notifySubscribers();
  }

  /**
   * 팀원 제거
   */
  removeMember(id: string) {
    this.members.delete(id);
    this.notifySubscribers();
  }

  /**
   * 활동 기록 추가
   */
  private addActivity(activity: TeamActivity) {
    this.activities.push(activity);
    
    // 최근 100개만 유지
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(-100);
    }
  }

  /**
   * 최근 활동 조회
   */
  getRecentActivities(limit: number = 20): TeamActivity[] {
    return this.activities.slice(-limit).reverse();
  }

  /**
   * 온라인 멤버 수 조회
   */
  getOnlineCount(): number {
    return Array.from(this.members.values()).filter(
      member => member.status !== 'offline'
    ).length;
  }

  /**
   * 상태별 멤버 수 조회
   */
  getStatusCounts(): Record<TeamMember['status'], number> {
    const counts: Record<TeamMember['status'], number> = {
      online: 0,
      offline: 0,
      busy: 0,
      away: 0,
      meeting: 0
    };

    Array.from(this.members.values()).forEach(member => {
      counts[member.status]++;
    });

    return counts;
  }

  /**
   * 평균 생산성 조회
   */
  getAverageProductivity(): number {
    const members = Array.from(this.members.values());
    const totalProductivity = members.reduce((sum, member) => {
      return sum + (member.productivity || 0);
    }, 0);

    return members.length > 0 ? Math.round(totalProductivity / members.length) : 0;
  }

  /**
   * 현재 미팅 중인 멤버 조회
   */
  getMembersInMeeting(): TeamMember[] {
    return Array.from(this.members.values()).filter(
      member => member.status === 'meeting'
    );
  }

  /**
   * 구독 등록
   */
  subscribe(callback: (members: TeamMember[]) => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * 구독자에게 알림
   */
  private notifySubscribers() {
    const members = this.getMembers();
    this.subscribers.forEach(callback => {
      callback(members);
    });
  }

  /**
   * 정리
   */
  cleanup() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }
    this.subscribers.clear();
    this.members.clear();
    this.activities = [];
  }
}

// 싱글톤 인스턴스
export const teamStatusService = new TeamStatusService();

export type { TeamMember, TeamActivity };