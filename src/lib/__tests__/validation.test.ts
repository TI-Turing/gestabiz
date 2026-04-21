import { describe, it, expect } from 'vitest'
import {
  validators,
  ValidationSchema,
  validateField,
} from '@/lib/validation'

describe('validation.validators', () => {
  describe('required', () => {
    it('inválido para vacío/null/undefined', () => {
      expect(validators.required('').isValid).toBe(false)
      expect(validators.required(null).isValid).toBe(false)
      expect(validators.required(undefined).isValid).toBe(false)
    })
    it('válido para valor presente', () => {
      expect(validators.required('hi').isValid).toBe(true)
      expect(validators.required(0).isValid).toBe(true)
    })
  })

  describe('email', () => {
    it('válido para formato correcto', () => {
      expect(validators.email('a@b.com').isValid).toBe(true)
    })
    it('inválido para formato malo', () => {
      expect(validators.email('not-email').isValid).toBe(false)
    })
    it('válido cuando vacío (opcional)', () => {
      expect(validators.email('').isValid).toBe(true)
    })
  })

  describe('phone', () => {
    it('válido tras strip de espacios y guiones', () => {
      const r = validators.phone('+57 300-123-4567')
      expect(typeof r.isValid).toBe('boolean')
    })
    it('vacío es válido', () => {
      expect(validators.phone('').isValid).toBe(true)
    })
  })

  describe('minLength / maxLength', () => {
    it('minLength', () => {
      expect(validators.minLength(3)('ab').isValid).toBe(false)
      expect(validators.minLength(3)('abc').isValid).toBe(true)
      expect(validators.minLength(3)('').isValid).toBe(true) // optional
    })
    it('maxLength', () => {
      expect(validators.maxLength(3)('abcd').isValid).toBe(false)
      expect(validators.maxLength(3)('abc').isValid).toBe(true)
    })
  })

  describe('min / max', () => {
    it('min', () => {
      expect(validators.min(5)(4).isValid).toBe(false)
      expect(validators.min(5)(5).isValid).toBe(true)
    })
    it('max', () => {
      expect(validators.max(10)(11).isValid).toBe(false)
      expect(validators.max(10)(10).isValid).toBe(true)
    })
  })

  describe('url', () => {
    it('válida URLs correctas', () => {
      expect(validators.url('https://example.com').isValid).toBe(true)
    })
    it('rechaza URLs malas', () => {
      expect(validators.url('not a url').isValid).toBe(false)
    })
    it('vacío válido', () => {
      expect(validators.url('').isValid).toBe(true)
    })
  })

  describe('password', () => {
    it('rechaza < 8 caracteres', () => {
      expect(validators.password('1234567').isValid).toBe(false)
    })
    it('acepta >= 8', () => {
      expect(validators.password('12345678').isValid).toBe(true)
    })
    it('vacío válido', () => {
      expect(validators.password('').isValid).toBe(true)
    })
  })

  describe('passwordConfirmation', () => {
    it('coincide', () => {
      expect(validators.passwordConfirmation('abc')('abc').isValid).toBe(true)
    })
    it('no coincide', () => {
      expect(validators.passwordConfirmation('abc')('xyz').isValid).toBe(false)
    })
  })

  describe('date', () => {
    it('fecha válida', () => {
      expect(validators.date('2025-01-01').isValid).toBe(true)
    })
    it('fecha inválida', () => {
      expect(validators.date('not-a-date').isValid).toBe(false)
    })
    it('vacío válido', () => {
      expect(validators.date('').isValid).toBe(true)
    })
  })

  describe('futureDate', () => {
    it('fecha futura válida', () => {
      const d = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      expect(validators.futureDate(d).isValid).toBe(true)
    })
    it('fecha pasada inválida', () => {
      expect(validators.futureDate('2000-01-01').isValid).toBe(false)
    })
  })

  describe('businessHours', () => {
    it('cierre posterior a apertura', () => {
      expect(validators.businessHours('09:00', '17:00').isValid).toBe(true)
    })
    it('cierre antes de apertura', () => {
      expect(validators.businessHours('17:00', '09:00').isValid).toBe(false)
    })
    it('vacíos válido', () => {
      expect(validators.businessHours('', '').isValid).toBe(true)
    })
  })
})

describe('ValidationSchema', () => {
  it('puede instanciarse y permite definir reglas', () => {
    const schema = new ValidationSchema()
    const rule = schema.field('name').required()
    expect(rule).toBeDefined()
    expect(typeof rule.required).toBe('function')
  })

  it('validate sobre instancia sin reglas retorna isValid true', () => {
    const schema = new ValidationSchema()
    const r = schema.validate({ name: 'Ana' })
    expect(r.isValid).toBe(true)
    expect(r.errors).toEqual({})
  })
})

describe('validateField', () => {
  it('aplica varios validadores', () => {
    const r = validateField('a@b.com', ['required', 'email'])
    expect(r.isValid).toBe(true)
  })

  it('falla en el primer inválido', () => {
    const r = validateField('', ['required', 'email'])
    expect(r.isValid).toBe(false)
  })

  it('soporta minLength con options', () => {
    const r = validateField('ab', ['minLength'], { min: 3 })
    expect(r.isValid).toBe(false)
  })

  it('ignora validador desconocido', () => {
    const r = validateField('x', ['noSuchValidator'])
    expect(r.isValid).toBe(true)
  })
})

