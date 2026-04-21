import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatTime,
  formatCurrency,
  formatNumber,
  formatPercentage,
  roundToDecimals,
  validateEmail,
  validatePhone,
  validateTime,
  generateTimeSlots,
  getAppointmentDuration,
  addMinutesToTime,
  capitalizeFirst,
  camelToSnake,
  snakeToCamel,
  slugify,
  generateHandle,
  truncate,
  groupBy,
  unique,
  sortBy,
  debounce,
  isToday,
  isTomorrow,
  isYesterday,
  getRelativeDate,
  getDaysBetween,
  addDays,
  storage,
} from '@/lib/utils'

describe('cn', () => {
  it('combina clases simples', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('resuelve conflictos de Tailwind con twMerge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('ignora valores falsy', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('soporta arrays y objetos de clsx', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c')
  })
})

describe('formatTime', () => {
  it('formato 12h por defecto', () => {
    expect(formatTime('09:00')).toBe('9:00 AM')
    expect(formatTime('13:30')).toBe('1:30 PM')
    expect(formatTime('00:15')).toBe('12:15 AM')
    expect(formatTime('12:00')).toBe('12:00 PM')
  })

  it('formato 24h cuando se solicita', () => {
    expect(formatTime('09:00', true)).toBe('09:00')
    expect(formatTime('13:30', true)).toBe('13:30')
    expect(formatTime('00:15', true)).toBe('00:15')
  })
})

describe('formatCurrency / formatNumber / formatPercentage', () => {
  it('formatCurrency COP usa locale es-CO sin decimales', () => {
    const result = formatCurrency(30000)
    expect(result).toContain('30.000')
  })

  it('formatNumber separa miles con punto', () => {
    expect(formatNumber(30000)).toBe('30.000')
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('formatPercentage divide entre 100', () => {
    const result = formatPercentage(15.5)
    expect(result).toContain('15')
    expect(result).toContain('%')
  })
})

describe('roundToDecimals', () => {
  it('redondea a 2 decimales por defecto', () => {
    expect(roundToDecimals(1.2345)).toBe(1.23)
    expect(roundToDecimals(1.235)).toBe(1.24)
  })

  it('respeta decimales custom', () => {
    expect(roundToDecimals(1.23456, 4)).toBe(1.2346)
    expect(roundToDecimals(1.5, 0)).toBe(2)
  })
})

describe('validate*', () => {
  it('validateEmail acepta válidos y rechaza inválidos', () => {
    expect(validateEmail('a@b.com')).toBe(true)
    expect(validateEmail('user.name+tag@example.co.uk')).toBe(true)
    expect(validateEmail('not-an-email')).toBe(false)
    expect(validateEmail('@nodomain')).toBe(false)
  })

  it('validatePhone acepta números limpiando separadores', () => {
    expect(validatePhone('+57 300 123 4567')).toBe(true)
    expect(validatePhone('300-123-4567')).toBe(true)
    expect(validatePhone('abc')).toBe(false)
  })

  it('validateTime acepta HH:MM 24h', () => {
    expect(validateTime('09:30')).toBe(true)
    expect(validateTime('23:59')).toBe(true)
    expect(validateTime('25:00')).toBe(false)
    expect(validateTime('abc')).toBe(false)
  })
})

describe('generateTimeSlots', () => {
  it('genera slots cada 30 min entre 6 y 22 por defecto', () => {
    const slots = generateTimeSlots()
    expect(slots[0].value).toBe('06:00')
    expect(slots[1].value).toBe('06:30')
    expect(slots[slots.length - 1].value).toBe('22:00')
  })

  it('respeta interval custom', () => {
    const slots = generateTimeSlots(9, 10, 15)
    expect(slots).toHaveLength(5) // 9:00, 9:15, 9:30, 9:45, 10:00
  })

  it('format24h aplica al label', () => {
    const slots = generateTimeSlots(13, 13, 30, true)
    expect(slots[0].label).toBe('13:00')
  })
})

describe('getAppointmentDuration', () => {
  it('retorna minutos cuando < 60', () => {
    expect(getAppointmentDuration('09:00', '09:45')).toBe('45m')
  })

  it('retorna horas exactas', () => {
    expect(getAppointmentDuration('09:00', '11:00')).toBe('2h')
  })

  it('retorna horas+minutos mezclados', () => {
    expect(getAppointmentDuration('09:00', '10:30')).toBe('1h 30m')
  })
})

describe('addMinutesToTime', () => {
  it('suma minutos correctamente', () => {
    expect(addMinutesToTime('09:00', 30)).toBe('09:30')
    expect(addMinutesToTime('09:45', 30)).toBe('10:15')
  })

  it('hace wrap en 24h', () => {
    expect(addMinutesToTime('23:30', 60)).toBe('00:30')
  })
})

describe('string utils', () => {
  it('capitalizeFirst', () => {
    expect(capitalizeFirst('hola')).toBe('Hola')
    expect(capitalizeFirst('HELLO')).toBe('Hello')
  })

  it('camelToSnake', () => {
    expect(camelToSnake('myVariableName')).toBe('my_variable_name')
  })

  it('snakeToCamel', () => {
    expect(snakeToCamel('my_variable_name')).toBe('myVariableName')
  })

  it('slugify quita acentos básicos y espacios', () => {
    expect(slugify('Hola Mundo')).toBe('hola-mundo')
    expect(slugify('  Foo  Bar  ')).toBe('foo-bar')
  })

  it('generateHandle prefija @ y reemplaza guiones por puntos', () => {
    expect(generateHandle('Salon Central')).toBe('@salon.central')
    expect(generateHandle('Hola Mundo')).toBe('@hola.mundo')
  })

  it('truncate respeta length', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
    expect(truncate('short', 10)).toBe('short')
  })
})

describe('array utils', () => {
  it('groupBy agrupa por key derivada', () => {
    const items = [
      { type: 'a', n: 1 },
      { type: 'b', n: 2 },
      { type: 'a', n: 3 },
    ]
    const groups = groupBy(items, i => i.type)
    expect(groups.a).toHaveLength(2)
    expect(groups.b).toHaveLength(1)
  })

  it('unique elimina duplicados', () => {
    expect(unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3])
  })

  it('sortBy ordena ascendente y descendente', () => {
    const arr = [{ n: 3 }, { n: 1 }, { n: 2 }]
    expect(sortBy(arr, 'n').map(x => x.n)).toEqual([1, 2, 3])
    expect(sortBy(arr, 'n', 'desc').map(x => x.n)).toEqual([3, 2, 1])
  })

  it('sortBy no muta el array original', () => {
    const arr = [{ n: 3 }, { n: 1 }]
    sortBy(arr, 'n')
    expect(arr.map(x => x.n)).toEqual([3, 1])
  })
})

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('solo ejecuta la última llamada después del wait', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('a')
    debounced('b')
    debounced('c')
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })
})

describe('date utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-04T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('isToday/isTomorrow/isYesterday', () => {
    expect(isToday('2026-04-04T08:00:00Z')).toBe(true)
    expect(isTomorrow('2026-04-05T08:00:00Z')).toBe(true)
    expect(isYesterday('2026-04-03T08:00:00Z')).toBe(true)
    expect(isToday('2026-04-10T08:00:00Z')).toBe(false)
  })

  it('getRelativeDate retorna labels traducidos', () => {
    expect(getRelativeDate('2026-04-04T08:00:00Z', 'es')).toBe('Hoy')
    expect(getRelativeDate('2026-04-04T08:00:00Z', 'en')).toBe('Today')
    expect(getRelativeDate('2026-04-05T08:00:00Z', 'es')).toBe('Mañana')
    expect(getRelativeDate('2026-04-03T08:00:00Z', 'en')).toBe('Yesterday')
  })

  it('getDaysBetween calcula diferencia', () => {
    expect(getDaysBetween('2026-04-01', '2026-04-10')).toBe(9)
  })

  it('addDays suma días y retorna ISO date', () => {
    expect(addDays('2026-04-01', 5)).toBe('2026-04-06')
  })
})

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('set y get funcionan con objetos', () => {
    storage.set('key', { a: 1 })
    expect(storage.get('key')).toEqual({ a: 1 })
  })

  it('get retorna defaultValue cuando no existe', () => {
    expect(storage.get('missing', 'fallback')).toBe('fallback')
  })

  it('get retorna null cuando no existe sin default', () => {
    expect(storage.get('missing')).toBeNull()
  })

  it('get tolera JSON inválido', () => {
    localStorage.setItem('bad', 'not json {')
    expect(storage.get('bad', 'fallback')).toBe('fallback')
  })
})
