#!/usr/bin/env node
/**
 * Guard de pre-commit: bloquea el commit si hay archivos .env* en staging,
 * excepto los templates legítimos (.env.example, *.template).
 *
 * Invocado por lint-staged vía .lintstagedrc.json. Recibe los paths staged
 * como argumentos.
 *
 * Ref: auditoria-completa-abril-2026.md §3.1
 */

const path = require('path')

const ALLOWED = [/\.env\.example$/i, /\.template$/i]
const BLOCKED = /(^|\/)\.env(\.|$)/

const args = process.argv.slice(2)
const bad = args.filter(p => {
  const normalized = p.replace(/\\/g, '/')
  if (!BLOCKED.test(normalized)) return false
  return !ALLOWED.some(rx => rx.test(normalized))
})

if (bad.length > 0) {
  console.error('\n❌ Pre-commit bloqueado: no se pueden commitear archivos .env*')
  console.error('   (solo .env.example y *.template están permitidos)\n')
  for (const p of bad) console.error('  - ' + p)
  console.error('\nSi necesitas un template, renómbralo a `.env.example` o `*.template`.\n')
  process.exit(1)
}
process.exit(0)
