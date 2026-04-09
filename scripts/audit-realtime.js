#!/usr/bin/env node

/**
 * Script de Diagnóstico Completo para Supabase Realtime
 * 
 * Este script busca TODOS los patrones problemáticos en el código
 * que pueden causar loops infinitos o memory leaks.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');const issues = [];

// 1. Buscar todos los .subscribe()
try {
  const result = execSync('git grep -n "\\.subscribe()" -- "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' });
  const lines = result.trim().split('\n');
  console.log(`   ✅ Encontrados ${lines.length} usos de .subscribe()`);
  lines.forEach(line => {
    const [file, lineNum] = line.split(':');
    issues.push({ type: 'subscribe', file, line: lineNum, content: line });
  });
} catch (e) {
  console.log('   ℹ️  No se encontraron .subscribe()');
}

// 2. Buscar console.log en handlerstry {
  const result = execSync('git grep -n "console\\.log.*payload\\|console\\.log.*channel\\|console\\.log.*Subscrib" -- "src/**/*.ts"', { encoding: 'utf8' });
  const lines = result.trim().split('\n');  lines.forEach(line => {    issues.push({ type: 'console.log', severity: 'HIGH', content: line });
  });
} catch (e) {}

// 3. Buscar callbacks en dependency arraystry {
  const result = execSync('git grep -n "}, \\[.*fetch.*\\]\\|}, \\[.*subscribe.*\\]" -- "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' });
  const lines = result.trim().split('\n');  lines.forEach(line => {
    if (!line.includes('eslint-disable-next-line')) {      issues.push({ type: 'callback-in-deps', severity: 'HIGH', content: line });
    }
  });
} catch (e) {
  console.log('   ℹ️  No se encontraron callbacks en deps (o todos tienen eslint-disable)');
}

// 4. Buscar useEffect sin cleanuptry {
  const files = execSync('find src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' }).trim().split('\n');
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const useEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\.subscribe\(\)[\s\S]*?\}, \[.*?\]\)/g;
    const matches = content.match(useEffectRegex);
    
    if (matches) {
      matches.forEach(match => {
        if (!match.includes('return () =>') && !match.includes('removeChannel')) {          issues.push({ type: 'missing-cleanup', severity: 'CRITICAL', file, content: match.substring(0, 100) });
        }
      });
    }
  });
} catch (e) {}

// 5. Buscar canales sin nombres únicos
console.log('\n5️⃣ Buscando canales sin nombres únicos (sin timestamp)...');
try {
  const result = execSync('git grep -n "supabase\\.channel(" -- "src/**/*.ts"', { encoding: 'utf8' });
  const lines = result.trim().split('\n');
  
  lines.forEach(line => {
    if (!line.includes('Date.now()') && !line.includes('${') && !line.includes('`')) {      issues.push({ type: 'static-channel-name', severity: 'MEDIUM', content: line });
    }
  });
  
  if (issues.filter(i => i.type === 'static-channel-name').length === 0) {  }
} catch (e) {}

// 6. Buscar setInterval sin clearIntervaltry {
  const files = execSync('git grep -l "setInterval" -- "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' }).trim().split('\n');
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const hasSetInterval = content.includes('setInterval');
    const hasClearInterval = content.includes('clearInterval');
    
    if (hasSetInterval && !hasClearInterval) {      issues.push({ type: 'interval-leak', severity: 'HIGH', file });
    }
  });
  
  if (issues.filter(i => i.type === 'interval-leak').length === 0) {  }
} catch (e) {}

// 7. Verificar que removeChannel esté en cleanupconst subscribeFiles = [...new Set(issues.filter(i => i.type === 'subscribe').map(i => i.file))];

subscribeFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const subscribeCount = (content.match(/\.subscribe\(\)/g) || []).length;
  const removeChannelCount = (content.match(/removeChannel/g) || []).length;
  
  if (subscribeCount > removeChannelCount) {    issues.push({ type: 'missing-remove-channel', severity: 'CRITICAL', file, subscribeCount, removeChannelCount });
  }
});

// RESUMENconst critical = issues.filter(i => i.severity === 'CRITICAL');
const high = issues.filter(i => i.severity === 'HIGH');
const medium = issues.filter(i => i.severity === 'MEDIUM');critical.forEach(issue => {
  console.log(`   - ${issue.type}: ${issue.file || issue.content.substring(0, 80)}`);
});high.forEach(issue => {
  console.log(`   - ${issue.type}: ${issue.content.substring(0, 80)}`);
});if (critical.length > 0 || high.length > 0) {  process.exit(1);
} else {  process.exit(0);
}
