// ==============================================
// TEST DE AUTENTICACIÓN - Copiar y pegar en DevTools Console
// ==============================================// Test 1: Verificar sesión actual
const testAuth = async () => {  const { data: session, error: sessionError } = await supabase.auth.getSession();  console.log(' Access Token (primeros 50 chars):', session.session?.access_token?.substring(0, 50) + '...');
  console.log(' Token expires at:', new Date(session.session?.expires_at * 1000));
  console.log(' Is token expired:', Date.now() > (session.session?.expires_at * 1000));
  
  if (sessionError) {    return null;
  }
  
  return session.session;
};

// Test 2: Intentar INSERT en businesses
const testBusinessInsert = async (sessionData) => {  if (!sessionData?.user?.id) {    return;
  }
  
  // Primero, obtener una categoría válida
  const { data: categories } = await supabase
    .from('business_categories')
    .select('id')
    .limit(1)
    .single();
  
  if (!categories?.id) {    return;
  }  // Intentar INSERT
  const testBusinessData = {
    name: 'TEST Business Debug ' + Date.now(),
    owner_id: sessionData.user.id,
    category_id: categories.id,
    is_active: true,
    legal_entity_type: 'individual',
    business_hours: {
      monday: { open: '09:00', close: '18:00', closed: false }
    },
    settings: {
      currency: 'COP',
      appointment_buffer: 15
    }
  };  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert(testBusinessData)
    .select()
    .single();
  
  if (businessError) {    return false;
  } else {    // Limpiar: eliminar el negocio de prueba
    await supabase.from('businesses').delete().eq('id', business.id);    return true;
  }
};

// Test 3: Verificar políticas RLS visibles
const testRLSPolicies = async () => {  const { data: policies, error } = await supabase
    .rpc('get_table_policies', { table_name: 'businesses' })
    .select();
  
  if (error) {
    console.log(' No se puede ejecutar get_table_policies (esperado si no existe la función)');
  } else {  }
};

// Ejecutar todos los tests
const runAllTests = async () => {
  try {
    const sessionData = await testAuth();
    
    if (sessionData) {
      await testBusinessInsert(sessionData);
    }  } catch (err) {  }
};

// Iniciar tests
runAllTests();
