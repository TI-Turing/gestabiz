/**
 * Script para crear 30 negocios ficticios
 * Distribución: 7 Bogotá, 2 Girardot, 21 Medellín
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Distribución geográfica
const CITIES = [
  { name: 'Bogotá', department: 'Cundinamarca', count: 7 },
  { name: 'Girardot', department: 'Cundinamarca', count: 2 },
  { name: 'Medellín', department: 'Antioquia', count: 21 },
];

// Categorías con valores del enum business_category
const CATEGORIES = [
  { value: 'beauty', name: 'Belleza y Estética' },
  { value: 'professional', name: 'Servicios Profesionales' },
  { value: 'health', name: 'Salud y Bienestar' },
  { value: 'fitness', name: 'Fitness y Deportes' },
  { value: 'education', name: 'Educación' },
  { value: 'consulting', name: 'Consultoría' },
  { value: 'food', name: 'Alimentación' },
  { value: 'maintenance', name: 'Mantenimiento' },
];

// Sufijos para nombres de negocios
const SUFFIXES = ['Premium', 'Elite', 'Plus', 'VIP', 'Express', 'Center', 'Studio', 'Pro', 'Deluxe', 'Exclusive'];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createBusinesses() {  // Obtener los primeros 25 usuarios como owners
  const { data: owners } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone')
    .order('created_at')
    .limit(25);

  if (!owners || owners.length < 25) {
    return;
  }  let businessIndex = 0;
  const createdBusinesses = [];

  for (const cityDist of CITIES) {    for (let i = 0; i < cityDist.count; i++) {
      // Seleccionar owner (primeros 20 únicos, después repetidos)
      const ownerIndex = businessIndex < 20 ? businessIndex : randomInt(0, 19);
      const owner = owners[ownerIndex];

      // Seleccionar categoría aleatoria
      const category = randomElement(CATEGORIES);
      const businessName = `${category.name} ${randomElement(SUFFIXES)} ${cityDist.name}`;
      const description = `${category.name} profesional en ${cityDist.name}. Ofrecemos servicios de alta calidad con profesionales certificados.`;
      
      // Generar slug único
      const slugBase = businessName
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replaceAll(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const slug = `${slugBase}-${businessIndex + 1}`;

      try {
        const { data, error} = await supabase
          .from('businesses')
          .insert({
            owner_id: owner.id,
            name: businessName,
            slug,
            description,
            email: owner.email,
            phone: owner.phone || '3001234567',
            category: category.value as 'beauty' | 'professional' | 'health' | 'fitness' | 'education' | 'consulting' | 'food' | 'maintenance',
            city: cityDist.name,
            state: cityDist.department,
            country: 'Colombia',
            is_active: true,
            is_public: true,
          })
          .select()
          .single();

        if (error) {          continue;
        }

        createdBusinesses.push(data);
        businessIndex++;      } catch (error: unknown) {
        if (error instanceof Error) {        }
      }
    }  }  // Mostrar resumen por ciudad  for (const city of CITIES) {
    const count = createdBusinesses.filter(b => b.city === city.name).length;  }

  return createdBusinesses;
}

await createBusinesses();
