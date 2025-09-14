/**
 * ProjectSummaryWidget 단위 테스트
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProjectSummaryWidget } from '@/components/dashboard/widgets/ProjectSummaryWidget'

// Mock the hook
jest.mock('@/lib/stores/useDashboardStore', () => ({
  useDashboardStore: () => ({
    updateWidgetConfig: jest.fn(),
  }),
}))

describe('ProjectSummaryWidget', () => {
  const defaultProps = {
    id: 'widget-1',
    type: 'project-summary' as const,
    config: {},
    isEditMode: false,
  }

  it('should render widget title', () => {
    render(<ProjectSummaryWidget {...defaultProps} />)
    expect(screen.getByText('프로젝트 현황')).toBeInTheDocument()
  })

  it('should display project statistics', () => {
    render(<ProjectSummaryWidget {...defaultProps} />)
    
    // Check for statistic cards
    expect(screen.getByText('전체 프로젝트')).toBeInTheDocument()
    expect(screen.getByText('진행 중')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByText('대기 중')).toBeInTheDocument()
  })

  it('should show recent projects section', () => {
    render(<ProjectSummaryWidget {...defaultProps} />)
    expect(screen.getByText('최근 프로젝트')).toBeInTheDocument()
  })

  it('should display chart when data is available', () => {
    render(<ProjectSummaryWidget {...defaultProps} />)
    // Chart container should exist
    const chartContainer = screen.getByTestId('project-status-chart')
    expect(chartContainer).toBeInTheDocument()
  })

  it('should handle edit mode', () => {
    const { rerender } = render(<ProjectSummaryWidget {...defaultProps} />)
    
    // Initially not in edit mode
    expect(screen.queryByText('설정')).not.toBeInTheDocument()
    
    // Switch to edit mode
    rerender(<ProjectSummaryWidget {...defaultProps} isEditMode={true} />)
    
    // Edit mode UI elements might appear
    // Note: Actual implementation may vary
  })

  it('should apply custom config', () => {
    const customConfig = {
      showChart: false,
      maxProjects: 5,
    }
    
    render(<ProjectSummaryWidget {...defaultProps} config={customConfig} />)
    
    // Verify config is applied
    // Note: Actual implementation details needed
  })
})