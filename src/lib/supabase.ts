import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Build-safe environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key'

// Warn if using placeholder values (but allow build to succeed)
if (typeof window !== 'undefined' && supabaseUrl.includes('placeholder')) {
  console.warn('⚠️ Using placeholder Supabase URL. Please set up environment variables for full functionality.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)