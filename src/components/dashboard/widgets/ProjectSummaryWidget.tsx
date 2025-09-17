'use client'

import React, { useEffect, useState } from 'react'
import { Briefcase, TrendingUp, Clock, CheckCircle, Calendar, Users, Flag, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import type { WidgetProps } from '@/types/dashboard'
import { getSupabaseClientSafe } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { widgetColors, widgetCategoryColors, gradients } from '@/lib/dashboard/widget-colors'

interface TeamMember {
  id: string
  name: string
  avatar?: string
  role?: string
}

interface Milestone {
  id: string
  name: string
  date: string
  status: 'completed' | 'current' | 'upcoming'
}

interface ProjectSummary {
  total: number
  inProgress: number
  completed: number
  onHold: number
  totalRevenue: number
  averageProgress: number
  recentProjects: Array<{
    id: string
    name: string
    status: string
    progress: number
    client: string
    teamMembers?: TeamMember[]
    milestones?: Milestone[]
    deadline?: string
  }>
}

export function ProjectSummaryWidget({
  id,
  type,
  config,
  isEditMode,
  className
}: WidgetProps) {
  const [data, setData] = useState<ProjectSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseClientSafe()

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 개발 중에는 항상 목 데이터 사용
        // TODO: 프로덕션에서는 실제 Supabase 연결 사용
        const useMockData = true // 개발 중 플래그
        
        if (useMockData) {
          // 목 데이터 설정
          setData({
            total: 12,
            inProgress: 5,
            completed: 6,
            onHold: 1,
            totalRevenue: 45000000,
            averageProgress: 68,
            recentProjects: [
              { 
                id: '1', 
                name: '웹사이트 리뉴얼', 
                status: 'in_progress', 
                progress: 75, 
                client: 'A사',
                deadline: '2025-02-28',
                teamMembers: [
                  { id: 't1', name: '김개발', role: '프론트엔드' },
                  { id: 't2', name: '이디자인', role: 'UI/UX' },
                  { id: 't3', name: '박백엔드', role: '백엔드' }
                ],
                milestones: [
                  { id: 'm1', name: '기획 완료', date: '2025-01-15', status: 'completed' },
                  { id: 'm2', name: '디자인 완료', date: '2025-02-01', status: 'current' },
                  { id: 'm3', name: '개발 완료', date: '2025-02-20', status: 'upcoming' },
                  { id: 'm4', name: '배포', date: '2025-02-28', status: 'upcoming' }
                ]
              },
              { 
                id: '2', 
                name: '모바일 앱 개발', 
                status: 'in_progress', 
                progress: 40, 
                client: 'B사',
                deadline: '2025-03-15',
                teamMembers: [
                  { id: 't4', name: '최모바일', role: '모바일 개발' },
                  { id: 't5', name: '정서버', role: '서버 개발' }
                ],
                milestones: [
                  { id: 'm5', name: 'MVP 개발', date: '2025-02-10', status: 'current' },
                  { id: 'm6', name: '베타 테스트', date: '2025-03-01', status: 'upcoming' }
                ]
              },
              { 
                id: '3', 
                name: '데이터 분석 시스템', 
                status: 'completed', 
                progress: 100, 
                client: 'C사',
                teamMembers: [
                  { id: 't6', name: '강데이터', role: '데이터 분석' }
                ]
              },
              { 
                id: '4', 
                name: 'ERP 시스템 구축', 
                status: 'in_progress', 
                progress: 60, 
                client: 'D사',
                deadline: '2025-04-30',
                teamMembers: [
                  { id: 't7', name: '송기획', role: 'PM' },
                  { id: 't8', name: '한개발', role: '풀스택' },
                  { id: 't9', name: '오운영', role: 'DevOps' }
                ]
              },
              { 
                id: '5', 
                name: 'UI/UX 디자인', 
                status: 'on_hold', 
                progress: 30, 
                client: 'E사',
                teamMembers: [
                  { id: 't10', name: '윤디자인', role: 'UI/UX' }
                ]
              }
            ]
          })
          setLoading(false)
          return
        }
        
        // 프로덕션 코드 (현재는 실행되지 않음)
        if (!supabase) {
          throw new Error('Supabase client not available')
        }
        
        const { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (projectError) throw projectError

        if (projects && projects.length > 0) {
          // 프로젝트 통계 계산
          const total = projects.length
          const inProgress = projects.filter((p: any) => p.status === 'in_progress').length
          const completed = projects.filter((p: any) => p.status === 'completed').length
          const onHold = projects.filter((p: any) => p.status === 'on_hold').length
          
          // 전체 수익 계산 (임시 값)
          const totalRevenue = projects.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0)
          
          // 평균 진행률 계산
          const averageProgress = projects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / total || 0

          // 최근 프로젝트 5개
          const recentProjects = projects.slice(0, 5).map((p: any) => ({
            id: p.id,
            name: p.name || '제목 없음',
            status: p.status || 'pending',
            progress: p.progress || 0,
            client: p.client_name || '미지정'
          }))

          setData({
            total,
            inProgress,
            completed,
            onHold,
            totalRevenue,
            averageProgress: Math.round(averageProgress),
            recentProjects
          })
        } else {
          // 프로젝트가 없을 때도 기본 구조 표시
          setData({
            total: 0,
            inProgress: 0,
            completed: 0,
            onHold: 0,
            totalRevenue: 0,
            averageProgress: 0,
            recentProjects: []
          })
        }
      } catch (err) {
        console.error('Failed to fetch project data:', err)
        // 에러 시에도 목 데이터 표시
        setData({
          total: 12,
          inProgress: 5,
          completed: 6,
          onHold: 1,
          totalRevenue: 45000000,
          averageProgress: 68,
          recentProjects: [
            { 
              id: '1', 
              name: '웹사이트 리뉴얼', 
              status: 'in_progress', 
              progress: 75, 
              client: 'A사',
              deadline: '2025-02-28',
              teamMembers: [
                { id: 't1', name: '김개발', role: '프론트엔드' },
                { id: 't2', name: '이디자인', role: 'UI/UX' },
                { id: 't3', name: '박백엔드', role: '백엔드' }
              ],
              milestones: [
                { id: 'm1', name: '기획 완료', date: '2025-01-15', status: 'completed' },
                { id: 'm2', name: '디자인 완료', date: '2025-02-01', status: 'current' },
                { id: 'm3', name: '개발 완료', date: '2025-02-20', status: 'upcoming' },
                { id: 'm4', name: '배포', date: '2025-02-28', status: 'upcoming' }
              ]
            },
            { 
              id: '2', 
              name: '모바일 앱 개발', 
              status: 'in_progress', 
              progress: 40, 
              client: 'B사',
              deadline: '2025-03-15',
              teamMembers: [
                { id: 't4', name: '최모바일', role: '모바일 개발' },
                { id: 't5', name: '정서버', role: '서버 개발' }
              ],
              milestones: [
                { id: 'm5', name: 'MVP 개발', date: '2025-02-10', status: 'current' },
                { id: 'm6', name: '베타 테스트', date: '2025-03-01', status: 'upcoming' }
              ]
            },
            { 
              id: '3', 
              name: '데이터 분석 시스템', 
              status: 'completed', 
              progress: 100, 
              client: 'C사',
              teamMembers: [
                { id: 't6', name: '강데이터', role: '데이터 분석' }
              ]
            },
            { 
              id: '4', 
              name: 'ERP 시스템 구축', 
              status: 'in_progress', 
              progress: 60, 
              client: 'D사',
              deadline: '2025-04-30',
              teamMembers: [
                { id: 't7', name: '송기획', role: 'PM' },
                { id: 't8', name: '한개발', role: '풀스택' },
                { id: 't9', name: '오운영', role: 'DevOps' }
              ]
            },
            { 
              id: '5', 
              name: 'UI/UX 디자인', 
              status: 'on_hold', 
              progress: 30, 
              client: 'E사',
              teamMembers: [
                { id: 't10', name: '윤디자인', role: 'UI/UX' }
              ]
            }
          ]
        })
      } finally {
        setLoading(false)
      }
    }

    if (!isEditMode) {
      fetchProjectData()
    } else {
      // 편집 모드에서는 샘플 데이터 표시
      setData({
        total: 12,
        inProgress: 5,
        completed: 6,
        onHold: 1,
        totalRevenue: 45000000,
        averageProgress: 68,
        recentProjects: []
      })
      setLoading(false)
    }
  }, [isEditMode, supabase])

  // 편집 모드 뷰
  if (isEditMode) {
    return (
      <Card className={cn("h-full flex items-center justify-center bg-gray-50", className)}>
        <div className="text-center">
          <Briefcase className={cn("w-12 h-12 mx-auto mb-2", widgetColors.primary.icon)} />
          <Typography variant="body2" className={widgetColors.text.secondary}>
            프로젝트 요약
          </Typography>
          <Typography variant="caption" className={cn(widgetColors.text.tertiary, "mt-1")}>
            프로젝트 현황 표시
          </Typography>
        </div>
      </Card>
    )
  }

  // 로딩 상태
  if (loading) {
    return (
      <Card className={cn("h-full p-4", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </Card>
    )
  }

  // 에러 상태
  if (error && !data) {
    return (
      <Card className={cn("h-full p-4 flex items-center justify-center", className)}>
        <Typography variant="body2" className={widgetColors.status.error.text}>
          {error}
        </Typography>
      </Card>
    )
  }

  // 데이터가 없는 경우
  if (!data) {
    return (
      <Card className={cn("h-full p-4 flex items-center justify-center", className)}>
        <Typography variant="body2" className={widgetColors.text.secondary}>
          프로젝트가 없습니다
        </Typography>
      </Card>
    )
  }

  // 상태별 색상 - 밝고 깔끔한 스타일
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-[var(--color-brand-secondary-end)] bg-[var(--color-brand-secondary-start)]/10'
      case 'in_progress': return 'text-[var(--color-brand-primary-end)] bg-[var(--color-brand-primary-start)]/10'
      case 'on_hold': return 'text-[var(--color-status-warning)] bg-[var(--color-status-warning)]/10'
      default: return 'text-[var(--color-text-secondary)] bg-gray-100'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료'
      case 'in_progress': return '진행중'
      case 'on_hold': return '보류'
      default: return '대기'
    }
  }

  return (
    <Card className={cn("h-full p-3 sm:p-4 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow", className)}>
      {/* 헤더 */}
      <CardHeader className="pb-2 sm:pb-3 px-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--color-brand-primary-start)]/10">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-brand-primary-end)]" />
            </div>
            <CardTitle className={cn("text-base sm:text-lg", widgetColors.text.primary)}>프로젝트 현황</CardTitle>
          </div>
          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-[var(--color-brand-primary-start)]/10 rounded-full">
            <Typography variant="caption" className="font-medium text-[10px] sm:text-xs text-[var(--color-brand-primary-end)]">
              총 {data.total}개
            </Typography>
          </span>
        </div>
      </CardHeader>

      {/* 통계 카드 - 밝고 깔끔한 스타일 */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="p-3 sm:p-4 rounded-xl bg-[var(--color-brand-primary-start)]/5 border border-[var(--color-brand-primary-start)]/20">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="p-1 sm:p-1.5 rounded-lg bg-white">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--color-brand-primary-end)]" />
            </div>
            <Typography variant="caption" className="font-medium text-[10px] sm:text-xs text-[var(--color-brand-primary-end)]">
              진행중
            </Typography>
          </div>
          <Typography variant="h2" className={cn("text-xl sm:text-2xl", widgetColors.text.primary, "font-bold")}>
            {data.inProgress}
          </Typography>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-[var(--color-brand-secondary-start)]/5 border border-[var(--color-brand-secondary-start)]/20">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="p-1 sm:p-1.5 rounded-lg bg-white">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--color-brand-secondary-end)]" />
            </div>
            <Typography variant="caption" className="font-medium text-[10px] sm:text-xs text-[var(--color-brand-secondary-end)]">
              완료
            </Typography>
          </div>
          <Typography variant="h2" className={cn("text-xl sm:text-2xl", widgetColors.text.primary, "font-bold")}>
            {data.completed}
          </Typography>
        </div>
      </div>

      {/* 평균 진행률 - 개선된 원형 프로그레스바 */}
      <div className="mb-3 sm:mb-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between mb-1.5 sm:mb-2">
            <Typography variant="body2" className={cn("text-xs sm:text-sm", widgetColors.text.secondary, "font-medium")}>
              평균 진행률
            </Typography>
            <Typography variant="body2" className="font-bold text-xs sm:text-sm text-[var(--color-brand-primary-end)]">
              {data.averageProgress}%
            </Typography>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out bg-[var(--color-brand-primary-end)]"
              style={{ width: `${data.averageProgress}%` }}
            />
          </div>
        </div>
        {/* 원형 프로그레스 */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              stroke="var(--color-brand-primary-start)"
              strokeWidth="3"
              fill="none"
              opacity="0.2"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              stroke="var(--color-brand-primary-end)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${data.averageProgress * 1.25} 125`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Typography variant="caption" className="font-bold text-[10px] sm:text-xs text-[var(--color-brand-primary-end)]">
              {data.averageProgress}%
            </Typography>
          </div>
        </div>
      </div>

      {/* 최근 프로젝트 목록 */}
      {data.recentProjects.length > 0 && (
        <div className="flex-1 overflow-hidden">
          <Typography variant="body2" className={cn("font-medium text-sm sm:text-base mb-1.5 sm:mb-2", widgetColors.text.primary)}>
            최근 프로젝트
          </Typography>
          <div className="space-y-1.5 sm:space-y-2 overflow-y-auto max-h-48">
            {data.recentProjects.map((project) => (
              <div
                key={project.id}
                className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm hover:border-[var(--color-brand-primary-end)] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Typography variant="body2" className={cn("text-sm sm:text-base", widgetColors.text.primary, "font-semibold truncate")}>
                      {project.name}
                    </Typography>
                    <Typography variant="caption" className={cn("text-xs sm:text-sm", widgetColors.text.tertiary, "truncate")}>
                      {project.client}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className={cn(
                      "text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-medium",
                      getStatusColor(project.status)
                    )}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                </div>
                
                {/* 진행률 표시 */}
                {project.status === 'in_progress' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--color-brand-primary-end)] rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <Typography variant="caption" className="font-medium text-[10px] sm:text-xs text-[var(--color-brand-primary-end)] min-w-[2rem] text-right">
                      {project.progress}%
                    </Typography>
                  </div>
                )}
                
                {/* 팀원 아바타 */}
                {project.teamMembers && project.teamMembers.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-3 h-3 text-gray-400" />
                    <div className="flex -space-x-2">
                      {project.teamMembers.slice(0, 3).map((member) => (
                        <div
                          key={member.id}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-[var(--color-brand-primary-start)] to-[var(--color-brand-primary-end)] flex items-center justify-center text-white text-[10px] font-medium border-2 border-white"
                          title={`${member.name} - ${member.role}`}
                        >
                          {member.name.substring(0, 1)}
                        </div>
                      ))}
                      {project.teamMembers.length > 3 && (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-[10px] font-medium border-2 border-white">
                          +{project.teamMembers.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 마일스톤 타임라인 */}
                {project.milestones && project.milestones.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Flag className="w-3 h-3 text-gray-400" />
                      <Typography variant="caption" className="text-[10px] sm:text-xs text-gray-500">
                        마일스톤
                      </Typography>
                    </div>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200" />
                      <div className="space-y-1 pl-3">
                        {project.milestones.slice(0, 2).map((milestone, idx) => (
                          <div key={milestone.id} className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full -ml-[13px] border-2 border-white",
                              milestone.status === 'completed' ? 'bg-green-500' :
                              milestone.status === 'current' ? 'bg-blue-500' : 'bg-gray-300'
                            )} />
                            <Typography variant="caption" className="text-[10px] text-gray-600 truncate">
                              {milestone.name}
                            </Typography>
                            <Typography variant="caption" className="text-[9px] text-gray-400">
                              {new Date(milestone.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </Typography>
                          </div>
                        ))}
                        {project.milestones.length > 2 && (
                          <Typography variant="caption" className="text-[9px] text-gray-400 pl-2">
                            +{project.milestones.length - 2} more
                          </Typography>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 마감일 표시 */}
                {project.deadline && (
                  <div className="flex items-center gap-1 mt-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <Typography variant="caption" className="text-[10px] text-gray-500">
                      마감: {new Date(project.deadline).toLocaleDateString('ko-KR')}
                    </Typography>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 전체 수익 (옵션) */}
      {config?.showRevenue && data.totalRevenue > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Typography variant="body2" className={widgetColors.text.secondary}>
              총 수익
            </Typography>
            <Typography variant="h3" className={widgetColors.status.success.text}>
              ₩{data.totalRevenue.toLocaleString()}
            </Typography>
          </div>
        </div>
      )}
    </Card>
  )
}

// 위젯 메타데이터
export const projectSummaryWidgetMetadata = {
  name: '프로젝트 요약',
  description: '진행 중인 프로젝트 현황을 한눈에 확인',
  icon: 'briefcase',
  defaultSize: { width: 2, height: 2 },
  minSize: { width: 1, height: 1 },
  maxSize: { width: 4, height: 4 },
  tags: ['프로젝트', '요약', '현황'],
  configurable: true,
  version: '1.0.0'
}

export default ProjectSummaryWidget