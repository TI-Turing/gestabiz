// Test setup file - runs before all tests
import '@testing-library/jest-dom'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = []
  disconnect() {
    // Mock implementation
  }
  observe() {
    // Mock implementation
  }
  takeRecords() {
    return []
  }
  unobserve() {
    // Mock implementation
  }
} as unknown as typeof IntersectionObserver

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  disconnect() {
    // Mock implementation
  }
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
} as unknown as typeof ResizeObserver

// Suppress console errors in tests (optional)
/* eslint-disable no-console */
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: useLayoutEffect') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.requestSubmit'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
/* eslint-enable no-console */

// ─── localStorage / sessionStorage mock ────────────────────
const createStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  }
}

Object.defineProperty(window, 'localStorage', { value: createStorageMock(), writable: true })
Object.defineProperty(window, 'sessionStorage', { value: createStorageMock(), writable: true })

// ─── navigator.geolocation ─────────────────────────────────
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn((success: PositionCallback) =>
      success({
        coords: { latitude: 6.2087, longitude: -75.5743, accuracy: 10 } as GeolocationCoordinates,
        timestamp: Date.now(),
      } as GeolocationPosition)
    ),
    watchPosition: vi.fn().mockReturnValue(1),
    clearWatch: vi.fn(),
  },
  writable: true,
})

// ─── crypto.randomUUID ─────────────────────────────────────
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: vi.fn(() => '00000000-0000-4000-a000-000000000000'),
    },
    writable: true,
  })
}

// ─── window.scrollTo ───────────────────────────────────────
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
