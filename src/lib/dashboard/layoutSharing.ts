import type { DashboardLayout } from '@/types/dashboard'
import { exportLayout, importLayout } from './layoutExportImport'

/**
 * 레이아웃을 공유 가능한 문자열로 인코딩
 * Base64로 인코딩하여 URL에 포함 가능하게 만듦
 */
export function encodeLayoutForSharing(layout: DashboardLayout): string {
  try {
    const layoutJson = exportLayout(layout)
    // URL-safe Base64 인코딩
    const encoded = btoa(encodeURIComponent(layoutJson))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    return encoded
  } catch (error) {
    console.error('Failed to encode layout:', error)
    throw new Error('레이아웃 인코딩에 실패했습니다.')
  }
}

/**
 * 공유된 문자열에서 레이아웃 디코딩
 */
export function decodeLayoutFromSharing(shareCode: string): DashboardLayout | null {
  try {
    // URL-safe Base64 디코딩
    let base64 = shareCode
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    // 패딩 추가 (필요한 경우)
    const padding = 4 - (base64.length % 4)
    if (padding !== 4) {
      base64 += '='.repeat(padding)
    }
    
    const decoded = decodeURIComponent(atob(base64))
    return importLayout(decoded)
  } catch (error) {
    console.error('Failed to decode layout:', error)
    return null
  }
}

/**
 * 공유 링크 생성
 */
export function generateShareLink(layout: DashboardLayout, baseUrl?: string): string {
  const shareCode = encodeLayoutForSharing(layout)
  const url = baseUrl || window.location.origin
  return `${url}/dashboard?share=${shareCode}`
}

/**
 * 공유 링크에서 레이아웃 추출
 */
export function extractLayoutFromShareLink(url: string): DashboardLayout | null {
  try {
    const urlObj = new URL(url)
    const shareCode = urlObj.searchParams.get('share')
    
    if (!shareCode) {
      return null
    }
    
    return decodeLayoutFromSharing(shareCode)
  } catch (error) {
    console.error('Failed to extract layout from URL:', error)
    return null
  }
}

/**
 * 짧은 공유 코드 생성 (6자리)
 * 실제 프로덕션에서는 백엔드 서버에 저장하고 짧은 코드를 매핑해야 함
 */
export function generateShortShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * 클립보드에 텍스트 복사
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 폴백: 임시 textarea 사용
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * 공유 통계 (로컬 스토리지에 저장)
 */
export interface ShareStats {
  totalShares: number
  lastSharedAt?: Date
  sharedLayouts: string[] // layout IDs
}

export function getShareStats(): ShareStats {
  const stats = localStorage.getItem('dashboardShareStats')
  if (stats) {
    const parsed = JSON.parse(stats)
    return {
      ...parsed,
      lastSharedAt: parsed.lastSharedAt ? new Date(parsed.lastSharedAt) : undefined
    }
  }
  return {
    totalShares: 0,
    sharedLayouts: []
  }
}

export function updateShareStats(layoutId: string): void {
  const stats = getShareStats()
  stats.totalShares++
  stats.lastSharedAt = new Date()
  
  if (!stats.sharedLayouts.includes(layoutId)) {
    stats.sharedLayouts.push(layoutId)
  }
  
  localStorage.setItem('dashboardShareStats', JSON.stringify(stats))
}