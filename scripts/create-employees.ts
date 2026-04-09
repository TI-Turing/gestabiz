/**
 * Script para crear 15 empleados vinculados a negocios
 * 12 empleados en 1 negocio, 3 empleados en 2-3 negocios
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function createEmployees() {  // Obtener 15 usuarios para usar como empleados (usuarios 26-40)
  const { data: employeeUsers, error: userError } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone')
    .order('created_at')
    .range(25, 39); // Usuarios 26-40

  if (userError || !employeeUsers || employeeUsers.length < 15) {    return;
  }  // Obtener todos los negocios
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, category')
    .order('created_at');

  if (bizError || !businesses) {    return;
  }  // Obtener servicios por negocio
  const { data: allServices, error: servicesError } = await supabase
    .from('services')
    .select('id, business_id, name');

  if (servicesError || !allServices) {    return;
  }  let totalEmployees = 0;
  let totalAssignments = 0;

  for (let i = 0; i < employeeUsers.length; i++) {
    const employee = employeeUsers[i];
    
    // Los primeros 12 trabajan en 1 negocio, los últimos 3 en 2-3 negocios
    const numBusinesses = i < 12 ? 1 : randomInt(2, 3);
    

    // Seleccionar negocios aleatorios
    const selectedBusinesses = businesses
      .sort(() => Math.random() - 0.5)
      .slice(0, numBusinesses);

    for (const business of selectedBusinesses) {
      try {
        // Crear empleado en business_employees
        const { error: empError } = await supabase
          .from('business_employees')
          .insert({
            business_id: business.id,
            employee_id: employee.id,
            role: 'employee',
            status: 'approved',
            is_active: true,
            offers_services: true,
            job_title: 'Profesional',
            employee_type: 'service_provider',
          })
          .select()
          .single();

        if (empError) {          continue;
        }        // Obtener ubicaciones del negocio
        const { data: businessLocations } = await supabase
          .from('locations')
          .select('id')
          .eq('business_id', business.id);

        if (!businessLocations || businessLocations.length === 0) {          totalEmployees++;
          continue;
        }

        // Obtener servicios disponibles en las ubicaciones del negocio
        const { data: availableServices } = await supabase
          .from('location_services')
          .select('service_id, location_id, services(id, name, business_id)')
          .in('location_id', businessLocations.map(l => l.id))
          .eq('is_active', true);

        if (!availableServices || availableServices.length === 0) {          totalEmployees++;
          continue;
        }

        // Agrupar por service_id para evitar duplicados
        const uniqueServices = Array.from(
          new Map(availableServices.map(item => [
            item.service_id, 
            { service_id: item.service_id, location_id: item.location_id }
          ])).values()
        );

        // Seleccionar 3-6 servicios aleatorios
        const numServices = Math.min(randomInt(3, 6), uniqueServices.length);
        const selectedServices = uniqueServices
          .sort(() => Math.random() - 0.5)
          .slice(0, numServices);

        for (const { service_id, location_id } of selectedServices) {
          const { error: serviceError } = await supabase
            .from('employee_services')
            .insert({
              employee_id: employee.id,
              service_id: service_id,
              business_id: business.id,
              location_id: location_id,
            });

          if (serviceError) {            continue;
          }
          
          totalAssignments++;
        }        totalEmployees++;

      } catch (error: unknown) {
        if (error instanceof Error) {        }
      }
    }  }  // Verificar
  const { count: empCount } = await supabase
    .from('business_employees')
    .select('*', { count: 'exact', head: true });
  
  const { count: servCount } = await supabase
    .from('employee_services')
    .select('*', { count: 'exact', head: true });}

await createEmployees();
