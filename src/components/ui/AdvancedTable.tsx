'use client';

import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, withDragDrop } from './DynamicDragDrop';
import type { DropResult } from '@hello-pangea/dnd';
import { 
  GripVertical,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Pagination from '@/components/ui/Pagination';
import Checkbox from '@/components/ui/Checkbox';
import type { 
  ProjectTableColumn, 
  ProjectTableRow, 
  ProjectTableConfig,
  TableFilterState,
  TableSortState 
} from '@/lib/types/project-table.types';

export interface AdvancedTableProps {
  data: ProjectTableRow[];
  config: ProjectTableConfig;
  onConfigChange: (config: ProjectTableConfig) => void;
  onRowClick?: (row: ProjectTableRow) => void;
  loading?: boolean;
  // 키보드 네비게이션 관련
  selectedProjectIndex?: number;
  // 삭제 모드 관련
  isDeleteMode?: boolean;
  selectedItems?: string[];
  onItemSelect?: (itemId: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}

export function AdvancedTable({ 
  data, 
  config, 
  onConfigChange, 
  onRowClick,
  loading = false,
  selectedProjectIndex,
  isDeleteMode = false,
  selectedItems = [],
  onItemSelect,
  onSelectAll,
  onDeselectAll
}: AdvancedTableProps) {
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [draggedColumns, setDraggedColumns] = useState<ProjectTableColumn[] | null>(null);
  // 컬럼 리사이징 상태 (최소화)
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [hoveredColumnIndex, setHoveredColumnIndex] = useState<number | null>(null);

  // 컬럼 순서 변경 핸들러 (설정 패널용)
  const handleColumnSettingsReorder = (result: DropResult) => {
    if (!result.destination) return;

    const newColumns = [...config.columns];
    const [reorderedColumn] = newColumns.splice(result.source.index, 1);
    newColumns.splice(result.destination.index, 0, reorderedColumn);

    // order 값 업데이트
    const updatedColumns = newColumns.map((col, index) => ({
      ...col,
      order: index
    }));

    onConfigChange({
      ...config,
      columns: updatedColumns
    });
  };

  // 테이블 헤더 드래그앤드롭 핸들러 (실시간)
  const handleColumnReorder = (result: DropResult) => {
    // 드래그 종료 시 상태 초기화
    setDraggedColumnId(null);
    setDraggedColumns(null);
    
    if (!result.destination) return;
    
    // 드래그앤드롭이 테이블 헤더에서 발생한 경우
    if (result.source.droppableId === 'table-header') {
      const visibleColumnsCopy = [...baseVisibleColumns];
      const [reorderedColumn] = visibleColumnsCopy.splice(result.source.index, 1);
      visibleColumnsCopy.splice(result.destination.index, 0, reorderedColumn);

      // 전체 컬럼 배열에서 order 값 업데이트 - 순서대로 재배열
      const updatedColumns = config.columns.map(col => {
        const visibleIndex = visibleColumnsCopy.findIndex(vc => vc.id === col.id);
        if (visibleIndex !== -1) {
          return { ...col, order: visibleIndex };
        }
        // 숨겨진 컬럼은 기존 order 유지하되, 보이는 컬럼들 이후로 배치
        return { ...col, order: col.order + visibleColumnsCopy.length };
      }).sort((a, b) => a.order - b.order); // order 값으로 정렬

      onConfigChange({
        ...config,
        columns: updatedColumns
      });
    } else {
      // 설정 패널에서 발생한 경우 기존 로직 사용
      handleColumnSettingsReorder(result);
    }
  };

  // 드래그 시작 핸들러
  const handleDragStart = (start: any) => {
    if (start.source.droppableId === 'table-header') {
      const draggedColumn = baseVisibleColumns[start.source.index];
      setDraggedColumnId(draggedColumn.id);
      // 드래그 시작 시 현재 컬럼 순서 저장
      setDraggedColumns([...baseVisibleColumns]);
    }
  };

  // 드래그 업데이트 핸들러 (실시간 미리보기)
  const handleDragUpdate = (update: any) => {
    if (update.destination && update.source.droppableId === 'table-header') {
      const columns = [...baseVisibleColumns];
      const [draggedColumn] = columns.splice(update.source.index, 1);
      columns.splice(update.destination.index, 0, draggedColumn);
      setDraggedColumns(columns);
    }
  };

  // 60fps 고성능 리사이징 시스템 (CSS 변수 + RAF 기반)
  const handleResizeStart = (columnId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const column = config.columns.find(col => col.id === columnId);
    if (!column) return;

    const startX = e.clientX;
    const startWidth = column.width || 120;
    
    // 최소한의 상태만 설정 (렌더링 최적화)
    setResizingColumnId(columnId);
    
    // 고성능을 위한 셀렉터 및 CSS 변수 설정
    const headerCells = document.querySelectorAll(`[data-column-id="${columnId}"]`);
    const dataCells = document.querySelectorAll(`[data-column-key="${column.key}"]`);
    const tableElement = document.querySelector(`[data-column-id="${columnId}"]`)?.closest('table');
    
    // GPU 가속 및 성능 최적화 설정
    const allCells = [...headerCells, ...dataCells];
    allCells.forEach((cell: Element) => {
      const htmlCell = cell as HTMLElement;
      htmlCell.style.willChange = 'width';
      htmlCell.style.contain = 'layout style';
    });

    let currentMouseX = startX;
    let rafId = 0;
    let pendingWidth = startWidth;

    // 60fps 보장을 위한 RAF 기반 업데이트
    const updateCellWidths = (width: number) => {
      // CSS 변수를 통한 일괄 업데이트 (성능 최적화)
      const widthPx = `${width}px`;
      
      allCells.forEach((cell: Element) => {
        const htmlCell = cell as HTMLElement;
        // 배칭된 스타일 업데이트
        htmlCell.style.cssText = `width: ${widthPx}; min-width: ${widthPx}; max-width: ${widthPx}; will-change: width; contain: layout style;`;
      });
    };

    const moveHandler = (e: MouseEvent) => {
      currentMouseX = e.clientX;
      
      // 델타 계산
      const deltaX = e.clientX - startX;
      pendingWidth = Math.max(80, Math.min(400, startWidth + deltaX));
      
      // RAF를 통한 60fps 업데이트 스케줄링
      if (rafId) return; // 이미 예약된 업데이트가 있으면 스킵
      
      rafId = requestAnimationFrame(() => {
        updateCellWidths(pendingWidth);
        rafId = 0;
      });
    };

    const upHandler = () => {
      // 마지막 RAF 취소 (필요시)
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      
      // 최종 너비 계산 및 적용
      const finalDeltaX = currentMouseX - startX;
      const finalWidth = Math.max(80, Math.min(400, startWidth + finalDeltaX));
      
      // 부드러운 완료 애니메이션과 함께 최종 너비 적용
      allCells.forEach((cell: Element) => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.transition = 'width 0.1s cubic-bezier(0.4, 0.0, 0.2, 1)';
        htmlCell.style.cssText = `width: ${finalWidth}px; min-width: ${finalWidth}px; max-width: ${finalWidth}px; transition: width 0.1s cubic-bezier(0.4, 0.0, 0.2, 1);`;
        
        // 애니메이션 완료 후 최적화 속성 정리
        setTimeout(() => {
          htmlCell.style.willChange = 'auto';
          htmlCell.style.contain = '';
          htmlCell.style.transition = '';
        }, 100);
      });
      
      // React 상태 업데이트 (지연시켜서 성능 향상)
      setTimeout(() => {
        const updatedColumns = config.columns.map(col =>
          col.id === columnId ? { ...col, width: finalWidth } : col
        );

        onConfigChange({
          ...config,
          columns: updatedColumns
        });

        // 상태 정리
        setResizingColumnId(null);
      }, 0);
      
      // 이벤트 리스너 제거
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    // 이벤트 리스너 등록 (passive: false로 성능 최적화)
    document.addEventListener('mousemove', moveHandler, { passive: false });
    document.addEventListener('mouseup', upHandler, { passive: false });
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };



  // 정렬 핸들러
  const handleSort = (columnKey: string) => {
    const newSort: TableSortState = {
      column: columnKey,
      direction: 
        config.sort.column === columnKey && config.sort.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    };

    onConfigChange({
      ...config,
      sort: newSort
    });
  };


  // 보이는 컬럼만 필터링 및 정렬
  const baseVisibleColumns = config.columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  // 드래그 중일 때는 임시 순서 사용, 아닐 때는 기본 순서 사용
  const visibleColumns = draggedColumns || baseVisibleColumns;

  // 컬럼 너비 계산 (순수 함수, 리렌더링 없음)
  const getColumnWidth = (column: ProjectTableColumn) => {
    return column.width || 120;
  };

  // 셀 값 포맷팅
  const formatCellValue = (value: any, column: ProjectTableColumn) => {
    switch (column.type) {
      case 'date':
        return value ? new Date(value).toLocaleDateString('ko-KR') : '-';
      case 'currency':
        return `${Number(value).toLocaleString()}원`;
      case 'progress':
        return (
          <div className="w-full max-w-[100px] min-w-[80px]">
            <div className="h-2 md:h-2.5 bg-bg-secondary rounded-full overflow-hidden mb-1">
              <div 
                className="h-full bg-weave-primary transition-all duration-300"
                style={{ width: `${value || 0}%` }}
              />
            </div>
            <div className="text-center">
              <span className="text-[10px] md:text-xs text-txt-secondary font-medium">
                {value || 0}%
              </span>
            </div>
          </div>
        );
      case 'payment_progress':
        return (
          <div className="w-full max-w-[100px] min-w-[80px]">
            <div className="h-2 md:h-2.5 bg-bg-secondary rounded-full overflow-hidden mb-1">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${value || 0}%` }}
              />
            </div>
            <div className="text-center">
              <span className="text-[10px] md:text-xs text-green-600 font-medium">
                {value || 0}%
              </span>
            </div>
          </div>
        );
      case 'status':
        const statusColors = {
          planning: 'bg-gray-100 text-gray-700',
          in_progress: 'bg-blue-100 text-blue-700',
          review: 'bg-yellow-100 text-yellow-700',
          completed: 'bg-green-100 text-green-700',
          on_hold: 'bg-orange-100 text-orange-700',
          cancelled: 'bg-red-100 text-red-700'
        };
        const statusLabels = {
          planning: '기획',
          in_progress: '진행중',
          review: '검토',
          completed: '완료',
          on_hold: '보류',
          cancelled: '취소'
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}`}>
            {statusLabels[value as keyof typeof statusLabels] || value}
          </span>
        );
      default:
        return value || '-';
    }
  };

  return (
    <div className="space-y-4">

      {/* 테이블 */}
      <Card>
        <Table>
          <DragDropContext 
            onDragStart={handleDragStart}
            onDragEnd={handleColumnReorder}
            onDragUpdate={handleDragUpdate}
          >
            <Droppable 
              droppableId="table-header" 
              direction="horizontal"
              renderClone={(provided, snapshot, rubric) => {
                const column = visibleColumns[rubric.source.index];
                return (
                  <TableHead
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="select-none opacity-90 shadow-2xl scale-110 bg-bg-primary border-2 border-weave-primary z-[1000] rounded-md"
                    style={{
                      width: getColumnWidth(column),
                      ...provided.draggableProps.style,
                    }}
                  >
                    <div className="flex items-center gap-2 px-2">
                      <span className="flex-shrink-0 font-medium">{column.label}</span>
                      {column.sortable && (
                        <div className="flex flex-col flex-shrink-0">
                          <SortAsc className="w-3 h-3 text-txt-tertiary" />
                          <SortDesc className="w-3 h-3 -mt-1 text-txt-tertiary" />
                        </div>
                      )}
                    </div>
                  </TableHead>
                );
              }}
            >
              {(provided, snapshot) => (
                <TableHeader>
                  <TableRow
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {/* 삭제 모드일 때 체크박스 헤더 */}
                    {isDeleteMode && (
                      <TableHead className="w-12 px-2">
                        <Checkbox
                          checked={selectedItems.length === data.length && data.length > 0}
                          indeterminate={selectedItems.length > 0 && selectedItems.length < data.length}
                          onChange={selectedItems.length === data.length ? onDeselectAll : onSelectAll}
                          size="sm"
                          aria-label="전체 선택"
                        />
                      </TableHead>
                    )}
                    {visibleColumns.map((column, index) => (
                      <Draggable 
                        key={column.id} 
                        draggableId={column.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <>
                            <TableHead 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              data-column-id={column.id}
                              data-column-key={column.key}
                              className={`select-none transition-all duration-200 group relative ${
                                snapshot.isDragging 
                                  ? 'opacity-40 bg-weave-primary-light border-2 border-dashed border-weave-primary cursor-grabbing' 
                                  : 'hover:bg-bg-secondary hover:shadow-sm cursor-pointer'
                              } ${resizingColumnId === column.id ? 'bg-weave-primary-light will-change-transform' : ''}`}
                              style={{ 
                                width: getColumnWidth(column),
                                minWidth: getColumnWidth(column),
                                maxWidth: getColumnWidth(column),
                                willChange: resizingColumnId === column.id ? 'width' : 'auto',
                                transform: 'translateZ(0)', // 하드웨어 가속 활성화
                                ...(!snapshot.isDragging && provided.draggableProps.style)
                              }}
                              onMouseEnter={() => setHoveredColumnIndex(index)}
                              onMouseLeave={() => setHoveredColumnIndex(null)}
                            >
                              <div 
                                {...provided.dragHandleProps}
                                className="flex items-center gap-2 relative cursor-move"
                                onClick={(e) => {
                                  // 드래그 중이 아닐 때만 정렬 실행
                                  if (!snapshot.isDragging && column.sortable) {
                                    handleSort(column.key as string);
                                  }
                                }}
                              >
                                <span className="flex-shrink-0">{column.label}</span>
                                {column.sortable && (
                                  <div className="flex flex-col flex-shrink-0">
                                    <SortAsc className={`w-3 h-3 ${
                                      config.sort.column === column.key && config.sort.direction === 'asc'
                                        ? 'text-weave-primary' 
                                        : 'text-txt-tertiary'
                                    }`} />
                                    <SortDesc className={`w-3 h-3 -mt-1 ${
                                      config.sort.column === column.key && config.sort.direction === 'desc'
                                        ? 'text-weave-primary' 
                                        : 'text-txt-tertiary'
                                    }`} />
                                  </div>
                                )}
                                
                                {/* 드래그 인디케이터 (호버 시에만 표시) */}
                                {!snapshot.isDragging && (
                                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-3 h-3 text-txt-tertiary" />
                                  </div>
                                )}
                              </div>

                              {/* 컬럼 리사이저 - 해당 컬럼 또는 다음 컬럼에 호버했을 때만 표시 */}
                              {index < visibleColumns.length - 1 && (hoveredColumnIndex === index || hoveredColumnIndex === index + 1 || resizingColumnId === column.id) && (
                                <div
                                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group/resizer z-20"
                                  onMouseDown={(e) => handleResizeStart(column.id, e)}
                                  title="드래그해서 컬럼 너비 조절"
                                  style={{
                                    width: '4px',
                                    right: '-2px'
                                  }}
                                >
                                  {/* 기본 상태 - 컬럼 호버 시 표시되는 경계선 */}
                                  <div className="absolute inset-0 bg-weave-primary transition-all duration-200 opacity-60 hover:opacity-100" />
                                  
                                  {/* 호버 상태 - 명확한 리사이저 */}
                                  <div className="absolute inset-0 -left-1 -right-1 opacity-0 hover:opacity-100 transition-opacity duration-200">
                                    <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-weave-primary rounded-full" />
                                    {/* 중앙 핸들 점들 */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                      <div className="flex flex-col gap-0.5">
                                        <div className="w-0.5 h-0.5 bg-white rounded-full opacity-80" />
                                        <div className="w-0.5 h-0.5 bg-white rounded-full opacity-80" />
                                        <div className="w-0.5 h-0.5 bg-white rounded-full opacity-80" />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* 리사이징 중 상태 */}
                                  {resizingColumnId === column.id && (
                                    <div className="absolute inset-0 -left-1 -right-1 bg-weave-primary opacity-80">
                                      <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-weave-primary-dark rounded-full shadow-lg" />
                                    </div>
                                  )}
                                  
                                  {/* 확장된 클릭 영역 */}
                                  <div className="absolute inset-0 -left-2 -right-2" />
                                </div>
                              )}
                            </TableHead>
                          </>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableRow>
                </TableHeader>
              )}
            </Droppable>
          </DragDropContext>
          <TableBody>
            {loading ? (
              // 로딩 스켈레톤 행들
              Array.from({ length: 8 }, (_, index) => (
                <TableRow key={`loading-${index}`}>
                  {visibleColumns.map((column) => (
                    <TableCell 
                      key={`loading-${column.id}-${index}`}
                      data-column-id={column.id}
                      data-column-key={column.key}
                      className={`transition-all duration-200 ${
                        draggedColumnId === column.id 
                          ? 'opacity-40 bg-weave-primary-light border-x-2 border-dashed border-weave-primary' 
                          : ''
                      }`}
                      style={{
                        width: getColumnWidth(column),
                        minWidth: getColumnWidth(column),
                        maxWidth: getColumnWidth(column),
                        willChange: resizingColumnId === column.id ? 'width' : 'auto',
                        transform: 'translateZ(0)', // 하드웨어 가속
                      }}
                    >
                      <div className="animate-pulse">
                        {(column.type === 'progress' || column.type === 'payment_progress') ? (
                          <div className="w-full max-w-[100px] min-w-[80px]">
                            <div className="h-2 md:h-2.5 bg-gray-200 rounded-full mb-1"></div>
                            <div className="text-center">
                              <div className="h-2 bg-gray-200 rounded w-6 mx-auto"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-4 bg-gray-200 rounded" style={{ 
                            width: column.type === 'status' ? '60px' :
                                   column.type === 'date' ? '80px' :
                                   column.type === 'currency' ? '90px' : '120px' 
                          }}></div>
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              data.map((row, index) => (
                <TableRow 
                  key={row.id}
                  onClick={() => !isDeleteMode && onRowClick?.(row)}
                  className={`${isDeleteMode ? "" : "cursor-pointer"} ${
                    selectedProjectIndex === index ? "bg-weave-primary-light border-l-4 border-weave-primary" : ""
                  }`}
                >
                  {/* 삭제 모드일 때 체크박스 */}
                  {isDeleteMode && (
                    <TableCell 
                      className="w-12 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedItems.includes(row.id)}
                        onChange={() => onItemSelect?.(row.id)}
                        size="sm"
                        aria-label={`${row.name} 선택`}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.map((column) => (
                    <TableCell 
                      key={column.id}
                      data-column-id={column.id}
                      data-column-key={column.key}
                      className={`transition-all duration-200 ${
                        draggedColumnId === column.id 
                          ? 'opacity-40 bg-weave-primary-light border-x-2 border-dashed border-weave-primary' 
                          : ''
                      }`}
                      style={{
                        width: getColumnWidth(column),
                        minWidth: getColumnWidth(column),
                        maxWidth: getColumnWidth(column),
                        willChange: resizingColumnId === column.id ? 'width' : 'auto',
                        transform: 'translateZ(0)', // 하드웨어 가속
                      }}
                    >
                      {formatCellValue(row[column.key], column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && data.length === 0 && (
          <div className="text-center py-12">
            <Typography variant="body1" className="text-txt-secondary">
              검색 결과가 없습니다.
            </Typography>
          </div>
        )}
      </Card>

      {/* 페이지네이션 */}
      {!loading && data.length > 0 && (
        <Pagination
          currentPage={config.pagination.page}
          totalPages={Math.ceil(config.pagination.total / config.pagination.pageSize)}
          onPageChange={(page) => {
            onConfigChange({
              ...config,
              pagination: {
                ...config.pagination,
                page
              }
            });
          }}
          itemsPerPage={config.pagination.pageSize}
          totalItems={config.pagination.total}
          size="sm"
          showInfo={true}
          visiblePages={5}
        />
      )}
    </div>
  );
}