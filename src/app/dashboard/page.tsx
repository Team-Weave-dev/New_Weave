'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { WorkspacePageContainer } from '@/components/layout/PageContainer';
import { DashboardContainer } from '@/components/dashboard/DashboardContainer';
import { OnboardingModal } from '@/components/dashboard/OnboardingModal';
import { TemplateManager } from '@/components/dashboard/TemplateManager';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { useDashboardStore } from '@/lib/stores/useDashboardStore';
import { getSupabaseClientSafe } from '@/lib/supabase/client';
import { 
  shouldShowOnboarding, 
  isDashboardEmpty,
  getVisitStatistics,
  firstTimeUserService 
} from '@/lib/dashboard/firstTimeUserService';
import { templateService } from '@/lib/dashboard/templateService';
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  
  const {
    currentLayout,
    isEditMode,
    setEditMode,
    createLayout,
    setCurrentLayout,
    addWidget,
    reflowWidgets,
  } = useDashboardStore();

  // 첫 사용자 체크 및 온보딩 표시
  useEffect(() => {
    const checkFirstVisit = () => {
      // 사용자 데이터 업데이트 (방문 횟수 등)
      const userData = firstTimeUserService.getUserData();
      console.log('사용자 방문 데이터:', userData);
      
      // 온보딩 표시 여부 결정
      if (shouldShowOnboarding()) {
        setShowOnboarding(true);
      } else {
        // 대시보드가 비어있으면 기본 레이아웃 초기화
        if (isDashboardEmpty()) {
          initializeDefaultLayout();
        }
      }
      
      // 방문 통계 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        const stats = getVisitStatistics();
        console.log('방문 통계:', stats);
      }
    };
    
    checkFirstVisit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열을 비워서 처음 마운트 시에만 실행
  
  // 기본 레이아웃 초기화 함수 (미니멀 템플릿 사용)
  const initializeDefaultLayout = async () => {
    // 이미 레이아웃과 위젯이 있으면 초기화 스킵
    if (currentLayout && currentLayout.widgets.length > 0) {
      return;
    }
    
    // 레이아웃이 없는 경우 미니멀 템플릿 적용
    if (!currentLayout) {
      const defaultLayout = createLayout('내 대시보드', '3x3');
      setCurrentLayout(defaultLayout);
      
      // 미니멀 템플릿 적용 (신규 사용자를 위한 간단한 시작)
      await templateService.applyTemplate('minimal', {
        preserveExisting: false,
        merge: false,
        backup: false
      });
    }
  };

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
  
  // 온보딩 완료 핸들러
  const handleOnboardingComplete = (templateId?: string) => {
    setShowOnboarding(false);
    
    if (!templateId) {
      // 템플릿을 선택하지 않은 경우 기본 레이아웃 초기화
      initializeDefaultLayout();
    }
    
    // firstTimeUserService에서 이미 처리됨 (completeOnboarding 또는 skipOnboarding)
  };

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
              {/* 템플릿 관리 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateManager(true)}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                템플릿
              </Button>
              
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
              
              {/* 위젯 추가 버튼 - DashboardContainer의 EditModeToolbar 사용하도록 제거 */}
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
          <DashboardContainer showToolbar={true} />
        </div>
        
        {/* 온보딩 모달 */}
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
        />
        
        {/* 템플릿 관리 모달 */}
        <TemplateManager
          isOpen={showTemplateManager}
          onClose={() => setShowTemplateManager(false)}
        />
      </WorkspacePageContainer>
    </AppLayout>
  );
}
