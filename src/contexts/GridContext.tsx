'use client'

import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import { GridSize } from '@/types/dashboard'

interface GridContextValue {
  gridSize: GridSize
  gap: number
  padding: number
  cellSize: number
  containerRef: React.RefObject<HTMLDivElement>
  gridColumns: number
  isEditMode: boolean
}

const GridContext = createContext<GridContextValue | null>(null)

export function useGridContext() {
  const context = useContext(GridContext)
  return context
}

export function useGridContextRequired() {
  const context = useContext(GridContext)
  if (!context) {
    throw new Error('useGridContext must be used within GridProvider')
  }
  return context
}

interface GridProviderProps {
  children: ReactNode
  gridSize: GridSize
  gap: number
  padding: number
  cellSize: number
  containerRef: React.RefObject<HTMLDivElement>
  isEditMode: boolean
}

export function GridProvider({
  children,
  gridSize,
  gap,
  padding,
  cellSize,
  containerRef,
  isEditMode
}: GridProviderProps) {
  const gridColumns = useMemo(() => {
    const sizeMap = {
      '2x2': 2,
      '3x3': 3,
      '4x4': 4,
      '5x5': 5,
    }
    return sizeMap[gridSize] || 3
  }, [gridSize])

  const value = useMemo(() => ({
    gridSize,
    gap,
    padding,
    cellSize,
    containerRef,
    gridColumns,
    isEditMode
  }), [gridSize, gap, padding, cellSize, containerRef, gridColumns, isEditMode])

  return (
    <GridContext.Provider value={value}>
      {children}
    </GridContext.Provider>
  )
}