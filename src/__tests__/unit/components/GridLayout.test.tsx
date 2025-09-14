/**
 * GridLayout 컴포넌트 단위 테스트
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { GridLayout } from '@/components/dashboard/GridLayout'

describe('GridLayout', () => {
  it('should render with default props', () => {
    const { container } = render(
      <GridLayout>
        <div>Test Content</div>
      </GridLayout>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('grid')
  })

  it('should apply correct grid size class', () => {
    const { container, rerender } = render(
      <GridLayout gridSize="3x3">
        <div>Content</div>
      </GridLayout>
    )
    
    expect(container.firstChild).toHaveClass('grid-cols-3')
    
    rerender(
      <GridLayout gridSize="4x4">
        <div>Content</div>
      </GridLayout>
    )
    
    expect(container.firstChild).toHaveClass('grid-cols-4')
  })

  it('should apply custom gap', () => {
    const { container } = render(
      <GridLayout gap={20}>
        <div>Content</div>
      </GridLayout>
    )
    
    const gridElement = container.firstChild as HTMLElement
    expect(gridElement.style.gap).toBe('20px')
  })

  it('should apply custom padding', () => {
    const { container } = render(
      <GridLayout padding={30}>
        <div>Content</div>
      </GridLayout>
    )
    
    const gridElement = container.firstChild as HTMLElement
    expect(gridElement.style.padding).toBe('30px')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <GridLayout className="custom-class">
        <div>Content</div>
      </GridLayout>
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should handle all grid sizes', () => {
    const gridSizes = ['2x2', '3x3', '4x4', '5x5'] as const
    const expectedCols = ['grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5']
    
    gridSizes.forEach((size, index) => {
      const { container } = render(
        <GridLayout gridSize={size}>
          <div>Content</div>
        </GridLayout>
      )
      
      expect(container.firstChild).toHaveClass(expectedCols[index])
    })
  })

  it('should render multiple children', () => {
    render(
      <GridLayout>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </GridLayout>
    )
    
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
  })
})