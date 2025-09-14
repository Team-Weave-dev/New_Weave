'use client'

import React, { useState, useEffect } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import Button from '@/components/ui/Button'
import { 
  Share2, 
  Link, 
  Copy, 
  Check, 
  X,
  Download,
  ExternalLink,
  Users,
  Clock
} from 'lucide-react'
import { 
  generateShareLink, 
  copyToClipboard,
  generateShortShareCode,
  updateShareStats,
  getShareStats
} from '@/lib/dashboard/layoutSharing'
import { downloadLayout } from '@/lib/dashboard/layoutExportImport'
import { cn } from '@/lib/utils'
import type { DashboardLayout } from '@/types/dashboard'

interface ShareLayoutModalProps {
  isOpen: boolean
  onClose: () => void
  layout?: DashboardLayout
}

export function ShareLayoutModal({ isOpen, onClose, layout: propLayout }: ShareLayoutModalProps) {
  const { currentLayout } = useDashboardStore()
  const layout = propLayout || currentLayout
  
  const [shareLink, setShareLink] = useState('')
  const [shortCode, setShortCode] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [shareMethod, setShareMethod] = useState<'link' | 'code' | 'file'>('link')
  const [shareStats, setShareStats] = useState(getShareStats())

  useEffect(() => {
    if (isOpen && layout) {
      // 공유 링크 생성
      const link = generateShareLink(layout)
      setShareLink(link)
      
      // 짧은 코드 생성 (실제로는 서버에서 생성해야 함)
      const code = generateShortShareCode()
      setShortCode(code)
      
      // 통계 업데이트
      setShareStats(getShareStats())
    }
  }, [isOpen, layout])

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareLink)
    if (success) {
      setIsCopied(true)
      if (layout) {
        updateShareStats(layout.id)
        setShareStats(getShareStats())
      }
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleCopyCode = async () => {
    const success = await copyToClipboard(shortCode)
    if (success) {
      setIsCopied(true)
      if (layout) {
        updateShareStats(layout.id)
        setShareStats(getShareStats())
      }
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (layout) {
      downloadLayout(layout)
      updateShareStats(layout.id)
      setShareStats(getShareStats())
    }
  }

  const handleOpenInNewTab = () => {
    window.open(shareLink, '_blank')
    if (layout) {
      updateShareStats(layout.id)
      setShareStats(getShareStats())
    }
  }

  if (!isOpen || !layout) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">레이아웃 공유</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 레이아웃 정보 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">{layout.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{layout.gridSize} 그리드</span>
              <span>•</span>
              <span>{layout.widgets.length}개 위젯</span>
              <span>•</span>
              <span>생성: {new Date(layout.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>

          {/* 공유 방법 선택 */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <Button
                variant={shareMethod === 'link' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShareMethod('link')}
                className="flex-1"
              >
                <Link className="h-4 w-4 mr-2" />
                링크 공유
              </Button>
              <Button
                variant={shareMethod === 'code' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShareMethod('code')}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                공유 코드
              </Button>
              <Button
                variant={shareMethod === 'file' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShareMethod('file')}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                파일 다운로드
              </Button>
            </div>

            {/* 링크 공유 */}
            {shareMethod === 'link' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    onClick={handleCopyLink}
                    className="gap-2"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        복사
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenInNewTab}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    열기
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  이 링크를 공유하면 다른 사람들이 이 레이아웃을 가져올 수 있습니다.
                </p>
              </div>
            )}

            {/* 공유 코드 */}
            {shareMethod === 'code' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold tracking-wider mb-4 p-4 bg-gray-100 rounded-lg">
                    {shortCode}
                  </div>
                  <Button
                    onClick={handleCopyCode}
                    className="gap-2"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        코드 복사
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  이 6자리 코드를 공유하면 다른 사람들이 레이아웃을 가져올 수 있습니다.
                  <br />
                  <span className="text-xs text-gray-500">
                    (참고: 현재는 데모용 코드입니다. 실제 구현 시 서버 연동이 필요합니다)
                  </span>
                </p>
              </div>
            )}

            {/* 파일 다운로드 */}
            {shareMethod === 'file' && (
              <div className="space-y-4">
                <div className="text-center">
                  <Button
                    onClick={handleDownload}
                    size="lg"
                    className="gap-2"
                  >
                    <Download className="h-5 w-5" />
                    JSON 파일 다운로드
                  </Button>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  레이아웃을 JSON 파일로 다운로드하여 오프라인으로 공유할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {/* 공유 통계 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-900">공유 통계</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-600 font-semibold">{shareStats.totalShares}</p>
                <p className="text-gray-600">총 공유 횟수</p>
              </div>
              <div>
                <p className="text-blue-600 font-semibold">{shareStats.sharedLayouts.length}</p>
                <p className="text-gray-600">공유된 레이아웃</p>
              </div>
              <div>
                <p className="text-blue-600 font-semibold">
                  {shareStats.lastSharedAt 
                    ? new Date(shareStats.lastSharedAt).toLocaleDateString('ko-KR')
                    : '-'}
                </p>
                <p className="text-gray-600">마지막 공유</p>
              </div>
            </div>
          </div>

          {/* 경고 메시지 */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ 공유된 레이아웃에는 민감한 정보가 포함될 수 있습니다. 
              신뢰할 수 있는 사람과만 공유하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}