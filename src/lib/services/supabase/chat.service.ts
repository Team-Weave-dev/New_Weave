import { getSupabaseClientSafe } from '@/lib/supabase/client'

// 타입 정의
export interface ChatSession {
  id: string
  user_id: string
  type: 'general' | 'tax' | 'rag' | 'unified'
  title?: string
  metadata?: any
  created_at: string
  updated_at?: string
}

export interface ChatMessage {
  id: string
  session_id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  metadata?: any
  created_at: string
}

export type ChatMessageInsert = Omit<ChatMessage, 'id' | 'created_at'>

export class ChatService {
  private supabase = getSupabaseClientSafe()

  // 채팅 세션 생성
  async createSession(userId: string, type: ChatSession['type'] = 'general', title?: string): Promise<ChatSession> {
    // TODO: chat_sessions 테이블이 생성되면 활성화
    return {
      id: Date.now().toString(),
      user_id: userId,
      type,
      title: title || 'New Chat',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as ChatSession
  }

  // 채팅 세션 목록 조회
  async getSessions(userId: string, type?: ChatSession['type']) {
    // TODO: chat_sessions 테이블이 생성되면 활성화
    return []
  }

  // 특정 세션 조회
  async getSessionById(sessionId: string): Promise<ChatSession & { chat_messages: ChatMessage[] }> {
    // TODO: chat_sessions 테이블이 생성되면 활성화
    return {
      id: sessionId,
      user_id: '',
      type: 'general',
      title: 'Chat Session',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      chat_messages: []
    } as ChatSession & { chat_messages: ChatMessage[] }
  }

  // 메시지 추가
  async addMessage(sessionId: string, message: Omit<ChatMessageInsert, 'id' | 'created_at' | 'session_id'>) {
    // TODO: chat_messages 테이블이 생성되면 활성화
    return {
      id: Date.now().toString(),
      session_id: sessionId,
      ...message,
      created_at: new Date().toISOString()
    } as ChatMessage
  }

  // 세션의 메시지 조회
  async getMessages(sessionId: string, limit: number = 100): Promise<ChatMessage[]> {
    // TODO: chat_messages 테이블이 생성되면 활성화
    return []
  }

  // 세션 제목 업데이트
  async updateSessionTitle(sessionId: string, title: string) {
    // TODO: chat_sessions 테이블이 생성되면 활성화
    return {
      id: sessionId,
      user_id: '',
      type: 'general' as const,
      title,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as ChatSession
  }

  // 세션 삭제
  async deleteSession(sessionId: string) {
    // TODO: chat_sessions 테이블이 생성되면 활성화
    return true
  }

  // 메시지 검색
  async searchMessages(userId: string, query: string, sessionId?: string) {
    // TODO: search_chat_messages RPC 함수가 생성되면 활성화
    return []
  }

  // 최근 세션 조회
  async getRecentSessions(userId: string, limit: number = 20) {
    // TODO: get_recent_chat_sessions RPC 함수가 생성되면 활성화
    return []
  }

  // 메시지 반응 추가
  async addReaction(messageId: string, userId: string, reaction: string) {
    // TODO: chat_message_reactions 테이블이 생성되면 활성화
    return {
      id: Date.now().toString(),
      message_id: messageId,
      user_id: userId,
      reaction,
      created_at: new Date().toISOString()
    }
  }

  // 메시지 반응 제거
  async removeReaction(messageId: string, userId: string, reaction: string) {
    // TODO: chat_message_reactions 테이블이 생성되면 활성화
    return true
  }

  // 세션 요약 저장
  async saveSessionSummary(sessionId: string, summary: string, keyTopics: string[]) {
    // TODO: chat_session_summaries 테이블이 생성되면 활성화
    return {
      id: Date.now().toString(),
      session_id: sessionId,
      summary,
      key_topics: keyTopics,
      created_at: new Date().toISOString()
    }
  }

  // 문서 컨텍스트 추가
  async addContextDocument(sessionId: string, documentId: string) {
    // TODO: chat_context_documents 테이블이 생성되면 활성화
    return {
      id: Date.now().toString(),
      session_id: sessionId,
      document_id: documentId,
      created_at: new Date().toISOString()
    }
  }

  // 실시간 메시지 구독
  subscribeToMessages(sessionId: string, callback: (payload: any) => void) {
    // TODO: chat_messages 테이블이 생성되면 활성화
    return this.supabase
      .channel(`chat_messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        callback
      )
      .subscribe()
  }

  // 타입별 세션 통계
  async getSessionStats(userId: string) {
    // TODO: chat_sessions 테이블이 생성되면 활성화
    return {
      total: 0,
      byType: {
        general: 0,
        tax: 0,
        rag: 0
      }
    }
  }
}

// 싱글톤 인스턴스
export const chatService = new ChatService()