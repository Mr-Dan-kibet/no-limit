import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cookie-backed so the session is readable by middleware and server components.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
