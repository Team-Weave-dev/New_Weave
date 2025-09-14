'use client'

import React, { Suspense } from 'react'
import { DashboardContainer } from './DashboardContainer'
import { Loader2 } from 'lucide-react'

interface DashboardContainerWrapperProps {
  className?: string
  showToolbar?: boolean
  initialLayoutId?: string
}

export function DashboardContainerWrapper(props: DashboardContainerWrapperProps) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-secondary)]" />
        </div>
      }
    >
      <DashboardContainer {...props} />
    </Suspense>
  )
}