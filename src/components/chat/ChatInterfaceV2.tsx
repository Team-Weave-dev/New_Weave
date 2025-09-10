'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHistory from '@/components/ai-assistant/ChatHistory';
import { SidebarSkeleton } from './MessageSkeleton';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { useReactions } from './EmojiReaction';
import { chatService, ChatMessage, ChatSession } from '@/lib/services/chatService';
import { chatService as chatSessionsService } from '@/lib/services/supabase/chat.service';
import { Trash2, Download, RefreshCw, Menu, X, Search, Keyboard, History, FileSearch, Maximize2, Minimize2 } from 'lucide-react';
import DocumentUploadPanel from './DocumentUploadPanel';
import ChatWelcome from './ChatWelcome';
import { ContextBuilder } from '@/lib/chat/contextBuilder';

export default function ChatInterface() {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [showDocumentPanel, setShowDocumentPanel] = useState(false);
  const [hasUploadedDocs, setHasUploadedDocs] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const { toasts, addToast, hideToast } = useToast();
  const { addReaction, getReactions } = useReactions();
  
  // 초기화
  useEffect(() => {
    initializeChat();
    createSupabaseSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Supabase 세션 생성
  const createSupabaseSession = async () => {
    try {
      const userId = 'system'; // TODO: 실제 사용자 ID로 교체
      const newSession = await chatSessionsService.createSession(
        userId,
        'unified', // 통합 모드
        undefined
      );
      
      if (newSession) {
        setDbSessionId(newSession.id);
      }
    } catch (error) {
      console.error('Supabase 세션 생성 오류:', error);
    }
  };
  
  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        startNewChat();
      }
      else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowSidebar(prev => !prev);
      }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(prev => !prev);
      }
      else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (messages.length > 0) {
          exportChat();
        }
      }
      else if (e.key === 'Escape' && isLoading) {
        stopGeneration();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messages.length, isLoading]);
  
  // 검색 필터링
  useEffect(() => {
    if (!searchQuery) {
      setFilteredSessions(sessions);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = sessions.filter(session => {
      return session.messages.some(msg => 
        msg.content.toLowerCase().includes(query)
      );
    });
    
    setFilteredSessions(filtered);
  }, [searchQuery, sessions]);
  
  const initializeChat = () => {
    let currentSession = chatService.getCurrentSession();
    
    if (!currentSession) {
      currentSession = chatService.createSession();
    }
    
    setSession(currentSession);
    setMessages(currentSession.messages);
    
    const allSessions = chatService.getAllSessions();
    setSessions(allSessions);
  };
  
  // 통합 메시지 전송
  const sendMessage = async (content: string) => {
    if (!session || isLoading) return;
    
    const userMessage = chatService.addMessage(session.id, {
      role: 'user',
      content
    });
    
    setMessages(prev => [...prev, userMessage]);
    
    // Supabase에 메시지 저장
    if (dbSessionId) {
      try {
        await chatSessionsService.saveMessage({
          sessionId: dbSessionId,
          role: 'user',
          content,
          userId: 'system'
        });
      } catch (error) {
        console.error('메시지 저장 오류:', error);
      }
    }
    
    setIsLoading(true);
    setIsTyping(true);
    setCurrentResponse('');
    
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      // 컨텍스트 빌더로 메시지 준비
      const contextBuilder = new ContextBuilder();
      const systemPrompt = contextBuilder.buildSystemPrompt();
      const enhancedMessage = contextBuilder.enhanceMessage(content, messages);
      const contextMessages = contextBuilder.buildContextMessages(
        content,
        messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        }))
      );
      
      // 통합 API 엔드포인트 사용
      const response = await fetch('/api/ai-assistant/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: enhancedMessage,
          userId: 'system',
          sessionId: session.id,
          stream: true
        }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'content') {
                  fullResponse += data.content;
                  setCurrentResponse(fullResponse);
                } else if (data.type === 'sources') {
                  // 소스 정보 표시
                  console.log('Sources:', data.content);
                } else if (data.type === 'suggestions') {
                  // 제안 표시
                  console.log('Suggestions:', data.content);
                } else if (data.type === 'done') {
                  break;
                }
              } catch (e) {
                console.error('JSON 파싱 오류:', e);
              }
            }
          }
        }
      }
      
      // 응답 메시지 추가
      const assistantMessage = chatService.addMessage(session.id, {
        role: 'assistant',
        content: fullResponse
      });
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Supabase에 응답 저장
      if (dbSessionId) {
        try {
          await chatSessionsService.saveMessage({
            sessionId: dbSessionId,
            role: 'assistant',
            content: fullResponse,
            userId: 'system'
          });
        } catch (error) {
          console.error('응답 저장 오류:', error);
        }
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('전송 오류:', error);
        addToast({
          id: Date.now().toString(),
          type: 'error',
          title: '전송 실패',
          message: 'AI 응답을 받을 수 없습니다.',
          duration: 3000
        });
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setCurrentResponse('');
      setAbortController(null);
    }
  };
  
  // 생성 중단
  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setIsTyping(false);
      if (currentResponse) {
        const partialMessage = chatService.addMessage(session!.id, {
          role: 'assistant',
          content: currentResponse + ' [생성 중단됨]'
        });
        setMessages(prev => [...prev, partialMessage]);
      }
      setCurrentResponse('');
      setAbortController(null);
      
      addToast({
        id: Date.now().toString(),
        type: 'info',
        title: '생성 중단',
        message: 'AI 응답 생성이 중단되었습니다.',
        duration: 2000
      });
    }
  };
  
  // 새 채팅 시작
  const startNewChat = () => {
    const newSession = chatService.createSession();
    setSession(newSession);
    setMessages([]);
    setInputMessage('');
    createSupabaseSession();
    
    addToast({
      id: Date.now().toString(),
      type: 'success',
      title: '새 대화',
      message: '새로운 대화를 시작합니다.',
      duration: 2000
    });
  };
  
  // 채팅 내보내기
  const exportChat = () => {
    if (!session || messages.length === 0) return;
    
    const chatContent = messages
      .map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${session.id}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addToast({
      id: Date.now().toString(),
      type: 'success',
      title: '내보내기 완료',
      message: '대화가 텍스트 파일로 저장되었습니다.',
      duration: 2000
    });
  };
  
  // 세션 선택
  const selectSession = async (sessionId: string) => {
    const selectedSession = sessions.find(s => s.id === sessionId);
    if (selectedSession) {
      chatService.setCurrentSession(sessionId);
      setSession(selectedSession);
      setMessages(selectedSession.messages);
      setShowHistory(false);
    }
  };
  
  // 세션 삭제
  const deleteSession = (sessionId: string) => {
    if (confirm('이 대화를 삭제하시겠습니까?')) {
      chatService.deleteSession(sessionId);
      const remainingSessions = chatService.getAllSessions();
      setSessions(remainingSessions);
      
      if (session?.id === sessionId) {
        startNewChat();
      }
      
      addToast({
        id: Date.now().toString(),
        type: 'info',
        title: '삭제 완료',
        message: '대화가 삭제되었습니다.',
        duration: 2000
      });
    }
  };
  
  return (
    <div className={`relative h-screen flex flex-col bg-gradient-to-b from-bg-primary to-bg-secondary ${
      isMaximized ? 'fixed inset-0 z-50' : ''
    }`}>
      <ToastContainer toasts={toasts} hideToast={hideToast} />
      
      {/* 헤더 */}
      <div className="bg-bg-primary/80 backdrop-blur-sm border-b border-border-light sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* AI 업무비서 텍스트 */}
              <Typography variant="body2" className="text-sm font-medium text-txt-secondary">
                AI 업무비서
              </Typography>
              
              {/* 통합 모드 표시 */}
              <div className="flex gap-1.5">
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-weave-primary/10 text-weave-primary">
                  🤖 통합 AI
                </span>
                <span className="hidden sm:inline px-2.5 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-600">
                  ✨ 자동 의도 분석
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* 문서 업로드 버튼 */}
              <Button
                variant="ghost"
                onClick={() => setShowDocumentPanel(true)}
                className="p-1.5"
                title="문서 관리"
              >
                <FileSearch className="h-4 w-4" />
                {hasUploadedDocs && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </Button>
              
              {/* 사이드바 토글 버튼 */}
              <Button
                variant="ghost"
                onClick={() => setShowSidebar(prev => !prev)}
                className="p-1.5"
                title="사이드바 토글"
              >
                {showSidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* 메인 채팅 영역 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {messages.length === 0 ? (
              <ChatWelcome
                onSuggestionClick={sendMessage}
                chatType="unified"
              />
            ) : (
              <MessageList
                messages={messages}
                isTyping={isTyping}
                currentResponse={currentResponse}
                onRegenerate={(messageId) => {
                  const message = messages.find(m => m.id === messageId);
                  if (message && message.role === 'user') {
                    sendMessage(message.content);
                  }
                }}
                onReaction={(messageId, reaction) => {
                  addReaction(messageId, reaction);
                  addToast({
                    id: Date.now().toString(),
                    type: 'success',
                    title: '반응 추가됨',
                    message: `${reaction} 반응이 추가되었습니다.`,
                    duration: 1500
                  });
                }}
                reactions={getReactions()}
              />
            )}
          </div>
          
          <MessageInput
            value={inputMessage}
            onChange={setInputMessage}
            onSend={sendMessage}
            isLoading={isLoading}
            onStop={stopGeneration}
            placeholder="세무, 프로젝트, 문서 등 무엇이든 물어보세요. AI가 자동으로 의도를 파악합니다..."
          />
        </div>
        
        {/* 사이드바 */}
        {showSidebar && (
          <div className="w-80 border-l border-border-light bg-bg-primary overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-light">
              <div className="flex items-center justify-between mb-3">
                <Typography variant="h6" className="text-txt-primary">
                  대화 기록
                </Typography>
                <Button
                  variant="ghost"
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-1"
                >
                  <History className="h-4 w-4" />
                </Button>
              </div>
              
              {showHistory && (
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-txt-tertiary" />
                  <input
                    type="text"
                    placeholder="대화 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-bg-secondary rounded-lg text-sm text-txt-primary placeholder-txt-tertiary focus:outline-none focus:ring-2 focus:ring-weave-primary"
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={startNewChat}
                  className="flex-1 text-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  새 대화
                </Button>
                {messages.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={exportChat}
                    className="flex-1 text-sm"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    내보내기
                  </Button>
                )}
              </div>
            </div>
            
            {showHistory ? (
              <ChatHistory
                sessions={filteredSessions}
                currentSessionId={session?.id}
                onSelectSession={selectSession}
                onDeleteSession={deleteSession}
                isLoading={false}
              />
            ) : (
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-3">
                  <div className="p-3 bg-bg-secondary rounded-lg">
                    <Typography variant="body2" className="text-xs text-txt-secondary mb-2">
                      AI 기능
                    </Typography>
                    <div className="space-y-2 text-xs text-txt-tertiary">
                      <div>• 세무 상담 및 절세 전략</div>
                      <div>• 프로젝트 관리 및 분석</div>
                      <div>• 클라이언트 정보 조회</div>
                      <div>• 문서 작성 및 템플릿</div>
                      <div>• 비즈니스 인사이트</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-bg-secondary rounded-lg">
                    <Typography variant="body2" className="text-xs text-txt-secondary mb-2">
                      단축키
                    </Typography>
                    <div className="space-y-1 text-xs text-txt-tertiary">
                      <div className="flex justify-between">
                        <span>새 대화</span>
                        <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">⌘K</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>사이드바</span>
                        <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">⌘/</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>대화 기록</span>
                        <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">⌘H</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>내보내기</span>
                        <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">⌘S</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>중단</span>
                        <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">ESC</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 문서 업로드 패널 */}
      {showDocumentPanel && (
        <DocumentUploadPanel
          onClose={() => setShowDocumentPanel(false)}
          onUploadComplete={() => {
            setHasUploadedDocs(true);
            addToast({
              id: Date.now().toString(),
              type: 'success',
              title: '업로드 완료',
              message: '문서가 성공적으로 업로드되었습니다.',
              duration: 3000
            });
          }}
        />
      )}
    </div>
  );
}