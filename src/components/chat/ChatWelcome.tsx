'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { MessageSquare, FileSearch, Calculator, Sparkles } from 'lucide-react';

interface ChatWelcomeProps {
  chatType: 'general' | 'rag' | 'tax' | 'unified';
  onExampleClick: (text: string) => void;
}

export default function ChatWelcome({ chatType, onExampleClick }: ChatWelcomeProps) {
  const examples = {
    general: [
      "프로젝트 진행 상황 보고서를 작성해줘",
      "효과적인 회의 진행 방법은?",
      "팀 커뮤니케이션 개선 방안을 제안해줘",
      "업무 우선순위 정하는 방법을 알려줘"
    ],
    rag: [
      "업로드한 계약서의 주요 조항을 요약해줘",
      "문서에서 결제 관련 내용을 찾아줘",
      "프로젝트 요구사항 문서를 분석해줘",
      "업로드한 보고서의 핵심 지표는?"
    ],
    tax: [
      "프리랜서 종합소득세 신고 방법은?",
      "사업자 부가세 신고 절차를 알려줘",
      "연말정산 의료비 공제 한도는?",
      "법인세 중간예납 계산 방법은?"
    ],
    unified: [
      "2025년 종합소득세 세율 구간을 알려줘",
      "프로젝트 진행 현황 보고서 작성해줘",
      "계약서의 주요 조항을 분석해줘",
      "팀 업무 효율성 개선 방안을 제안해줘"
    ]
  };

  const getModeInfo = () => {
    switch (chatType) {
      case 'rag':
        return {
          icon: <FileSearch className="w-8 h-8 text-weave-primary" />,
          title: "RAG 모드 활성화",
          description: "문서를 업로드하면 AI가 문서 내용을 기반으로 정확한 답변을 제공합니다.",
          hint: "우측 상단의 📄 버튼을 클릭하여 문서를 업로드하세요!"
        };
      case 'tax':
        return {
          icon: <Calculator className="w-8 h-8 text-weave-primary" />,
          title: "세무 상담 모드",
          description: "한국 세법 기준으로 세무 관련 질문에 전문적인 답변을 제공합니다.",
          hint: "복잡한 세무 결정은 반드시 세무사와 상담하세요."
        };
      case 'unified':
        return {
          icon: <Sparkles className="w-8 h-8 text-weave-primary" />,
          title: "통합 AI 시스템",
          description: "세무, 문서 분석, 업무 지원을 자동으로 판단하여 최적의 답변을 제공합니다.",
          hint: "모든 유형의 질문을 자유롭게 해보세요!"
        };
      default:
        return {
          icon: <MessageSquare className="w-8 h-8 text-weave-primary" />,
          title: "AI 업무 비서",
          description: "업무 관련 질문, 문서 작성, 아이디어 제안 등 다양한 도움을 제공합니다.",
          hint: "자유롭게 질문해보세요!"
        };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full">
        {/* 모드 안내 */}
        <Card className="p-6 mb-6 text-center">
          <div className="flex justify-center mb-4">
            {modeInfo.icon}
          </div>
          <Typography variant="h3" className="text-xl font-semibold mb-2">
            {modeInfo.title}
          </Typography>
          <Typography variant="body1" className="text-txt-secondary mb-3">
            {modeInfo.description}
          </Typography>
          <Typography variant="body2" className="text-txt-tertiary text-sm">
            💡 {modeInfo.hint}
          </Typography>
        </Card>

        {/* 예시 질문 */}
        <div>
          <Typography variant="body2" className="text-txt-secondary mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            이런 질문을 해보세요
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {examples[chatType].map((example, index) => (
              <button
                key={index}
                onClick={() => onExampleClick(example)}
                className="text-left p-3 rounded-lg border border-border-light 
                         hover:border-weave-primary hover:bg-weave-primary/5 
                         transition-all duration-200 group"
              >
                <Typography variant="body2" className="text-txt-secondary group-hover:text-txt-primary">
                  {example}
                </Typography>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}