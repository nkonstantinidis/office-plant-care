import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const normalizeSupabaseUrl = (url) => {
  if (!url) return url
  return url
    .trim()
    .replace(/\/$/, '')
    .replace(/\/rest\/v1$/, '')
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Supabase config is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
