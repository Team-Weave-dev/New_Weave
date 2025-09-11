import { getSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type TaxRecord = Database['public']['Tables']['tax_transactions']['Row']
type TaxRecordInsert = Database['public']['Tables']['tax_transactions']['Insert']
type TaxRecordUpdate = Database['public']['Tables']['tax_transactions']['Update']

export class TaxService {
  private supabase = getSupabaseClient()

  // 세무 기록 생성
  async createTaxRecord(record: Omit<TaxRecordInsert, 'id' | 'created_at' | 'updated_at'>) {
    const insertData: any = record;
    const { data, error } = await this.supabase
      .from('tax_transactions')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 세무 기록 목록 조회
  async getTaxRecords(userId: string, year?: number, quarter?: number) {
    let query = this.supabase
      .from('tax_transactions')
      .select(`
        *,
        clients (
          id,
          name,
          company,
          business_number
        )
      `)
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('quarter', { ascending: false, nullsFirst: false })

    if (year) {
      query = query.eq('year', year)
    }

    if (quarter) {
      query = query.eq('quarter', quarter)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  // 특정 세무 기록 조회
  async getTaxRecordById(id: string) {
    const { data, error } = await this.supabase
      .from('tax_transactions')
      .select(`
        *,
        clients (
          id,
          name,
          company,
          business_number,
          tax_type
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // 세무 기록 업데이트
  async updateTaxRecord(id: string, updates: TaxRecordUpdate) {
    const { data, error } = await (this.supabase
      .from('tax_transactions') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 세무 기록 삭제
  async deleteTaxRecord(id: string) {
    const { error } = await this.supabase
      .from('tax_transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  // 사업자번호별 세무 기록 조회
  async getTaxRecordsByBusinessNumber(businessNumber: string, userId: string) {
    const { data, error } = await this.supabase
      .from('tax_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('business_number', businessNumber)
      .order('year', { ascending: false })
      .order('quarter', { ascending: false, nullsFirst: false })

    if (error) throw error
    return data
  }

  // 클라이언트별 세무 기록 조회
  async getTaxRecordsByClient(clientId: string) {
    const { data, error } = await this.supabase
      .from('tax_transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('year', { ascending: false })
      .order('quarter', { ascending: false, nullsFirst: false })

    if (error) throw error
    return data
  }

  // 마감일 임박 세무 신고 조회
  async getUpcomingTaxDeadlines(userId: string, days: number = 30) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const { data, error } = await this.supabase
      .from('tax_transactions')
      .select(`
        *,
        clients (
          name,
          company,
          business_number
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('due_date', futureDate.toISOString())
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })

    if (error) throw error
    return data
  }

  // 연도별 세무 통계
  async getTaxStatsByYear(userId: string, year: number) {
    const { data, error } = await this.supabase
      .from('tax_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)

    if (error) throw error

    const stats = {
      year,
      total: data?.length || 0,
      totalAmount: 0,
      byQuarter: {
        1: { count: 0, amount: 0 },
        2: { count: 0, amount: 0 },
        3: { count: 0, amount: 0 },
        4: { count: 0, amount: 0 }
      },
      byStatus: {} as Record<string, number>,
      byTaxType: {} as Record<string, { count: number; amount: number }>
    }

    data?.forEach((record: any) => {
      // 총액
      stats.totalAmount += record.amount || 0

      // 분기별
      if (record.quarter) {
        stats.byQuarter[record.quarter as 1 | 2 | 3 | 4].count++
        stats.byQuarter[record.quarter as 1 | 2 | 3 | 4].amount += record.amount || 0
      }

      // 상태별
      stats.byStatus[record.status] = (stats.byStatus[record.status] || 0) + 1

      // 세금 유형별
      if (!stats.byTaxType[record.tax_type]) {
        stats.byTaxType[record.tax_type] = { count: 0, amount: 0 }
      }
      stats.byTaxType[record.tax_type].count++
      stats.byTaxType[record.tax_type].amount += record.amount || 0
    })

    return stats
  }

  // 세무 달력 데이터 조회
  async getTaxCalendar(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const { data, error } = await this.supabase
      .from('tax_transactions')
      .select(`
        *,
        clients (
          name,
          company
        )
      `)
      .eq('user_id', userId)
      .gte('due_date', startDate.toISOString())
      .lte('due_date', endDate.toISOString())
      .order('due_date', { ascending: true })

    if (error) throw error
    return data
  }

  // 세무 신고 상태 업데이트
  async updateTaxStatus(id: string, status: string, filedDate?: string) {
    const updates: TaxRecordUpdate = {
      status,
      filed_date: filedDate
    }

    const { data, error } = await (this.supabase
      .from('tax_transactions') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 실시간 구독 설정
  subscribeToChanges(userId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('tax_transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tax_transactions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

// 싱글톤 인스턴스
export const taxService = new TaxService()