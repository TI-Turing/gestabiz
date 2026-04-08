/**
 * Script de debugging para RLS de LOCATIONS
 * Prueba específica para insertar sedes
 */
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export async function testLocationInsert() {  try {
    // Test 1: Verificar sesión    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {      toast.error('No estás autenticado');
      return { success: false, error: 'No session' };
    }

    const userId = sessionData.session.user.id;    // Test 2: Verificar que el usuario tiene al menos un negocio    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, owner_id')
      .eq('owner_id', userId)
      .limit(1);

    if (businessError) {      toast.error('Error al verificar negocios');
      return { success: false, error: businessError };
    }

    if (!businesses || businesses.length === 0) {      toast.warning('Primero debes crear un negocio');
      return { success: false, error: 'No businesses found' };
    }

    const business = businesses[0];    // Test 3: Intentar INSERT de location    const testLocationData = {
      business_id: business.id,
      name: 'TEST Location Debug ' + Date.now(),
      address: 'Calle Test 123',
      city: 'Bogotá',
      state: 'Cundinamarca',
      country: 'Colombia',
      postal_code: '110111',
      phone: '+573001234567',
      email: 'test@example.com',
      description: 'Sede de prueba para debugging RLS',
      is_active: true,
      is_primary: false,
      business_hours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      },
    };    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert(testLocationData)
      .select()
      .single();

    if (locationError) {      toast.error(`Error al insertar location: ${locationError.message}`);
      
      return {
        success: false,
        error: locationError,
        context: {
          userId,
          businessId: business.id,
          businessOwnerId: business.owner_id,
          idsMatch: business.owner_id === userId,
        },
      };
    }    toast.success('¡Test exitoso! Location creada correctamente');

    // Limpiar: eliminar la location de prueba    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .eq('id', location.id);

    if (deleteError) {    } else {    }    return {
      success: true,
      location,
      context: {
        userId,
        businessId: business.id,
        businessName: business.name,
      },
    };

  } catch (err) {    toast.error('Error durante el test de locations');
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// Función auxiliar para ejecutar desde DevTools
if (typeof window !== 'undefined') {
  (window as any).testLocationInsert = testLocationInsert;
}
