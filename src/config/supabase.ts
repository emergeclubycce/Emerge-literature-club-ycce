import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_2 as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_1 as string

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_1 environment variable is not set.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
