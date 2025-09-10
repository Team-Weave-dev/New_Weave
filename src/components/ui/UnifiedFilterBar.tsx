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
  RotateCcw,
  Trash2,
  Check,
  X
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

export interface UnifiedFilterBarProps {
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
  
  // 페이지네이션 설정
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  
  // 클라이언트 목록 (동적 생성용)
  availableClients?: string[];
  
  // 표시 옵션
  showColumnSettings?: boolean;  // 리스트 뷰에서만 true
  
  // 삭제 모드 관련
  isDeleteMode?: boolean;
  selectedItems?: string[];
  onToggleDeleteMode?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onDeleteSelected?: () => void;
  totalItems?: number;
  
  // 로딩 상태
  loading?: boolean;
}

/**
 * 통합 필터 바 컴포넌트
 * 
 * 특징:
 * - 검색, 필터, 컬럼 설정 통합 관리
 * - 기존 ProjectTableControls 대체
 * - WEAVE 디자인 시스템 준수
 * - 헤더 우측 영역에 최적화된 레이아웃
 */
export function UnifiedFilterBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  columns = [],
  onColumnConfigChange,
  onResetColumns,
  onResetFilters,
  pageSize = 10,
  onPageSizeChange,
  availableClients = [],
  showColumnSettings = true,
  isDeleteMode = false,
  selectedItems = [],
  onToggleDeleteMode,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  totalItems = 0,
  loading = false
}: UnifiedFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSettingsPanel, setShowColumnSettingsPanel] = useState(false);

  // 상태 필터 변경 핸들러
  const handleStatusFilterChange = (status: string) => {
    onFiltersChange({
      ...filters,
      statusFilter: status as any
    });
  };

  // 클라이언트 필터 변경 핸들러
  const handleClientFilterChange = (client: string) => {
    onFiltersChange({
      ...filters,
      clientFilter: client
    });
  };

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (size: string) => {
    if (onPageSizeChange) {
      onPageSizeChange(parseInt(size, 10));
    }
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
      sort: { column: '', direction: 'asc' },
      pagination: { page: 1, pageSize: 20, total: 0 }
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

  return (
    <div className="w-full">
      {/* 메인 필터 바 */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* 검색 입력 */}
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
            {/* 삭제 모드 */}
            {!isDeleteMode ? (
              <Button
                variant="outline"
                onClick={onToggleDeleteMode}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {/* 전체선택/해제 */}
                <Button
                  variant="outline"
                  onClick={selectedItems?.length === totalItems ? onDeselectAll : onSelectAll}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Check className="w-4 h-4" />
                  {selectedItems?.length === totalItems ? '전체해제' : '전체선택'}
                </Button>
                
                {/* 선택삭제 */}
                <Button
                  variant="destructive"
                  onClick={onDeleteSelected}
                  className="flex items-center gap-2"
                  disabled={loading || !selectedItems?.length}
                >
                  <Trash2 className="w-4 h-4" />
                  삭제 ({selectedItems?.length || 0})
                </Button>
                
                {/* 취소 */}
                <Button
                  variant="ghost"
                  onClick={onToggleDeleteMode}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                  취소
                </Button>
              </div>
            )}

            {/* 필터 버튼 - 삭제 모드가 아닐 때만 표시 */}
            {!isDeleteMode && (
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
            
            {/* 컬럼 설정 버튼 (리스트 뷰에서만) */}
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
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="body2" className="text-txt-secondary">
                상태, 클라이언트, 페이지 크기를 설정하여 프로젝트를 필터링하세요.
              </Typography>
              {onResetFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetFilters}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  필터 초기화
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* 페이지 크기 설정 */}
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  페이지당 항목 수
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary"
                  disabled={loading}
                >
                  <option value={5}>5개</option>
                  <option value={10}>10개</option>
                  <option value={20}>20개</option>
                  <option value={50}>50개</option>
                  <option value={100}>100개</option>
                </select>
              </div>

              {/* 클라이언트 필터 */}
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  클라이언트
                </label>
                <select
                  value={filters.clientFilter || 'all'}
                  onChange={(e) => handleClientFilterChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-primary"
                  disabled={loading}
                >
                  <option value="all">모든 클라이언트</option>
                  {availableClients.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 컬럼 설정 패널 */}
        {showColumnSettingsPanel && showColumnSettings && columns.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <div className="flex justify-between items-center mb-3">
              <Typography variant="body2" className="text-txt-secondary">
                컬럼을 드래그하여 순서를 변경하고, 체크박스로 표시/숨김을 설정하세요.
              </Typography>
              {onResetColumns && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetColumns}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  컬럼 초기화
                </Button>
              )}
            </div>
            
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
    </div>
  );
}