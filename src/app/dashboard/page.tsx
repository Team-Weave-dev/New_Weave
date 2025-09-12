'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { WorkspacePageContainer } from '@/components/layout/PageContainer';
import { DashboardContainer } from '@/components/dashboard/DashboardContainer';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { useDashboardStore } from '@/lib/stores/useDashboardStore';
import { getSupabaseClientSafe } from '@/lib/supabase/client';
import { 
  LayoutGrid, 
  Plus, 
  Settings, 
  Save,
  RefreshCw,
  Grid3x3,
  Grid2x2,
  Square,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Target,
  PieChart
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseClient] = useState(() => getSupabaseClientSafe());
  
  const {
    currentLayout,
    isEditMode,
    setEditMode,
    createLayout,
    setCurrentLayout,
    addWidget,
    reflowWidgets,
  } = useDashboardStore();

  // 초기 레이아웃 설정
  useEffect(() => {
    // 이미 레이아웃과 위젯이 있으면 초기화 스킵
    if (currentLayout && currentLayout.widgets.length > 0) {
      return;
    }
    
    // 레이아웃이 없는 경우에만 생성
    if (!currentLayout) {
      const defaultLayout = createLayout('내 대시보드', '3x3');
      setCurrentLayout(defaultLayout);
      
      // 레이아웃 생성 직후 샘플 위젯 추가
      const sampleWidgets = [
        { type: '프로젝트 요약', position: { x: 0, y: 0, width: 1, height: 1 } },
        { type: '매출 차트', position: { x: 1, y: 0, width: 2, height: 1 } },
        { type: '할 일 목록', position: { x: 0, y: 1, width: 1, height: 2 } },
        { type: '캘린더', position: { x: 1, y: 1, width: 1, height: 1 } },
        { type: '최근 활동', position: { x: 2, y: 1, width: 1, height: 2 } },
      ];
      
      sampleWidgets.forEach(widget => {
        addWidget(widget);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열을 비워서 처음 마운트 시에만 실행

  // 인증 체크
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabaseClient) return;
      
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session) {
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router, supabaseClient]);

  return (
    <AppLayout>
      <WorkspacePageContainer>
        {/* 헤더 영역 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-3 bg-weave-primary-light rounded-lg flex-shrink-0">
                <LayoutGrid className="w-6 h-6 text-weave-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-4 mb-1">
                  <Typography variant="h2" className="text-2xl text-txt-primary">
                    대시보드
                  </Typography>
                </div>
                <Typography variant="body1" className="text-txt-secondary">
                  프로젝트와 비즈니스 현황을 한눈에 확인하세요
                </Typography>
              </div>
            </div>
            
            {/* 우측 액션 버튼 그룹 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* 그리드 크기 선택 */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Grid3x3 className="h-4 w-4" />
                  <span>3x3</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
              
              {/* 편집 모드 토글 */}
              <Button
                variant={isEditMode ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setEditMode(!isEditMode)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {isEditMode ? '편집 완료' : '대시보드 편집'}
              </Button>
              
              {/* 위젯 추가 버튼 */}
              {isEditMode && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    // 위젯 라이브러리 모달 열기
                    console.log('위젯 추가 모달 열기');
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  위젯 추가
                </Button>
              )}
            </div>
          </div>

          {/* 편집 모드 안내 메시지 */}
          {isEditMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">
                    대시보드 편집 모드
                  </h3>
                  <p className="text-sm text-blue-700">
                    위젯을 드래그하여 위치를 변경하거나, 새로운 위젯을 추가할 수 있습니다.
                    편집을 완료하면 자동으로 저장됩니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reflowWidgets}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    자동 정렬
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(false)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    저장
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 대시보드 위젯 컨테이너 */}
        <div className="bg-white rounded-lg border border-gray-200 min-h-[600px]">
          <DashboardContainer showToolbar={false} />
        </div>
      </WorkspacePageContainer>
    </AppLayout>
  );
}
