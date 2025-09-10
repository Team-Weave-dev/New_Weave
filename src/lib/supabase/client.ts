import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseClient() {
  return supabase;
}

// createClient 함수를 export하여 다른 컴포넌트에서 사용 가능하도록 함
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
