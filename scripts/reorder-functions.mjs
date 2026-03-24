import fs from 'fs'

const file = 'supabase/migrations/20251026230533_initial_schema.sql'
let content = fs.readFileSync(file, 'utf8')
const lines = content.split('\n')

// Find the start of the Functions section
const fnSectionLine = lines.findIndex(l => l.trim() === '-- Functions')
console.log('Functions section starts at line:', fnSectionLine + 1)

// Extract a function block by name: returns [startLine, endLine] (inclusive)
function findFunctionBlock(name) {
  const startLine = lines.findIndex(l =>
    l.startsWith(`CREATE OR REPLACE FUNCTION public.${name}(`)
  )
  if (startLine === -1) return null
  // Find the ending $...$;
  for (let i = startLine + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (/^\$[a-zA-Z_]*\$;$/.test(trimmed)) {
      return [startLine, i]
    }
  }
  return null
}

// Functions to move to the top (in dependency order)
const functionsToPromote = [
  'is_business_owner',    // no deps - needed by is_business_admin
  'is_business_member',   // no deps - needed by many
  'is_business_admin',    // depends on is_business_owner
  'is_business_favorite', // no deps - useful early
]

const promotedBlocks = []
const removedRanges = []

for (const fnName of functionsToPromote) {
  const range = findFunctionBlock(fnName)
  if (!range) {
    console.warn(`  WARNING: Function ${fnName} not found!`)
    continue
  }
  console.log(`  Moving ${fnName} (lines ${range[0]+1}-${range[1]+1})`)
  const block = lines.slice(range[0], range[1] + 1).join('\n')
  promotedBlocks.push(block)
  removedRanges.push(range)
}

// Remove promoted functions from original positions (process in reverse order)
const sortedRanges = [...removedRanges].sort((a, b) => b[0] - a[0])
for (const [start, end] of sortedRanges) {
  // Remove lines including possible blank line after
  const extra = lines[end + 1] === '' ? 1 : 0
  lines.splice(start, end - start + 1 + extra)
}

// Insert promoted functions right after -- Functions line
const newFnSectionLine = lines.findIndex(l => l.trim() === '-- Functions')
const insertBlock = promotedBlocks.join('\n\n') + '\n'
lines.splice(newFnSectionLine + 1, 0, insertBlock)

const newContent = lines.join('\n')
fs.writeFileSync(file, newContent, 'utf8')
console.log('Done. New line count:', newContent.split('\n').length)
