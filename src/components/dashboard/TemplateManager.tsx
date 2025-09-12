'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3x3, 
  Save, 
  Upload, 
  Download, 
  Plus, 
  Check, 
  X, 
  Sparkles,
  Clock,
  Star,
  Trash2,
  Edit2,
  Eye,
  Settings
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/lib/stores/useDashboardStore';
import { 
  dashboardTemplates, 
  type DashboardTemplate 
} from './templates/dashboardTemplates';
import { 
  templateService
} from '@/lib/dashboard/templateService';
import { 
  getPreviousTemplateChoice,
  isDashboardEmpty,
  getRecommendedTemplates 
} from '@/lib/dashboard/firstTimeUserService';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateManager({ isOpen, onClose }: TemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<DashboardTemplate[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [previewTemplate, setPreviewTemplate] = useState<DashboardTemplate | null>(null);
  const [recommendedTemplateIds, setRecommendedTemplateIds] = useState<string[]>([]);
  
  const { currentLayout } = useDashboardStore();

  // 커스텀 템플릿 로드
  useEffect(() => {
    const loadCustomTemplates = () => {
      const stored = localStorage.getItem('custom-templates');
      if (stored) {
        try {
          const templates = JSON.parse(stored) as DashboardTemplate[];
          setCustomTemplates(templates);
        } catch (error) {
          console.error('Failed to load custom templates:', error);
        }
      }
    };
    
    loadCustomTemplates();
  }, []);

  // 이전 선택한 템플릿 불러오기 및 추천 템플릿 설정
  useEffect(() => {
    const previousChoice = getPreviousTemplateChoice();
    if (previousChoice) {
      setSelectedTemplate(previousChoice);
    }
    
    // 추천 템플릿 ID 설정
    const recommended = getRecommendedTemplates();
    setRecommendedTemplateIds(recommended);
  }, []);

  // 템플릿 적용
  const handleApplyTemplate = async (templateId: string) => {
    setIsApplying(true);
    
    try {
      const success = await templateService.applyTemplate(templateId, {
        preserveExisting: false,
        merge: false,
        backup: true
      });
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // 현재 레이아웃을 템플릿으로 저장
  const handleSaveAsTemplate = () => {
    if (!templateName || !currentLayout) return;
    
    const newTemplate = templateService.saveAsTemplate(
      templateName,
      templateDescription || '사용자 정의 템플릿'
    );
    
    if (newTemplate) {
      // 커스텀 템플릿 목록 업데이트
      const updatedTemplates = [...customTemplates, newTemplate];
      setCustomTemplates(updatedTemplates);
      localStorage.setItem('custom-templates', JSON.stringify(updatedTemplates));
      
      // 다이얼로그 리셋
      setShowSaveDialog(false);
      setTemplateName('');
      setTemplateDescription('');
      
      // 탭 전환
      setActiveTab('custom');
    }
  };

  // 커스텀 템플릿 삭제
  const handleDeleteCustomTemplate = (templateId: string) => {
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updatedTemplates);
    localStorage.setItem('custom-templates', JSON.stringify(updatedTemplates));
  };

  // 템플릿 미리보기
  const handlePreviewTemplate = (template: DashboardTemplate) => {
    setPreviewTemplate(template);
  };

  const getTemplateIcon = (category: string) => {
    switch(category) {
      case 'project': return '📊';
      case 'tax': return '📅';
      case 'balanced': return '⚖️';
      case 'minimal': return '✨';
      default: return '⭐';
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
          
          {/* 메인 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
          >
            {/* 헤더 */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
              
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    템플릿 관리
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    대시보드 레이아웃을 빠르게 변경하고 관리할 수 있습니다
                  </p>
                </div>
              </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="px-6 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('preset')}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-colors",
                    activeTab === 'preset' 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  기본 템플릿
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-colors",
                    activeTab === 'custom' 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  내 템플릿 ({customTemplates.length})
                </button>
                
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={!currentLayout || currentLayout.widgets.length === 0}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    현재 레이아웃 저장
                  </Button>
                </div>
              </div>
            </div>

            {/* 컨텐츠 영역 */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {activeTab === 'preset' ? (
                /* 기본 템플릿 */
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardTemplates.map((template) => {
                    const isRecommended = recommendedTemplateIds.includes(template.id);
                    const isSelected = selectedTemplate === template.id;
                    
                    return (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={cn(
                            "relative cursor-pointer transition-all duration-200",
                            "hover:shadow-lg hover:border-blue-500/50",
                            isSelected && "border-blue-500 ring-2 ring-blue-500/20",
                            isRecommended && "border-green-500/30"
                          )}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <div className="p-4">
                            {/* 추천 배지 */}
                            {isRecommended && (
                              <div className="absolute top-2 right-2">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  추천
                                </span>
                              </div>
                            )}
                            
                            {/* 선택 체크마크 */}
                            {isSelected && (
                              <div className="absolute top-2 left-2">
                                <div className="bg-blue-500 text-white rounded-full p-1">
                                  <Check className="h-3 w-3" />
                                </div>
                              </div>
                            )}

                            {/* 템플릿 정보 */}
                            <div className="text-3xl mb-2">
                              {getTemplateIcon(template.category)}
                            </div>
                            <h3 className="font-semibold text-base mb-1">
                              {template.name}
                            </h3>
                            <p className="text-xs text-gray-600 mb-3">
                              {template.description}
                            </p>

                            {/* 메타 정보 */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>그리드: {template.layout.gridSize}</span>
                              <span>{template.layout.widgets?.length || 0}개 위젯</span>
                            </div>

                            {/* 액션 버튼 */}
                            <div className="mt-3 flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewTemplate(template);
                                }}
                                className="flex-1"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyTemplate(template.id);
                                }}
                                disabled={isApplying}
                                className="flex-1"
                              >
                                적용
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* 커스텀 템플릿 */
                <div>
                  {customTemplates.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        저장된 커스텀 템플릿이 없습니다
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowSaveDialog(true)}
                        disabled={!currentLayout || currentLayout.widgets.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        현재 레이아웃을 템플릿으로 저장
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {customTemplates.map((template) => (
                        <motion.div
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card className="relative cursor-pointer hover:shadow-lg">
                            <div className="p-4">
                              <div className="text-3xl mb-2">⭐</div>
                              <h3 className="font-semibold text-base mb-1">
                                {template.name}
                              </h3>
                              <p className="text-xs text-gray-600 mb-3">
                                {template.description}
                              </p>

                              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                <span>그리드: {template.layout.gridSize}</span>
                                <span>{template.layout.widgets?.length || 0}개 위젯</span>
                              </div>

                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePreviewTemplate(template)}
                                  className="flex-1"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleApplyTemplate(template.id)}
                                  disabled={isApplying}
                                  className="flex-1"
                                >
                                  적용
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCustomTemplate(template.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 미리보기 패널 */}
            {previewTemplate && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    미리보기: {previewTemplate.name}
                  </h3>
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-2 h-32">
                    {previewTemplate.layout.widgets?.map((widget, index) => (
                      <div
                        key={index}
                        className="bg-gray-100 rounded p-2 text-xs text-gray-600"
                        style={{
                          gridColumn: `span ${widget.position.width}`,
                          gridRow: `span ${widget.position.height}`
                        }}
                      >
                        {widget.type}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* 템플릿 저장 다이얼로그 */}
          {showSaveDialog && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center z-60"
            >
              <div 
                className="absolute inset-0 bg-black/20" 
                onClick={() => setShowSaveDialog(false)}
              />
              <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">
                  템플릿으로 저장
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      템플릿 이름
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 내 업무 대시보드"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명 (선택사항)
                    </label>
                    <textarea
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="템플릿에 대한 간단한 설명"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    취소
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveAsTemplate}
                    disabled={!templateName}
                  >
                    저장
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}