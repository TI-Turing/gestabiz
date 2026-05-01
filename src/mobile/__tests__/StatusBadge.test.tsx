/**
 * Smoke tests — StatusBadge
 * Verifica que el badge renderiza el label correcto para cada estado,
 * incluyendo 'pending' (estado recién añadido a los filtros de upcoming).
 */
import React from 'react'
import { render, screen } from '@testing-library/react-native'
import StatusBadge from '../src/components/ui/StatusBadge'

describe('StatusBadge', () => {
  const statuses = [
    { status: 'pending' as const, label: 'Pendiente' },
    { status: 'scheduled' as const, label: 'Programada' },
    { status: 'confirmed' as const, label: 'Confirmada' },
    { status: 'completed' as const, label: 'Completada' },
    { status: 'cancelled' as const, label: 'Cancelada' },
    { status: 'no_show' as const, label: 'No asistió' },
  ]

  it.each(statuses)('muestra "$label" para status "$status"', ({ status, label }) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeTruthy()
  })

  it('renderiza sin errores en size sm (default)', () => {
    expect(() => render(<StatusBadge status="pending" />)).not.toThrow()
  })

  it('renderiza sin errores en size md', () => {
    expect(() => render(<StatusBadge status="confirmed" size="md" />)).not.toThrow()
  })

  it('pending muestra color amber (#F59E0B)', () => {
    const { getByText } = render(<StatusBadge status="pending" />)
    const label = getByText('Pendiente')
    expect(label.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#F59E0B' }),
      ]),
    )
  })
})
