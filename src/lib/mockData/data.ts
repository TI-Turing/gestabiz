// ============================================================
// MOCK DATA — All entity data
// ============================================================
import {
  OWNER_ID, BUSINESS_ID, LOCATION_IDS, EMPLOYEE_IDS,
  SERVICE_IDS, CLIENT_IDS, RESOURCE_IDS, VACANCY_IDS, CONVERSATION_IDS,
} from './ids'
import {
  daysAgo, daysFromNow, todayAt, dateAt, monthStart, mockUUID,
} from './helpers'

// ─── Avatars & Images ─────────────────────────────────────────
// Gender-aware avatars: randomuser.me/portraits/{women|men}/{N}.jpg
const maleAvatar = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`
const femaleAvatar = (n: number) => `https://randomuser.me/api/portraits/women/${n}.jpg`
const AVATARS: Record<string, string> = {
  // Owner
  'carlos-owner': maleAvatar(32),
  // Employees
  'valentina-morales': femaleAvatar(44),
  'sebastian-velasco': maleAvatar(45),
  'camila-rios': femaleAvatar(68),
  'andres-mejia': maleAvatar(75),
  // Clients — female
  [CLIENT_IDS.MARIANA]: femaleAvatar(1),
  [CLIENT_IDS.SOFIA]: femaleAvatar(12),
  [CLIENT_IDS.DANIELA]: femaleAvatar(23),
  [CLIENT_IDS.CAROLINA]: femaleAvatar(34),
  [CLIENT_IDS.ISABELLA]: femaleAvatar(45),
  [CLIENT_IDS.LAURA]: femaleAvatar(56),
  [CLIENT_IDS.PAULA]: femaleAvatar(67),
  [CLIENT_IDS.ANDREA]: femaleAvatar(78),
  [CLIENT_IDS.JULIANA]: femaleAvatar(85),
  [CLIENT_IDS.FERNANDA]: femaleAvatar(90),
  [CLIENT_IDS.CATALINA]: femaleAvatar(95),
  // Clients — male
  [CLIENT_IDS.ALEJANDRO]: maleAvatar(11),
  [CLIENT_IDS.NICOLAS]: maleAvatar(22),
  [CLIENT_IDS.MIGUEL]: maleAvatar(33),
  [CLIENT_IDS.RICARDO]: maleAvatar(55),
  // Applicants
  'applicant-001': femaleAvatar(15),  // María Fernanda
  'applicant-002': femaleAvatar(26),  // Lucía
  'applicant-003': maleAvatar(18),    // Diego
  'applicant-004': femaleAvatar(37),  // Laura
  'applicant-005': femaleAvatar(48),  // Natalia
}
const avatar = (seed: string) => AVATARS[seed] || `https://randomuser.me/api/portraits/lego/${Math.abs(seed.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)) % 10}.jpg`
const svcImg = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`

// ─── PROFILES ────────────────────────────────────────────────
export const profiles = [
  {
    id: OWNER_ID,
    email: 'carlos.mendoza@elitewellness.co',
    full_name: 'Carlos Mendoza',
    avatar_url: avatar('carlos-owner'),
    phone: '+57 300 123 4567',
    is_active: true,
    created_at: daysAgo(365),
    updated_at: daysAgo(1),
  },
  {
    id: EMPLOYEE_IDS.VALENTINA,
    email: 'valentina.morales@elitewellness.co',
    full_name: 'Valentina Morales',
    avatar_url: avatar('valentina-morales'),
    phone: '+57 301 234 5678',
    is_active: true,
    created_at: daysAgo(300),
    updated_at: daysAgo(2),
  },
  {
    id: EMPLOYEE_IDS.SEBASTIAN,
    email: 'sebastian.velasco@elitewellness.co',
    full_name: 'Sebastián Velasco',
    avatar_url: avatar('sebastian-velasco'),
    phone: '+57 302 345 6789',
    is_active: true,
    created_at: daysAgo(280),
    updated_at: daysAgo(3),
  },
  {
    id: EMPLOYEE_IDS.CAMILA,
    email: 'camila.rios@elitewellness.co',
    full_name: 'Camila Ríos',
    avatar_url: avatar('camila-rios'),
    phone: '+57 303 456 7890',
    is_active: true,
    created_at: daysAgo(250),
    updated_at: daysAgo(1),
  },
  {
    id: EMPLOYEE_IDS.ANDRES,
    email: 'andres.mejia@elitewellness.co',
    full_name: 'Andrés Mejía',
    avatar_url: avatar('andres-mejia'),
    phone: '+57 304 567 8901',
    is_active: true,
    created_at: daysAgo(200),
    updated_at: daysAgo(5),
  },
  // Clients
  ...[
    { id: CLIENT_IDS.MARIANA, name: 'Mariana López', email: 'mariana.lopez@gmail.com' },
    { id: CLIENT_IDS.SOFIA, name: 'Sofía Hernández', email: 'sofia.hernandez@outlook.com' },
    { id: CLIENT_IDS.DANIELA, name: 'Daniela Torres', email: 'daniela.torres@gmail.com' },
    { id: CLIENT_IDS.CAROLINA, name: 'Carolina Gutiérrez', email: 'carolina.g@hotmail.com' },
    { id: CLIENT_IDS.ISABELLA, name: 'Isabella Rojas', email: 'isabella.rojas@yahoo.com' },
    { id: CLIENT_IDS.LAURA, name: 'Laura Martínez', email: 'laura.martinez@gmail.com' },
    { id: CLIENT_IDS.PAULA, name: 'Paula Vargas', email: 'paula.vargas@outlook.com' },
    { id: CLIENT_IDS.ALEJANDRO, name: 'Alejandro Ramírez', email: 'alejandro.r@gmail.com' },
    { id: CLIENT_IDS.NICOLAS, name: 'Nicolás Castaño', email: 'nicolas.castano@gmail.com' },
    { id: CLIENT_IDS.MIGUEL, name: 'Miguel Ángel Pardo', email: 'miguel.pardo@outlook.com' },
    { id: CLIENT_IDS.ANDREA, name: 'Andrea Salazar', email: 'andrea.salazar@gmail.com' },
    { id: CLIENT_IDS.JULIANA, name: 'Juliana Ospina', email: 'juliana.ospina@yahoo.com' },
    { id: CLIENT_IDS.FERNANDA, name: 'Fernanda Muñoz', email: 'fernanda.m@gmail.com' },
    { id: CLIENT_IDS.CATALINA, name: 'Catalina Arias', email: 'catalina.arias@hotmail.com' },
    { id: CLIENT_IDS.RICARDO, name: 'Ricardo Duarte', email: 'ricardo.duarte@gmail.com' },
  ].map(c => ({
    id: c.id,
    email: c.email,
    full_name: c.name,
    avatar_url: avatar(c.id),
    phone: `+57 3${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    is_active: true,
    created_at: daysAgo(Math.floor(90 + Math.random() * 200)),
    updated_at: daysAgo(Math.floor(Math.random() * 10)),
  })),
]

// ─── BUSINESSES ──────────────────────────────────────────────
export const businesses = [
  {
    id: BUSINESS_ID,
    name: 'Élite Wellness & Spa',
    description: 'Centro de bienestar integral con los mejores profesionales de Medellín. Ofrecemos tratamientos de spa, estética, peluquería y terapias corporales en un ambiente de lujo y relajación.',
    logo_url: svcImg('elite-wellness-logo'),
    banner_url: svcImg('spa-relaxation-wellness'),
    owner_id: OWNER_ID,
    slug: 'elite-wellness-spa-medellin',
    category_id: 'cat-health-wellness',
    category: { id: 'cat-health-wellness', name: 'Salud y Bienestar', slug: 'salud-bienestar' },
    subcategories: [
      { id: 'sub-1', subcategory: { name: 'Spa & Masajes' } },
      { id: 'sub-2', subcategory: { name: 'Estética Facial' } },
      { id: 'sub-3', subcategory: { name: 'Peluquería' } },
    ],
    resource_model: 'hybrid',
    average_rating: 4.85,
    review_count: 127,
    is_active: true,
    settings: {
      currency: 'COP',
      timezone: 'America/Bogota',
      language: 'es',
      vacation_days_per_year: 15,
      require_absence_approval: true,
      allow_same_day_absence: false,
      max_advance_vacation_request_days: 90,
    },
    created_at: daysAgo(365),
    updated_at: daysAgo(1),
  },
]

// ─── LOCATIONS ───────────────────────────────────────────────
export const locations = [
  {
    id: LOCATION_IDS.POBLADO,
    business_id: BUSINESS_ID,
    name: 'Sede El Poblado',
    address: 'Cra 43A #7-50, Torre Élite Piso 3',
    city: 'Medellín',
    state: 'Antioquia',
    country: 'Colombia',
    phone: '+57 604 312 4500',
    email: 'poblado@elitewellness.co',
    opens_at: '07:00',
    closes_at: '21:00',
    is_active: true,
    images: [svcImg('spa-lobby-poblado'), svcImg('spa-room-poblado')],
    amenities: ['WiFi', 'Estacionamiento', 'Café de cortesía', 'Sala VIP', 'Duchas'],
    capacity: 12,
    created_at: daysAgo(365),
    updated_at: daysAgo(10),
  },
  {
    id: LOCATION_IDS.LAURELES,
    business_id: BUSINESS_ID,
    name: 'Sede Laureles',
    address: 'Cra 76 #33-18, Centro Comercial Unicentro Local 205',
    city: 'Medellín',
    state: 'Antioquia',
    country: 'Colombia',
    phone: '+57 604 413 5600',
    email: 'laureles@elitewellness.co',
    opens_at: '08:00',
    closes_at: '20:00',
    is_active: true,
    images: [svcImg('spa-lobby-laureles')],
    amenities: ['WiFi', 'Estacionamiento', 'Café de cortesía'],
    capacity: 8,
    created_at: daysAgo(200),
    updated_at: daysAgo(5),
  },
]

// ─── SERVICES ────────────────────────────────────────────────
const SVC = SERVICE_IDS
export const services = [
  { id: SVC.MASAJE_RELAJANTE, name: 'Masaje Relajante', description: 'Masaje terapéutico de cuerpo completo con aceites esenciales para aliviar tensión y estrés.', duration: 60, price: 120000, category: 'massage', image_url: svcImg('spa'), color: '#7c3aed', tags: ['relajación', 'estrés', 'bienestar'] },
  { id: SVC.MASAJE_DEPORTIVO, name: 'Masaje Deportivo', description: 'Terapia muscular profunda especializada para deportistas y personas activas.', duration: 45, price: 100000, category: 'massage', image_url: svcImg('therapy'), color: '#2563eb', tags: ['deporte', 'muscular', 'recuperación'] },
  { id: SVC.FACIAL_PREMIUM, name: 'Facial Premium Anti-Edad', description: 'Tratamiento facial avanzado con ácido hialurónico, vitamina C y radiofrecuencia.', duration: 75, price: 150000, category: 'facial', image_url: svcImg('face'), color: '#ec4899', tags: ['anti-edad', 'rejuvenecimiento', 'premium'] },
  { id: SVC.CORTE_CABELLO, name: 'Corte & Estilizado', description: 'Corte de cabello personalizado con lavado, secado y estilizado profesional.', duration: 30, price: 55000, category: 'hair', image_url: svcImg('haircut'), color: '#f59e0b', tags: ['corte', 'estilo', 'moda'] },
  { id: SVC.COLORACION, name: 'Coloración Completa', description: 'Coloración profesional con productos premium. Incluye lavado, aplicación y secado.', duration: 120, price: 185000, category: 'hair', image_url: svcImg('hair'), color: '#ef4444', tags: ['color', 'tinte', 'moda'] },
  { id: SVC.MANICURE_PEDICURE, name: 'Manicure & Pedicure Spa', description: 'Tratamiento completo de manos y pies con exfoliación, hidratación y esmaltado.', duration: 60, price: 70000, category: 'nails', image_url: svcImg('nails'), color: '#14b8a6', tags: ['uñas', 'manos', 'pies'] },
  { id: SVC.TRATAMIENTO_CAPILAR, name: 'Tratamiento Capilar Intensivo', description: 'Hidratación profunda con keratina brasileña para cabello brillante y sedoso.', duration: 45, price: 95000, category: 'hair', image_url: svcImg('hair-care'), color: '#8b5cf6', tags: ['keratina', 'hidratación', 'brillo'] },
  { id: SVC.DEPILACION_LASER, name: 'Depilación Láser', description: 'Depilación definitiva con tecnología láser de diodo de última generación.', duration: 30, price: 95000, category: 'body', image_url: svcImg('laser'), color: '#06b6d4', tags: ['láser', 'definitiva', 'tecnología'] },
  { id: SVC.MICROBLADING, name: 'Microblading Cejas', description: 'Micropigmentación de cejas pelo a pelo para un aspecto natural y definido.', duration: 90, price: 280000, category: 'beauty', image_url: svcImg('eyebrows'), color: '#d946ef', tags: ['cejas', 'micropigmentación', 'definición'] },
  { id: SVC.LIMPIEZA_FACIAL, name: 'Limpieza Facial Profunda', description: 'Limpieza facial con extracción, mascarilla purificante y alta frecuencia.', duration: 60, price: 85000, category: 'facial', image_url: svcImg('skincare'), color: '#22c55e', tags: ['limpieza', 'piel', 'purificante'] },
].map(s => ({
  ...s,
  duration_minutes: s.duration,
  business_id: BUSINESS_ID,
  currency: 'COP',
  is_active: true,
  created_at: daysAgo(300),
  updated_at: daysAgo(Math.floor(Math.random() * 30)),
}))

// ─── BUSINESS EMPLOYEES ──────────────────────────────────────
const EMP = EMPLOYEE_IDS
export const business_employees = [
  // Owner auto-registered as manager
  {
    id: mockUUID(), business_id: BUSINESS_ID, employee_id: OWNER_ID,
    role: 'manager', employee_type: 'location_manager', status: 'approved',
    is_active: true, hire_date: daysAgo(365),
    lunch_break_start: '12:00', lunch_break_end: '13:00',
    allow_client_messages: true, salary_base: 0, salary_type: 'fixed',
    created_at: daysAgo(365), updated_at: daysAgo(1),
  },
  {
    id: mockUUID(), business_id: BUSINESS_ID, employee_id: EMP.VALENTINA,
    role: 'employee', employee_type: 'specialist', status: 'approved',
    is_active: true, hire_date: daysAgo(300),
    lunch_break_start: '12:00', lunch_break_end: '13:00',
    allow_client_messages: true, salary_base: 2800000, salary_type: 'fixed',
    location_id: LOCATION_IDS.POBLADO, reports_to: OWNER_ID, setup_completed: true,
    created_at: daysAgo(300), updated_at: daysAgo(2),
  },
  {
    id: mockUUID(), business_id: BUSINESS_ID, employee_id: EMP.SEBASTIAN,
    role: 'employee', employee_type: 'professional', status: 'approved',
    is_active: true, hire_date: daysAgo(280),
    lunch_break_start: '13:00', lunch_break_end: '14:00',
    allow_client_messages: true, salary_base: 2500000, salary_type: 'commission',
    location_id: LOCATION_IDS.POBLADO, reports_to: OWNER_ID, setup_completed: true,
    created_at: daysAgo(280), updated_at: daysAgo(3),
  },
  {
    id: mockUUID(), business_id: BUSINESS_ID, employee_id: EMP.CAMILA,
    role: 'employee', employee_type: 'specialist', status: 'approved',
    is_active: true, hire_date: daysAgo(250),
    lunch_break_start: '12:30', lunch_break_end: '13:30',
    allow_client_messages: true, salary_base: 2600000, salary_type: 'fixed',
    location_id: LOCATION_IDS.POBLADO, reports_to: OWNER_ID, setup_completed: true,
    created_at: daysAgo(250), updated_at: daysAgo(1),
  },
  {
    id: mockUUID(), business_id: BUSINESS_ID, employee_id: EMP.ANDRES,
    role: 'employee', employee_type: 'professional', status: 'approved',
    is_active: true, hire_date: daysAgo(200),
    lunch_break_start: '12:00', lunch_break_end: '13:00',
    allow_client_messages: true, salary_base: 2400000, salary_type: 'fixed',
    location_id: LOCATION_IDS.POBLADO, reports_to: OWNER_ID, setup_completed: true,
    created_at: daysAgo(200), updated_at: daysAgo(5),
  },
]

// ─── EMPLOYEE SERVICES (M:N) ────────────────────────────────
export const employee_services = [
  // Valentina: masajes
  { id: mockUUID(), employee_id: EMP.VALENTINA, service_id: SVC.MASAJE_RELAJANTE, created_at: daysAgo(300) },
  { id: mockUUID(), employee_id: EMP.VALENTINA, service_id: SVC.MASAJE_DEPORTIVO, created_at: daysAgo(300) },
  { id: mockUUID(), employee_id: EMP.VALENTINA, service_id: SVC.DEPILACION_LASER, created_at: daysAgo(200) },
  // Sebastián: cabello
  { id: mockUUID(), employee_id: EMP.SEBASTIAN, service_id: SVC.CORTE_CABELLO, created_at: daysAgo(280) },
  { id: mockUUID(), employee_id: EMP.SEBASTIAN, service_id: SVC.COLORACION, created_at: daysAgo(280) },
  { id: mockUUID(), employee_id: EMP.SEBASTIAN, service_id: SVC.TRATAMIENTO_CAPILAR, created_at: daysAgo(280) },
  // Camila: faciales & belleza
  { id: mockUUID(), employee_id: EMP.CAMILA, service_id: SVC.FACIAL_PREMIUM, created_at: daysAgo(250) },
  { id: mockUUID(), employee_id: EMP.CAMILA, service_id: SVC.LIMPIEZA_FACIAL, created_at: daysAgo(250) },
  { id: mockUUID(), employee_id: EMP.CAMILA, service_id: SVC.MICROBLADING, created_at: daysAgo(250) },
  { id: mockUUID(), employee_id: EMP.CAMILA, service_id: SVC.MANICURE_PEDICURE, created_at: daysAgo(200) },
  // Andrés: terapias corporales
  { id: mockUUID(), employee_id: EMP.ANDRES, service_id: SVC.MASAJE_RELAJANTE, created_at: daysAgo(200) },
  { id: mockUUID(), employee_id: EMP.ANDRES, service_id: SVC.MASAJE_DEPORTIVO, created_at: daysAgo(200) },
  { id: mockUUID(), employee_id: EMP.ANDRES, service_id: SVC.DEPILACION_LASER, created_at: daysAgo(200) },
  { id: mockUUID(), employee_id: EMP.ANDRES, service_id: SVC.MANICURE_PEDICURE, created_at: daysAgo(150) },
]

// ─── LOCATION SERVICES ──────────────────────────────────────
export const location_services = Object.values(SERVICE_IDS).flatMap(svcId => [
  { id: mockUUID(), location_id: LOCATION_IDS.POBLADO, service_id: svcId, is_active: true },
  { id: mockUUID(), location_id: LOCATION_IDS.LAURELES, service_id: svcId, is_active: true },
])

// ─── BUSINESS ROLES ──────────────────────────────────────────
export const business_roles = [
  { id: mockUUID(), business_id: BUSINESS_ID, user_id: OWNER_ID, role: 'admin', employee_type: 'service_provider', is_active: true, assigned_at: daysAgo(365), created_at: daysAgo(365), profiles: { id: OWNER_ID, full_name: 'Carlos Mendoza', email: 'carlos.mendoza@elitewellness.co', avatar_url: avatar('carlos-owner') } },
  { id: mockUUID(), business_id: BUSINESS_ID, user_id: EMP.VALENTINA, role: 'employee', employee_type: 'service_provider', is_active: true, assigned_at: daysAgo(300), reports_to: OWNER_ID, created_at: daysAgo(300), profiles: { id: EMP.VALENTINA, full_name: 'Valentina Morales', email: 'valentina.morales@elitewellness.co', avatar_url: avatar('valentina-morales') } },
  { id: mockUUID(), business_id: BUSINESS_ID, user_id: EMP.SEBASTIAN, role: 'employee', employee_type: 'service_provider', is_active: true, assigned_at: daysAgo(280), reports_to: OWNER_ID, created_at: daysAgo(280), profiles: { id: EMP.SEBASTIAN, full_name: 'Sebastián Velasco', email: 'sebastian.velasco@elitewellness.co', avatar_url: avatar('sebastian-velasco') } },
  { id: mockUUID(), business_id: BUSINESS_ID, user_id: EMP.CAMILA, role: 'employee', employee_type: 'service_provider', is_active: true, assigned_at: daysAgo(250), reports_to: OWNER_ID, created_at: daysAgo(250), profiles: { id: EMP.CAMILA, full_name: 'Camila Ríos', email: 'camila.rios@elitewellness.co', avatar_url: avatar('camila-rios') } },
  { id: mockUUID(), business_id: BUSINESS_ID, user_id: EMP.ANDRES, role: 'employee', employee_type: 'service_provider', is_active: true, assigned_at: daysAgo(200), reports_to: OWNER_ID, created_at: daysAgo(200), profiles: { id: EMP.ANDRES, full_name: 'Andrés Mejía', email: 'andres.mejia@elitewellness.co', avatar_url: avatar('andres-mejia') } },
]

// ─── BUSINESS CATEGORIES ─────────────────────────────────────
export const business_categories = [
  { id: 'cat-health-wellness', name: 'Salud y Bienestar', slug: 'salud-bienestar', icon: 'Heart', is_active: true },
  { id: 'cat-beauty', name: 'Belleza', slug: 'belleza', icon: 'Sparkle', is_active: true },
  { id: 'cat-fitness', name: 'Fitness y Deporte', slug: 'fitness', icon: 'Barbell', is_active: true },
]

// ─── APPOINTMENTS ────────────────────────────────────────────
interface ApptTemplate {
  employeeId: string; serviceId: string; serviceName: string;
  price: number; duration: number; locationId: string;
}

const APPT_TEMPLATES: ApptTemplate[] = [
  { employeeId: EMP.VALENTINA, serviceId: SVC.MASAJE_RELAJANTE, serviceName: 'Masaje Relajante', price: 120000, duration: 60, locationId: LOCATION_IDS.POBLADO },
  { employeeId: EMP.VALENTINA, serviceId: SVC.MASAJE_DEPORTIVO, serviceName: 'Masaje Deportivo', price: 100000, duration: 45, locationId: LOCATION_IDS.POBLADO },
  { employeeId: EMP.VALENTINA, serviceId: SVC.DEPILACION_LASER, serviceName: 'Depilación Láser', price: 95000, duration: 30, locationId: LOCATION_IDS.POBLADO },
  { employeeId: EMP.SEBASTIAN, serviceId: SVC.CORTE_CABELLO, serviceName: 'Corte & Estilizado', price: 55000, duration: 30, locationId: LOCATION_IDS.POBLADO },
  { employeeId: EMP.SEBASTIAN, serviceId: SVC.COLORACION, serviceName: 'Coloración Completa', price: 185000, duration: 120, locationId: LOCATION_IDS.LAURELES },
  { employeeId: EMP.SEBASTIAN, serviceId: SVC.TRATAMIENTO_CAPILAR, serviceName: 'Tratamiento Capilar', price: 95000, duration: 45, locationId: LOCATION_IDS.POBLADO },
  { employeeId: EMP.CAMILA, serviceId: SVC.FACIAL_PREMIUM, serviceName: 'Facial Premium Anti-Edad', price: 150000, duration: 75, locationId: LOCATION_IDS.POBLADO },
  { employeeId: EMP.CAMILA, serviceId: SVC.LIMPIEZA_FACIAL, serviceName: 'Limpieza Facial Profunda', price: 85000, duration: 60, locationId: LOCATION_IDS.LAURELES },
  { employeeId: EMP.CAMILA, serviceId: SVC.MICROBLADING, serviceName: 'Microblading Cejas', price: 280000, duration: 90, locationId: LOCATION_IDS.POBLADO },
  { employeeId: EMP.ANDRES, serviceId: SVC.MASAJE_RELAJANTE, serviceName: 'Masaje Relajante', price: 120000, duration: 60, locationId: LOCATION_IDS.LAURELES },
  { employeeId: EMP.ANDRES, serviceId: SVC.MASAJE_DEPORTIVO, serviceName: 'Masaje Deportivo', price: 100000, duration: 45, locationId: LOCATION_IDS.LAURELES },
  { employeeId: EMP.ANDRES, serviceId: SVC.MANICURE_PEDICURE, serviceName: 'Manicure & Pedicure Spa', price: 70000, duration: 60, locationId: LOCATION_IDS.LAURELES },
]

const ALL_CLIENT_IDS: string[] = Object.values(CLIENT_IDS)
const CLIENT_NAMES: Record<string, string> = {}
profiles.filter(p => ALL_CLIENT_IDS.includes(p.id)).forEach(p => { CLIENT_NAMES[p.id] = p.full_name })

function generateAppointments() {
  const result: Record<string, unknown>[] = []
  let idx = 0

  // TODAY: 8 appointments (busy day!)
  const todaySlots = [8, 9, 10, 11, 14, 15, 16, 17]
  for (const hour of todaySlots) {
    const tmpl = APPT_TEMPLATES[idx % APPT_TEMPLATES.length]
    const clientId = ALL_CLIENT_IDS[idx % ALL_CLIENT_IDS.length]
    const startTime = todayAt(hour, 0)
    const endDate = new Date(startTime)
    endDate.setMinutes(endDate.getMinutes() + tmpl.duration)
    result.push({
      id: mockUUID(),
      business_id: BUSINESS_ID,
      location_id: tmpl.locationId,
      service_id: tmpl.serviceId,
      employee_id: tmpl.employeeId,
      client_id: clientId,
      client_name: CLIENT_NAMES[clientId] || 'Cliente',
      start_time: startTime,
      end_time: endDate.toISOString(),
      status: hour < 12 ? 'completed' : (hour < 15 ? 'confirmed' : 'pending'),
      price: tmpl.price,
      currency: 'COP',
      notes: null,
      is_location_exception: false,
      created_at: daysAgo(3),
      updated_at: todayAt(7, 0),
      // Joins
      service: services.find(s => s.id === tmpl.serviceId),
      location: locations.find(l => l.id === tmpl.locationId),
      employee: profiles.find(p => p.id === tmpl.employeeId),
      client: profiles.find(p => p.id === clientId),
    })
    idx++
  }

  // UPCOMING (next 7 days): 5 appointments per day
  for (let day = 1; day <= 7; day++) {
    const hoursPool = [8, 9, 10, 11, 14, 15, 16, 17, 18]
    for (let j = 0; j < 5; j++) {
      const tmpl = APPT_TEMPLATES[(idx + j) % APPT_TEMPLATES.length]
      const clientId = ALL_CLIENT_IDS[(idx + j) % ALL_CLIENT_IDS.length]
      const hour = hoursPool[j % hoursPool.length]
      const startTime = dateAt(day, hour)
      const endDate = new Date(startTime)
      endDate.setMinutes(endDate.getMinutes() + tmpl.duration)
      result.push({
        id: mockUUID(),
        business_id: BUSINESS_ID,
        location_id: tmpl.locationId,
        service_id: tmpl.serviceId,
        employee_id: tmpl.employeeId,
        client_id: clientId,
        client_name: CLIENT_NAMES[clientId] || 'Cliente',
        start_time: startTime,
        end_time: endDate.toISOString(),
        status: j === 0 ? 'confirmed' : 'pending',
        price: tmpl.price,
        currency: 'COP',
        notes: null,
        is_location_exception: false,
        created_at: daysAgo(Math.floor(Math.random() * 5)),
        updated_at: daysAgo(0),
        service: services.find(s => s.id === tmpl.serviceId),
        location: locations.find(l => l.id === tmpl.locationId),
        employee: profiles.find(p => p.id === tmpl.employeeId),
        client: profiles.find(p => p.id === clientId),
      })
    }
    idx += 5
  }

  // PAST (last 30 days): 6 per day = ~180 appointments
  for (let day = 1; day <= 30; day++) {
    const count = 4 + (day % 3) // 4-6 per day
    for (let j = 0; j < count; j++) {
      const tmpl = APPT_TEMPLATES[(idx + j) % APPT_TEMPLATES.length]
      const clientId = ALL_CLIENT_IDS[(idx + j) % ALL_CLIENT_IDS.length]
      const hour = 8 + j * 2
      const startTime = dateAt(-day, hour)
      const endDate = new Date(startTime)
      endDate.setMinutes(endDate.getMinutes() + tmpl.duration)
      const isCancelled = day % 10 === 0 && j === 0
      result.push({
        id: mockUUID(),
        business_id: BUSINESS_ID,
        location_id: tmpl.locationId,
        service_id: tmpl.serviceId,
        employee_id: tmpl.employeeId,
        client_id: clientId,
        client_name: CLIENT_NAMES[clientId] || 'Cliente',
        start_time: startTime,
        end_time: endDate.toISOString(),
        status: isCancelled ? 'cancelled' : 'completed',
        price: tmpl.price,
        currency: 'COP',
        notes: null,
        is_location_exception: false,
        created_at: dateAt(-day - 2, 10),
        updated_at: dateAt(-day, hour + 1),
        service: services.find(s => s.id === tmpl.serviceId),
        location: locations.find(l => l.id === tmpl.locationId),
        employee: profiles.find(p => p.id === tmpl.employeeId),
        client: profiles.find(p => p.id === clientId),
      })
    }
    idx += 6
  }

  // Enrich with PostgREST join aliases used by various components
  return result.map(apt => ({
    ...apt,
    // AppointmentsCalendar expects "services" (plural, table name)
    services: apt.service,
    // AppointmentCard expects these PostgREST join aliases
    businesses: businesses[0],
    profiles: apt.employee,
    // Additional fields the calendar reads
    confirmed: apt.status === 'confirmed',
    payment_status: 'paid',
    gross_amount: apt.price,
    commission_amount: 0,
    net_amount: apt.price,
    other_deductions: 0,
  }))
}

export const appointments = generateAppointments()

// ─── TRANSACTIONS (6 months for charts) ─────────────────────
const INCOME_CATEGORIES = ['service_sale', 'product_sale', 'commission', 'gift_card', 'tip']

// Fixed monthly expenses (realistic for Medellín spa, 2 locations)
const MONTHLY_EXPENSES: Array<{ category: string; amount: number; loc: 0 | 1; desc: string }> = [
  { category: 'rent', amount: 2800000, loc: 0, desc: 'Arriendo Sede El Poblado' },
  { category: 'rent', amount: 2200000, loc: 1, desc: 'Arriendo Sede Laureles' },
  { category: 'utilities', amount: 320000, loc: 0, desc: 'Servicios públicos El Poblado' },
  { category: 'utilities', amount: 280000, loc: 1, desc: 'Servicios públicos Laureles' },
  { category: 'supplies', amount: 420000, loc: 0, desc: 'Insumos y productos profesionales' },
  { category: 'marketing', amount: 350000, loc: 0, desc: 'Publicidad digital y redes sociales' },
  { category: 'insurance', amount: 180000, loc: 0, desc: 'Seguro empresarial' },
  { category: 'software', amount: 120000, loc: 0, desc: 'Licencias de software' },
  { category: 'cleaning', amount: 150000, loc: 0, desc: 'Servicio de aseo' },
  { category: 'cleaning', amount: 150000, loc: 1, desc: 'Servicio de aseo' },
  { category: 'maintenance', amount: 200000, loc: 0, desc: 'Mantenimiento equipos' },
]
// Total expenses: ~$7,170,000/month

function generateTransactions() {
  const result: Record<string, unknown>[] = []
  const employeeIds = Object.values(EMPLOYEE_IDS)
  const locationIds = [LOCATION_IDS.POBLADO, LOCATION_IDS.LAURELES]

  // Seeded pseudo-random for deterministic amounts
  let seed = 42
  const nextRand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff }

  for (let monthBack = 0; monthBack < 6; monthBack++) {
    // Growth factor: older months have less revenue (shows growth trend)
    const growthFactor = 0.75 + (0.25 * (5 - monthBack) / 5)
    const baseMonthlyIncome = Math.floor(13500000 * growthFactor)

    // 18-22 income transactions per month (service appointments + product sales)
    const incomeCount = 18 + (monthBack % 3) * 2
    const clientNames = Object.values(CLIENT_NAMES)
    const serviceNames = ['Masaje Relajante', 'Corte & Estilizado', 'Facial Premium', 'Coloración Completa', 'Limpieza Facial', 'Masaje Deportivo', 'Microblading', 'Depilación Láser', 'Tratamiento Capilar', 'Manicure & Pedicure']
    for (let i = 0; i < incomeCount; i++) {
      const dayInMonth = 1 + (i * 1.4) % 28
      const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - monthBack, Math.floor(dayInMonth))
      const variance = 0.7 + nextRand() * 0.6
      const amount = Math.floor((baseMonthlyIncome / incomeCount) * variance)
      const locIdx = i % 2
      const clientName = clientNames[i % clientNames.length] || 'Walk-in'
      const serviceName = serviceNames[i % serviceNames.length]
      result.push({
        id: mockUUID(),
        business_id: BUSINESS_ID,
        location_id: locationIds[locIdx],
        type: 'income',
        category: INCOME_CATEGORIES[i % INCOME_CATEGORIES.length],
        amount,
        currency: 'COP',
        description: serviceName,
        transaction_date: monthDate.toISOString(),
        payment_method: i % 3 === 0 ? 'cash' : (i % 3 === 1 ? 'card' : 'transfer'),
        is_verified: monthBack > 0,
        employee_id: employeeIds[i % employeeIds.length],
        metadata: { client_name: clientName, client_phone: `+57 30${i % 5}${Math.floor(1000000 + nextRand() * 9000000)}` },
        subtotal: Math.floor(amount / 1.19),
        tax_type: 'IVA',
        tax_rate: 19,
        tax_amount: Math.floor(amount - amount / 1.19),
        fiscal_period: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
        created_at: monthDate.toISOString(),
        updated_at: monthDate.toISOString(),
        location: locations.find(l => l.id === locationIds[locIdx]),
      })
    }

    // Fixed monthly expenses (no random duplication, realistic amounts)
    for (let i = 0; i < MONTHLY_EXPENSES.length; i++) {
      const exp = MONTHLY_EXPENSES[i]
      const dayInMonth = 1 + (i * 2.5) % 28
      const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - monthBack, Math.floor(dayInMonth))
      result.push({
        id: mockUUID(),
        business_id: BUSINESS_ID,
        location_id: locationIds[exp.loc],
        type: 'expense',
        category: exp.category,
        amount: exp.amount,
        currency: 'COP',
        description: exp.desc,
        transaction_date: monthDate.toISOString(),
        payment_method: 'transfer',
        is_verified: true,
        employee_id: null,
        subtotal: exp.amount,
        tax_type: null,
        tax_rate: 0,
        tax_amount: 0,
        fiscal_period: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
        created_at: monthDate.toISOString(),
        updated_at: monthDate.toISOString(),
        location: locations.find(l => l.id === locationIds[exp.loc]),
      })
    }
  }

  return result
}

export const transactions = generateTransactions()

// ─── RECURRING EXPENSES ──────────────────────────────────────
export const recurring_expenses = [
  { id: mockUUID(), business_id: BUSINESS_ID, name: 'Software CRM + Gestabiz', category: 'software', amount: 189000, currency: 'COP', recurrence_frequency: 'monthly', next_payment_date: daysFromNow(12), is_active: true, total_paid: 2268000, location_id: null, created_at: daysAgo(365) },
  { id: mockUUID(), business_id: BUSINESS_ID, name: 'Suscripción Mailchimp', category: 'marketing', amount: 95000, currency: 'COP', recurrence_frequency: 'monthly', next_payment_date: daysFromNow(18), is_active: true, total_paid: 1140000, location_id: null, created_at: daysAgo(300) },
  { id: mockUUID(), business_id: BUSINESS_ID, name: 'Hosting y dominio web', category: 'software', amount: 45000, currency: 'COP', recurrence_frequency: 'monthly', next_payment_date: daysFromNow(22), is_active: true, total_paid: 540000, location_id: null, created_at: daysAgo(365) },
]

// ─── IN-APP NOTIFICATIONS ────────────────────────────────────
export const in_app_notifications = [
  { id: mockUUID(), user_id: OWNER_ID, type: 'appointment_confirmed', title: 'Cita confirmada', message: 'Mariana López confirmó su cita de Masaje Relajante para hoy a las 2:00 PM.', data: { appointmentId: appointments[3]?.id, businessId: BUSINESS_ID }, status: 'unread', priority: 1, created_at: todayAt(7, 30) },
  { id: mockUUID(), user_id: OWNER_ID, type: 'new_review', title: 'Nueva reseña ★★★★★', message: 'Sofía Hernández dejó una reseña de 5 estrellas: "Increíble experiencia, el servicio fue excepcional..."', data: { businessId: BUSINESS_ID, rating: 5 }, status: 'unread', priority: 1, created_at: todayAt(6, 45) },
  { id: mockUUID(), user_id: OWNER_ID, type: 'absence_request', title: 'Solicitud de ausencia', message: 'Camila Ríos solicita vacaciones del 15 al 19 de este mes.', data: { businessId: BUSINESS_ID, employeeId: EMP.CAMILA }, status: 'unread', priority: 2, created_at: daysAgo(1) },
  { id: mockUUID(), user_id: OWNER_ID, type: 'new_application', title: 'Nueva aplicación a vacante', message: 'María Fernanda Gómez aplicó al puesto de Estilista Senior.', data: { businessId: BUSINESS_ID, vacancyId: VACANCY_IDS.ESTILISTA }, status: 'unread', priority: 1, created_at: daysAgo(1) },
  { id: mockUUID(), user_id: OWNER_ID, type: 'appointment_completed', title: 'Cita completada', message: 'La cita de Nicolás Castaño (Corte & Estilizado) fue completada por Sebastián Velasco.', data: { businessId: BUSINESS_ID }, status: 'read', priority: 0, created_at: todayAt(11, 30) },
  { id: mockUUID(), user_id: OWNER_ID, type: 'payment_received', title: 'Pago recibido', message: 'Se recibió un pago de $280.000 COP por Microblading - Carolina Gutiérrez.', data: { businessId: BUSINESS_ID, amount: 280000 }, status: 'read', priority: 0, created_at: daysAgo(1) },
  { id: mockUUID(), user_id: OWNER_ID, type: 'reminder', title: 'Recordatorio: 8 citas hoy', message: 'Tienes 8 citas programadas para hoy. La primera a las 8:00 AM.', data: { businessId: BUSINESS_ID }, status: 'read', priority: 1, created_at: todayAt(6, 0) },
  { id: mockUUID(), user_id: OWNER_ID, type: 'employee_request', title: 'Nuevo empleado solicitó unirse', message: 'Laura Posada ha solicitado unirse a tu equipo como Terapeuta Corporal.', data: { businessId: BUSINESS_ID }, status: 'read', priority: 1, created_at: daysAgo(2) },
  { id: mockUUID(), user_id: OWNER_ID, type: 'system', title: 'Actualización de plataforma', message: 'Gestabiz v2.5: Nuevas métricas de rendimiento disponibles en Reportes.', data: {}, status: 'read', priority: 0, created_at: daysAgo(3) },
  { id: mockUUID(), user_id: OWNER_ID, type: 'weekly_summary', title: 'Resumen semanal', message: 'Esta semana: 42 citas completadas, $5.230.000 en ingresos, 3 nuevas reseñas (promedio 4.9★).', data: { businessId: BUSINESS_ID }, status: 'read', priority: 0, created_at: daysAgo(7) },
]

// ─── EMPLOYEE ABSENCES ──────────────────────────────────────
// start_date / end_date must be YYYY-MM-DD (PostgreSQL date type) — component appends 'T00:00:00'
export const employee_absences = [
  { id: mockUUID(), business_id: BUSINESS_ID, employee_id: EMP.CAMILA, absence_type: 'vacation', start_date: daysFromNow(15).slice(0, 10), end_date: daysFromNow(19).slice(0, 10), reason: 'Vacaciones familiares programadas', employee_notes: 'Viaje familiar planificado con anticipación', admin_notes: null, status: 'pending', approved_by: null, approved_at: null, created_at: daysAgo(1), updated_at: daysAgo(1), employee: { full_name: 'Camila Ríos', email: 'camila.rios@elitewellness.co' } },
  { id: mockUUID(), business_id: BUSINESS_ID, employee_id: EMP.VALENTINA, absence_type: 'personal', start_date: daysFromNow(8).slice(0, 10), end_date: daysFromNow(9).slice(0, 10), reason: 'Cita médica programada', employee_notes: 'Revisión anual de salud', admin_notes: null, status: 'pending', approved_by: null, approved_at: null, created_at: daysAgo(2), updated_at: daysAgo(2), employee: { full_name: 'Valentina Morales', email: 'valentina.morales@elitewellness.co' } },
  { id: mockUUID(), business_id: BUSINESS_ID, employee_id: EMP.ANDRES, absence_type: 'sick_leave', start_date: daysAgo(5).slice(0, 10), end_date: daysAgo(3).slice(0, 10), reason: 'Gripe con incapacidad médica', employee_notes: 'Adjunto certificado médico', admin_notes: 'Verificado con soporte médico', status: 'approved', approved_by: OWNER_ID, approved_at: daysAgo(5), created_at: daysAgo(5), updated_at: daysAgo(5), employee: { full_name: 'Andrés Mejía', email: 'andres.mejia@elitewellness.co' } },
  { id: mockUUID(), business_id: BUSINESS_ID, employee_id: EMP.SEBASTIAN, absence_type: 'personal', start_date: daysAgo(15).slice(0, 10), end_date: daysAgo(15).slice(0, 10), reason: 'Diligencia personal', employee_notes: null, admin_notes: 'Solo un día, aprobado', status: 'approved', approved_by: OWNER_ID, approved_at: daysAgo(14), created_at: daysAgo(16), updated_at: daysAgo(14), employee: { full_name: 'Sebastián Velasco', email: 'sebastian.velasco@elitewellness.co' } },
]

export const absence_approval_requests = employee_absences.map(a => ({
  ...a,
  employeeId: a.employee_id,
  employeeName: profiles.find(p => p.id === a.employee_id)?.full_name || '',
  employeeEmail: profiles.find(p => p.id === a.employee_id)?.email || '',
  daysRequested: Math.ceil((new Date(a.end_date).getTime() - new Date(a.start_date).getTime()) / 86400000) + 1,
}))

export const vacation_balance = [
  { id: mockUUID(), employee_id: EMP.VALENTINA, business_id: BUSINESS_ID, year: new Date().getFullYear(), total_days_available: 15, days_used: 5, days_pending: 0, days_remaining: 10 },
  { id: mockUUID(), employee_id: EMP.SEBASTIAN, business_id: BUSINESS_ID, year: new Date().getFullYear(), total_days_available: 15, days_used: 3, days_pending: 0, days_remaining: 12 },
  { id: mockUUID(), employee_id: EMP.CAMILA, business_id: BUSINESS_ID, year: new Date().getFullYear(), total_days_available: 15, days_used: 2, days_pending: 5, days_remaining: 8 },
  { id: mockUUID(), employee_id: EMP.ANDRES, business_id: BUSINESS_ID, year: new Date().getFullYear(), total_days_available: 15, days_used: 4, days_pending: 0, days_remaining: 11 },
]

// ─── JOB VACANCIES ──────────────────────────────────────────
export const job_vacancies = [
  {
    id: VACANCY_IDS.ESTILISTA,
    business_id: BUSINESS_ID,
    title: 'Estilista Senior',
    description: 'Buscamos estilista con mínimo 5 años de experiencia en coloración avanzada, cortes de tendencia y tratamientos capilares. Debe tener certificación en productos premium.',
    requirements: 'Mínimo 5 años de experiencia. Certificación en coloración. Portfolio actualizado.',
    responsibilities: 'Atención al cliente VIP. Coloración avanzada. Asesoría de imagen. Capacitación de junior staff.',
    benefits: ['Salario competitivo', 'Comisiones del 15%', 'Capacitación internacional', 'Productos de cortesía'],
    position_type: 'full_time',
    experience_required: '5+ años',
    salary_min: 2800000,
    salary_max: 4000000,
    currency: 'COP',
    location_id: LOCATION_IDS.POBLADO,
    remote_allowed: false,
    number_of_positions: 1,
    required_services: [SVC.CORTE_CABELLO, SVC.COLORACION, SVC.TRATAMIENTO_CAPILAR],
    status: 'active',
    published_at: daysAgo(10),
    expires_at: daysFromNow(20),
    views_count: 89,
    applications_count: 5,
    created_at: daysAgo(10),
    updated_at: daysAgo(2),
  },
  {
    id: VACANCY_IDS.TERAPEUTA,
    business_id: BUSINESS_ID,
    title: 'Terapeuta Corporal',
    description: 'Profesional en terapias corporales (masajes, reflexología, drenaje linfático). Experiencia en atención personalizada de alta gama.',
    requirements: 'Certificación en masoterapia. Mínimo 2 años de experiencia.',
    responsibilities: 'Masajes terapéuticos y relajantes. Consulta inicial con cliente. Seguimiento post-tratamiento.',
    benefits: ['Horario flexible', 'Seguro médico', 'Bonos trimestrales'],
    position_type: 'full_time',
    experience_required: '2+ años',
    salary_min: 2200000,
    salary_max: 3000000,
    currency: 'COP',
    location_id: LOCATION_IDS.LAURELES,
    remote_allowed: false,
    number_of_positions: 2,
    required_services: [SVC.MASAJE_RELAJANTE, SVC.MASAJE_DEPORTIVO],
    status: 'active',
    published_at: daysAgo(5),
    expires_at: daysFromNow(25),
    views_count: 52,
    applications_count: 3,
    created_at: daysAgo(5),
    updated_at: daysAgo(1),
  },
]

// ─── JOB APPLICATIONS ───────────────────────────────────────
export const job_applications = [
  { id: mockUUID(), vacancy_id: VACANCY_IDS.ESTILISTA, user_id: 'applicant-001', status: 'pending', cover_letter: 'Tengo 7 años de experiencia en salones premium. Me especializo en balayage y coloración fantasía.', cv_url: null, expected_salary: 3500000, available_from: daysFromNow(14), created_at: daysAgo(3), updated_at: daysAgo(3), applicant: { id: 'applicant-001', full_name: 'María Fernanda Gómez', email: 'mf.gomez@gmail.com', avatar_url: avatar('applicant-001'), phone: '+57 310 555 1234' }, vacancy: { ...job_vacancies[0], business_name: 'Élite Wellness & Spa' } },
  { id: mockUUID(), vacancy_id: VACANCY_IDS.ESTILISTA, user_id: 'applicant-002', status: 'in_review', cover_letter: 'Graduada del Instituto de Belleza Internacional. Experiencia en Bogotá y Miami.', cv_url: null, expected_salary: 3800000, available_from: daysFromNow(7), created_at: daysAgo(5), updated_at: daysAgo(2), reviewed_at: daysAgo(2), applicant: { id: 'applicant-002', full_name: 'Lucía Restrepo', email: 'lucia.r@outlook.com', avatar_url: avatar('applicant-002'), phone: '+57 311 555 5678' }, vacancy: { ...job_vacancies[0], business_name: 'Élite Wellness & Spa' } },
  { id: mockUUID(), vacancy_id: VACANCY_IDS.ESTILISTA, user_id: 'applicant-003', status: 'rejected', cover_letter: 'Estilista freelance con 3 años de experiencia.', cv_url: null, expected_salary: 2500000, available_from: daysFromNow(0), decision_notes: 'No cumple requisito de 5 años', created_at: daysAgo(8), updated_at: daysAgo(6), applicant: { id: 'applicant-003', full_name: 'Diego Salazar', email: 'diego.s@gmail.com', avatar_url: avatar('applicant-003'), phone: '+57 312 555 3456' }, vacancy: { ...job_vacancies[0], business_name: 'Élite Wellness & Spa' } },
  { id: mockUUID(), vacancy_id: VACANCY_IDS.TERAPEUTA, user_id: 'applicant-004', status: 'pending', cover_letter: 'Fisioterapeuta certificada con especialización en masaje deportivo y drenaje linfático.', cv_url: null, expected_salary: 2800000, available_from: daysFromNow(10), created_at: daysAgo(2), updated_at: daysAgo(2), applicant: { id: 'applicant-004', full_name: 'Laura Posada', email: 'laura.posada@gmail.com', avatar_url: avatar('applicant-004'), phone: '+57 313 555 7890' }, vacancy: { ...job_vacancies[1], business_name: 'Élite Wellness & Spa' } },
  { id: mockUUID(), vacancy_id: VACANCY_IDS.TERAPEUTA, user_id: 'applicant-005', status: 'accepted', cover_letter: 'Especialista en terapias orientales con certificación en Tailandia.', cv_url: null, expected_salary: 2600000, available_from: daysFromNow(0), decision_notes: 'Excelente perfil, contratada', created_at: daysAgo(4), updated_at: daysAgo(1), applicant: { id: 'applicant-005', full_name: 'Natalia Cárdenas', email: 'natalia.c@yahoo.com', avatar_url: avatar('applicant-005'), phone: '+57 314 555 2345' }, vacancy: { ...job_vacancies[1], business_name: 'Élite Wellness & Spa' } },
]

// ─── BUSINESS RESOURCES ──────────────────────────────────────
export const business_resources = [
  {
    id: RESOURCE_IDS.SALA_VIP,
    business_id: BUSINESS_ID, location_id: LOCATION_IDS.POBLADO,
    name: 'Sala VIP Premium', resource_type: 'room', description: 'Sala exclusiva con jacuzzi privado, sistema de aromaterapia y música ambiental personalizada.',
    capacity: 2, is_active: true, status: 'available',
    image_url: svcImg('vip-room-spa'), amenities: ['Jacuzzi', 'Aromaterapia', 'Música personalizada', 'Champaña de cortesía'],
    price_per_hour: 200000, currency: 'COP',
    location: { id: LOCATION_IDS.POBLADO, name: 'Sede El Poblado', address: 'Cra 43A #7-50, Torre Élite Piso 3', city: 'Medellín' },
    created_at: daysAgo(300), updated_at: daysAgo(5),
  },
  {
    id: RESOURCE_IDS.SALA_MASAJES,
    business_id: BUSINESS_ID, location_id: LOCATION_IDS.POBLADO,
    name: 'Sala de Masajes 1', resource_type: 'room', description: 'Sala equipada con camilla profesional, aceites premium y sistema de calefacción.',
    capacity: 1, is_active: true, status: 'available',
    image_url: svcImg('massage-room'), amenities: ['Camilla profesional', 'Aceites premium', 'Calefacción'],
    price_per_hour: 80000, currency: 'COP',
    location: { id: LOCATION_IDS.POBLADO, name: 'Sede El Poblado', address: 'Cra 43A #7-50, Torre Élite Piso 3', city: 'Medellín' },
    created_at: daysAgo(300), updated_at: daysAgo(10),
  },
  {
    id: RESOURCE_IDS.CABINA_FACIAL,
    business_id: BUSINESS_ID, location_id: LOCATION_IDS.POBLADO,
    name: 'Cabina Facial Avanzada', resource_type: 'station', description: 'Cabina equipada con vaporizador, alta frecuencia, radiofrecuencia y LED terapéutico.',
    capacity: 1, is_active: true, status: 'available',
    image_url: svcImg('facial-cabin'), amenities: ['Vaporizador', 'Alta frecuencia', 'Radiofrecuencia', 'LED terapéutico'],
    price_per_hour: 120000, currency: 'COP',
    location: { id: LOCATION_IDS.POBLADO, name: 'Sede El Poblado', address: 'Cra 43A #7-50, Torre Élite Piso 3', city: 'Medellín' },
    created_at: daysAgo(200), updated_at: daysAgo(1),
  },
]

// ─── REVIEWS ─────────────────────────────────────────────────
export const reviews = [
  { id: mockUUID(), business_id: BUSINESS_ID, client_id: CLIENT_IDS.MARIANA, employee_id: EMP.VALENTINA, rating: 5, comment: 'Increíble experiencia. El masaje relajante fue exactamente lo que necesitaba. Valentina tiene manos mágicas. Volveré sin duda.', response: '¡Gracias Mariana! Nos encanta saber que disfrutaste tu experiencia. Te esperamos pronto.', review_type: 'employee', is_visible: true, created_at: daysAgo(3) },
  { id: mockUUID(), business_id: BUSINESS_ID, client_id: CLIENT_IDS.SOFIA, employee_id: null, rating: 5, comment: 'El mejor spa de Medellín. Las instalaciones son impecables, el personal es super amable y los productos son de primera calidad.', response: null, review_type: 'business', is_visible: true, created_at: daysAgo(5) },
  { id: mockUUID(), business_id: BUSINESS_ID, client_id: CLIENT_IDS.CAROLINA, employee_id: EMP.SEBASTIAN, rating: 5, comment: 'Sebastián logró el color exacto que quería. Profesional, detallista y muy buen gusto. Mi cabello quedó espectacular.', response: '¡Nos alegra mucho Carolina! Sebastián es un artista.', review_type: 'employee', is_visible: true, created_at: daysAgo(7) },
  { id: mockUUID(), business_id: BUSINESS_ID, client_id: CLIENT_IDS.ALEJANDRO, employee_id: EMP.ANDRES, rating: 4, comment: 'Muy buen masaje deportivo, me ayudó con la recuperación post-entrenamiento. Lo recomiendo ampliamente.', response: null, review_type: 'employee', is_visible: true, created_at: daysAgo(10) },
  { id: mockUUID(), business_id: BUSINESS_ID, client_id: CLIENT_IDS.ISABELLA, employee_id: EMP.CAMILA, rating: 5, comment: 'El microblading quedó perfecto. Se ven naturales y el resultado superó mis expectativas. Camila es una artista.', response: '¡Gracias Isabella! Tu diseño quedó precioso.', review_type: 'employee', is_visible: true, created_at: daysAgo(12) },
  { id: mockUUID(), business_id: BUSINESS_ID, client_id: CLIENT_IDS.LAURA, employee_id: null, rating: 5, comment: 'Desde que descubrí Élite Wellness no voy a otro spa. La calidad del servicio es insuperable.', response: null, review_type: 'business', is_visible: true, created_at: daysAgo(15) },
  { id: mockUUID(), business_id: BUSINESS_ID, client_id: CLIENT_IDS.NICOLAS, employee_id: EMP.ANDRES, rating: 5, comment: 'Fui por un dolor de espalda y salí nuevo. Andrés encontró todos los nudos y los trabajó increíble.', response: '¡Excelente Nicolás! Te esperamos para tu próxima sesión.', review_type: 'employee', is_visible: true, created_at: daysAgo(18) },
  { id: mockUUID(), business_id: BUSINESS_ID, client_id: CLIENT_IDS.DANIELA, employee_id: EMP.CAMILA, rating: 4, comment: 'Muy buena limpieza facial. Mi piel se siente renovada. Solo sugeriría mejorar el tiempo de espera.', response: 'Agradecemos tu feedback Daniela. Estamos trabajando en optimizar tiempos.', review_type: 'employee', is_visible: true, created_at: daysAgo(20) },
  { id: mockUUID(), business_id: BUSINESS_ID, client_id: CLIENT_IDS.ANDREA, employee_id: null, rating: 5, comment: 'Las mejores instalaciones de la ciudad. Todo está impecable. Me encanta el café de cortesía mientras esperas.', response: null, review_type: 'business', is_visible: true, created_at: daysAgo(25) },
  { id: mockUUID(), business_id: BUSINESS_ID, client_id: CLIENT_IDS.MIGUEL, employee_id: EMP.VALENTINA, rating: 5, comment: 'Mi esposa y yo fuimos a la sala VIP. Una experiencia inolvidable. El masaje en pareja fue excepcional.', response: '¡Gracias Miguel! Nos encantó tenerlos en nuestra Sala VIP.', review_type: 'business', is_visible: true, created_at: daysAgo(28) },
]

// ─── CHAT CONVERSATIONS ──────────────────────────────────────
export const chat_conversations = [
  {
    id: CONVERSATION_IDS.CONV_1,
    type: 'direct', title: null, created_by: CLIENT_IDS.MARIANA,
    business_id: BUSINESS_ID, last_message_at: todayAt(10, 15),
    last_message_preview: '¡Perfecto! Nos vemos mañana entonces 😊',
    created_at: daysAgo(5), updated_at: todayAt(10, 15),
    is_archived: false, metadata: {},
    unread_count: 1, is_pinned: false, is_muted: false,
    other_user: profiles.find(p => p.id === CLIENT_IDS.MARIANA),
  },
  {
    id: CONVERSATION_IDS.CONV_2,
    type: 'direct', title: null, created_by: CLIENT_IDS.ALEJANDRO,
    business_id: BUSINESS_ID, last_message_at: daysAgo(1),
    last_message_preview: 'Gracias por la información sobre los paquetes corporativos.',
    created_at: daysAgo(3), updated_at: daysAgo(1),
    is_archived: false, metadata: {},
    unread_count: 0, is_pinned: false, is_muted: false,
    other_user: profiles.find(p => p.id === CLIENT_IDS.ALEJANDRO),
  },
  {
    id: CONVERSATION_IDS.CONV_3,
    type: 'direct', title: null, created_by: CLIENT_IDS.CAROLINA,
    business_id: BUSINESS_ID, last_message_at: daysAgo(2),
    last_message_preview: '¿Tienen disponibilidad para microblading la próxima semana?',
    created_at: daysAgo(10), updated_at: daysAgo(2),
    is_archived: false, metadata: {},
    unread_count: 1, is_pinned: true, is_muted: false,
    other_user: profiles.find(p => p.id === CLIENT_IDS.CAROLINA),
  },
]

export const chat_participants = [
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_1, user_id: OWNER_ID, created_at: daysAgo(5) },
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_1, user_id: CLIENT_IDS.MARIANA, created_at: daysAgo(5) },
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_2, user_id: OWNER_ID, created_at: daysAgo(3) },
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_2, user_id: CLIENT_IDS.ALEJANDRO, created_at: daysAgo(3) },
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_3, user_id: OWNER_ID, created_at: daysAgo(10) },
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_3, user_id: CLIENT_IDS.CAROLINA, created_at: daysAgo(10) },
]

export const messages = [
  // Conversation 1 — Mariana
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_1, sender_id: CLIENT_IDS.MARIANA, content: 'Hola, ¿tienen disponibilidad para un masaje relajante mañana en la tarde?', created_at: todayAt(9, 30), read: true },
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_1, sender_id: OWNER_ID, content: '¡Hola Mariana! Sí, tenemos disponible a las 3:00 PM con Valentina Morales. ¿Te gustaría reservar?', created_at: todayAt(9, 45), read: true },
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_1, sender_id: CLIENT_IDS.MARIANA, content: '¡Perfecto! Nos vemos mañana entonces 😊', created_at: todayAt(10, 15), read: false },
  // Conversation 2 — Alejandro
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_2, sender_id: CLIENT_IDS.ALEJANDRO, content: 'Buenos días, me interesa saber si manejan paquetes corporativos para empresas.', created_at: dateAt(-1, 9, 0), read: true },
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_2, sender_id: OWNER_ID, content: '¡Buenos días Alejandro! Sí, tenemos paquetes corporativos desde 10 personas. Incluyen masajes, faciales y descuentos del 20%. Te envío el brochure por email.', created_at: dateAt(-1, 10, 30), read: true },
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_2, sender_id: CLIENT_IDS.ALEJANDRO, content: 'Gracias por la información sobre los paquetes corporativos.', created_at: dateAt(-1, 11, 0), read: true },
  // Conversation 3 — Carolina
  { id: mockUUID(), conversation_id: CONVERSATION_IDS.CONV_3, sender_id: CLIENT_IDS.CAROLINA, content: '¿Tienen disponibilidad para microblading la próxima semana?', created_at: dateAt(-2, 14, 0), read: false },
]

// ─── USER PERMISSIONS ────────────────────────────────────────
const OWNER_PERMISSIONS = [
  'services.create', 'services.edit', 'services.delete', 'services.view',
  'resources.create', 'resources.edit', 'resources.delete', 'resources.view',
  'locations.create', 'locations.edit', 'locations.delete', 'locations.view',
  'employees.create', 'employees.edit', 'employees.delete', 'employees.view', 'employees.edit_salary',
  'appointments.create', 'appointments.edit', 'appointments.delete', 'appointments.cancel',
  'recruitment.create_vacancy', 'recruitment.edit_vacancy', 'recruitment.delete_vacancy', 'recruitment.manage_applications',
  'accounting.create', 'accounting.edit', 'accounting.delete', 'accounting.view_reports',
  'expenses.create', 'expenses.delete',
  'reviews.create', 'reviews.moderate', 'reviews.respond',
  'billing.manage', 'billing.view',
  'notifications.manage',
  'settings.edit', 'settings.edit_business',
  'permissions.manage', 'permissions.view', 'permissions.assign',
  'absences.approve', 'absences.request',
  'favorites.toggle',
  'sales.create',
]

const ownerPerms = OWNER_PERMISSIONS.map(p => ({
  id: mockUUID(),
  business_id: BUSINESS_ID,
  user_id: OWNER_ID,
  permission: p,
  granted_by: OWNER_ID,
  is_active: true,
  created_at: daysAgo(365),
}))

const EMPLOYEE_PERMS = [
  'services.view', 'appointments.create', 'appointments.edit', 'appointments.cancel_own',
  'appointments.reschedule_own', 'reviews.create', 'absences.request', 'employees.edit_own_profile',
]

const employeePerms = [EMP.VALENTINA, EMP.SEBASTIAN, EMP.CAMILA, EMP.ANDRES].flatMap(empId =>
  EMPLOYEE_PERMS.map(p => ({
    id: mockUUID(),
    business_id: BUSINESS_ID,
    user_id: empId,
    permission: p,
    granted_by: OWNER_ID,
    is_active: true,
    created_at: daysAgo(200),
  }))
)

export const user_permissions = [...ownerPerms, ...employeePerms]

// ─── PUBLIC HOLIDAYS (Colombia) ──────────────────────────────
const year = new Date().getFullYear()
export const public_holidays = [
  { id: mockUUID(), country_id: 'CO', name: 'Año Nuevo', holiday_date: `${year}-01-01`, is_recurring: true },
  { id: mockUUID(), country_id: 'CO', name: 'Día de los Reyes Magos', holiday_date: `${year}-01-06`, is_recurring: true },
  { id: mockUUID(), country_id: 'CO', name: 'Día de San José', holiday_date: `${year}-03-24`, is_recurring: false },
  { id: mockUUID(), country_id: 'CO', name: 'Día del Trabajo', holiday_date: `${year}-05-01`, is_recurring: true },
  { id: mockUUID(), country_id: 'CO', name: 'Día de la Independencia', holiday_date: `${year}-07-20`, is_recurring: true },
  { id: mockUUID(), country_id: 'CO', name: 'Batalla de Boyacá', holiday_date: `${year}-08-07`, is_recurring: true },
  { id: mockUUID(), country_id: 'CO', name: 'Día de la Raza', holiday_date: `${year}-10-12`, is_recurring: false },
  { id: mockUUID(), country_id: 'CO', name: 'Día de Todos los Santos', holiday_date: `${year}-11-03`, is_recurring: false },
  { id: mockUUID(), country_id: 'CO', name: 'Independencia de Cartagena', holiday_date: `${year}-11-17`, is_recurring: false },
  { id: mockUUID(), country_id: 'CO', name: 'Inmaculada Concepción', holiday_date: `${year}-12-08`, is_recurring: true },
  { id: mockUUID(), country_id: 'CO', name: 'Navidad', holiday_date: `${year}-12-25`, is_recurring: true },
]

// ─── RPC MOCK DATA ───────────────────────────────────────────
export const rpcData = {
  get_business_hierarchy: [
    {
      user_id: EMP.VALENTINA, employee_id: EMP.VALENTINA, business_id: BUSINESS_ID,
      full_name: 'Valentina Morales', email: 'valentina.morales@elitewellness.co',
      role: 'employee', employee_type: 'specialist', hierarchy_level: 2,
      job_title: 'Especialista en Masajes & Terapias', reports_to: OWNER_ID, supervisor_name: 'Carlos Mendoza',
      location_id: LOCATION_IDS.POBLADO, location_name: 'Sede El Poblado',
      direct_reports_count: 0, all_reports_count: 0, occupancy_rate: 87,
      average_rating: 4.95, gross_revenue: 14400000,
      total_appointments: 142, completed_appointments: 138, cancelled_appointments: 4, total_reviews: 35,
      services_offered: [
        { service_id: SVC.MASAJE_RELAJANTE, service_name: 'Masaje Relajante', expertise_level: 'expert', commission_percentage: 15 },
        { service_id: SVC.MASAJE_DEPORTIVO, service_name: 'Masaje Deportivo', expertise_level: 'expert', commission_percentage: 15 },
        { service_id: SVC.DEPILACION_LASER, service_name: 'Depilación Láser', expertise_level: 'intermediate', commission_percentage: 10 },
      ],
      is_active: true, hired_at: daysAgo(300), phone: '+57 301 234 5678',
      avatar_url: avatar('valentina-morales'), salary_base: 2800000, salary_type: 'fixed',
    },
    {
      user_id: EMP.SEBASTIAN, employee_id: EMP.SEBASTIAN, business_id: BUSINESS_ID,
      full_name: 'Sebastián Velasco', email: 'sebastian.velasco@elitewellness.co',
      role: 'employee', employee_type: 'professional', hierarchy_level: 2,
      job_title: 'Estilista Profesional', reports_to: OWNER_ID, supervisor_name: 'Carlos Mendoza',
      location_id: LOCATION_IDS.POBLADO, location_name: 'Sede El Poblado',
      direct_reports_count: 0, all_reports_count: 0, occupancy_rate: 82,
      average_rating: 4.88, gross_revenue: 11200000,
      total_appointments: 156, completed_appointments: 148, cancelled_appointments: 8, total_reviews: 28,
      services_offered: [
        { service_id: SVC.CORTE_CABELLO, service_name: 'Corte & Estilizado', expertise_level: 'expert', commission_percentage: 12 },
        { service_id: SVC.COLORACION, service_name: 'Coloración Completa', expertise_level: 'expert', commission_percentage: 15 },
        { service_id: SVC.TRATAMIENTO_CAPILAR, service_name: 'Tratamiento Capilar', expertise_level: 'advanced', commission_percentage: 12 },
      ],
      is_active: true, hired_at: daysAgo(280), phone: '+57 302 345 6789',
      avatar_url: avatar('sebastian-velasco'), salary_base: 2500000, salary_type: 'commission',
    },
    {
      user_id: EMP.CAMILA, employee_id: EMP.CAMILA, business_id: BUSINESS_ID,
      full_name: 'Camila Ríos', email: 'camila.rios@elitewellness.co',
      role: 'employee', employee_type: 'specialist', hierarchy_level: 2,
      job_title: 'Especialista Facial & Micropigmentación', reports_to: OWNER_ID, supervisor_name: 'Carlos Mendoza',
      location_id: LOCATION_IDS.POBLADO, location_name: 'Sede El Poblado',
      direct_reports_count: 0, all_reports_count: 0, occupancy_rate: 79,
      average_rating: 4.92, gross_revenue: 12800000,
      total_appointments: 118, completed_appointments: 114, cancelled_appointments: 4, total_reviews: 31,
      services_offered: [
        { service_id: SVC.FACIAL_PREMIUM, service_name: 'Facial Premium Anti-Edad', expertise_level: 'expert', commission_percentage: 15 },
        { service_id: SVC.LIMPIEZA_FACIAL, service_name: 'Limpieza Facial Profunda', expertise_level: 'expert', commission_percentage: 10 },
        { service_id: SVC.MICROBLADING, service_name: 'Microblading Cejas', expertise_level: 'expert', commission_percentage: 20 },
        { service_id: SVC.MANICURE_PEDICURE, service_name: 'Manicure & Pedicure Spa', expertise_level: 'advanced', commission_percentage: 10 },
      ],
      is_active: true, hired_at: daysAgo(250), phone: '+57 303 456 7890',
      avatar_url: avatar('camila-rios'), salary_base: 2600000, salary_type: 'fixed',
    },
    {
      user_id: EMP.ANDRES, employee_id: EMP.ANDRES, business_id: BUSINESS_ID,
      full_name: 'Andrés Mejía', email: 'andres.mejia@elitewellness.co',
      role: 'employee', employee_type: 'professional', hierarchy_level: 2,
      job_title: 'Terapeuta Corporal', reports_to: OWNER_ID, supervisor_name: 'Carlos Mendoza',
      location_id: LOCATION_IDS.POBLADO, location_name: 'Sede El Poblado',
      direct_reports_count: 0, all_reports_count: 0, occupancy_rate: 75,
      average_rating: 4.80, gross_revenue: 9600000,
      total_appointments: 108, completed_appointments: 102, cancelled_appointments: 6, total_reviews: 22,
      services_offered: [
        { service_id: SVC.MASAJE_RELAJANTE, service_name: 'Masaje Relajante', expertise_level: 'advanced', commission_percentage: 12 },
        { service_id: SVC.MASAJE_DEPORTIVO, service_name: 'Masaje Deportivo', expertise_level: 'expert', commission_percentage: 15 },
        { service_id: SVC.DEPILACION_LASER, service_name: 'Depilación Láser', expertise_level: 'intermediate', commission_percentage: 10 },
        { service_id: SVC.MANICURE_PEDICURE, service_name: 'Manicure & Pedicure Spa', expertise_level: 'intermediate', commission_percentage: 8 },
      ],
      is_active: true, hired_at: daysAgo(200), phone: '+57 304 567 8901',
      avatar_url: avatar('andres-mejia'), salary_base: 2400000, salary_type: 'fixed',
    },
  ],
  get_client_dashboard_data: {
    upcoming_appointments: appointments.filter(a =>
      (a as Record<string, unknown>).status !== 'completed' && (a as Record<string, unknown>).status !== 'cancelled'
    ).slice(0, 5),
    recent_appointments: appointments.filter(a =>
      (a as Record<string, unknown>).status === 'completed'
    ).slice(0, 10),
    favorite_businesses: [businesses[0]],
    stats: { total_appointments: 24, upcoming_count: 3, completed_count: 21, total_spent: 2340000 },
  },
}
