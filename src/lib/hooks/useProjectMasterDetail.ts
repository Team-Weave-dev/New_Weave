'use client';

import { useState, useCallback, useMemo } from 'react';
import type { 
  ProjectTableRow, 
  TableFilterState, 
  TableSortState 
} from '@/lib/types/project-table.types';
import type { ViewMode } from '@/components/ui/ViewSwitchButtons';

export type DetailTabType = 'overview' | 'document-management' | 'tax-management';

export interface MasterDetailState {
  // 프로젝트 관련 상태
  projects: ProjectTableRow[];
  selectedProject: ProjectTableRow | null;
  selectedProjectIndex: number;
  
  // UI 상태
  isCreateModalOpen: boolean;
  activeDetailTab: DetailTabType;
  isLoading: boolean;
  currentView: ViewMode; // 뷰 모드 상태 추가
  
  // 검색 및 필터 (확장됨)
  searchQuery: string;
  filteredProjects: ProjectTableRow[];
  filters: TableFilterState;
  sort: TableSortState;
  availableClients: string[]; // 클라이언트 목록 추가
  
  // 페이지네이션 상태
  currentPage: number;
  pageSize: number;
  paginatedProjects: ProjectTableRow[];
  totalPages: number;
}

export interface MasterDetailActions {
  // 프로젝트 선택 관리
  selectProject: (project: ProjectTableRow) => void;
  selectProjectByIndex: (index: number) => void;
  navigateProject: (direction: 'prev' | 'next') => void;
  clearSelection: () => void;
  
  // 프로젝트 생성 관리
  openCreateModal: () => void;
  closeCreateModal: () => void;
  addNewProject: (project: ProjectTableRow) => void;
  
  // 프로젝트 수정 관리
  updateProject: (project: ProjectTableRow) => void;
  deleteProject: (projectId: string) => void;
  
  // UI 상태 관리
  setActiveDetailTab: (tab: DetailTabType) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setCurrentView: (view: ViewMode) => void; // 뷰 모드 변경
  
  // 필터 및 정렬 관리 (새로 추가)
  updateFilters: (filters: TableFilterState) => void;
  updateSort: (sort: TableSortState) => void;
  resetFilters: () => void;
  resetAll: () => void;  // 전체 초기화 (필터 + 컬럼)
  
  // 페이지네이션 관리
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  
  // 데이터 관리
  refreshProjects: (projects: ProjectTableRow[]) => void;
}

/**
 * 프로젝트 마스터-디테일 뷰의 중앙화된 상태 관리 훅
 * 
 * 특징:
 * - 단일 진실의 원천 (Single Source of Truth)
 * - 불변성 보장 (Immutable State Updates)
 * - 메모화된 파생 상태 (Memoized Derived State)
 * - 타입 안전성 보장 (Type Safety)
 */
export function useProjectMasterDetail(initialProjects: ProjectTableRow[] = []): {
  state: MasterDetailState;
  actions: MasterDetailActions;
} {
  // 기본 상태
  const [projects, setProjects] = useState<ProjectTableRow[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<ProjectTableRow | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabType>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<ViewMode>('detail'); // 뷰 모드 상태 추가
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // Detail View 기본값 5개로 설정
  
  // 필터 및 정렬 상태 (새로 추가)
  const [filters, setFilters] = useState<TableFilterState>({
    searchQuery: '',
    statusFilter: 'all',
    clientFilter: 'all',
    customFilters: {}
  });
  
  // 항상 최신 프로젝트부터 표시 (프로젝트 번호 내림차순 고정)
  const [sort, setSort] = useState<TableSortState>({
    column: 'no',
    direction: 'desc'
  });

  // 파생 상태: 필터링된 프로젝트 목록 (개선됨)
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // 검색 쿼리 필터링 (기존 searchQuery와 filters.searchQuery 통합)
    const searchTerm = searchQuery || filters.searchQuery;
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.client.toLowerCase().includes(query) ||
        project.no.toLowerCase().includes(query)
      );
    }

    // 상태 필터링
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.status === filters.statusFilter
      );
    }

    // 클라이언트 필터링
    if (filters.clientFilter && filters.clientFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.client === filters.clientFilter
      );
    }

    // 사용자 정의 필터
    Object.entries(filters.customFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(project => 
          project[key as keyof ProjectTableRow] === value
        );
      }
    });

    // 정렬 적용
    if (sort.column) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[sort.column as keyof ProjectTableRow];
        const bValue = b[sort.column as keyof ProjectTableRow];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          // No 컬럼의 경우 숫자 부분을 추출하여 정렬
          if (sort.column === 'no' && aValue.includes('_') && bValue.includes('_')) {
            const aNum = parseInt(aValue.split('_')[1] || '0');
            const bNum = parseInt(bValue.split('_')[1] || '0');
            comparison = aNum - bNum;
          } else {
            comparison = aValue.localeCompare(bValue, 'ko-KR');
          }
        } else {
          const aStr = String(aValue);
          const bStr = String(bValue);
          comparison = aStr.localeCompare(bStr, 'ko-KR');
        }

        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [projects, searchQuery, filters, sort]);

  // 파생 상태: 페이지네이션된 프로젝트 목록
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, pageSize]);

  // 파생 상태: 총 페이지 수
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProjects.length / pageSize);
  }, [filteredProjects.length, pageSize]);

  // 파생 상태: 선택된 프로젝트의 인덱스 (전체 필터된 목록에서)
  const selectedProjectIndex = useMemo(() => {
    if (!selectedProject) return -1;
    return filteredProjects.findIndex(p => p.id === selectedProject.id);
  }, [filteredProjects, selectedProject]);

  // 파생 상태: 클라이언트 목록 자동 생성
  const availableClients = useMemo(() => {
    const clients = projects
      .map(project => project.client)
      .filter(client => client && client.trim() !== '')
      .filter((client, index, array) => array.indexOf(client) === index)
      .sort((a, b) => a.localeCompare(b, 'ko-KR'));
    
    return clients;
  }, [projects]);

  // 액션: 프로젝트 선택 (개선된 탭 상태 관리)
  const selectProject = useCallback((project: ProjectTableRow) => {
    console.log('🎯 Selecting project:', {
      id: project.id,
      no: project.no,
      name: project.name,
      currentlySelected: selectedProject?.no
    });
    
    const previousProjectId = selectedProject?.id;
    setSelectedProject(project);
    
    // 다른 프로젝트를 선택하는 경우에만 탭 리셋
    if (previousProjectId !== project.id) {
      setActiveDetailTab('overview');
      console.log('📑 Resetting tab to overview (different project selected)');
    } else {
      console.log('📑 Keeping current tab (same project re-selected)');
    }
  }, [selectedProject]);

  // 액션: 인덱스로 프로젝트 선택
  const selectProjectByIndex = useCallback((index: number) => {
    if (index >= 0 && index < filteredProjects.length) {
      const project = filteredProjects[index];
      setSelectedProject(project);
      setActiveDetailTab('overview');
    }
  }, [filteredProjects]);

  // 액션: 프로젝트 네비게이션 (이전/다음)
  const navigateProject = useCallback((direction: 'prev' | 'next') => {
    const currentIndex = selectedProjectIndex;
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredProjects.length - 1;
    } else {
      newIndex = currentIndex < filteredProjects.length - 1 ? currentIndex + 1 : 0;
    }

    selectProjectByIndex(newIndex);
  }, [selectedProjectIndex, filteredProjects.length, selectProjectByIndex]);

  // 액션: 선택 해제
  const clearSelection = useCallback(() => {
    setSelectedProject(null);
    setActiveDetailTab('overview');
  }, []);

  // 액션: 생성 모달 열기
  const openCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  // 액션: 생성 모달 닫기
  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  // 액션: 새 프로젝트 추가
  const addNewProject = useCallback((newProject: ProjectTableRow) => {
    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject); // 새로 생성된 프로젝트 자동 선택
    setIsCreateModalOpen(false);
  }, []);

  // 액션: 프로젝트 업데이트
  const updateProject = useCallback((updatedProject: ProjectTableRow) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    
    // 현재 선택된 프로젝트가 업데이트된 경우 상태 동기화
    if (selectedProject?.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  }, [selectedProject]);

  // 액션: 프로젝트 삭제
  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    // 삭제된 프로젝트가 현재 선택된 프로젝트인 경우 선택 해제
    if (selectedProject?.id === projectId) {
      clearSelection();
    }
  }, [selectedProject, clearSelection]);

  // 액션: 로딩 상태 설정
  const handleSetLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // 액션: 필터 업데이트 (새로 추가)
  const updateFilters = useCallback((newFilters: TableFilterState) => {
    console.log('🔍 Updating Filters:', newFilters);
    setFilters(newFilters);
    
    // 검색어가 변경된 경우 레거시 searchQuery도 동기화
    if (newFilters.searchQuery !== searchQuery) {
      setSearchQuery(newFilters.searchQuery);
    }
    
    // 필터 변경 시 첫 페이지로 이동
    setCurrentPage(1);
  }, [searchQuery]);

  // 액션: 정렬 업데이트 (새로 추가)
  const updateSort = useCallback((newSort: TableSortState) => {
    console.log('🔽 Updating Sort:', newSort);
    setSort(newSort);
  }, []);

  // 액션: 필터 초기화 (새로 추가)
  const resetFilters = useCallback(() => {
    console.log('🔄 Resetting Filters');
    const initialFilters: TableFilterState = {
      searchQuery: '',
      statusFilter: 'all',
      clientFilter: 'all',
      customFilters: {}
    };
    setFilters(initialFilters);
    setSearchQuery('');
    
    const initialSort: TableSortState = {
      column: 'no',
      direction: 'desc'
    };
    setSort(initialSort);
    
    // 필터 초기화 시 첫 페이지로 이동
    setCurrentPage(1);
  }, []);

  // 전체 초기화 (필터 + 정렬 + 페이지네이션)
  const resetAll = useCallback(() => {
    console.log('🔄 Resetting All Settings (Filters + Sort + Pagination)');
    const initialFilters: TableFilterState = {
      searchQuery: '',
      statusFilter: 'all',
      clientFilter: 'all',
      customFilters: {}
    };
    setFilters(initialFilters);
    setSearchQuery('');
    
    const initialSort: TableSortState = {
      column: 'no',
      direction: 'desc'
    };
    setSort(initialSort);
    
    // 페이지네이션 초기화
    setCurrentPage(1);
    setPageSize(5); // Detail View 기본값
  }, []);

  // 액션: 검색어 설정 (기존 로직과 새로운 필터 상태 동기화)
  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({
      ...prev,
      searchQuery: query
    }));
    // 검색어 변경 시 첫 페이지로 이동
    setCurrentPage(1);
  }, []);

  // 액션: 페이지네이션 관리
  const handleSetCurrentPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  // 액션: 프로젝트 목록 새로고침 (개선된 상태 동기화)
  const refreshProjects = useCallback((newProjects: ProjectTableRow[]) => {
    console.log('🔄 Refreshing Projects:', {
      newProjectsCount: newProjects.length,
      currentSelected: selectedProject?.no,
      newProjectNumbers: newProjects.map(p => p.no)
    });
    
    // 현재 선택된 프로젝트의 ID를 미리 저장
    const currentSelectedId = selectedProject?.id;
    const currentSelectedNo = selectedProject?.no;
    
    // 프로젝트 목록을 먼저 업데이트
    setProjects(newProjects);
    
    // 선택된 프로젝트가 있었다면 새 목록에서 찾아서 다시 선택
    if (currentSelectedId && currentSelectedNo) {
      // ID로 먼저 찾기 (정확한 매칭)
      let updatedProject = newProjects.find(p => p.id === currentSelectedId);
      
      // ID로 찾지 못했다면 No(프로젝트 번호)로 찾기 (fallback)
      if (!updatedProject) {
        updatedProject = newProjects.find(p => p.no === currentSelectedNo);
        console.log('🔍 Project not found by ID, searching by No:', currentSelectedNo);
      }
      
      if (updatedProject) {
        console.log('✅ Re-selecting project after refresh:', {
          id: updatedProject.id,
          no: updatedProject.no,
          name: updatedProject.name
        });
        
        // 즉시 재선택 (비동기 처리 방지)
        setSelectedProject(updatedProject);
        // 탭도 현재 상태 유지 (초기화하지 않음)
      } else {
        console.log('❌ Selected project not found in refreshed data, clearing selection');
        clearSelection();
      }
    }
  }, [selectedProject, clearSelection]);

  // 상태와 액션 반환 (메모화)
  const state: MasterDetailState = useMemo(() => ({
    projects,
    selectedProject,
    selectedProjectIndex,
    isCreateModalOpen,
    activeDetailTab,
    isLoading,
    currentView, // 뷰 모드 상태 추가
    searchQuery,
    filteredProjects,
    filters,
    sort,
    availableClients, // 클라이언트 목록 추가
    // 페이지네이션 상태 추가
    currentPage,
    pageSize,
    paginatedProjects,
    totalPages,
  }), [
    projects,
    selectedProject,
    selectedProjectIndex,
    isCreateModalOpen,
    activeDetailTab,
    isLoading,
    currentView, // 뷰 모드 의존성 추가
    searchQuery,
    filteredProjects,
    filters,
    sort,
    availableClients, // 클라이언트 목록 의존성 추가
    // 페이지네이션 의존성 추가
    currentPage,
    pageSize,
    paginatedProjects,
    totalPages,
  ]);

  const actions: MasterDetailActions = useMemo(() => ({
    selectProject,
    selectProjectByIndex,
    navigateProject,
    clearSelection,
    openCreateModal,
    closeCreateModal,
    addNewProject,
    updateProject,
    deleteProject,
    setActiveDetailTab,
    setSearchQuery: handleSetSearchQuery,
    setLoading: handleSetLoading,
    setCurrentView, // 뷰 모드 변경 액션 추가
    updateFilters,
    updateSort,
    resetFilters,
    resetAll,
    // 페이지네이션 액션 추가
    setCurrentPage: handleSetCurrentPage,
    setPageSize: handleSetPageSize,
    goToNextPage,
    goToPrevPage,
    refreshProjects,
  }), [
    selectProject,
    selectProjectByIndex,
    navigateProject,
    clearSelection,
    openCreateModal,
    closeCreateModal,
    addNewProject,
    updateProject,
    deleteProject,
    setActiveDetailTab,
    handleSetSearchQuery,
    handleSetLoading,
    updateFilters,
    updateSort,
    resetFilters,
    resetAll,
    // 페이지네이션 액션 의존성 추가
    handleSetCurrentPage,
    handleSetPageSize,
    goToNextPage,
    goToPrevPage,
    refreshProjects,
  ]);

  return { state, actions };
}