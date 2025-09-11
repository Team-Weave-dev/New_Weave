import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 환경변수 안전성 강화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 초기화 (환경변수 없으면 null)
let supabase: ReturnType<typeof createSupabaseClient> | null = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    console.log('🔗 Supabase client initialized successfully');
  } else {
    console.log('⚠️ Supabase 환경변수 없음, Mock 모드로 동작');
  }
} catch (error) {
  console.error('❌ Supabase client 초기화 실패:', error);
  supabase = null;
}

export { supabase };

export function getSupabaseClient() {
  return supabase;
}

// createClient 함수를 export하여 다른 컴포넌트에서 사용 가능하도록 함
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase 환경변수가 설정되지 않음');
    return null;
  }
  try {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('❌ Supabase client 생성 실패:', error);
    return null;
  }
}

// Safe 버전 - null 체크 포함
export function getSupabaseClientSafe() {
  return supabase;
}
