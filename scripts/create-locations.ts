/**
 * Script para crear sedes (locations) para los 30 negocios
 * 1-10 sedes por negocio con horarios y direcciones
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Datos por ciudad
const LOCATIONS_DATA: Record<string, { neighborhoods: string[]; addresses: string[] }> = {
  'Bogotá': {
    neighborhoods: ['Chapinero', 'Usaquén', 'Suba', 'Engativá', 'Fontibón', 'Cedritos', 'Zona Rosa', 'Centro'],
    addresses: ['Calle', 'Carrera', 'Avenida', 'Transversal', 'Diagonal']
  },
  'Girardot': {
    neighborhoods: ['Centro', 'Alto de la Cruz', 'La Magdalena', 'San Miguel'],
    addresses: ['Calle', 'Carrera', 'Avenida']
  },
  'Medellín': {
    neighborhoods: ['El Poblado', 'Laureles', 'Envigado', 'Sabaneta', 'Belén', 'La América', 'Centro'],
    addresses: ['Calle', 'Carrera', 'Avenida', 'Circular']
  }
};

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAddress(city: string): string {
  const data = LOCATIONS_DATA[city];
  if (!data) return 'Dirección no disponible';
  
  const street = randomElement(data.addresses);
  const number1 = randomInt(1, 200);
  const number2 = randomInt(1, 150);
  const number3 = randomInt(1, 99);
  const neighborhood = randomElement(data.neighborhoods);
  return `${street} ${number1} # ${number2}-${number3}, ${neighborhood}`;
}

async function createLocations() {  // Obtener todos los negocios
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, city, state, phone')
    .order('created_at');

  if (bizError || !businesses) {    return;
  }  let totalLocations = 0;

  for (const business of businesses) {
    const numLocations = randomInt(1, 10);    for (let i = 0; i < numLocations; i++) {
      const locationName = numLocations === 1 
        ? 'Sede Principal' 
        : `Sede ${['Principal', 'Norte', 'Sur', 'Centro', 'Este', 'Oeste', 'Mall', 'Plaza', 'Express', 'VIP'][i] || (i + 1)}`;
      
      const address = generateAddress(business.city);
      const phone = `3${randomInt(10, 99)}${randomInt(1000000, 9999999)}`;
      const opensAt = `0${randomInt(6, 9)}:00:00`;
      const closesAt = `${randomInt(17, 21)}:00:00`;

      try {
        const { error } = await supabase
          .from('locations')
          .insert({
            business_id: business.id,
            name: locationName,
            address,
            city: business.city,
            state: business.state,
            country: 'Colombia',
            phone,
            opens_at: opensAt,
            closes_at: closesAt,
            is_active: true,
          });

        if (error) {          continue;
        }

        totalLocations++;
      } catch (error: unknown) {
        if (error instanceof Error) {        }
      }
    }
  }  // Verificar total
  const { count } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true });}

await createLocations();
