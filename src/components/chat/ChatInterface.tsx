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
  const [showSidebar, setShowSidebar] = useState(false); // 기본값을 false로 설정
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  // 통합 AI 시스템 사용 - chatType 제거됨
  const [showDocumentPanel, setShowDocumentPanel] = useState(false);
  const [hasUploadedDocs, setHasUploadedDocs] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatType, setChatType] = useState<'general' | 'rag' | 'tax'>('general'); // chatType 추가
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
      // TODO: 실제 사용자 ID로 교체 필요
      const userId = 'system';
      const newSession = await chatSessionsService.createSession(
        userId,
        'unified', // 통합 모드
        undefined
      );
      
      if (newSession) {
        setDbSessionId(newSession.id);
        // 세션이 생성되었습니다
      }
    } catch (error) {
      console.error('Supabase 세션 생성 오류:', error);
    }
  };
  
  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: 새 대화
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        startNewChat();
      }
      // Cmd/Ctrl + /: 사이드바 토글
      else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowSidebar(prev => !prev);
      }
      // Cmd/Ctrl + H: 히스토리 토글
      else if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(prev => !prev);
      }
      // Cmd/Ctrl + S: 대화 저장(내보내기)
      else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (messages.length > 0) {
          exportChat();
        }
      }
      // Escape: 응답 중단
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
      // 메시지 내용으로 검색
      return session.messages.some(msg => 
        msg.content.toLowerCase().includes(query)
      );
    });
    
    setFilteredSessions(filtered);
  }, [searchQuery, sessions]);
  
  const initializeChat = () => {
    // 현재 세션 가져오기 또는 새로 생성
    let currentSession = chatService.getCurrentSession();
    
    if (!currentSession) {
      currentSession = chatService.createSession();
    }
    
    setSession(currentSession);
    setMessages(currentSession.messages);
    
    // 모든 세션 로드
    const allSessions = chatService.getAllSessions();
    setSessions(allSessions);
  };
  
  // 메시지 전송
  const sendMessage = async (content: string) => {
    if (!session || isLoading) return;
    
    // 사용자 메시지 추가
    const userMessage = chatService.addMessage(session.id, {
      role: 'user',
      content
    });
    
    setMessages(prev => [...prev, userMessage]);
    
    // Supabase에 메시지 저장
    if (dbSessionId) {
      saveMessageToSupabase(dbSessionId, {
        role: 'user',
        content,
        metadata: {}
      });
    }
    setIsLoading(true);
    setIsTyping(true);
    setCurrentResponse('');
    
    // AbortController 생성 (응답 중단용)
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      // 컨텍스트 메시지 가져오기
      const contextMessages = chatService.getContextMessages(session.id);
      
      // 개인화된 컨텍스트 구축
      const userContext = {
        id: 'system',
        name: '사용자',
        company: 'WEAVE',
        preferences: {
          language: 'ko',
          tone: 'professional' as const,
          expertise: ['비즈니스', '프로젝트 관리']
        }
      };
      
      const { systemPrompt, enhancedMessage } = ContextBuilder.buildPersonalizedContext(
        content,
        {
          mode: chatType,
          userContext,
          sessionHistory: contextMessages.slice(-5).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp
          }))
        }
      );
      
      // 통합 API 엔드포인트 사용
      const apiEndpoint = '/api/ai-assistant/unified';
      
      // API 요청
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: enhancedMessage,
          messages: [
            { role: 'system', content: systemPrompt },
            ...contextMessages.map(m => ({
              role: m.role,
              content: m.content
            }))
          ],
          sessionId: session.id,
          // 자동 의도 분석 사용
          userContext
        }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error('API 응답 오류');
      }
      
      // SSE 스트림 처리
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let metadata: any = null;
      
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
                  accumulatedContent += data.data;
                  setCurrentResponse(accumulatedContent);
                } else if (data.type === 'metadata') {
                  metadata = data.data;
                } else if (data.type === 'error') {
                  throw new Error(data.data);
                } else if (data.type === 'done') {
                  // 완료 처리
                  break;
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
      
      // AI 응답 메시지 저장
      if (accumulatedContent) {
        const aiMessage = chatService.addMessage(session.id, {
          role: 'assistant',
          content: accumulatedContent,
          metadata: metadata || {
            model: 'gemini-2.5-flash-lite',
            processingTime: Date.now() - userMessage.timestamp.getTime()
          }
        });
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Supabase에 메시지 저장
        if (dbSessionId) {
          saveMessageToSupabase(dbSessionId, {
            role: 'assistant',
            content: accumulatedContent,
            metadata: metadata || {},
            model: 'gemini-2.5-flash-lite'
          });
        }
        
        // 세션 업데이트
        const updatedSession = chatService.getSession(session.id);
        if (updatedSession) {
          setSession(updatedSession);
          setSessions(chatService.getAllSessions());
        }
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        
        // 에러 타입별 메시지
        let errorMsg = '응답 생성 중 오류가 발생했습니다.';
        if (error.message?.includes('API key')) {
          errorMsg = 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.';
        } else if (error.message?.includes('network')) {
          errorMsg = '네트워크 연결을 확인해주세요.';
        } else if (error.message?.includes('rate limit')) {
          errorMsg = 'API 사용량 제한에 도달했습니다. 잠시 후 다시 시도해주세요.';
        }
        
        // Toast 알림
        addToast(errorMsg, 'error');
        
        // 에러 메시지 추가
        const errorMessage = chatService.addMessage(session.id, {
          role: 'assistant',
          content: `죄송합니다. ${errorMsg} 다시 시도해주세요.`,
          metadata: {} as any
        });
        
        setMessages(prev => [...prev, errorMessage]);
      } else {
        // 사용자가 중단한 경우
        addToast('응답 생성이 중단되었습니다.', 'info');
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setCurrentResponse('');
      setAbortController(null);
    }
  };
  
  // 응답 중단
  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setIsTyping(false);
      
      // 중단된 응답도 저장
      if (currentResponse) {
        const aiMessage = chatService.addMessage(session!.id, {
          role: 'assistant',
          content: currentResponse + '\n\n*(응답이 중단되었습니다)*',
          metadata: {} as any
        });
        
        setMessages(prev => [...prev, aiMessage]);
        setCurrentResponse('');
      }
    }
  };
  
  // 새 대화 시작
  const startNewChat = () => {
    const newSession = chatService.createSession();
    setSession(newSession);
    setMessages([]);
    setSessions(chatService.getAllSessions());
    setShowSidebar(false);
    setShowHistory(false);
    createSupabaseSession(); // 새 Supabase 세션 생성
  };
  
  // Supabase에 메시지 저장
  const saveMessageToSupabase = async (sessionId: string, message: any) => {
    try {
      await chatSessionsService.addMessage(sessionId, {
        role: message.role as 'user' | 'assistant' | 'system',
        content: message.content,
        metadata: {
          ...(message.metadata || {}),
          model: message.model
        }
      });
      
      // addMessage는 자동으로 세션 업데이트 시간을 갱신합니다
    } catch (error) {
      console.error('메시지 저장 오류:', error);
    }
  };
  
  // Supabase에서 세션 로드 (히스토리에서 선택 시)
  const loadSession = async (sessionId: string) => {
    try {
      // 세션 정보 가져오기
      const sessionData = await chatSessionsService.getSessionById(sessionId);
      
      if (sessionData) {
        // 메시지 가져오기
        const messagesData = await chatSessionsService.getMessages(sessionId);
        
        // 메시지 형식 변환
        const loadedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata
        }));
        
        setMessages(loadedMessages);
        setDbSessionId(sessionId);
        setShowHistory(false);
        
        // 세션 타입 업데이트
        if (sessionData.type) {
          // 통합 모드로 변경됨
        }
      }
    } catch (error) {
      console.error('세션 로드 오류:', error);
      addToast('대화를 불러올 수 없습니다.', 'error');
    }
  };
  
  // 세션 전환
  const switchSession = (sessionId: string) => {
    const targetSession = chatService.getSession(sessionId);
    if (targetSession) {
      setSession(targetSession);
      setMessages(targetSession.messages);
      setShowSidebar(false);
    }
  };
  
  // 현재 대화 삭제
  const clearCurrentChat = () => {
    if (!session) return;
    
    if (confirm('현재 대화를 삭제하시겠습니까?')) {
      chatService.deleteSession(session.id);
      initializeChat();
      addToast('대화가 삭제되었습니다.', 'success');
    }
  };
  
  // 이모지 반응 처리
  const handleReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
    // LocalStorage에도 저장 (선택사항)
    addToast(`${emoji} 반응을 추가했습니다`, 'success');
  };
  
  // 메시지별 반응 가져오기
  const getMessageReactions = () => {
    const reactionsMap = new Map<string, any[]>();
    messages.forEach(msg => {
      const reactions = getReactions(msg.id);
      if (reactions.length > 0) {
        reactionsMap.set(msg.id, reactions);
      }
    });
    return reactionsMap;
  };
  
  // 메시지 재생성
  const regenerateMessage = async (messageId: string) => {
    if (!session || isLoading) return;
    
    // 마지막 사용자 메시지 찾기
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;
    
    // AI 응답 제거
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex >= 0) {
      const newMessages = messages.slice(0, messageIndex);
      setMessages(newMessages);
      
      // 세션 업데이트
      const updatedSession = chatService.getSession(session.id);
      if (updatedSession) {
        updatedSession.messages = newMessages;
        chatService.saveSession(updatedSession);
      }
      
      // 다시 생성
      await sendMessage(lastUserMessage.content);
    }
  };
  
  // 대화 내보내기 (Supabase 데이터 포함)
  const exportChat = async () => {
    if (!session) return;
    
    try {
      // Supabase에서 세션 데이터 가져오기
      let exportData = chatService.exportSession(session.id);
      
      if (dbSessionId) {
        // Supabase 세션 정보 추가
        const sessionData = await chatSessionsService.getSessionById(dbSessionId);
        if (sessionData) {
          exportData = `# 채팅 세션 정보\n\n` +
            `- 세션 ID: ${sessionData.id}\n` +
            `- 생성일: ${new Date(sessionData.created_at).toLocaleString('ko-KR')}\n` +
            `- 타입: ${sessionData.type || 'general'}\n` +
            `- 메시지 수: ${messages.length}\n\n` +
            `---\n\n` +
            exportData;
        }
      }
      
      const blob = new Blob([exportData], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_${session.id}_${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addToast('대화 기록이 다운로드되었습니다.', 'success');
    } catch (error) {
      console.error('Export error:', error);
      addToast('내보내기 중 오류가 발생했습니다.', 'error');
    }
  };
  
  // 최대화 모드일 때 모달로 표시
  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* 최대화 헤더 */}
        <div className="bg-white border-b border-border-light px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* AI 업무비서 텍스트 - 작게 */}
              <Typography variant="body2" className="text-sm font-medium text-txt-secondary">AI 업무비서</Typography>
              
              {/* 채팅 모드 선택 */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setChatType('general');
                    if (messages.length === 0 || confirm('모드를 변경하면 현재 대화가 초기화됩니다. 계속하시겠습니까?')) {
                      startNewChat();
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    chatType === 'general'
                      ? 'bg-weave-primary text-white'
                      : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                  }`}
                  title="일반적인 업무 질문과 대화"
                >
                  💬 일반
                </button>
                <button
                  onClick={() => {
                    setChatType('rag');
                    if (chatType !== 'rag' && (messages.length === 0 || confirm('모드를 변경하면 현재 대화가 초기화됩니다. 계속하시겠습니까?'))) {
                      startNewChat();
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all relative ${
                    chatType === 'rag'
                      ? 'bg-weave-primary text-white'
                      : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                  }`}
                  title="업로드된 문서를 기반으로 한 지능형 검색"
                >
                  📚 RAG
                  {hasUploadedDocs && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setChatType('tax');
                    if (messages.length === 0 || confirm('모드를 변경하면 현재 대화가 초기화됩니다. 계속하시겠습니까?')) {
                      startNewChat();
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    chatType === 'tax'
                      ? 'bg-weave-primary text-white'
                      : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                  }`}
                  title="한국 세무 전문 상담"
                >
                  📊 세무
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {chatType === 'rag' && (
                <Button
                  variant="ghost"
                  onClick={() => setShowDocumentPanel(true)}
                  className="p-1.5"
                  title="문서 관리"
                >
                  <FileSearch className="w-4 h-4" />
                  {hasUploadedDocs && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={() => setShowHistory(!showHistory)}
                className="p-1.5"
                title="대화 히스토리"
              >
                <History className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                onClick={startNewChat}
                className="p-1.5"
                title="새 대화"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              {/* 최소화와 닫기 버튼 */}
              <Button
                variant="ghost"
                onClick={() => setIsMaximized(false)}
                className="p-1.5"
                title="최소화"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="p-1.5"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* 메시지 목록 */}
        {messages.length === 0 && !isTyping ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ChatWelcome 
              chatType={chatType}
              onExampleClick={(text) => {
                setInputMessage(text);
                setTimeout(() => {
                  const textarea = document.querySelector('textarea');
                  if (textarea) {
                    (textarea as HTMLTextAreaElement).focus();
                  }
                }, 100);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <MessageList
              messages={[
                ...messages,
                ...(currentResponse ? [{
                  id: 'temp',
                  role: 'assistant' as const,
                  content: currentResponse,
                  timestamp: new Date()
                }] : [])
              ]}
              isTyping={isTyping && !currentResponse}
              onExampleClick={(text) => setInputMessage(text)}
              onRegenerate={regenerateMessage}
              messageReactions={getMessageReactions()}
              onReaction={handleReaction}
            />
          </div>
        )}
        
        {/* 메시지 입력 */}
        <MessageInput
          onSendMessage={(msg) => {
            sendMessage(msg);
            setInputMessage('');
          }}
          onStopGeneration={stopGeneration}
          isLoading={isLoading}
          disabled={!session}
          value={inputMessage}
          onChange={setInputMessage}
          placeholder={
            chatType === 'rag' 
              ? "문서 기반 질문을 입력하세요..." 
              : chatType === 'tax'
              ? "세무 관련 질문을 입력하세요..."
              : "메시지를 입력하세요..."
          }
        />
        
        {/* 문서 업로드 패널 */}
        <DocumentUploadPanel
          isOpen={showDocumentPanel}
          onClose={() => setShowDocumentPanel(false)}
          onUploadSuccess={() => {
            setHasUploadedDocs(true);
            addToast('문서가 성공적으로 업로드되었습니다', 'success');
          }}
        />
        
        {/* Toast 알림 */}
        <ToastContainer toasts={toasts} onClose={hideToast} />
      </div>
    );
  }

  return (
    <div className="flex h-full relative">
      {/* 히스토리 패널 */}
      {showHistory && (
        <div className="w-80 border-r border-border-light bg-bg-secondary flex-shrink-0">
          <ChatHistory
            onSessionSelect={loadSession}
            currentSessionId={dbSessionId || undefined}
            onNewChat={startNewChat}
          />
        </div>
      )}
      
      {/* 사이드바 - 삭제 또는 숨김 처리 */}
      {false && (
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-bg-secondary to-white border-r border-border-light
        transform transition-transform duration-200 ease-in-out shadow-xl lg:shadow-none
        ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-border-light bg-white/50 backdrop-blur">
          <Typography variant="h4" className="text-txt-primary font-semibold mb-3">
            AI 챗봇
          </Typography>
          <Button
            variant="primary"
            onClick={startNewChat}
            className="w-full shadow-sm"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 대화 시작
            </span>
          </Button>
        </div>
        
        <div className="overflow-y-auto p-4">
          {/* 검색 바 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
              <input
                type="text"
                placeholder="대화 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border-light rounded-lg
                         bg-white focus:outline-none focus:ring-2 focus:ring-weave-primary/50
                         placeholder-txt-tertiary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1
                           hover:bg-bg-secondary rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-txt-tertiary" />
                </button>
              )}
            </div>
          </div>
          
          <Typography variant="body2" className="text-txt-secondary font-semibold mb-3">
            대화 목록 {searchQuery && `(${filteredSessions.length}개 찾음)`}
          </Typography>
          
          <div className="space-y-2">
            {filteredSessions.map(s => {
              const isActive = s.id === session?.id;
              const firstMessage = s.messages.find(m => m.role === 'user')?.content || '새 대화';
              const messageCount = s.messages.length;
              
              return (
                <div
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-all duration-200 border
                    ${isActive 
                      ? 'bg-gradient-to-r from-weave-primary to-weave-primary-light text-white border-weave-primary shadow-md transform scale-[1.02]' 
                      : 'bg-white hover:bg-bg-secondary border-border-light hover:border-weave-primary/30 hover:shadow-sm'
                    }
                  `}
                >
                  <Typography variant="body2" className={`font-medium truncate mb-1 ${
                    isActive ? 'text-white' : 'text-txt-primary'
                  }`}>
                    {firstMessage.slice(0, 40)}...
                  </Typography>
                  <div className="flex items-center justify-between mt-2">
                    <Typography variant="body2" className={`text-xs ${
                      isActive ? 'text-white/90' : 'text-txt-tertiary'
                    }`}>
                      {new Date(s.updatedAt).toLocaleDateString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                    <Typography variant="body2" className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-bg-secondary text-txt-secondary'
                    }`}>
                      {messageCount}개
                    </Typography>
                  </div>
                </div>
              );
            })}
            
            {filteredSessions.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-txt-tertiary mx-auto mb-3" />
                <Typography variant="body2" className="text-txt-tertiary">
                  &ldquo;{searchQuery}&rdquo;에 대한 검색 결과가 없습니다
                </Typography>
              </div>
            )}
            
            {sessions.length === 0 && !searchQuery && (
              <div className="text-center py-8">
                <Typography variant="body2" className="text-txt-tertiary">
                  아직 대화가 없습니다
                </Typography>
                <Typography variant="body2" className="text-txt-tertiary text-sm mt-1">
                  위의 버튼을 눌러 시작하세요
                </Typography>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
      
      {/* 모바일 사이드바 오버레이 - 사이드바와 함께 숨김 */}
      {false && showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        {/* 헤더 */}
        <div className="bg-white border-b border-border-light px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              
              {/* 채팅 모드 선택 */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setChatType('general');
                    if (messages.length === 0 || confirm('모드를 변경하면 현재 대화가 초기화됩니다. 계속하시겠습니까?')) {
                      startNewChat();
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    chatType === 'general'
                      ? 'bg-weave-primary text-white'
                      : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                  }`}
                  title="일반적인 업무 질문과 대화"
                >
                  💬 일반
                </button>
                <button
                  onClick={() => {
                    setChatType('rag');
                    if (chatType !== 'rag' && (messages.length === 0 || confirm('모드를 변경하면 현재 대화가 초기화됩니다. 계속하시겠습니까?'))) {
                      startNewChat();
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all relative ${
                    chatType === 'rag'
                      ? 'bg-weave-primary text-white'
                      : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                  }`}
                  title="업로드된 문서를 기반으로 한 지능형 검색"
                >
                  📚 RAG
                  {hasUploadedDocs && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setChatType('tax');
                    if (messages.length === 0 || confirm('모드를 변경하면 현재 대화가 초기화됩니다. 계속하시겠습니까?')) {
                      startNewChat();
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    chatType === 'tax'
                      ? 'bg-weave-primary text-white'
                      : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                  }`}
                  title="한국 세무 전문 상담"
                >
                  📊 세무
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* RAG 모드일 때만 문서 관리 버튼 표시 */}
              {chatType === 'rag' && (
                <Button
                  variant="ghost"
                  onClick={() => setShowDocumentPanel(true)}
                  className="p-1.5"
                  title="문서 관리"
                >
                  <FileSearch className="w-4 h-4" />
                  {hasUploadedDocs && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </Button>
              )}
              
              {/* 히스토리 버튼 */}
              <Button
                variant="ghost"
                onClick={() => setShowHistory(!showHistory)}
                className="p-1.5"
                title="대화 히스토리"
              >
                <History className="w-4 h-4" />
              </Button>
              
              {/* 새 대화 버튼 */}
              <Button
                variant="ghost"
                onClick={startNewChat}
                className="p-1.5"
                title="새 대화"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              {/* 최대화 버튼 */}
              <Button
                variant="ghost"
                onClick={() => setIsMaximized(true)}
                className="p-1.5"
                title="최대화"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* 메시지 목록 또는 환영 화면 */}
        {messages.length === 0 && !isTyping ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ChatWelcome 
              chatType={chatType}
              onExampleClick={(text) => {
                setInputMessage(text);
                // 입력 필드에 포커스
                setTimeout(() => {
                  const textarea = document.querySelector('textarea');
                  if (textarea) {
                    (textarea as HTMLTextAreaElement).focus();
                  }
                }, 100);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <MessageList
              messages={[
                ...messages,
                ...(currentResponse ? [{
                  id: 'temp',
                  role: 'assistant' as const,
                  content: currentResponse,
                  timestamp: new Date()
                }] : [])
              ]}
              isTyping={isTyping && !currentResponse}
              onExampleClick={(text) => setInputMessage(text)}
              onRegenerate={regenerateMessage}
              messageReactions={getMessageReactions()}
              onReaction={handleReaction}
            />
          </div>
        )}
        
        {/* 메시지 입력 */}
        <MessageInput
          onSendMessage={(msg) => {
            sendMessage(msg);
            setInputMessage('');
          }}
          onStopGeneration={stopGeneration}
          isLoading={isLoading}
          disabled={!session}
          value={inputMessage}
          onChange={setInputMessage}
          placeholder={
            chatType === 'rag' 
              ? "문서 기반 질문을 입력하세요..." 
              : chatType === 'tax'
              ? "세무 관련 질문을 입력하세요..."
              : "메시지를 입력하세요..."
          }
        />
      </div>
      
      {/* 키보드 단축키 팝업 - 숨김 */}
      {false && showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
             onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h3" className="text-lg font-semibold">
                키보드 단축키
              </Typography>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1 hover:bg-bg-secondary rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <Typography variant="body2" className="text-txt-secondary">새 대화</Typography>
                <Typography variant="body2" className="font-mono text-xs bg-bg-secondary px-2 py-1 rounded">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + K
                </Typography>
              </div>
              
              <div className="flex justify-between">
                <Typography variant="body2" className="text-txt-secondary">사이드바 토글</Typography>
                <Typography variant="body2" className="font-mono text-xs bg-bg-secondary px-2 py-1 rounded">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + /
                </Typography>
              </div>
              
              <div className="flex justify-between">
                <Typography variant="body2" className="text-txt-secondary">히스토리 토글</Typography>
                <Typography variant="body2" className="font-mono text-xs bg-bg-secondary px-2 py-1 rounded">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + H
                </Typography>
              </div>
              
              <div className="flex justify-between">
                <Typography variant="body2" className="text-txt-secondary">대화 내보내기</Typography>
                <Typography variant="body2" className="font-mono text-xs bg-bg-secondary px-2 py-1 rounded">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + S
                </Typography>
              </div>
              
              <div className="flex justify-between">
                <Typography variant="body2" className="text-txt-secondary">응답 중단</Typography>
                <Typography variant="body2" className="font-mono text-xs bg-bg-secondary px-2 py-1 rounded">
                  ESC
                </Typography>
              </div>
              
              <div className="flex justify-between">
                <Typography variant="body2" className="text-txt-secondary">메시지 전송</Typography>
                <Typography variant="body2" className="font-mono text-xs bg-bg-secondary px-2 py-1 rounded">
                  Enter
                </Typography>
              </div>
              
              <div className="flex justify-between">
                <Typography variant="body2" className="text-txt-secondary">줄바꿈</Typography>
                <Typography variant="body2" className="font-mono text-xs bg-bg-secondary px-2 py-1 rounded">
                  Shift + Enter
                </Typography>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 문서 업로드 패널 */}
      <DocumentUploadPanel
        isOpen={showDocumentPanel}
        onClose={() => setShowDocumentPanel(false)}
        onUploadSuccess={() => {
          setHasUploadedDocs(true);
          addToast('문서가 성공적으로 업로드되었습니다', 'success');
        }}
      />
      
      {/* Toast 알림 */}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </div>
  );
}