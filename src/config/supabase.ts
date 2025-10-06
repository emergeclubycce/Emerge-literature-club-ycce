import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_2
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtaGJmc2NneWxuaXBqbHhkZnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzczNzcsImV4cCI6MjA3NDkxMzM3N30.aVf-t6T4Btvq7hp2N64pJXTh34jvbzKVs3lnA5Zvejs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
