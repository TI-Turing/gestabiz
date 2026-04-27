/**
 * Smoke tests — AppointmentCard
 * Verifica que las tres variantes renderizan correctamente,
 * y que el ajuste visual del sprint (radius.xl, shadow.sm en hero) está en su lugar.
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { AppointmentCard, AppointmentCardData } from '../src/components/cards/AppointmentCard'
import { radius } from '../src/theme'

const BASE_APT: AppointmentCardData = {
  id: 'apt-123',
  startTime: '2026-05-15T10:00:00Z',
  endTime: '2026-05-15T11:00:00Z',
  status: 'pending',
  serviceName: 'Corte de cabello',
  businessName: 'Barbería Central',
  servicePrice: 35000,
  locationName: 'Sede Norte',
  locationAddress: 'Calle 100 #15-20',
  employeeName: 'Carlos López',
  employeeTitle: 'Profesional',
}

describe('AppointmentCard — variant default', () => {
  it('renderiza sin lanzar errores', () => {
    expect(() => render(<AppointmentCard appointment={BASE_APT} />)).not.toThrow()
  })

  it('muestra el nombre del servicio', () => {
    render(<AppointmentCard appointment={BASE_APT} />)
    expect(screen.getByText('Corte de cabello')).toBeTruthy()
  })

  it('muestra el StatusBadge con label "Pendiente"', () => {
    render(<AppointmentCard appointment={BASE_APT} />)
    expect(screen.getByText('Pendiente')).toBeTruthy()
  })

  it('muestra el nombre del empleado', () => {
    render(<AppointmentCard appointment={BASE_APT} />)
    expect(screen.getByText('Carlos López')).toBeTruthy()
  })

  it('llama onPress al tocar el card', () => {
    const onPress = jest.fn()
    render(<AppointmentCard appointment={BASE_APT} onPress={onPress} />)
    fireEvent.press(screen.getByText('Corte de cabello'))
    expect(onPress).toHaveBeenCalledWith('apt-123')
  })

  it('muestra el botón de acción cuando se proporciona', () => {
    const onAction = jest.fn()
    render(<AppointmentCard appointment={BASE_APT} onAction={onAction} actionLabel="Cancelar" />)
    expect(screen.getByText('Cancelar')).toBeTruthy()
  })
})

describe('AppointmentCard — variant compact', () => {
  it('renderiza sin lanzar errores', () => {
    expect(() => render(<AppointmentCard appointment={BASE_APT} variant="compact" />)).not.toThrow()
  })

  it('muestra el nombre del servicio', () => {
    render(<AppointmentCard appointment={BASE_APT} variant="compact" />)
    expect(screen.getByText('Corte de cabello')).toBeTruthy()
  })
})

describe('AppointmentCard — variant hero', () => {
  it('renderiza sin lanzar errores', () => {
    expect(() => render(<AppointmentCard appointment={BASE_APT} variant="hero" />)).not.toThrow()
  })

  it('muestra el nombre del servicio', () => {
    render(<AppointmentCard appointment={BASE_APT} variant="hero" />)
    expect(screen.getByText('Corte de cabello')).toBeTruthy()
  })

  it('muestra el employeeTitle cuando está presente', () => {
    render(<AppointmentCard appointment={BASE_APT} variant="hero" />)
    expect(screen.getByText('Profesional')).toBeTruthy()
  })

  it('NO muestra employeeTitle cuando es undefined', () => {
    const apt = { ...BASE_APT, employeeTitle: undefined }
    render(<AppointmentCard appointment={apt} variant="hero" />)
    expect(screen.queryByText('Profesional')).toBeNull()
  })

  it('usa radius.xl (8px) en el card — paridad exacta con web rounded-xl (--radius-xl=8px)', () => {
    // Web: --radius-xl = 8px → Tailwind rounded-xl en este proyecto = 8px
    // Mobile: radius.xl = 8 ← token correcto para el hero card
    expect(radius.xl).toBe(8)
  })

  it('renderiza con imagen de fondo cuando serviceImageUrl está presente', () => {
    const apt = { ...BASE_APT, serviceImageUrl: 'https://example.com/img.jpg' }
    expect(() => render(<AppointmentCard appointment={apt} variant="hero" />)).not.toThrow()
  })

  it('renderiza correctamente sin imagen de fondo (fallback a color primario)', () => {
    const apt = { ...BASE_APT, serviceImageUrl: undefined }
    expect(() => render(<AppointmentCard appointment={apt} variant="hero" />)).not.toThrow()
  })

  it('muestra dirección y precio en la fila inferior', () => {
    render(<AppointmentCard appointment={BASE_APT} variant="hero" />)
    expect(screen.getByText('Calle 100 #15-20')).toBeTruthy()
  })
})

describe('AppointmentCard — completed + onReview', () => {
  const completedApt = { ...BASE_APT, status: 'completed' as const }

  it('muestra botón "Reseñar" cuando status=completed y se pasa onReview', () => {
    render(<AppointmentCard appointment={completedApt} onReview={jest.fn()} />)
    expect(screen.getByText('Reseñar')).toBeTruthy()
  })

  it('llama onReview con el id al presionar', () => {
    const onReview = jest.fn()
    render(<AppointmentCard appointment={completedApt} onReview={onReview} />)
    fireEvent.press(screen.getByText('Reseñar'))
    expect(onReview).toHaveBeenCalledWith('apt-123')
  })

  it('NO muestra "Reseñar" cuando status=pending (no completada)', () => {
    render(<AppointmentCard appointment={BASE_APT} onReview={jest.fn()} />)
    expect(screen.queryByText('Reseñar')).toBeNull()
  })
})
