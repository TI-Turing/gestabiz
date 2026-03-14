// ============================================================
// MOCK DATA — Date helpers
// ============================================================

const NOW = new Date()
const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate())

export function daysAgo(n: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export function daysFromNow(n: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export function todayAt(hours: number, minutes = 0): string {
  const d = new Date(TODAY)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

export function dateAt(daysOffset: number, hours: number, minutes = 0): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + daysOffset)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

export function monthStart(monthsBack = 0): string {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - monthsBack, 1)
  return d.toISOString()
}

/** Deterministic pseudo-random using a seed string */
export function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash % 1000) / 1000
}

/** Pick from array using seed */
export function pick<T>(arr: T[], seed: string): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)]
}

/** Generate a UUID-like string */
let _counter = 0
export function mockUUID(): string {
  _counter++
  const hex = _counter.toString(16).padStart(8, '0')
  return `mock-${hex}-aaaa-bbbb-ccccddddeeee`
}
