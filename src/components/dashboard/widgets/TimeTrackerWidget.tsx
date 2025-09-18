'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, Square, Clock, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'

interface TimeSession {
  id: string
  projectName: string
  startTime: Date
  endTime?: Date
  duration: number // in seconds
  description?: string
}

interface ProjectTime {
  projectName: string
  totalTime: number // in seconds
  sessions: TimeSession[]
  isExpanded?: boolean
}

interface TimeTrackerWidgetProps {
  id: string
  config?: {
    projects?: string[]
    isPreviewMode?: boolean // 프리뷰 모드 플래그
    disableTimers?: boolean // 타이머 비활성화 플래그
  }
  isEditMode: boolean
  onConfigChange?: (config: any) => void
}

export function TimeTrackerWidget({ id, config, isEditMode }: TimeTrackerWidgetProps) {
  // 프리뷰 모드 체크
  const isPreviewMode = config?.isPreviewMode || config?.disableTimers
  
  const [isTracking, setIsTracking] = useState(false)
  const [currentProject, setCurrentProject] = useState('')
  const [currentDescription, setCurrentDescription] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [sessions, setSessions] = useState<TimeSession[]>([])
  const [projectTimes, setProjectTimes] = useState<ProjectTime[]>([])
  const [showReport, setShowReport] = useState(false)
  
  const startTimeRef = useRef<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 기본 프로젝트 목록
  const defaultProjects = config?.projects || [
    'Weave 프로젝트',
    '클라이언트 A',
    '클라이언트 B',
    '내부 개발',
    '기타'
  ]

  // 타이머 시작
  const startTimer = useCallback(() => {
    // 프리뷰 모드에서는 타이머 작동 안함
    if (isPreviewMode) return
    
    if (!currentProject) {
      alert('프로젝트를 선택해주세요.')
      return
    }
    
    setIsTracking(true)
    startTimeRef.current = new Date()
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
        setElapsedTime(elapsed)
      }
    }, 1000)
  }, [currentProject, isPreviewMode])

  // 타이머 정지
  const stopTimer = useCallback(() => {
    if (!startTimeRef.current || !intervalRef.current) return
    
    const endTime = new Date()
    const newSession: TimeSession = {
      id: `session-${Date.now()}`,
      projectName: currentProject,
      startTime: startTimeRef.current,
      endTime: endTime,
      duration: elapsedTime,
      description: currentDescription
    }
    
    setSessions(prev => [...prev, newSession])
    
    // 프로젝트별 시간 집계 업데이트
    setProjectTimes(prev => {
      const existingProject = prev.find(p => p.projectName === currentProject)
      if (existingProject) {
        return prev.map(p =>
          p.projectName === currentProject
            ? {
                ...p,
                totalTime: p.totalTime + elapsedTime,
                sessions: [...p.sessions, newSession]
              }
            : p
        )
      } else {
        return [...prev, {
          projectName: currentProject,
          totalTime: elapsedTime,
          sessions: [newSession]
        }]
      }
    })
    
    // 타이머 초기화
    setIsTracking(false)
    setElapsedTime(0)
    setCurrentDescription('')
    startTimeRef.current = null
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [currentProject, elapsedTime, currentDescription])

  // 타이머 리셋 (세션 취소)
  const resetTimer = useCallback(() => {
    setIsTracking(false)
    setElapsedTime(0)
    startTimeRef.current = null
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // 시간 포맷팅 함수
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 날짜 포맷팅 함수
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // 프로젝트 확장/축소 토글
  const toggleProjectExpand = (projectName: string) => {
    setProjectTimes(prev =>
      prev.map(p =>
        p.projectName === projectName
          ? { ...p, isExpanded: !p.isExpanded }
          : p
      )
    )
  }

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-2">
          <Typography variant="h3" className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            시간 추적기
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReport(!showReport)}
          >
            {showReport ? '타이머' : '리포트'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!showReport ? (
          // 타이머 뷰
          <div className="space-y-4">
            {/* 프로젝트 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                프로젝트
              </label>
              <select
                value={currentProject}
                onChange={(e) => setCurrentProject(e.target.value)}
                disabled={isTracking}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-white"
              >
                <option value="">프로젝트 선택...</option>
                {defaultProjects.map(project => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>

            {/* 설명 입력 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                작업 내용 (선택사항)
              </label>
              <input
                type="text"
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                disabled={isTracking}
                placeholder="작업 내용을 간단히 입력..."
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg"
              />
            </div>

            {/* 타이머 디스플레이 */}
            <div className="text-center py-8">
              <Typography variant="h1" className="text-5xl font-mono">
                {formatTime(elapsedTime)}
              </Typography>
              {isTracking && currentProject && (
                <Typography variant="body2" className="mt-2 text-[var(--color-text-secondary)]">
                  {currentProject} 작업 중...
                </Typography>
              )}
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex justify-center gap-2">
              {!isTracking ? (
                <Button
                  onClick={startTimer}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  시작
                </Button>
              ) : (
                <>
                  <Button
                    onClick={stopTimer}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    정지 & 저장
                  </Button>
                  <Button
                    onClick={resetTimer}
                    variant="ghost"
                    className="flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    취소
                  </Button>
                </>
              )}
            </div>

            {/* 최근 세션 */}
            {sessions.length > 0 && (
              <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                <Typography variant="h4" className="mb-3">
                  오늘의 세션
                </Typography>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sessions.slice(-3).reverse().map(session => (
                    <div
                      key={session.id}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <Typography variant="body2" className="font-medium">
                          {session.projectName}
                        </Typography>
                        {session.description && (
                          <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                            {session.description}
                          </Typography>
                        )}
                      </div>
                      <Typography variant="body2" className="font-mono">
                        {formatTime(session.duration)}
                      </Typography>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // 리포트 뷰
          <div className="space-y-4">
            <Typography variant="h4" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              프로젝트별 시간 집계
            </Typography>
            
            {projectTimes.length === 0 ? (
              <div className="text-center py-8">
                <Typography variant="body2" className="text-[var(--color-text-secondary)]">
                  아직 기록된 시간이 없습니다.
                </Typography>
              </div>
            ) : (
              <div className="space-y-2">
                {projectTimes.map(project => (
                  <div key={project.projectName} className="border rounded-lg">
                    <div
                      className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleProjectExpand(project.projectName)}
                    >
                      <div className="flex items-center gap-2">
                        {project.isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <Typography variant="body1" className="font-medium">
                          {project.projectName}
                        </Typography>
                      </div>
                      <Typography variant="h4" className="font-mono">
                        {formatTime(project.totalTime)}
                      </Typography>
                    </div>
                    
                    {project.isExpanded && (
                      <div className="border-t border-[var(--color-border)] p-3 bg-gray-50">
                        <div className="space-y-2">
                          {project.sessions.map(session => (
                            <div
                              key={session.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <div className="flex-1">
                                <Typography variant="caption">
                                  {formatDate(session.startTime)}
                                </Typography>
                                {session.description && (
                                  <Typography variant="caption" className="ml-2 text-[var(--color-text-secondary)]">
                                    - {session.description}
                                  </Typography>
                                )}
                              </div>
                              <Typography variant="caption" className="font-mono">
                                {formatTime(session.duration)}
                              </Typography>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* 총 시간 */}
                <div className="pt-3 mt-3 border-t-2 border-[var(--color-border)]">
                  <div className="flex justify-between items-center">
                    <Typography variant="h4">총 시간</Typography>
                    <Typography variant="h3" className="font-mono">
                      {formatTime(
                        projectTimes.reduce((total, p) => total + p.totalTime, 0)
                      )}
                    </Typography>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}