'use client'

import React from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedWidgetProps {
  children: React.ReactNode
  id: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  isDragging?: boolean
  isResizing?: boolean
  isEditMode?: boolean
  className?: string
}

export function AnimatedWidget({
  children,
  id,
  position,
  isDragging = false,
  isResizing = false,
  isEditMode = false,
  className
}: AnimatedWidgetProps) {
  const layoutId = `widget-${id}`

  const variants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      }
    },
    dragging: {
      scale: 1.05,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: {
        duration: 0.15,
      }
    },
    resizing: {
      transition: {
        duration: 0,
      }
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        layoutId={layoutId}
        layout
        initial="initial"
        animate={
          isDragging ? 'dragging' : 
          isResizing ? 'resizing' : 
          'animate'
        }
        exit="exit"
        whileHover={{
          scale: isEditMode && !isDragging ? 1.02 : 1,
          transition: {
            duration: 0.2,
          }
        }}
        variants={variants}
        className={cn('relative h-full w-full', className)}
        style={{
          gridColumn: `span ${position.width}`,
          gridRow: `span ${position.height}`,
        }}
        drag={false} // 드래그는 dnd-kit에서 처리
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// 위젯 추가/제거 시 리스트 애니메이션
export function AnimatedWidgetList({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, staggerChildren: 0.05 }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  )
}

// 레이아웃 변경 애니메이션
export function LayoutTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        layout: {
          type: 'spring',
          bounce: 0.2,
          duration: 0.6
        },
        opacity: {
          duration: 0.2
        }
      }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  )
}