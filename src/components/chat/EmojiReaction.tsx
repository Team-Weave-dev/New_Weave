'use client';

import React, { useState } from 'react';
import { Smile } from 'lucide-react';

interface Reaction {
  emoji: string;
  label: string;
  count: number;
  userReacted: boolean;
}

interface EmojiReactionProps {
  messageId: string;
  reactions?: Reaction[];
  onReaction?: (messageId: string, emoji: string) => void;
  compact?: boolean;
}

// 자주 사용되는 반응 이모지
const AVAILABLE_REACTIONS = [
  { emoji: '👍', label: '좋아요' },
  { emoji: '❤️', label: '하트' },
  { emoji: '😊', label: '웃음' },
  { emoji: '🎉', label: '축하' },
  { emoji: '🤔', label: '생각 중' },
  { emoji: '👏', label: '박수' },
  { emoji: '🔥', label: '멋져요' },
  { emoji: '💡', label: '아이디어' }
];

export default function EmojiReaction({ 
  messageId, 
  reactions = [], 
  onReaction, 
  compact = false 
}: EmojiReactionProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  const handleReaction = (emoji: string) => {
    onReaction?.(messageId, emoji);
    setShowPicker(false);
  };

  // 컴팩트 모드 - 인라인 표시
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            onClick={() => handleReaction(reaction.emoji)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all
              ${reaction.userReacted 
                ? 'bg-weave-primary/20 border border-weave-primary/40' 
                : 'bg-bg-secondary hover:bg-bg-tertiary border border-transparent'
              }
            `}
          >
            <span>{reaction.emoji}</span>
            {reaction.count > 0 && (
              <span className={`font-medium ${
                reaction.userReacted ? 'text-weave-primary' : 'text-txt-secondary'
              }`}>
                {reaction.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* 기존 반응들 표시 */}
      <div className="flex items-center gap-1 flex-wrap">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            onClick={() => handleReaction(reaction.emoji)}
            className={`group relative inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all
              ${reaction.userReacted 
                ? 'bg-gradient-to-r from-weave-primary/20 to-weave-primary-light/20 border border-weave-primary/40 shadow-sm' 
                : 'bg-white hover:bg-bg-secondary border border-border-light hover:border-weave-primary/30'
              }
            `}
            title={`${reaction.label} (${reaction.count}명)`}
          >
            <span className="text-base">{reaction.emoji}</span>
            {reaction.count > 0 && (
              <span className={`text-xs font-medium ${
                reaction.userReacted ? 'text-weave-primary' : 'text-txt-secondary'
              }`}>
                {reaction.count}
              </span>
            )}
            
            {/* 호버 시 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                          opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-txt-primary text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {reaction.label}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-txt-primary"></div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 반응 추가 버튼 */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1.5 rounded-full bg-white hover:bg-bg-secondary border border-border-light 
                   hover:border-weave-primary/30 transition-all group"
          title="반응 추가"
        >
          <Smile className="w-4 h-4 text-txt-tertiary group-hover:text-weave-primary transition-colors" />
        </button>

        {/* 이모지 선택기 */}
        {showPicker && (
          <>
            {/* 백드롭 */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowPicker(false)}
            />
            
            {/* 이모지 팝업 */}
            <div className="absolute bottom-full left-0 mb-2 z-50 animate-slide-up">
              <div className="bg-white rounded-lg shadow-lg border border-border-light p-2">
                <div className="grid grid-cols-4 gap-1">
                  {AVAILABLE_REACTIONS.map((item) => (
                    <button
                      key={item.emoji}
                      onClick={() => handleReaction(item.emoji)}
                      onMouseEnter={() => setHoveredEmoji(item.emoji)}
                      onMouseLeave={() => setHoveredEmoji(null)}
                      className="p-2 rounded hover:bg-bg-secondary transition-colors relative group"
                      title={item.label}
                    >
                      <span className="text-xl">{item.emoji}</span>
                      
                      {/* 이모지 라벨 툴팁 */}
                      {hoveredEmoji === item.emoji && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1">
                          <div className="bg-txt-primary text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {item.label}
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 반응 관리를 위한 Hook
export function useReactions() {
  const [messageReactions, setMessageReactions] = useState<Map<string, Reaction[]>>(new Map());

  const addReaction = (messageId: string, emoji: string) => {
    setMessageReactions(prev => {
      const newMap = new Map(prev);
      const reactions = newMap.get(messageId) || [];
      
      // 이미 반응한 이모지인지 확인
      const existingIndex = reactions.findIndex(r => r.emoji === emoji);
      
      if (existingIndex >= 0) {
        // 이미 반응한 경우 토글
        const existing = reactions[existingIndex];
        if (existing.userReacted) {
          // 반응 취소
          if (existing.count <= 1) {
            // 완전히 제거
            reactions.splice(existingIndex, 1);
          } else {
            // 카운트만 감소
            reactions[existingIndex] = {
              ...existing,
              count: existing.count - 1,
              userReacted: false
            };
          }
        } else {
          // 반응 추가
          reactions[existingIndex] = {
            ...existing,
            count: existing.count + 1,
            userReacted: true
          };
        }
      } else {
        // 새로운 반응 추가
        const reactionInfo = AVAILABLE_REACTIONS.find(r => r.emoji === emoji);
        reactions.push({
          emoji,
          label: reactionInfo?.label || '',
          count: 1,
          userReacted: true
        });
      }
      
      newMap.set(messageId, reactions);
      return newMap;
    });
  };

  const getReactions = (messageId: string): Reaction[] => {
    return messageReactions.get(messageId) || [];
  };

  return {
    addReaction,
    getReactions,
    messageReactions
  };
}