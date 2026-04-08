import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createLocationServices() {  // Obtener todos los negocios
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name');

  if (bizError || !businesses) {    return;
  }  let totalAssignments = 0;

  for (const business of businesses) {
    // Obtener ubicaciones del negocio
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .eq('business_id', business.id);

    if (!locations || locations.length === 0) continue;

    // Obtener servicios del negocio
    const { data: services } = await supabase
      .from('services')
      .select('id, name')
      .eq('business_id', business.id);

    if (!services || services.length === 0) continue;    // Vincular TODOS los servicios con TODAS las ubicaciones del negocio
    for (const location of locations) {
      for (const service of services) {
        const { error } = await supabase
          .from('location_services')
          .insert({
            location_id: location.id,
            service_id: service.id,
            is_active: true,
          });

        if (error) {        } else {
          totalAssignments++;
        }
      }
    }  }  // Verificación
  const { data: verification } = await supabase
    .from('location_services')
    .select('id', { count: 'exact', head: true });}

createLocationServices();
