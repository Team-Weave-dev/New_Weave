'use client'

// 동적 렌더링 강제 - Static Generation 방지
export const dynamic = 'force-dynamic';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Typography from '@/components/ui/Typography'
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    company: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    // 비밀번호 강도 확인
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      // 회원가입
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company: formData.company
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('이미 등록된 이메일입니다.')
        } else {
          setError(error.message)
        }
        return
      }

      // 회원가입 성공
      setSuccess(true)
    } catch (err) {
      console.error('Signup error:', err)
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      console.error('Google signup error:', err)
      setError('Google 회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary to-bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <Typography variant="h2" className="text-2xl font-bold text-txt-primary mb-4">
            회원가입이 완료되었습니다!
          </Typography>
          <Typography variant="body1" className="text-txt-secondary mb-6">
            입력하신 이메일로 인증 메일을 발송했습니다.<br />
            이메일을 확인하고 인증을 완료해주세요.
          </Typography>
          <Button
            variant="primary"
            onClick={() => router.push('/login')}
            className="w-full"
          >
            로그인 페이지로 이동
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary to-bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-weave-primary rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <Typography variant="h1" className="text-3xl font-bold text-txt-primary mb-2">
            WEAVE 회원가입
          </Typography>
          <Typography variant="body1" className="text-txt-secondary">
            비즈니스 관리를 시작하세요
          </Typography>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSignup} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <Typography variant="body2" className="text-red-600">
                  {error}
                </Typography>
              </div>
            )}

            {/* 이름 입력 */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-txt-secondary mb-2">
                이름 *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-txt-tertiary" />
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="홍길동"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 회사명 입력 */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-txt-secondary mb-2">
                회사명
              </label>
              <Input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="회사명 (선택사항)"
                disabled={loading}
              />
            </div>

            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-txt-secondary mb-2">
                이메일 *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-txt-tertiary" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-txt-secondary mb-2">
                비밀번호 *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-txt-tertiary" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="최소 6자 이상"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-txt-secondary mb-2">
                비밀번호 확인 *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-txt-tertiary" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="비밀번호 재입력"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 회원가입 버튼 */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || !formData.email || !formData.password || !formData.fullName}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  회원가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </Button>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-light" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-txt-tertiary">또는</span>
              </div>
            </div>

            {/* Google 회원가입 */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 회원가입
            </Button>

            {/* 로그인 링크 */}
            <div className="text-center">
              <Typography variant="body2" className="text-txt-secondary">
                이미 계정이 있으신가요?{' '}
                <Link
                  href="/login"
                  className="text-weave-primary hover:text-weave-primary-dark font-medium"
                >
                  로그인
                </Link>
              </Typography>
            </div>
          </form>
        </Card>

        {/* 약관 안내 */}
        <Typography variant="body2" className="text-txt-tertiary text-center mt-4">
          회원가입 시{' '}
          <Link href="/terms" className="text-weave-primary hover:text-weave-primary-dark">
            이용약관
          </Link>
          {' 및 '}
          <Link href="/privacy" className="text-weave-primary hover:text-weave-primary-dark">
            개인정보처리방침
          </Link>
          에 동의합니다.
        </Typography>
      </div>
    </div>
  )
}