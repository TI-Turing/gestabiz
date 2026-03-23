import fs from 'fs'

const file = 'supabase/migrations/20251026230533_initial_schema.sql'
let content = fs.readFileSync(file, 'utf8')

// pg_get_functiondef returns the function body ending with $tag$ (no semicolon)
// The dump script appended '\n$$;\n' after each, creating:
//   $function$
//
//   $$;
// We need to:
//   1. Remove standalone $$; lines that appear right after a closing dollar-quote
//   2. Add ; after the closing dollar-quote instead

// Count occurrences before
const countBefore = (content.match(/\$\$;\n/g) || []).length
console.log('Standalone $$; lines before:', countBefore)

// Pattern: closing dollar tag ($function$, $trigger$, $$, etc.) on its own line
// followed optionally by empty line, then $$;
// Replace with just the closing tag + ;
content = content.replace(/(\$[a-zA-Z_]*\$)\n\n\$\$;/g, '$1;')
content = content.replace(/(\$[a-zA-Z_]*\$)\n\$\$;/g, '$1;')

const countAfter = (content.match(/\$\$;\n/g) || []).length
console.log('Standalone $$; lines after:', countAfter)
console.log('Fixed:', countBefore - countAfter, 'occurrences')

fs.writeFileSync(file, content, 'utf8')
console.log('Done.')
