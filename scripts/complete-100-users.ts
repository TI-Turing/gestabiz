/**
 * Script para completar los 100 usuarios (actualmente hay 20, crear 80 más)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const FIRST_NAMES = [
  'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofia', 'Diego', 'Valentina',
  'Andrés', 'Camila', 'Felipe', 'Isabella', 'Santiago', 'Natalia', 'Miguel', 'Carolina', 'Sebastián', 'Daniela',
  'Alejandro', 'Paula', 'Ricardo', 'Andrea', 'Fernando', 'Juliana', 'Jorge', 'Gabriela', 'David', 'Mariana',
  'Oscar', 'Catalina', 'Javier', 'Melissa', 'Roberto', 'Alejandra', 'Manuel', 'Diana', 'Arturo', 'Paola',
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez', 'Ortiz', 'Chávez',
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const cleanFirst = firstName.toLowerCase().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '');
  const cleanLast = lastName.toLowerCase().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '');
  return `${cleanFirst}.${cleanLast}${index}@gestabiz.demo`;
}

async function createBatchUsers(startIndex: number, count: number) {  const createdUsers = [];
  const password = 'Demo2025!';

  for (let i = startIndex; i < startIndex + count; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const email = generateEmail(firstName, lastName, i);
    const fullName = `${firstName} ${lastName}`;
    const phone = `3${randomInt(10, 99)}${randomInt(1000000, 9999999)}`;

    try {
      // Crear usuario
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, phone }
      });

      if (authError) {
        if (authError.message.includes('already')) {          continue;
        }        continue;
      }

      const userId = authData.user.id;

      // Crear perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          phone,
          is_active: true,
        });

      if (profileError && !profileError.message.includes('duplicate')) {      }

      createdUsers.push({ id: userId, email, password, full_name: fullName, phone });
      
      if ((i - startIndex + 1) % 10 === 0) {      }

      // Pequeña pausa para no exceder rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: unknown) {
      if (error instanceof Error) {      }
    }
  }  return createdUsers;
}

async function main() {  // Verificar cuántos usuarios existen
  const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });  if ((count || 0) >= 100) {    return;
  }

  const remaining = 100 - (count || 0);  // Crear en lotes de 20
  const batchSize = 20;
  const batches = Math.ceil(remaining / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const startIndex = (count || 0) + (batch * batchSize) + 1;
    const batchCount = Math.min(batchSize, remaining - (batch * batchSize));    await createBatchUsers(startIndex, batchCount);
  }

  // Verificar total final
  const { count: finalCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });}

await main();
