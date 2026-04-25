import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

/** Configura el entorno para simular un ancho de pantalla dado. */
function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })

  // matchMedia devuelve matches=true cuando el ancho sea < 768
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: width < 768,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// SUITE
// ──────────────────────────────────────────────────────────────────────────────

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna false cuando el ancho es mayor al breakpoint (1280px)', () => {
    setViewport(1280)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('retorna false cuando el ancho es exactamente 768px (límite)', () => {
    setViewport(768)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('retorna true cuando el ancho es 767px (justo bajo el breakpoint)', () => {
    setViewport(767)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('retorna true cuando el ancho es 375px (teléfono estándar)', () => {
    setViewport(375)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('retorna true cuando el ancho es 0px', () => {
    setViewport(0)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('retorna false para tablet grande (1024px)', () => {
    setViewport(1024)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('se actualiza cuando cambia el media query (desktop → mobile)', () => {
    setViewport(1280)
    let changeCallback: ((event: { matches: boolean }) => void) | null = null

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: (
          _event: string,
          cb: (event: { matches: boolean }) => void
        ) => {
          changeCallback = cb
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })

    const { result } = renderHook(() => useIsMobile())

    // Estado inicial: no mobile
    expect(result.current).toBe(false)

    // El hook usa window.innerWidth en onChange (no event.matches).
    // Actualizar innerWidth antes de disparar el callback.
    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
      changeCallback?.({ matches: true })
    })

    expect(result.current).toBe(true)
  })

  it('se actualiza cuando cambia el media query (mobile → desktop)', () => {
    setViewport(375)
    let changeCallback: ((event: { matches: boolean }) => void) | null = null

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: (
          _event: string,
          cb: (event: { matches: boolean }) => void
        ) => {
          changeCallback = cb
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })

    const { result } = renderHook(() => useIsMobile())

    // Estado inicial: mobile
    expect(result.current).toBe(true)

    // El hook usa window.innerWidth en onChange (no event.matches).
    // Actualizar innerWidth antes de disparar el callback.
    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
      changeCallback?.({ matches: false })
    })

    expect(result.current).toBe(false)
  })

  it('limpia el listener al desmontar el componente', () => {
    setViewport(375)
    const removeEventListener = vi.fn()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener,
        dispatchEvent: vi.fn(),
      }),
    })

    const { unmount } = renderHook(() => useIsMobile())
    unmount()

    expect(removeEventListener).toHaveBeenCalledTimes(1)
  })

  it('retorna un booleano (no undefined ni null)', () => {
    setViewport(1280)
    const { result } = renderHook(() => useIsMobile())
    expect(typeof result.current).toBe('boolean')
  })
})
