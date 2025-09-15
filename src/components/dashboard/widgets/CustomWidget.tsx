'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'
import { Edit2, Plus } from 'lucide-react'

interface CustomWidgetProps {
  id: string
  type?: string
  config?: {
    title?: string
    content?: string
    color?: string
  }
  isEditMode?: boolean
  className?: string
}

export function CustomWidget({
  id,
  config,
  isEditMode,
  className = ''
}: CustomWidgetProps) {
  const title = config?.title || '커스텀 위젯'
  const content = config?.content || '이 위젯을 사용자 정의하세요'
  const color = config?.color || 'var(--color-brand-primary)'

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl" style={{ color }}>📦</span>
            {title}
          </CardTitle>
          {isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              aria-label="커스텀 위젯 편집"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {content ? (
            <Typography variant="body2" className="text-muted-foreground">
              {content}
            </Typography>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Plus className="h-12 w-12 text-muted-foreground/30" />
              <Typography 
                variant="caption" 
                className="text-center text-muted-foreground"
              >
                이 위젯을 편집하여<br />
                원하는 콘텐츠를 추가하세요
              </Typography>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}