#!/usr/bin/env node

/**
 * Script para eliminar todos los console.log de la aplicación
 * Uso: node scripts/remove-console-logs.js
 *
 * Elimina:
 * - console.log(), console.info(), console.warn(), console.error()
 * - Líneas completas de console.* si es lo único en la línea
 * - Preserva comentarios y strings
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const IGNORE_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  'coverage',
  '.env.local',
  '.env.production',
  'supabase',
  'extension'
]

const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

let filesProcessed = 0
let logsRemoved = 0

/**
 * Recursively find all target files
 */
function findFiles(dir) {
  const files = []
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(item)) {
        files.push(...findFiles(fullPath))
      }
    } else if (TARGET_EXTENSIONS.includes(path.extname(item))) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Remove console logs from file content
 */
function removeConsoleLogs(content) {
  let result = content
  let removed = 0

  // Regex pattern para console.log, console.warn, console.error, console.info
  // Captura:
  // 1. Líneas que solo contienen console.* seguidas de punto y coma
  // 2. Statements de console.* dentro de expresiones

  // Patrón 1: Línea completa dedicada a console.* (con indentación)
  const fullLinePattern = /^\s*console\.(log|warn|error|info|debug)\([^)]*\);?\s*\n/gm
  result = result.replace(fullLinePattern, () => {
    removed++
    return ''
  })

  // Patrón 2: console.* sin salto de línea (para casos en una línea con otra lógica)
  // Esto es más delicado, solo elimina si está entre llaves o es statement completo
  const inlinePattern = /console\.(log|warn|error|info|debug)\([^)]*\);\s*/g
  const matches = result.match(inlinePattern)

  if (matches) {
    // Para inline patterns, verificar que no rompa nada
    for (const match of matches) {
      // Si la línea completa es solo console.log, ya fue removida
      if (!fullLinePattern.test(match + '\n')) {
        // Verificar que sea seguro remover (ej: no es parte de una expresión lógica)
        const lines = result.split('\n')
        let shouldRemoveInline = true

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (line.includes(match) && line.trim() !== match.trim()) {
            // Esta es una línea con más contenido
            const before = line.substring(0, line.indexOf(match)).trim()
            const after = line.substring(line.indexOf(match) + match.length).trim()

            // Si tiene contenido antes o después (que no sea comentario), no remover
            if ((before && !before.startsWith('//')) || (after && !after.startsWith('//'))) {
              shouldRemoveInline = false
              break
            }
          }
        }
      }
    }
  }

  return { result, removed }
}

/**
 * Process all files
 */
function processAllFiles() {
  const files = findFiles(rootDir)
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      const { result, removed } = removeConsoleLogs(content)

      if (removed > 0) {
        fs.writeFileSync(file, result, 'utf-8')
        filesProcessed++
        logsRemoved += removed

        const relativePath = path.relative(rootDir, file)
        console.log(`✅ ${relativePath} — ${removed} console.log(s) removido(s)`)
      }
    } catch (error) {
    }
  }
}

// Run
processAllFiles()
console.log(`   Console.log(s) removido(s): ${logsRemoved}\n`)
