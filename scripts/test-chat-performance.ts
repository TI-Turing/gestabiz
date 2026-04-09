/**
 * Performance Testing Script - Chat System
 * 
 * Este script genera datos de prueba para medir el rendimiento del sistema de chat:
 * - Crea conversación con 1000+ mensajes
 * - Mide tiempos de carga y queries
 * - Analiza memory usage
 * - Identifica bottlenecks
 * 
 * Uso:
 * ```bash
 * # Desde raíz del proyecto
 * npx tsx scripts/test-chat-performance.ts
 * ```
 * 
 * Prerequisitos:
 * - npm install -D tsx
 * - Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
 * 
 * @author Gestabiz Team
 * @version 1.0.0
 * @date 2025-10-13
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuración de prueba
const TEST_CONFIG = {
  numMessages: 1000,
  numParticipants: 5,
  messageTypes: ['text', 'image', 'file'],
  batchSize: 50, // Insertar en lotes para no sobrecargar
};

// ============================================================================
// UTILIDADES
// ============================================================================

function generateRandomMessage(index: number): string {
  const templates = [
    `Mensaje de prueba #${index}`,
    `Este es un mensaje más largo para probar el rendimiento con diferentes tamaños de contenido. Mensaje #${index}`,
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mensaje #${index}`,
    `Corto #${index}`,
    `🎉 Emoji test ${index} 🚀`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// ============================================================================
// PASO 1: SETUP - Crear usuarios y conversación de prueba
// ============================================================================

async function setupTestData() {  // Nota: En producción necesitarías crear usuarios reales con auth.
  // Para testing, asumimos que ya existen usuarios de prueba.
  
  // Obtener usuarios existentes (tomar primeros 5)
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .limit(TEST_CONFIG.numParticipants);

  if (usersError || !users || users.length < 2) {    process.exit(1);
  }  users.forEach((u, i) => {
  });

  // Crear conversación de prueba
  const { result: conversation, duration: convDuration } = await measureTime(
    'Crear conversación',
    async () => {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          type: 'group',
          title: `🧪 Performance Test - ${new Date().toISOString()}`,
          created_by: users[0].id,
          metadata: { test: true, purpose: 'performance_testing' },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  );  // Agregar participantes
  const participantInserts = users.map((user) => ({
    conversation_id: conversation.id,
    user_id: user.id,
    joined_at: new Date().toISOString(),
  }));

  const { duration: partDuration } = await measureTime(
    `Agregar ${users.length} participantes`,
    async () => {
      const { error } = await supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (error) throw error;
      return true;
    }
  );  return {
    conversation,
    users,
    stats: {
      conversationCreation: convDuration,
      participantsCreation: partDuration,
    },
  };
}

// ============================================================================
// PASO 2: GENERACIÓN - Insertar 1000 mensajes
// ============================================================================

async function generateMessages(conversationId: string, userIds: string[]) {  const batches = Math.ceil(TEST_CONFIG.numMessages / TEST_CONFIG.batchSize);
  const stats = {
    totalMessages: 0,
    totalTime: 0,
    batchTimes: [] as number[],
    avgBatchTime: 0,
    minBatchTime: Infinity,
    maxBatchTime: 0,
  };

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * TEST_CONFIG.batchSize;
    const batchEnd = Math.min(
      (batch + 1) * TEST_CONFIG.batchSize,
      TEST_CONFIG.numMessages
    );
    const batchSize = batchEnd - batchStart;

    const messages = [];
    for (let i = batchStart; i < batchEnd; i++) {
      messages.push({
        conversation_id: conversationId,
        sender_id: getRandomElement(userIds),
        content: generateRandomMessage(i + 1),
        type: getRandomElement(TEST_CONFIG.messageTypes),
        sent_at: new Date(Date.now() - (TEST_CONFIG.numMessages - i) * 1000).toISOString(),
      });
    }

    const { duration } = await measureTime(
      `Batch ${batch + 1}/${batches} (${batchSize} mensajes)`,
      async () => {
        const { error } = await supabase.from('chat_messages').insert(messages);
        if (error) throw error;
        return true;
      }
    );

    stats.batchTimes.push(duration);
    stats.totalTime += duration;
    stats.totalMessages += batchSize;
    stats.minBatchTime = Math.min(stats.minBatchTime, duration);
    stats.maxBatchTime = Math.max(stats.maxBatchTime, duration);

    // Pausa pequeña entre batches para no sobrecargar
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  stats.avgBatchTime = stats.totalTime / batches;  

  return stats;
}

// ============================================================================
// PASO 3: QUERIES - Medir performance de lectura
// ============================================================================

async function testQueryPerformance(conversationId: string) {  const results: Record<string, number> = {};

  // Test 1: Fetch últimos 50 mensajes (caso típico)
  const { duration: d1 } = await measureTime(
    'Query: Últimos 50 mensajes',
    async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  );
  results.last50Messages = d1;

  // Test 2: Fetch ALL mensajes (peor caso)
  const { duration: d2 } = await measureTime(
    'Query: TODOS los mensajes (1000+)',
    async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  );
  results.allMessages = d2;

  // Test 3: Count total de mensajes
  const { duration: d3 } = await measureTime(
    'Query: COUNT total',
    async () => {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      if (error) throw error;
      return count;
    }
  );
  results.count = d3;

  // Test 4: Search mensajes (LIKE query)
  const { duration: d4 } = await measureTime(
    'Query: Search con LIKE',
    async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .ilike('content', '%prueba%')
        .limit(50);

      if (error) throw error;
      return data;
    }
  );
  results.search = d4;

  // Test 5: Fetch con JOIN a sender
  const { duration: d5 } = await measureTime(
    'Query: Con JOIN a profiles (sender)',
    async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, email, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  );
  results.withJoin = d5;  Object.entries(results).forEach(([key, duration]) => {
    const status = duration < 100 ? '✅' : duration < 500 ? '⚠️' : '❌';
  });  return results;
}

// ============================================================================
// PASO 4: ANÁLISIS - Recommendations
// ============================================================================

function analyzeResults(
  setupStats: any,
  generateStats: any,
  queryStats: Record<string, number>
) {  const recommendations: string[] = [];
  const warnings: string[] = [];
  const criticals: string[] = [];

  // Análisis de queries
  if (queryStats.last50Messages > 100) {
    warnings.push(
      `Query de 50 mensajes tardó ${queryStats.last50Messages.toFixed(2)}ms (>100ms). Considera pagination o virtual scrolling.`
    );
  }

  if (queryStats.allMessages > 1000) {
    criticals.push(
      `Query de TODOS los mensajes tardó ${queryStats.allMessages.toFixed(2)}ms (>1s). NUNCA cargar todos los mensajes. Implementa infinite scroll.`
    );
  } else if (queryStats.allMessages > 500) {
    warnings.push(
      `Query de todos los mensajes tardó ${queryStats.allMessages.toFixed(2)}ms (>500ms). Implementa pagination.`
    );
  }

  if (queryStats.search > 200) {
    recommendations.push(
      `Search query tardó ${queryStats.search.toFixed(2)}ms. Considera implementar full-text search o índice GIN trigram.`
    );
  }

  if (queryStats.withJoin > queryStats.last50Messages * 1.5) {
    recommendations.push(
      `JOIN con profiles aumenta tiempo en ${((queryStats.withJoin / queryStats.last50Messages - 1) * 100).toFixed(0)}%. Considera cache de user data en frontend.`
    );
  }

  // Análisis de throughput
  const throughput = generateStats.totalMessages / (generateStats.totalTime / 1000);
  if (throughput < 50) {
    warnings.push(
      `Throughput de inserción: ${throughput.toFixed(2)} msg/s. Considera usar RPC function para inserts bulk.`
    );
  }

  // Print results
  if (criticals.length > 0) {
    criticals.forEach((c) => );  }

  if (warnings.length > 0) {
    warnings.forEach((w) => );  }

  if (recommendations.length > 0) {
    recommendations.forEach((r) => );  }

  if (criticals.length === 0 && warnings.length === 0) {  }

  // Best practices  console.log('   1. Implementar Virtual Scrolling (react-window o react-virtuoso)');}

// ============================================================================
// PASO 5: CLEANUP - Eliminar datos de prueba
// ============================================================================

async function cleanup(conversationId: string) {  const { duration } = await measureTime(
    'Eliminar conversación y mensajes',
    async () => {
      // Supabase CASCADE delete eliminará mensajes, participantes, etc.
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    }
  );

}

// ============================================================================
// MAIN
// ============================================================================

async function main() {  try {
    // Paso 1: Setup
    const { conversation, users, stats: setupStats } = await setupTestData();

    // Paso 2: Generación de mensajes
    const generateStats = await generateMessages(
      conversation.id,
      users.map((u) => u.id)
    );

    // Paso 3: Test de queries
    const queryStats = await testQueryPerformance(conversation.id);

    // Paso 4: Análisis
    analyzeResults(setupStats, generateStats, queryStats);

    // Paso 5: Cleanup
    await cleanup(conversation.id);  } catch (error) {    process.exit(1);
  }
}

// Ejecutar
main();
