import { getSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

// TODO: Add documents table to database types
type Document = any
type DocumentInsert = any
type DocumentUpdate = any

export class DocumentsService {
  private supabase = getSupabaseClient()

  // 문서 업로드
  async uploadDocument(
    file: File,
    userId: string,
    projectId?: string,
    metadata?: any
  ) {
    // 1. 파일을 Storage에 업로드
    const fileName = `${userId}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('documents')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // 2. 파일 URL 생성
    const { data: urlData } = this.supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    // 3. 문서 메타데이터 저장
    const insertData: any = {
      user_id: userId,
      project_id: projectId,
      name: file.name,
      type: file.type || 'application/octet-stream',
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      metadata
    };
    const { data, error } = await this.supabase
      .from('documents')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      // 실패 시 업로드된 파일 삭제
      await this.supabase.storage.from('documents').remove([fileName])
      throw error
    }

    return data
  }

  // 문서 목록 조회
  async getDocuments(userId: string, projectId?: string) {
    let query = this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  // 문서 ID로 조회
  async getDocumentById(id: string) {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // 문서 내용 업데이트 (텍스트 추출 후)
  async updateDocumentContent(id: string, content: string, embeddings?: number[]) {
    const updates: DocumentUpdate = {
      content
    }

    if (embeddings) {
      updates.embeddings = embeddings
    }

    const { data, error } = await (this.supabase
      .from('documents') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 문서 삭제
  async deleteDocument(id: string) {
    // 1. 문서 정보 조회
    const { data: doc, error: fetchError } = await this.supabase
      .from('documents')
      .select('file_url, user_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // 2. Storage에서 파일 삭제
    if ((doc as any)?.file_url) {
      const path = (doc as any).file_url.split('/').slice(-2).join('/')
      await this.supabase.storage.from('documents').remove([path])
    }

    // 3. 데이터베이스에서 삭제
    const { error } = await this.supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  // 벡터 검색 (RAG용)
  async searchDocuments(
    queryEmbedding: number[],
    matchThreshold: number = 0.7,
    matchCount: number = 10
  ) {
    const { data, error } = await (this.supabase as any)
      .rpc('search_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount
      })

    if (error) throw error
    return data
  }

  // 텍스트로 문서 검색
  async searchDocumentsByText(userId: string, query: string) {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data
  }

  // 프로젝트별 문서 통계
  async getDocumentStats(userId: string) {
    const { data, error } = await this.supabase
      .from('documents')
      .select('project_id, file_size, type')
      .eq('user_id', userId)

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      totalSize: 0,
      byType: {} as Record<string, number>,
      byProject: {} as Record<string, number>
    }

    data?.forEach((doc: any) => {
      // 총 크기
      stats.totalSize += doc.file_size || 0

      // 타입별 카운트
      const type = doc.type || 'unknown'
      stats.byType[type] = (stats.byType[type] || 0) + 1

      // 프로젝트별 카운트
      if (doc.project_id) {
        stats.byProject[doc.project_id] = (stats.byProject[doc.project_id] || 0) + 1
      }
    })

    return stats
  }

  // 문서에서 임베딩 생성 (OpenAI API 필요)
  async generateEmbeddings(text: string): Promise<number[]> {
    // TODO: OpenAI API 또는 다른 임베딩 서비스 호출
    // 현재는 더미 데이터 반환
    return new Array(1536).fill(0).map(() => Math.random())
  }

  // 문서 내용 추출 및 임베딩 생성
  async processDocument(documentId: string) {
    const doc = await this.getDocumentById(documentId)
    
    if (!(doc as any)?.content) {
      throw new Error('Document has no content to process')
    }

    // 임베딩 생성
    const embeddings = await this.generateEmbeddings((doc as any).content)

    // 임베딩 저장
    return await this.updateDocumentContent(documentId, (doc as any).content, embeddings)
  }

  // 실시간 구독 설정
  subscribeToChanges(userId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

// 싱글톤 인스턴스
export const documentsService = new DocumentsService()