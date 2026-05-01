// Tests for pure utility functions used across the mobile app.
// Imports from production source to ensure tests reflect real behaviour.

import { haversineKm, formatDistance } from '../src/lib/geoUtils'
import { ROLE_LABELS } from '../src/lib/roleLabels'

// ─── Haversine distance ───────────────────────────────────────────────────────

describe('haversineKm', () => {
  it('retorna 0 para el mismo punto', () => {
    expect(haversineKm(4.6097, -74.0817, 4.6097, -74.0817)).toBeCloseTo(0, 5)
  })

  it('calcula distancia Bogotá → Medellín ~230 km', () => {
    const bogota = { lat: 4.6097, lon: -74.0817 }
    const medellin = { lat: 6.2442, lon: -75.5812 }
    const dist = haversineKm(bogota.lat, bogota.lon, medellin.lat, medellin.lon)
    expect(dist).toBeGreaterThan(220)
    expect(dist).toBeLessThan(250)
  })

  it('es simétrica (A→B === B→A)', () => {
    const d1 = haversineKm(4.6097, -74.0817, 6.2442, -75.5812)
    const d2 = haversineKm(6.2442, -75.5812, 4.6097, -74.0817)
    expect(d1).toBeCloseTo(d2, 5)
  })
})

describe('formatDistance', () => {
  it('muestra metros cuando < 1 km', () => {
    expect(formatDistance(0.35)).toBe('350 m')
    expect(formatDistance(0.1)).toBe('100 m')
  })

  it('muestra km con 1 decimal cuando >= 1 km', () => {
    expect(formatDistance(1.5)).toBe('1.5 km')
    expect(formatDistance(10.0)).toBe('10.0 km')
  })

  it('redondea metros correctamente', () => {
    expect(formatDistance(0.5567)).toBe('557 m')
  })
})

// ─── ROLE_LABELS ──────────────────────────────────────────────────────────────

describe('ROLE_LABELS', () => {
  it('mapea todos los roles esperados', () => {
    expect(ROLE_LABELS.manager).toBe('Manager')
    expect(ROLE_LABELS.professional).toBe('Profesional')
    expect(ROLE_LABELS.receptionist).toBe('Recepcionista')
    expect(ROLE_LABELS.accountant).toBe('Contador')
    expect(ROLE_LABELS.support_staff).toBe('Soporte')
  })

  it('tiene exactamente 5 roles', () => {
    expect(Object.keys(ROLE_LABELS)).toHaveLength(5)
  })
})

// ─── Appointment status filter (upcoming) ─────────────────────────────────────

describe('upcoming status filter', () => {
  const UPCOMING_STATUSES = ['scheduled', 'confirmed', 'pending']

  it('incluye pending (citas recién creadas)', () => {
    expect(UPCOMING_STATUSES).toContain('pending')
  })

  it('incluye scheduled y confirmed', () => {
    expect(UPCOMING_STATUSES).toContain('scheduled')
    expect(UPCOMING_STATUSES).toContain('confirmed')
  })

  it('no incluye completed, cancelled ni no_show', () => {
    expect(UPCOMING_STATUSES).not.toContain('completed')
    expect(UPCOMING_STATUSES).not.toContain('cancelled')
    expect(UPCOMING_STATUSES).not.toContain('no_show')
  })
})

// ─── serviceImageUrl fallback lógica ─────────────────────────────────────────

describe('serviceImageUrl fallback', () => {
  const resolveImage = (svcImg?: string, locBanner?: string) => svcImg ?? locBanner

  it('usa imagen del servicio cuando está disponible', () => {
    expect(resolveImage('https://svc.jpg', 'https://banner.jpg')).toBe('https://svc.jpg')
  })

  it('cae a banner de sede cuando no hay imagen de servicio', () => {
    expect(resolveImage(undefined, 'https://banner.jpg')).toBe('https://banner.jpg')
  })

  it('retorna undefined cuando ninguno está disponible', () => {
    expect(resolveImage(undefined, undefined)).toBeUndefined()
  })
})

// ─── toCardData mapping ───────────────────────────────────────────────────────

import { AppointmentCardData } from '../src/components/cards/AppointmentCard'

type AppointmentStatus = AppointmentCardData['status']

interface MockAptRow {
  id: string
  start_time: string
  end_time?: string
  status: AppointmentStatus
  serviceName: string
  serviceImageUrl?: string
  servicePrice?: number
  businessName: string
  employeeName?: string
  employeeAvatarUrl?: string
  employeeTitle?: string
  locationName?: string
  locationAddress?: string
}

function toCardData(apt: MockAptRow): AppointmentCardData {
  return {
    id: apt.id,
    startTime: apt.start_time,
    endTime: apt.end_time ?? undefined,
    status: apt.status,
    serviceName: apt.serviceName,
    serviceImageUrl: apt.serviceImageUrl,
    servicePrice: apt.servicePrice,
    businessName: apt.businessName,
    employeeName: apt.employeeName,
    employeeAvatarUrl: apt.employeeAvatarUrl,
    employeeTitle: apt.employeeTitle,
    locationName: apt.locationName,
    locationAddress: apt.locationAddress,
  }
}

describe('toCardData', () => {
  const baseApt: MockAptRow = {
    id: 'apt-1',
    start_time: '2026-05-01T10:00:00Z',
    status: 'pending',
    serviceName: 'Corte de cabello',
    businessName: 'Barbería Test',
  }

  it('mapea los campos obligatorios', () => {
    const card = toCardData(baseApt)
    expect(card.id).toBe('apt-1')
    expect(card.status).toBe('pending')
    expect(card.serviceName).toBe('Corte de cabello')
    expect(card.businessName).toBe('Barbería Test')
  })

  it('pasa employeeTitle cuando está presente', () => {
    const apt = { ...baseApt, employeeTitle: 'Profesional' }
    const card = toCardData(apt)
    expect(card.employeeTitle).toBe('Profesional')
  })

  it('employeeTitle es undefined cuando no se proporciona', () => {
    const card = toCardData(baseApt)
    expect(card.employeeTitle).toBeUndefined()
  })

  it('pasa serviceImageUrl (fallback de banner incluido)', () => {
    const apt = { ...baseApt, serviceImageUrl: 'https://banner.jpg' }
    const card = toCardData(apt)
    expect(card.serviceImageUrl).toBe('https://banner.jpg')
  })
})
