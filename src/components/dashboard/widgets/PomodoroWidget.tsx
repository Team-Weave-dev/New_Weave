'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee, Target, Volume2, VolumeX } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'

interface PomodoroSession {
  id: string
  type: 'work' | 'shortBreak' | 'longBreak'
  startTime: Date
  endTime?: Date
  completed: boolean
}

interface PomodoroWidgetProps {
  id: string
  config?: {
    workDuration?: number // in minutes
    shortBreakDuration?: number
    longBreakDuration?: number
    sessionsBeforeLongBreak?: number
    soundEnabled?: boolean
  }
  isEditMode: boolean
  onConfigChange?: (config: any) => void
}

export function PomodoroWidget({ id, config, isEditMode }: PomodoroWidgetProps) {
  // 프리뷰 모드 체크
  const isPreviewMode = config?.isPreviewMode || config?.disableTimers
  
  // 설정값
  const workDuration = (config?.workDuration || 25) * 60 // 25분을 초로 변환
  const shortBreakDuration = (config?.shortBreakDuration || 5) * 60 // 5분
  const longBreakDuration = (config?.longBreakDuration || 15) * 60 // 15분
  const sessionsBeforeLongBreak = config?.sessionsBeforeLongBreak || 4

  // 상태
  const [isRunning, setIsRunning] = useState(false)
  const [currentMode, setCurrentMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work')
  const [timeLeft, setTimeLeft] = useState(workDuration)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [todaySessions, setTodaySessions] = useState<PomodoroSession[]>([])
  const [soundEnabled, setSoundEnabled] = useState(config?.soundEnabled !== false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentSessionRef = useRef<PomodoroSession | null>(null)

  // 오늘 날짜 가져오기
  const getTodayDate = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }

  // 로컬 스토리지에서 오늘 세션 로드
  useEffect(() => {
    const loadTodaySessions = () => {
      const saved = localStorage.getItem(`pomodoro-sessions-${id}`)
      if (saved) {
        const sessions: PomodoroSession[] = JSON.parse(saved)
        const today = getTodayDate()
        const todaySessionsFiltered = sessions.filter(session => {
          const sessionDate = new Date(session.startTime)
          sessionDate.setHours(0, 0, 0, 0)
          return sessionDate.getTime() === today.getTime()
        })
        setTodaySessions(todaySessionsFiltered)
        
        // 완료된 작업 세션 수 계산
        const completedWorkSessions = todaySessionsFiltered.filter(
          s => s.type === 'work' && s.completed
        ).length
        setCompletedSessions(completedWorkSessions)
      }
    }
    loadTodaySessions()
  }, [id])

  // 세션 저장
  const saveSessions = useCallback((sessions: PomodoroSession[]) => {
    localStorage.setItem(`pomodoro-sessions-${id}`, JSON.stringify(sessions))
  }, [id])

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 알림 소리 재생
  const playSound = useCallback(() => {
    if (!soundEnabled) return
    
    // 간단한 비프음 생성
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 880 // A5 음
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }, [soundEnabled])

  // 세션 완료 처리
  const completeSession = useCallback(() => {
    if (currentSessionRef.current) {
      const completedSession = {
        ...currentSessionRef.current,
        endTime: new Date(),
        completed: true
      }
      
      const updatedSessions = [...todaySessions.filter(s => s.id !== completedSession.id), completedSession]
      setTodaySessions(updatedSessions)
      saveSessions(updatedSessions)
      
      if (completedSession.type === 'work') {
        setCompletedSessions(prev => prev + 1)
      }
      
      currentSessionRef.current = null
    }
    
    playSound()
    
    // 브라우저 알림 (권한이 있는 경우)
    if ('Notification' in window && Notification.permission === 'granted') {
      const message = currentMode === 'work' 
        ? '작업 시간이 끝났습니다! 휴식을 취하세요.'
        : '휴식이 끝났습니다! 다시 집중해봐요.'
      new Notification('뽀모도로 타이머', { body: message })
    }
  }, [currentMode, todaySessions, saveSessions, playSound])

  // 다음 모드로 전환
  const switchMode = useCallback(() => {
    let nextMode: 'work' | 'shortBreak' | 'longBreak'
    let nextDuration: number
    
    if (currentMode === 'work') {
      // 작업 후 휴식으로
      const sessionsCompleted = completedSessions + 1
      if (sessionsCompleted % sessionsBeforeLongBreak === 0) {
        nextMode = 'longBreak'
        nextDuration = longBreakDuration
      } else {
        nextMode = 'shortBreak'
        nextDuration = shortBreakDuration
      }
    } else {
      // 휴식 후 작업으로
      nextMode = 'work'
      nextDuration = workDuration
    }
    
    setCurrentMode(nextMode)
    setTimeLeft(nextDuration)
    setIsRunning(false)
  }, [currentMode, completedSessions, sessionsBeforeLongBreak, workDuration, shortBreakDuration, longBreakDuration])

  // 타이머 시작/일시정지
  const toggleTimer = useCallback(() => {
    // 프리뷰 모드에서는 타이머 작동 안함
    if (isPreviewMode) return
    
    if (!isRunning) {
      // 시작
      setIsRunning(true)
      
      // 새 세션 시작
      if (!currentSessionRef.current) {
        const newSession: PomodoroSession = {
          id: `session-${Date.now()}`,
          type: currentMode,
          startTime: new Date(),
          completed: false
        }
        currentSessionRef.current = newSession
        setTodaySessions(prev => [...prev, newSession])
      }
      
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeSession()
            switchMode()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      // 일시정지
      setIsRunning(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, currentMode, completeSession, switchMode, isPreviewMode])

  // 타이머 리셋
  const resetTimer = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // 현재 세션 취소
    if (currentSessionRef.current && !currentSessionRef.current.completed) {
      setTodaySessions(prev => prev.filter(s => s.id !== currentSessionRef.current?.id))
      currentSessionRef.current = null
    }
    
    // 작업 모드로 리셋
    setCurrentMode('work')
    setTimeLeft(workDuration)
  }, [workDuration])

  // 수동 모드 변경
  const changeMode = useCallback((mode: 'work' | 'shortBreak' | 'longBreak') => {
    if (isRunning) return // 실행 중에는 변경 불가
    
    setCurrentMode(mode)
    currentSessionRef.current = null
    
    switch (mode) {
      case 'work':
        setTimeLeft(workDuration)
        break
      case 'shortBreak':
        setTimeLeft(shortBreakDuration)
        break
      case 'longBreak':
        setTimeLeft(longBreakDuration)
        break
    }
  }, [isRunning, workDuration, shortBreakDuration, longBreakDuration])

  // 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsRunning(false)
    }
  }, [])

  // 진행률 계산
  const getProgress = (): number => {
    let totalDuration = workDuration
    if (currentMode === 'shortBreak') totalDuration = shortBreakDuration
    else if (currentMode === 'longBreak') totalDuration = longBreakDuration
    
    return ((totalDuration - timeLeft) / totalDuration) * 100
  }

  // 모드별 색상
  const getModeColor = () => {
    switch (currentMode) {
      case 'work':
        return 'var(--color-status-error)' // 빨간색 (집중)
      case 'shortBreak':
        return 'var(--color-status-success)' // 초록색 (짧은 휴식)
      case 'longBreak':
        return 'var(--color-status-info)' // 파란색 (긴 휴식)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <Typography variant="h3" className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            뽀모도로
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-4">
        {/* 모드 선택 버튼 */}
        <div className="flex justify-center gap-2 mb-4">
          <Button
            variant={currentMode === 'work' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => changeMode('work')}
            disabled={isRunning}
          >
            작업
          </Button>
          <Button
            variant={currentMode === 'shortBreak' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => changeMode('shortBreak')}
            disabled={isRunning}
          >
            짧은 휴식
          </Button>
          <Button
            variant={currentMode === 'longBreak' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => changeMode('longBreak')}
            disabled={isRunning}
          >
            긴 휴식
          </Button>
        </div>

        {/* 타이머 디스플레이 */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center">
            {/* 원형 프로그레스 바 */}
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="var(--color-border)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke={getModeColor()}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - getProgress() / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute">
              <Typography variant="h1" className="text-4xl font-mono">
                {formatTime(timeLeft)}
              </Typography>
              <Typography variant="caption" className="text-center block mt-1 text-[var(--color-text-secondary)]">
                {currentMode === 'work' ? '집중 시간' : currentMode === 'shortBreak' ? '짧은 휴식' : '긴 휴식'}
              </Typography>
            </div>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex justify-center gap-2 mb-4">
          <Button
            onClick={toggleTimer}
            variant="primary"
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                일시정지
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                시작
              </>
            )}
          </Button>
          <Button
            onClick={resetTimer}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            리셋
          </Button>
        </div>

        {/* 오늘의 세션 통계 */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <Typography variant="h4" className="mb-2 text-center">
            오늘의 세션
          </Typography>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <Typography variant="h3" className="text-[var(--color-status-error)]">
                {completedSessions}
              </Typography>
              <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                완료한 작업
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h3" className="text-[var(--color-status-success)]">
                {Math.floor(completedSessions / sessionsBeforeLongBreak)}
              </Typography>
              <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                완료한 사이클
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h3" className="text-[var(--color-status-info)]">
                {todaySessions.filter(s => s.type !== 'work' && s.completed).length}
              </Typography>
              <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                휴식 횟수
              </Typography>
            </div>
          </div>
        </div>

        {/* 다음 목표 */}
        {completedSessions > 0 && (
          <div className="mt-3 text-center">
            <Typography variant="caption" className="text-[var(--color-text-secondary)]">
              {sessionsBeforeLongBreak - (completedSessions % sessionsBeforeLongBreak)}개 더 완료하면 긴 휴식!
            </Typography>
          </div>
        )}
      </div>
    </Card>
  )
}