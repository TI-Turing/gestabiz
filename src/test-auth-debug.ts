/**
 * Script de debugging para RLS - Ejecutar desde la app
 * Importar y ejecutar testBusinessInsert() desde un componente
 */
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export async function testAuthDebug() {  try {
    // Test 1: Verificar sesión actual    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {      toast.error('Error al obtener sesión');
      return { success: false, error: 'Session error' };
    }    console.log('✅ Access Token (primeros 50 chars):', sessionData.session?.access_token?.substring(0, 50) + '...');
    console.log('✅ Token expires at:', new Date((sessionData.session?.expires_at || 0) * 1000));
    console.log('✅ Is token expired:', Date.now() > ((sessionData.session?.expires_at || 0) * 1000));

    if (!sessionData.session?.user) {      toast.error('No hay sesión activa');
      return { success: false, error: 'No session' };
    }

    const userId = sessionData.session.user.id;

    // Test 2: Obtener una categoría válida    const { data: category, error: categoryError } = await supabase
      .from('business_categories')
      .select('id, name')
      .limit(1)
      .single();

    if (categoryError || !category) {      toast.error('No se pudo obtener categoría de prueba');
      return { success: false, error: 'No category' };
    }    // Test 3: Intentar INSERT en businesses    const testBusinessData = {
      name: 'TEST Business Debug ' + Date.now(),
      owner_id: userId,
      category_id: category.id,
      is_active: true,
      legal_entity_type: 'individual' as const,
      business_hours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      },
      settings: {
        currency: 'COP',
        appointment_buffer: 15,
        advance_booking_days: 30,
        cancellation_policy: 24,
        auto_confirm: false,
        require_deposit: false,
        deposit_percentage: 0,
      },
    };    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert(testBusinessData)
      .select()
      .single();

    if (businessError) {      toast.error(`Error al insertar: ${businessError.message}`);
      
      return {
        success: false,
        error: businessError,
        sessionInfo: {
          userId,
          email: sessionData.session.user.email,
          hasToken: !!sessionData.session.access_token,
        },
      };
    }    toast.success('¡Test exitoso! Business creado correctamente');

    // Limpiar: eliminar el negocio de prueba    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', business.id);

    if (deleteError) {    } else {    }    return {
      success: true,
      business,
      sessionInfo: {
        userId,
        email: sessionData.session.user.email,
        hasToken: !!sessionData.session.access_token,
      },
    };

  } catch (err) {    toast.error('Error durante el test de autenticación');
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// Función auxiliar para ejecutar desde DevTools (si window.supabase está disponible)
if (typeof window !== 'undefined') {
  (window as any).testAuthDebug = testAuthDebug;
}
