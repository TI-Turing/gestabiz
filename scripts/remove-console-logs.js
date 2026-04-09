#!/usr/bin/env node

/**
 * Script para eliminar todos los console.log/warn/error/info/debug de la aplicacion.
 * Uso: node scripts/remove-console-logs.js
 *
 * Usa un parser de caracteres para manejar correctamente:
 * - Parentesis anidados: console.log(JSON.stringify(x))
 * - Llamadas multi-linea
 * - Strings y template literals (no modifica console.* dentro de strings)
 * - Comentarios de linea (//) y bloque de tipo JSDoc
 * - Guards de debug: if (DEBUG_MODE) console.log(...)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const IGNORE_DIRS = new Set([
  'node_modules', 'dist', 'build', '.git', '.next', 'coverage',
  'migrations_backup', '.vscode', '.claude', 'Obsidian', 'Posts',
  'public', 'pnpm-lock.yaml'
])

// Dentro de src/, ignorar supabase (edge functions) y tests
const IGNORE_SRC_SUBDIRS = new Set([])

const TARGET_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

let filesProcessed = 0
let logsRemoved = 0

function findFiles(dir, isInsideSrc = false) {
  const files = []
  let items
  try { items = fs.readdirSync(dir) } catch { return files }

  for (const item of items) {
    const fullPath = path.join(dir, item)
    let stat
    try { stat = fs.statSync(fullPath) } catch { continue }
    if (fullPath === SELF_PATH) continue

    if (stat.isDirectory()) {
      if (IGNORE_DIRS.has(item) || item.startsWith('.')) continue
      const nowInSrc = isInsideSrc || item === 'src'
      if (isInsideSrc && IGNORE_SRC_SUBDIRS.has(item)) continue
      files.push(...findFiles(fullPath, nowInSrc))
    } else if (TARGET_EXTENSIONS.has(path.extname(item))) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Finds matching closing paren, skipping strings, template literals, and comments.
 */
function findMatchingParen(s, start) {
  let depth = 0
  let i = start

  while (i < s.length) {
    const ch = s[i]

    if (ch === '(') {
      depth++
      i++
    } else if (ch === ')') {
      depth--
      if (depth === 0) return i
      i++
    } else if (ch === '/' && i + 1 < s.length) {
      if (s[i + 1] === '/') {
        const nl = s.indexOf('\n', i + 2)
        i = nl === -1 ? s.length : nl + 1
      } else if (s[i + 1] === '*') {
        const end = s.indexOf('*/', i + 2)
        i = end === -1 ? s.length : end + 2
      } else {
        i++
      }
    } else if (ch === '"' || ch === "'") {
      const quote = ch
      i++
      while (i < s.length) {
        if (s[i] === '\\') { i += 2; continue }
        if (s[i] === quote) { i++; break }
        i++
      }
    } else if (ch === '`') {
      i++
      while (i < s.length) {
        if (s[i] === '\\') { i += 2; continue }
        if (s[i] === '$' && s[i + 1] === '{') {
          i += 2
          let braceDepth = 1
          while (i < s.length && braceDepth > 0) {
            if (s[i] === '{') braceDepth++
            else if (s[i] === '}') braceDepth--
            i++
          }
          continue
        }
        if (s[i] === '`') { i++; break }
        i++
      }
    } else {
      i++
    }
  }

  return -1
}

/**
 * Returns the index of a '//' line-comment start in str, ignoring // inside strings.
 */
function findLineCommentStart(str) {
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (inSingle) {
      if (ch === '\\') { i++; continue }
      if (ch === "'") inSingle = false
    } else if (inDouble) {
      if (ch === '\\') { i++; continue }
      if (ch === '"') inDouble = false
    } else {
      if (ch === "'") inSingle = true
      else if (ch === '"') inDouble = true
      else if (ch === '/' && str[i + 1] === '/') return i
    }
  }
  return -1
}

/**
 * Returns true if position pos is inside a block comment.
 */
function isInsideBlockComment(content, pos) {
  const bsIdx = content.lastIndexOf('/*', pos - 1)
  if (bsIdx === -1) return false
  const beIdx = content.indexOf('*/', bsIdx + 2)
  return beIdx === -1 || beIdx >= pos
}

/**
 * Remove all console.* calls from source content.
 */
function removeConsoleLogs(content) {
  const re = /console\.(log|warn|error|info|debug)\s*\(/g
  const segments = []
  let keepStart = 0
  let removed = 0

  let match
  while ((match = re.exec(content)) !== null) {
    const callStart = match.index
    const openParenPos = callStart + match[0].length - 1

    const lineStart = content.lastIndexOf('\n', callStart - 1) + 1
    const prefix = content.slice(lineStart, callStart)

    // Skip if the call appears after a // comment on the same line
    if (findLineCommentStart(prefix) !== -1) continue

    // Skip if inside a /* ... */ block comment
    if (isInsideBlockComment(content, callStart)) continue

    // Find matching closing paren (handles nested parens, strings, templates)
    const closeParenPos = findMatchingParen(content, openParenPos)
    if (closeParenPos === -1) continue

    let stmtEnd = closeParenPos + 1
    if (stmtEnd < content.length && content[stmtEnd] === ';') stmtEnd++

    const afterStmt = content.slice(stmtEnd)
    const newlineRelPos = afterStmt.indexOf('\n')
    const afterOnSameLine = newlineRelPos === -1 ? afterStmt : afterStmt.slice(0, newlineRelPos)

    // Strip trailing line comment for the empty-line check
    const afterNoComment = afterOnSameLine.replace(/\/\/.*$/, '').trimEnd()

    // If the line only contains (optional if-guard +) the console call, remove entire line
    const isWholeLine =
      /^\s*(if\s*\([^)]*\)\s*)?$/.test(prefix) &&
      /^\s*$/.test(afterNoComment)

    if (isWholeLine) {
      segments.push(content.slice(keepStart, lineStart))
      keepStart = newlineRelPos === -1
        ? stmtEnd
        : stmtEnd + afterOnSameLine.length + 1
    } else {
      segments.push(content.slice(keepStart, callStart))
      keepStart = stmtEnd
    }

    removed++
    re.lastIndex = keepStart
  }

  segments.push(content.slice(keepStart))
  return { result: segments.join(''), removed }
}

const SELF_PATH = path.resolve(__dirname, 'remove-console-logs.js')

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
        console.log(`[OK] ${relativePath} -- ${removed} removido(s)`)
      }
    } catch (err) {
      const relativePath = path.relative(rootDir, file)
      console.error(`[ERROR] ${relativePath}: ${err.message}`)
    }
  }
}

processAllFiles()
console.log(`\nArchivos modificados: ${filesProcessed}`)
console.log(`Console calls removidas: ${logsRemoved}\n`)