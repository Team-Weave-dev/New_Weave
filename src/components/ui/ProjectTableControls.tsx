'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Filter, 
  Search, 
  Eye, 
  EyeOff, 
  GripVertical,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from './DynamicDragDrop';
import type { DropResult } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import type { 
  ProjectTableColumn, 
  ProjectTableConfig,
  TableFilterState 
} from '@/lib/types/project-table.types';

export interface ProjectTableControlsProps {
  // 검색 관련
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  // 필터 관련
  filters: TableFilterState;
  onFiltersChange: (filters: TableFilterState) => void;
  
  // 컬럼 설정 (리스트 뷰에서만 사용)
  columns?: ProjectTableColumn[];
  onColumnConfigChange?: (config: ProjectTableConfig) => void;
  onResetColumns?: () => void;
  onResetFilters?: () => void;
  
  // 표시 옵션
  showColumnSettings?: boolean;  // 디테일 뷰에서는 false
  showFilters?: boolean;         // 필터 패널 표시 여부
  
  // 레이아웃 모드
  compact?: boolean;            // 디테일 뷰용 컴팩트 모드
  
  // 로딩 상태
  loading?: boolean;
}

/**
 * 프로젝트 테이블 컨트롤 컴포넌트
 * 
 * 특징:
 * - 리스트 뷰(풀 모드) + 디테일 뷰(컴팩트 모드) 지원
 * - 검색, 필터, 컬럼 설정 통합 관리
 * - WEAVE 디자인 시스템 준수
 * - 재사용 가능한 구조
 */
export function ProjectTableControls({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  columns = [],
  onColumnConfigChange,
  onResetColumns,
  onResetFilters,
  showColumnSettings = true,
  showFilters: showFiltersParam = true,
  compact = false,
  loading = false
}: ProjectTableControlsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSettingsPanel, setShowColumnSettingsPanel] = useState(false);

  // 상태 필터 변경 핸들러
  const handleStatusFilterChange = (status: string) => {
    onFiltersChange({
      ...filters,
      statusFilter: status as any
    });
  };

  // 컬럼 순서 변경 핸들러
  const handleColumnReorder = (result: DropResult) => {
    if (!result.destination || !columns || !onColumnConfigChange) return;

    const newColumns = [...columns];
    const [reorderedColumn] = newColumns.splice(result.source.index, 1);
    newColumns.splice(result.destination.index, 0, reorderedColumn);

    // order 값 업데이트
    const updatedColumns = newColumns.map((col, index) => ({
      ...col,
      order: index
    }));

    // 기존 config를 보존하면서 컬럼만 업데이트
    onColumnConfigChange({
      columns: updatedColumns,
      filters,
      sort: { column: '', direction: 'asc' }, // 기본값 제공
      pagination: { page: 1, pageSize: 20, total: 0 } // 기본값 제공
    });
  };

  // 컬럼 가시성 토글
  const handleColumnVisibilityToggle = (columnId: string) => {
    if (!columns || !onColumnConfigChange) return;
    
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );

    onColumnConfigChange({
      columns: updatedColumns,
      filters,
      sort: { column: '', direction: 'asc' },
      pagination: { page: 1, pageSize: 20, total: 0 }
    });
  };

  // 컴팩트 모드 레이아웃
  if (compact) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between gap-3">
          {/* 검색 (컴팩트) */}
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-txt-tertiary" />
              <input
                type="text"
                placeholder="프로젝트 검색..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* 필터 버튼 */}
          {showFiltersParam && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
              disabled={loading}
            >
              <Filter className="w-3 h-3" />
              필터
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}

          {/* 초기화 버튼 */}
          {onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="px-2 py-1.5"
              disabled={loading}
              title="필터 초기화"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* 필터 패널 (컴팩트) */}
        {showFilters && showFiltersParam && (
          <div className="mt-3 pt-3 border-t border-border-light">
            <div className="flex items-center gap-3">
              <Typography variant="body2" className="text-txt-secondary font-medium min-w-0">
                상태:
              </Typography>
              <select
                value={filters.statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-border-light rounded focus:outline-none focus:ring-2 focus:ring-weave-primary"
                disabled={loading}
              >
                <option value="all">모든 상태</option>
                <option value="planning">기획</option>
                <option value="in_progress">진행중</option>
                <option value="review">검토</option>
                <option value="completed">완료</option>
                <option value="on_hold">보류</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>
        )}
      </Card>
    );
  }

  // 풀 모드 레이아웃 (기존 AdvancedTable과 동일)
  return (
    <Card className="p-4">
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        {/* 검색 */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
              disabled={loading}
            />
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex gap-2">
          {showFiltersParam && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Filter className="w-4 h-4" />
              필터
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
          
          {showColumnSettings && (
            <Button
              variant="outline"
              onClick={() => setShowColumnSettingsPanel(!showColumnSettingsPanel)}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Settings className="w-4 h-4" />
              컬럼 설정
              {showColumnSettingsPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilters && showFiltersParam && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-txt-secondary mb-2">
                상태
              </label>
              <select
                value={filters.statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary"
                disabled={loading}
              >
                <option value="all">모든 상태</option>
                <option value="planning">기획</option>
                <option value="in_progress">진행중</option>
                <option value="review">검토</option>
                <option value="completed">완료</option>
                <option value="on_hold">보류</option>
                <option value="cancelled">취소</option>
              </select>
            </div>

            {/* 추가 필터 영역 (향후 확장용) */}
            <div className="flex items-end">
              {(onResetFilters || onResetColumns) && (
                <div className="flex gap-2">
                  {onResetFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onResetFilters}
                      disabled={loading}
                    >
                      필터 초기화
                    </Button>
                  )}
                  {onResetColumns && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onResetColumns}
                      disabled={loading}
                    >
                      컬럼 초기화
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 컬럼 설정 패널 */}
      {showColumnSettingsPanel && showColumnSettings && columns.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <Typography variant="body2" className="mb-3 text-txt-secondary">
            컬럼을 드래그하여 순서를 변경하고, 체크박스로 표시/숨김을 설정하세요.
          </Typography>
          
          <DragDropContext onDragEnd={handleColumnReorder}>
            <Droppable droppableId="columns">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 max-h-60 overflow-y-auto"
                >
                  {columns
                    .sort((a, b) => a.order - b.order)
                    .map((column, index) => (
                      <Draggable 
                        key={column.id} 
                        draggableId={column.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-3 bg-bg-secondary rounded-lg ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center w-6 h-6 text-txt-tertiary hover:text-txt-secondary cursor-grab"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                            
                            <button
                              onClick={() => handleColumnVisibilityToggle(column.id)}
                              className="flex items-center justify-center w-6 h-6 text-txt-tertiary hover:text-txt-secondary"
                            >
                              {column.visible ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                            
                            <span className={`flex-1 text-sm ${
                              column.visible ? 'text-txt-primary' : 'text-txt-tertiary'
                            }`}>
                              {column.label}
                            </span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </Card>
  );
}