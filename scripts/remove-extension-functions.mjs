import fs from 'fs'

const file = 'supabase/migrations/20251026230533_initial_schema.sql'
let content = fs.readFileSync(file, 'utf8')

// Split into function blocks
// Each function starts with CREATE OR REPLACE FUNCTION
// and ends with a dollar-quote closing + ;
const lines = content.split('\n')
const result = []
let i = 0
let removed = 0

while (i < lines.length) {
  const line = lines[i]

  // Detect start of a CREATE OR REPLACE FUNCTION
  if (/^CREATE OR REPLACE FUNCTION /.test(line)) {
    // Collect the full function block
    const blockLines = [line]
    let j = i + 1
    let found = false
    while (j < lines.length) {
      blockLines.push(lines[j])
      // End of function: line that is just $...tag...$;
      if (/^\$[a-zA-Z_]*\$;$/.test(lines[j].trim())) {
        found = true
        j++
        break
      }
      j++
    }

    const block = blockLines.join('\n')

    // Skip if LANGUAGE c or LANGUAGE internal (extension functions)
    if (/ LANGUAGE c\b/.test(block) || / LANGUAGE internal\b/.test(block)) {
      removed++
      // also skip blank line after
      if (j < lines.length && lines[j] === '') j++
      i = j
      continue
    }

    result.push(block)
    // Skip blank line after function
    if (j < lines.length && lines[j] === '') {
      result.push('')
      j++
    }
    i = j
    continue
  }

  result.push(line)
  i++
}

const newContent = result.join('\n')
fs.writeFileSync(file, newContent, 'utf8')
console.log(`Removed ${removed} C/internal extension functions`)
console.log(`New line count: ${newContent.split('\n').length}`)
