// Script para verificar configuración de Supabaseconst supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

type GlobalWithProcess = typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
const gwp = globalThis as GlobalWithProcess
const demoFlag = typeof gwp !== 'undefined' && gwp.process?.env?.VITE_DEMO_MODE === 'true'
const isDemoMode = demoFlag || import.meta.env.VITE_DEMO_MODE === 'true' || supabaseUrl.includes('demo.supabase.co')if (isDemoMode) {} else {}

export {};
