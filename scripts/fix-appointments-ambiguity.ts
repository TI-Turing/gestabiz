/**
 * Script para aplicar fix de ambigüedad en appointments
 * Ejecuta la migración que crea la vista materializada
 * 
 * Uso: npm run fix-appointments-ambiguity
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {  try {
    // Leer el archivo de migración
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20251019000000_fix_appointments_ambiguity.sql'
    );    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Ejecutar la migración    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // Si no existe la función exec_sql, ejecutar directamente      // Dividir en statements individuales
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s.length > 10);

      for (const statement of statements) {
        if (statement.includes('COMMENT ON')) continue; // Skip comments
        
        const { error: stmtError } = await supabase.rpc('execute_sql', { 
          query: statement 
        });

        if (stmtError) {          console.log('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    // Verificar que la vista existe    const { data, error: viewError } = await supabase
      .from('appointments_with_relations')
      .select('id')
      .limit(1);

    if (viewError) {
      throw new Error(`No se pudo acceder a la vista: ${viewError.message}`);
    }    // Contar registros
    const { count, error: countError } = await supabase
      .from('appointments_with_relations')
      .select('*', { count: 'exact', head: true });

    if (!countError) {    }  } catch (error) {    process.exit(1);
  }
}

applyFix();
