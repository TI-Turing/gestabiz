/**
 * Script para generar datos ficticios completos en Supabase
 * Genera: usuarios, negocios, sedes, empleados, servicios, citas, transacciones
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Configuración de Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================================================
// DATOS BASE
// ============================================================================

const FIRST_NAMES = [
  'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofia', 'Diego', 'Valentina',
  'Andrés', 'Camila', 'Felipe', 'Isabella', 'Santiago', 'Natalia', 'Miguel', 'Carolina', 'Sebastián', 'Daniela',
  'Alejandro', 'Paula', 'Ricardo', 'Andrea', 'Fernando', 'Juliana', 'Jorge', 'Gabriela', 'David', 'Mariana',
  'Oscar', 'Catalina', 'Javier', 'Melissa', 'Roberto', 'Alejandra', 'Manuel', 'Diana', 'Arturo', 'Paola',
  'Héctor', 'Claudia', 'Raúl', 'Mónica', 'Eduardo', 'Marcela', 'César', 'Verónica', 'Iván', 'Adriana'
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez', 'Ortiz', 'Chávez',
  'Ruiz', 'Jiménez', 'Vargas', 'Castro', 'Mendoza', 'Romero', 'Herrera', 'Medina', 'Aguilar', 'Silva',
  'Rojas', 'Vega', 'Mora', 'Soto', 'Campos', 'Guerrero', 'Cortés', 'Palacios', 'Suárez', 'Ríos'
];

// Categorías de negocios con sus servicios típicos
const BUSINESS_CATEGORIES = {
  'Salud y Bienestar': {
    subcategories: ['Spa', 'Centro de masajes', 'Fisioterapia', 'Nutrición'],
    services: {
      'Spa': ['Masaje relajante', 'Facial profundo', 'Tratamiento corporal', 'Aromaterapia', 'Exfoliación'],
      'Centro de masajes': ['Masaje sueco', 'Masaje deportivo', 'Reflexología', 'Masaje tailandés', 'Drenaje linfático'],
      'Fisioterapia': ['Terapia manual', 'Rehabilitación', 'Electroterapia', 'Punción seca', 'Vendaje neuromuscular'],
      'Nutrición': ['Consulta nutricional', 'Plan alimenticio', 'Seguimiento mensual', 'Análisis composición corporal']
    }
  },
  'Belleza': {
    subcategories: ['Peluquería', 'Barbería', 'Salón de uñas', 'Centro estético'],
    services: {
      'Peluquería': ['Corte de cabello', 'Tinte', 'Mechas', 'Alisado', 'Tratamiento capilar', 'Peinado'],
      'Barbería': ['Corte clásico', 'Corte moderno', 'Afeitado', 'Arreglo de barba', 'Diseño de cejas'],
      'Salón de uñas': ['Manicure', 'Pedicure', 'Uñas acrílicas', 'Uñas en gel', 'Nail art'],
      'Centro estético': ['Depilación láser', 'Limpieza facial', 'Micropigmentación', 'Lifting', 'Peeling']
    }
  },
  'Servicios Profesionales': {
    subcategories: ['Abogados', 'Contadores', 'Arquitectos', 'Consultores'],
    services: {
      'Abogados': ['Consulta legal', 'Asesoría laboral', 'Derecho civil', 'Derecho penal', 'Contratos'],
      'Contadores': ['Declaración de renta', 'Contabilidad mensual', 'Auditoría', 'Asesoría tributaria'],
      'Arquitectos': ['Diseño arquitectónico', 'Planos', 'Remodelación', 'Consultoría'],
      'Consultores': ['Consultoría empresarial', 'Plan de negocios', 'Asesoría financiera', 'Marketing digital']
    }
  },
  'Educación': {
    subcategories: ['Academia de idiomas', 'Clases particulares', 'Centro de formación'],
    services: {
      'Academia de idiomas': ['Clase de inglés', 'Clase de francés', 'Clase de alemán', 'Preparación TOEFL'],
      'Clases particulares': ['Matemáticas', 'Física', 'Química', 'Programación', 'Piano'],
      'Centro de formación': ['Curso Excel', 'Curso PowerBI', 'Curso Python', 'Diseño gráfico']
    }
  },
  'Fitness': {
    subcategories: ['Gimnasio', 'Yoga', 'CrossFit', 'Entrenamiento personal'],
    services: {
      'Gimnasio': ['Membresía mensual', 'Entrenamiento personalizado', 'Clases grupales', 'Spinning'],
      'Yoga': ['Hatha yoga', 'Vinyasa', 'Yoga prenatal', 'Meditación'],
      'CrossFit': ['Clase CrossFit', 'Entrenamiento funcional', 'Levantamiento olímpico'],
      'Entrenamiento personal': ['Sesión 1-1', 'Evaluación física', 'Plan de entrenamiento']
    }
  }
};

// Ubicaciones por ciudad
const LOCATIONS_DATA = {
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

// ============================================================================
// UTILIDADES
// ============================================================================

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

function generatePhone(): string {
  const prefix = randomElement(['300', '301', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321']);
  return `${prefix}${randomInt(1000000, 9999999)}`;
}

function generateAddress(city: string): string {
  const data = LOCATIONS_DATA[city as keyof typeof LOCATIONS_DATA];
  const street = randomElement(data.addresses);
  const number1 = randomInt(1, 200);
  const number2 = randomInt(1, 150);
  const number3 = randomInt(1, 99);
  const neighborhood = randomElement(data.neighborhoods);
  return `${street} ${number1} # ${number2}-${number3}, ${neighborhood}`;
}

function generatePassword(): string {
  return 'Demo2025!'; // Contraseña estándar para todos los usuarios demo
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

// ============================================================================
// INTERFACES
// ============================================================================

interface GeneratedUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: 'owner' | 'employee' | 'client';
}

interface GeneratedBusiness {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  subcategory: string;
  city: string;
  department: string;
  description: string;
}

interface GeneratedLocation {
  id: string;
  business_id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  opens_at: string;
  closes_at: string;
}

interface GeneratedEmployee {
  id: string;
  user_id: string;
  businesses: Array<{
    business_id: string;
    location_ids: string[];
    schedule: Record<string, { start: string; end: string; active: boolean }>;
  }>;
}

interface GeneratedService {
  id: string;
  business_id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

const generatedUsers: GeneratedUser[] = [];
const generatedBusinesses: GeneratedBusiness[] = [];
const generatedLocations: GeneratedLocation[] = [];
const generatedEmployees: GeneratedEmployee[] = [];
const generatedServices: GeneratedService[] = [];

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

async function main() {  try {
    // Paso 1: Crear usuarios    await createUsers();

    // Paso 2: Crear negocios    await createBusinesses();

    // Paso 3: Crear sedes    await createLocations();

    // Paso 4: Crear servicios    await createServices();

    // Paso 5: Crear empleados    await createEmployees();

    // Paso 6: Asignar servicios a empleados    await assignServicesToEmployees();

    // Paso 7: Crear citas históricas    await createAppointments();

    // Paso 8: Crear transacciones contables    await createTransactions();

    // Paso 9: Generar archivos CSV    await generateCSVFiles();  } catch (error) {    throw error;
  }
}

async function createUsers() {
  const userRoles: ('owner' | 'employee' | 'client')[] = [];
  
  // 30 owners (para los 30 negocios, algunos tendrán múltiples negocios)
  for (let i = 0; i < 25; i++) {
    userRoles.push('owner');
  }
  
  // 15 employees
  for (let i = 0; i < 15; i++) {
    userRoles.push('employee');
  }
  
  // 60 clientes
  for (let i = 0; i < 60; i++) {
    userRoles.push('client');
  }

  // Crear usuarios en auth.users y profiles
  for (let i = 0; i < 100; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const email = generateEmail(firstName, lastName, i + 1);
    const password = generatePassword();
    const fullName = `${firstName} ${lastName}`;
    const phone = generatePhone();
    const role = userRoles[i];

    try {
      // Crear usuario en auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
        }
      });

      if (authError) {        continue;
      }

      const userId = authData.user.id;

      // Crear perfil en profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          name: fullName,
          phone,
          is_active: true,
          created_at: new Date().toISOString(),
        });

      if (profileError) {        continue;
      }

      generatedUsers.push({
        id: userId,
        email,
        password,
        full_name: fullName,
        phone,
        role,
      });

      if ((i + 1) % 10 === 0) {      }
    } catch (error) {    }
  }}

async function createBusinesses() {
  const owners = generatedUsers.filter(u => u.role === 'owner');
  const cityDistribution = [
    { city: 'Bogotá', department: 'Cundinamarca', count: 7 },
    { city: 'Girardot', department: 'Cundinamarca', count: 2 },
    { city: 'Medellín', department: 'Antioquia', count: 21 }
  ];

  const categoryKeys = Object.keys(BUSINESS_CATEGORIES);
  let businessIndex = 0;

  for (const dist of cityDistribution) {
    for (let i = 0; i < dist.count; i++) {
      // Algunos owners tienen múltiples negocios
      const ownerIndex = businessIndex < 20 ? businessIndex : randomInt(0, 19);
      const owner = owners[ownerIndex];
      
      const category = randomElement(categoryKeys);
      const subcategories = BUSINESS_CATEGORIES[category as keyof typeof BUSINESS_CATEGORIES].subcategories;
      const subcategory = randomElement(subcategories);
      
      const businessName = `${subcategory} ${randomElement(['Premium', 'Elite', 'Plus', 'VIP', 'Express', 'Center', 'Studio', 'Spa'])} ${dist.city}`;
      
      const description = `${subcategory} profesional en ${dist.city}. Ofrecemos servicios de alta calidad con profesionales certificados y experiencia comprobada.`;

      try {
        const { data, error } = await supabase
          .from('businesses')
          .insert({
            owner_id: owner.id,
            name: businessName,
            description,
            email: owner.email,
            phone: owner.phone,
            category,
            city: dist.city,
            department: dist.department,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {          continue;
        }

        generatedBusinesses.push({
          id: data.id,
          owner_id: owner.id,
          name: businessName,
          category,
          subcategory,
          city: dist.city,
          department: dist.department,
          description,
        });

        businessIndex++;
        
        if ((businessIndex) % 5 === 0) {        }
      } catch (error) {      }
    }
  }}

async function createLocations() {
  let totalLocations = 0;

  for (const business of generatedBusinesses) {
    const numLocations = randomInt(1, 10);
    
    for (let i = 0; i < numLocations; i++) {
      const locationName = numLocations === 1 
        ? 'Sede Principal' 
        : `Sede ${['Principal', 'Norte', 'Sur', 'Centro', 'Este', 'Oeste', 'Mall', 'Plaza'][i] || i + 1}`;
      
      const address = generateAddress(business.city);
      const phone = generatePhone();
      const opensAt = `0${randomInt(6, 9)}:00:00`;
      const closesAt = `${randomInt(17, 21)}:00:00`;

      try {
        const { data, error } = await supabase
          .from('locations')
          .insert({
            business_id: business.id,
            name: locationName,
            address,
            city: business.city,
            department: business.department,
            phone,
            opens_at: opensAt,
            closes_at: closesAt,
            is_active: true,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {          continue;
        }

        generatedLocations.push({
          id: data.id,
          business_id: business.id,
          name: locationName,
          address,
          city: business.city,
          phone,
          opens_at: opensAt,
          closes_at: closesAt,
        });

        totalLocations++;
      } catch (error) {      }
    }
    
    if ((generatedLocations.length) % 20 === 0) {    }
  }}

async function createServices() {
  let totalServices = 0;

  for (const business of generatedBusinesses) {
    const categoryData = BUSINESS_CATEGORIES[business.category as keyof typeof BUSINESS_CATEGORIES];
    const serviceList = categoryData.services[business.subcategory as keyof typeof categoryData.services] as string[] | undefined;
    
    if (!serviceList || serviceList.length === 0) {      continue;
    }

    // Crear todos los servicios de esa subcategoría
    for (const serviceName of serviceList) {
      const duration = randomInt(3, 12) * 15; // 45, 60, 75, 90, 105, 120, 135, 150, 165, 180 minutos
      const basePrice = randomInt(30, 200) * 1000; // Entre 30.000 y 200.000 COP
      const description = `${serviceName} profesional realizado por expertos certificados.`;

      try {
        const { data, error } = await supabase
          .from('services')
          .insert({
            business_id: business.id,
            name: serviceName,
            description,
            duration,
            price: basePrice,
            category: business.subcategory,
            is_active: true,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {          continue;
        }

        generatedServices.push({
          id: data.id,
          business_id: business.id,
          name: serviceName,
          description,
          duration,
          price: basePrice,
          category: business.subcategory,
        });

        totalServices++;
      } catch (error) {      }
    }
    
    if ((totalServices) % 50 === 0) {    }
  }}

async function createEmployees() {
  const employees = generatedUsers.filter(u => u.role === 'employee');
  
  // 12 empleados trabajarán en 1 solo negocio
  // 3 empleados trabajarán en 2-3 negocios
  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    const numBusinesses = i < 12 ? 1 : randomInt(2, 3);
    const selectedBusinesses = [];

    // Seleccionar negocios aleatorios
    const availableBusinesses = [...generatedBusinesses];
    for (let j = 0; j < numBusinesses; j++) {
      if (availableBusinesses.length === 0) break;
      const randomIndex = randomInt(0, availableBusinesses.length - 1);
      const business = availableBusinesses.splice(randomIndex, 1)[0];
      selectedBusinesses.push(business);
    }

    const employeeData: GeneratedEmployee = {
      id: employee.id,
      user_id: employee.id,
      businesses: [],
    };

    // Crear registros en business_employees para cada negocio
    for (const business of selectedBusinesses) {
      // Seleccionar 1-3 sedes del negocio donde trabajará
      const businessLocations = generatedLocations.filter(l => l.business_id === business.id);
      const numLocations = Math.min(randomInt(1, 3), businessLocations.length);
      const selectedLocations = businessLocations
        .sort(() => Math.random() - 0.5)
        .slice(0, numLocations)
        .map(l => l.id);

      // Generar horario semanal
      const schedule: Record<string, { start: string; end: string; active: boolean }> = {
        monday: { start: '08:00', end: '17:00', active: true },
        tuesday: { start: '08:00', end: '17:00', active: true },
        wednesday: { start: '08:00', end: '17:00', active: true },
        thursday: { start: '08:00', end: '17:00', active: true },
        friday: { start: '08:00', end: '17:00', active: true },
        saturday: { start: '09:00', end: '14:00', active: randomInt(0, 1) === 1 },
        sunday: { start: '10:00', end: '14:00', active: false },
      };

      const lunchBreakStart = `1${randomInt(2, 4)}:00:00`;
      const lunchBreakEnd = `1${randomInt(3, 5)}:00:00`;

      try {
        const { data, error } = await supabase
          .from('business_employees')
          .insert({
            business_id: business.id,
            employee_id: employee.id,
            role: 'employee',
            schedule,
            lunch_break_start: lunchBreakStart,
            lunch_break_end: lunchBreakEnd,
            is_active: true,
            joined_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {          continue;
        }

        // Vincular empleado a las sedes seleccionadas
        for (const locationId of selectedLocations) {
          await supabase
            .from('employee_locations')
            .insert({
              employee_id: data.id,
              location_id: locationId,
            });
        }

        employeeData.businesses.push({
          business_id: business.id,
          location_ids: selectedLocations,
          schedule,
        });
      } catch (error) {      }
    }

    generatedEmployees.push(employeeData);
    
    if ((i + 1) % 5 === 0) {    }
  }}

async function assignServicesToEmployees() {
  let totalAssignments = 0;

  for (const employee of generatedEmployees) {
    for (const businessData of employee.businesses) {
      // Obtener servicios del negocio
      const businessServices = generatedServices.filter(s => s.business_id === businessData.business_id);
      
      // Asignar al empleado entre 3-8 servicios del negocio
      const numServices = Math.min(randomInt(3, 8), businessServices.length);
      const selectedServices = businessServices
        .sort(() => Math.random() - 0.5)
        .slice(0, numServices);

      for (const service of selectedServices) {
        try {
          const { error } = await supabase
            .from('employee_services')
            .insert({
              employee_id: employee.id,
              service_id: service.id,
              business_id: businessData.business_id,
            });

          if (error) {            continue;
          }

          totalAssignments++;
        } catch (error) {        }
      }
    }
    
    if (totalAssignments % 20 === 0) {    }
  }}

async function createAppointments() {
  const clients = generatedUsers.filter(u => u.role === 'client');
  const activeClients = clients.slice(0, 70); // 70 clientes con citas
  
  const today = new Date();
  const threeMonthsAgo = addDays(today, -90);
  
  let totalAppointments = 0;

  // Cada cliente tendrá entre 2-8 citas en los últimos 3 meses
  for (const client of activeClients) {
    const numAppointments = randomInt(2, 8);
    
    for (let i = 0; i < numAppointments; i++) {
      // Fecha aleatoria en los últimos 3 meses
      const dayOffset = randomInt(0, 90);
      const appointmentDate = addDays(threeMonthsAgo, dayOffset);
      
      // Hora aleatoria entre 8am y 6pm
      const hour = randomInt(8, 17);
      const minute = randomElement([0, 15, 30, 45]);
      appointmentDate.setHours(hour, minute, 0, 0);

      // Seleccionar empleado aleatorio
      const randomEmployee = randomElement(generatedEmployees);
      const randomBusinessData = randomElement(randomEmployee.businesses);
      
      // Seleccionar servicio que el empleado pueda realizar
      const employeeServices = generatedServices.filter(s => 
        s.business_id === randomBusinessData.business_id
      );
      
      if (employeeServices.length === 0) continue;
      
      const selectedService = randomElement(employeeServices);
      const selectedLocation = randomElement(randomBusinessData.location_ids);
      
      // Calcular hora de fin
      const endDate = addHours(appointmentDate, selectedService.duration / 60);
      
      // Estado: 80% completadas, 10% canceladas, 10% no shows
      const statusRandom = Math.random();
      let status: string;
      if (statusRandom < 0.8) status = 'completed';
      else if (statusRandom < 0.9) status = 'cancelled';
      else status = 'no_show';

      // Determinar notas según estado
      let notes = 'Servicio realizado exitosamente';
      if (status === 'cancelled') notes = 'Cliente canceló';
      if (status === 'no_show') notes = 'Cliente no asistió';

      try {
        const { error } = await supabase
          .from('appointments')
          .insert({
            client_id: client.id,
            employee_id: randomEmployee.id,
            business_id: randomBusinessData.business_id,
            location_id: selectedLocation,
            service_id: selectedService.id,
            start_time: appointmentDate.toISOString(),
            end_time: endDate.toISOString(),
            status,
            notes,
            created_at: addDays(appointmentDate, -randomInt(1, 5)).toISOString(),
          });

        if (error) {          continue;
        }

        totalAppointments++;
      } catch (error) {      }
    }
    
    if (totalAppointments % 50 === 0) {    }
  }}

async function createTransactions() {
  // Obtener todas las citas completadas
  const { data: completedAppointments, error } = await supabase
    .from('appointments')
    .select('id, service_id, business_id, start_time')
    .eq('status', 'completed');

  if (error || !completedAppointments) {    return;
  }

  let totalTransactions = 0;

  // Crear transacción de ingreso por cada cita completada
  for (const appointment of completedAppointments) {
    const service = generatedServices.find(s => s.id === appointment.service_id);
    if (!service) continue;

    const subtotal = service.price;
    const taxRate = 0.19; // IVA 19% Colombia
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + taxAmount;

    const transactionDate = new Date(appointment.start_time);
    const fiscalPeriod = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;

    try {
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          business_id: appointment.business_id,
          type: 'income',
          category: 'service_sale',
          amount: totalAmount,
          subtotal,
          tax_type: 'IVA',
          tax_rate: taxRate,
          tax_amount: taxAmount,
          description: `Pago por servicio: ${service.name}`,
          fiscal_period: fiscalPeriod,
          transaction_date: transactionDate.toISOString(),
          created_at: transactionDate.toISOString(),
        });

      if (txError) {        continue;
      }

      totalTransactions++;

      if (totalTransactions % 50 === 0) {      }
    } catch (error) {    }
  }

  // Crear algunos gastos operacionales aleatorios para cada negocio
  for (const business of generatedBusinesses) {
    const numExpenses = randomInt(5, 15);
    
    for (let i = 0; i < numExpenses; i++) {
      const expenseDate = addDays(new Date(), -randomInt(1, 90));
      const fiscalPeriod = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      
      const categories = ['rent', 'utilities', 'supplies', 'marketing', 'maintenance'];
      const category = randomElement(categories);
      
      const amount = randomInt(50, 500) * 1000; // Entre 50k y 500k COP

      try {
        await supabase
          .from('transactions')
          .insert({
            business_id: business.id,
            type: 'expense',
            category,
            amount,
            subtotal: amount,
            description: `Gasto operacional - ${category}`,
            fiscal_period: fiscalPeriod,
            transaction_date: expenseDate.toISOString(),
            created_at: expenseDate.toISOString(),
          });

        totalTransactions++;
      } catch (error) {      }
    }
  }}

async function generateCSVFiles() {
  const outputDir = path.join(process.cwd(), 'generated-data');
  
  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // CSV 1: Todos los usuarios con credenciales
  const allUsersCSV = [
    'email,password,full_name,phone,role,user_id',
    ...generatedUsers.map(u => 
      `${u.email},${u.password},${u.full_name},${u.phone},${u.role},${u.id}`
    )
  ].join('\n');
  fs.writeFileSync(path.join(outputDir, '1-todos-usuarios.csv'), allUsersCSV, 'utf-8');  // CSV 2: Solo owners
  const owners = generatedUsers.filter(u => u.role === 'owner');
  const ownersCSV = [
    'email,password,full_name,phone,user_id',
    ...owners.map(u => 
      `${u.email},${u.password},${u.full_name},${u.phone},${u.id}`
    )
  ].join('\n');
  fs.writeFileSync(path.join(outputDir, '2-propietarios.csv'), ownersCSV, 'utf-8');  // CSV 3: Solo employees
  const employees = generatedUsers.filter(u => u.role === 'employee');
  const employeesCSV = [
    'email,password,full_name,phone,user_id,num_businesses',
    ...employees.map(u => {
      const empData = generatedEmployees.find(e => e.id === u.id);
      const numBusinesses = empData ? empData.businesses.length : 0;
      return `${u.email},${u.password},${u.full_name},${u.phone},${u.id},${numBusinesses}`;
    })
  ].join('\n');
  fs.writeFileSync(path.join(outputDir, '3-empleados.csv'), employeesCSV, 'utf-8');  // CSV 4: Solo clientes
  const clients = generatedUsers.filter(u => u.role === 'client');
  const clientsCSV = [
    'email,password,full_name,phone,user_id',
    ...clients.map(u => 
      `${u.email},${u.password},${u.full_name},${u.phone},${u.id}`
    )
  ].join('\n');
  fs.writeFileSync(path.join(outputDir, '4-clientes.csv'), clientsCSV, 'utf-8');  // CSV 5: Negocios
  const businessesCSV = [
    'business_id,name,owner_email,category,subcategory,city,department,description',
    ...generatedBusinesses.map(b => {
      const owner = generatedUsers.find(u => u.id === b.owner_id);
      return `${b.id},${b.name},${owner?.email || ''},${b.category},${b.subcategory},${b.city},${b.department},"${b.description}"`;
    })
  ].join('\n');
  fs.writeFileSync(path.join(outputDir, '5-negocios.csv'), businessesCSV, 'utf-8');  // CSV 6: Sedes
  const locationsCSV = [
    'location_id,business_id,name,address,city,phone,opens_at,closes_at',
    ...generatedLocations.map(l => 
      `${l.id},${l.business_id},${l.name},"${l.address}",${l.city},${l.phone},${l.opens_at},${l.closes_at}`
    )
  ].join('\n');
  fs.writeFileSync(path.join(outputDir, '6-sedes.csv'), locationsCSV, 'utf-8');  // CSV 7: Servicios
  const servicesCSV = [
    'service_id,business_id,name,description,duration_minutes,price_cop,category',
    ...generatedServices.map(s => 
      `${s.id},${s.business_id},${s.name},"${s.description}",${s.duration},${s.price},${s.category}`
    )
  ].join('\n');
  fs.writeFileSync(path.join(outputDir, '7-servicios.csv'), servicesCSV, 'utf-8');}

// Ejecutar script
await main().catch(console.error);
