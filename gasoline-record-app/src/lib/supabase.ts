import { createClient } from '@supabase/supabase-js'

// 環境変数から Supabase の設定を取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase クライアントの初期化
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
