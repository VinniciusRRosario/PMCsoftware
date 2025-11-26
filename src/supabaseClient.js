import { createClient } from '@supabase/supabase-js'

// No Vite, usamos import.meta.env e as variáveis devem começar com VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials missing! Verifique se o arquivo .env contém VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
