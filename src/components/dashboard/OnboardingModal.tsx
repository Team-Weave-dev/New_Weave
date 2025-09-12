'use client';

import { useState, useEffect } from 'react';
import { X, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/lib/stores/useDashboardStore';
import { 
  dashboardTemplates, 
  type DashboardTemplate
} from './templates/dashboardTemplates';
import { templateService } from '@/lib/dashboard/templateService';
import { completeOnboarding, skipOnboarding, getRecommendedTemplates } from '@/lib/dashboard/firstTimeUserService';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (templateId?: string) => void;
}

export function OnboardingModal({ 
  isOpen, 
  onClose, 
  onComplete 
}: OnboardingModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [recommendedTemplates, setRecommendedTemplates] = useState<string[]>([]);
  const { currentLayout } = useDashboardStore();

  // 추천 템플릿 로드
  useEffect(() => {
    if (isOpen) {
      const recommended = getRecommendedTemplates();
      setRecommendedTemplates(recommended);
      // 첫 번째 추천 템플릿을 기본 선택
      if (recommended.length > 0 && !selectedTemplate) {
        setSelectedTemplate(recommended[0]);
      }
    }
  }, [isOpen, selectedTemplate]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;

    setIsApplying(true);
    
    try {
      // templateService를 사용하여 템플릿 적용
      const success = await templateService.applyTemplate(selectedTemplate, {
        preserveExisting: false,
        merge: false,
        backup: true
      });
      
      if (success) {
        // 온보딩 완료 처리
        completeOnboarding(selectedTemplate);
        // 완료 콜백
        onComplete(selectedTemplate);
      } else {
        console.error('Failed to apply template');
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSkip = () => {
    skipOnboarding();
    onComplete();
  };

  const getTemplateIcon = (category: string) => {
    switch(category) {
      case 'project': return '📊';
      case 'tax': return '📅';
      case 'balanced': return '⚖️';
      case 'minimal': return '✨';
      default: return '📌';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          
          {/* 모달 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
          >
            {/* 헤더 */}
            <div className="px-6 py-4 border-b">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                대시보드 템플릿 선택
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                업무 스타일에 맞는 템플릿을 선택하여 빠르게 시작하세요.
                나중에 언제든지 변경할 수 있습니다.
              </p>
            </div>

            {/* 템플릿 그리드 */}
            <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-2 gap-4">
                {dashboardTemplates.map((template) => {
                  const isRecommended = recommendedTemplates.includes(template.id);
                  return (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={cn(
                        "relative cursor-pointer transition-all duration-200 border rounded-lg",
                        "hover:shadow-lg hover:border-blue-500/50",
                        selectedTemplate === template.id && 
                        "border-blue-500 ring-2 ring-blue-500/20",
                        isRecommended && "border-green-500/30 bg-green-50/30"
                      )}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="p-6">
                        {/* 선택 체크마크 */}
                        <AnimatePresence>
                          {selectedTemplate === template.id && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute top-3 right-3"
                            >
                              <div className="bg-blue-500 text-white rounded-full p-1">
                                <Check className="h-4 w-4" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* 추천 배지 */}
                        {isRecommended && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              추천
                            </span>
                          </div>
                        )}

                        {/* 템플릿 아이콘 */}
                        <div className="text-4xl mb-3">
                          {getTemplateIcon(template.category)}
                        </div>

                        {/* 템플릿 정보 */}
                        <h3 className="font-semibold text-lg mb-2">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {template.description}
                        </p>

                        {/* 추천 대상 */}
                        <div className="flex flex-wrap gap-1">
                          {template.recommendedFor.slice(0, 2).map((target) => (
                            <span 
                              key={target} 
                              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {target}
                            </span>
                          ))}
                          {template.recommendedFor.length > 2 && (
                            <span 
                              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              +{template.recommendedFor.length - 2}
                            </span>
                          )}
                        </div>

                        {/* 위젯 개수 정보 */}
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>그리드: {template.layout.gridSize}</span>
                            <span>위젯: {template.layout.widgets?.length || 0}개</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
                })}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isApplying}
              >
                건너뛰기
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isApplying}
                >
                  취소
                </Button>
                <Button
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplate || isApplying}
                  className="min-w-[120px]"
                >
                  {isApplying ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      적용 중...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      템플릿 적용
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}