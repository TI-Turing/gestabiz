/**
 * Category label translations for TransactionCategory enum values.
 * Used by export functions (PDF, CSV, Excel) that run outside React context.
 */

const CATEGORY_LABELS: Record<'es' | 'en', Record<string, string>> = {
  es: {
    // Income
    appointment_payment: 'Pagos de citas',
    product_sale: 'Venta de productos',
    service_sale: 'Venta de servicios',
    tip: 'Propinas',
    membership: 'Membresías',
    package: 'Paquetes',
    other_income: 'Otros ingresos',
    // Payroll
    salary: 'Salarios',
    payroll: 'Nómina',
    bonuses: 'Bonificaciones',
    commission: 'Comisiones',
    // Rent & Utilities
    rent: 'Alquiler',
    utilities: 'Servicios públicos',
    electricity: 'Electricidad',
    water: 'Agua',
    gas: 'Gas',
    internet: 'Internet',
    phone: 'Teléfono',
    // Maintenance & Supplies
    supplies: 'Suministros',
    cleaning: 'Limpieza',
    repairs: 'Reparaciones',
    furniture: 'Mobiliario',
    tools: 'Herramientas',
    software: 'Software',
    maintenance: 'Mantenimiento',
    // Marketing
    marketing: 'Marketing',
    advertising: 'Publicidad',
    social_media: 'Redes sociales',
    // Taxes
    tax: 'Impuestos',
    property_tax: 'Impuesto predial',
    income_tax: 'Impuesto de renta',
    vat: 'IVA',
    withholding: 'Retención en la fuente',
    // Insurance
    insurance: 'Seguros',
    liability_insurance: 'Seguro de responsabilidad',
    fire_insurance: 'Seguro contra incendios',
    theft_insurance: 'Seguro contra robo',
    health_insurance: 'Seguro de salud',
    // Training & Equipment
    training: 'Capacitación',
    certifications: 'Certificaciones',
    courses: 'Cursos',
    equipment: 'Equipos',
    // Transportation
    fuel: 'Combustible',
    parking: 'Parqueadero',
    public_transport: 'Transporte público',
    // Professional Fees
    accounting_fees: 'Honorarios contables',
    legal_fees: 'Honorarios legales',
    consulting_fees: 'Honorarios de consultoría',
    // Other
    depreciation: 'Depreciación',
    bank_fees: 'Comisiones bancarias',
    interest: 'Intereses',
    donations: 'Donaciones',
    uniforms: 'Uniformes',
    security: 'Seguridad',
    waste_disposal: 'Gestión de residuos',
    other_expense: 'Otros gastos',
  },
  en: {
    // Income
    appointment_payment: 'Appointment payments',
    product_sale: 'Product sales',
    service_sale: 'Service sales',
    tip: 'Tips',
    membership: 'Memberships',
    package: 'Packages',
    other_income: 'Other income',
    // Payroll
    salary: 'Salaries',
    payroll: 'Payroll',
    bonuses: 'Bonuses',
    commission: 'Commissions',
    // Rent & Utilities
    rent: 'Rent',
    utilities: 'Utilities',
    electricity: 'Electricity',
    water: 'Water',
    gas: 'Gas',
    internet: 'Internet',
    phone: 'Phone',
    // Maintenance & Supplies
    supplies: 'Supplies',
    cleaning: 'Cleaning',
    repairs: 'Repairs',
    furniture: 'Furniture',
    tools: 'Tools',
    software: 'Software',
    maintenance: 'Maintenance',
    // Marketing
    marketing: 'Marketing',
    advertising: 'Advertising',
    social_media: 'Social media',
    // Taxes
    tax: 'Taxes',
    property_tax: 'Property tax',
    income_tax: 'Income tax',
    vat: 'VAT',
    withholding: 'Withholding tax',
    // Insurance
    insurance: 'Insurance',
    liability_insurance: 'Liability insurance',
    fire_insurance: 'Fire insurance',
    theft_insurance: 'Theft insurance',
    health_insurance: 'Health insurance',
    // Training & Equipment
    training: 'Training',
    certifications: 'Certifications',
    courses: 'Courses',
    equipment: 'Equipment',
    // Transportation
    fuel: 'Fuel',
    parking: 'Parking',
    public_transport: 'Public transport',
    // Professional Fees
    accounting_fees: 'Accounting fees',
    legal_fees: 'Legal fees',
    consulting_fees: 'Consulting fees',
    // Other
    depreciation: 'Depreciation',
    bank_fees: 'Bank fees',
    interest: 'Interest',
    donations: 'Donations',
    uniforms: 'Uniforms',
    security: 'Security',
    waste_disposal: 'Waste disposal',
    other_expense: 'Other expenses',
  },
};

/**
 * Returns the translated label for a transaction category.
 * Falls back to the raw category string if no translation is found.
 */
export function getCategoryLabel(category: string, locale: 'es' | 'en' = 'es'): string {
  return CATEGORY_LABELS[locale]?.[category] ?? category;
}
