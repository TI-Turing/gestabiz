import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useForm } from '../useForm'
import { ValidationSchema, FormValidationResult } from '@/lib/validation'

// ──────────────────────────────────────────────────────────────────────────────
// MOCKS
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

interface TestForm {
  name: string
  email: string
  age: number
}

const initialValues: TestForm = {
  name: '',
  email: '',
  age: 0,
}

function makeValidationSchema(errors: Record<string, string> = {}): ValidationSchema {
  return {
    validate: (data: Record<string, unknown>): FormValidationResult => ({
      isValid: Object.keys(errors).length === 0,
      errors,
    }),
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SUITE
// ──────────────────────────────────────────────────────────────────────────────

describe('useForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Estado inicial ─────────────────────────────────────────────────────────

  it('initializa con los valores correctos', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.isDirty).toBe(false)
  })

  it('isValid es true cuando no hay errores', () => {
    const { result } = renderHook(() => useForm({ initialValues }))
    expect(result.current.isValid).toBe(true)
  })

  it('isDirty es false al inicio', () => {
    const { result } = renderHook(() => useForm({ initialValues }))
    expect(result.current.isDirty).toBe(false)
  })

  // ── setValue ───────────────────────────────────────────────────────────────

  it('setValue actualiza el campo correcto', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setValue('name', 'Juan')
    })

    expect(result.current.values.name).toBe('Juan')
    expect(result.current.values.email).toBe('')
  })

  it('isDirty es true después de setValue', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setValue('name', 'Juan')
    })

    expect(result.current.isDirty).toBe(true)
  })

  it('isDirty vuelve a false cuando el valor regresa al inicial', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setValue('name', 'Juan')
    })
    act(() => {
      result.current.setValue('name', '')
    })

    expect(result.current.isDirty).toBe(false)
  })

  // ── setValues ──────────────────────────────────────────────────────────────

  it('setValues actualiza múltiples campos', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setValues({ name: 'Ana', email: 'ana@test.com' })
    })

    expect(result.current.values.name).toBe('Ana')
    expect(result.current.values.email).toBe('ana@test.com')
    expect(result.current.values.age).toBe(0) // sin cambio
  })

  // ── setError / clearError ─────────────────────────────────────────────────

  it('setError registra un error en el campo', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setError('name', 'Nombre requerido')
    })

    expect(result.current.errors.name).toBe('Nombre requerido')
    expect(result.current.isValid).toBe(false)
  })

  it('clearError elimina el error del campo', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setError('name', 'Nombre requerido')
    })
    act(() => {
      result.current.clearError('name')
    })

    expect(result.current.errors.name).toBeUndefined()
    expect(result.current.isValid).toBe(true)
  })

  it('clearErrors elimina todos los errores', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setErrors({ name: 'error name', email: 'error email' })
    })
    act(() => {
      result.current.clearErrors()
    })

    expect(result.current.errors).toEqual({})
    expect(result.current.isValid).toBe(true)
  })

  // ── setTouched / setFieldTouched ─────────────────────────────────────────

  it('setTouched marca el campo como tocado', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setTouched('name', true)
    })

    expect(result.current.touched.name).toBe(true)
  })

  it('setTouched desmarca el campo con false', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setTouched('name', true)
    })
    act(() => {
      result.current.setTouched('name', false)
    })

    expect(result.current.touched.name).toBe(false)
  })

  // ── handleChange ──────────────────────────────────────────────────────────

  it('handleChange retorna función que actualiza el campo', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.handleChange('name')('Pedro')
    })

    expect(result.current.values.name).toBe('Pedro')
  })

  // ── handleBlur ────────────────────────────────────────────────────────────

  it('handleBlur marca el campo como tocado', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.handleBlur('name')()
    })

    expect(result.current.touched.name).toBe(true)
  })

  // ── validateForm ─────────────────────────────────────────────────────────

  it('validateForm retorna true cuando no hay schema', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    let isValid = false
    act(() => {
      isValid = result.current.validateForm()
    })

    expect(isValid).toBe(true)
  })

  it('validateForm retorna false cuando el schema falla', () => {
    const schema = makeValidationSchema({ name: 'Nombre requerido' })
    const { result } = renderHook(() =>
      useForm({ initialValues, validationSchema: schema })
    )

    let isValid = true
    act(() => {
      isValid = result.current.validateForm()
    })

    expect(isValid).toBe(false)
    expect(result.current.errors.name).toBe('Nombre requerido')
  })

  it('validateForm retorna true cuando el schema pasa', () => {
    const schema = makeValidationSchema()
    const { result } = renderHook(() =>
      useForm({ initialValues, validationSchema: schema })
    )

    let isValid = false
    act(() => {
      isValid = result.current.validateForm()
    })

    expect(isValid).toBe(true)
    expect(result.current.errors).toEqual({})
  })

  // ── validateField ─────────────────────────────────────────────────────────

  it('validateField retorna true sin schema', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    let isValid = false
    act(() => {
      isValid = result.current.validateField('name')
    })

    expect(isValid).toBe(true)
  })

  // ── handleSubmit ──────────────────────────────────────────────────────────

  it('handleSubmit llama onSubmit cuando el formulario es válido', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useForm({ initialValues, onSubmit }))

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(onSubmit).toHaveBeenCalledWith(initialValues)
  })

  it('handleSubmit no llama onSubmit cuando hay errores de validación', async () => {
    const onSubmit = vi.fn()
    const schema = makeValidationSchema({ name: 'Nombre requerido' })
    const { result } = renderHook(() =>
      useForm({ initialValues, validationSchema: schema, onSubmit })
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('handleSubmit previene submit duplicado mientras isSubmitting es true', async () => {
    let resolve: () => void
    const promise = new Promise<void>((res) => { resolve = res })
    const onSubmit = vi.fn().mockReturnValue(promise)
    const { result } = renderHook(() => useForm({ initialValues, onSubmit }))

    // iniciar submit
    act(() => { result.current.handleSubmit() })

    // intentar de nuevo antes de que termine
    await act(async () => {
      await result.current.handleSubmit()
    })

    resolve!()

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('handleSubmit marca todos los campos como touched', async () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.touched.name).toBe(true)
    expect(result.current.touched.email).toBe(true)
    expect(result.current.touched.age).toBe(true)
  })

  it('handleSubmit previene el comportamiento por defecto del evento', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useForm({ initialValues, onSubmit }))

    const preventDefault = vi.fn()
    const fakeEvent = { preventDefault } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(preventDefault).toHaveBeenCalled()
  })

  // ── reset / resetField ────────────────────────────────────────────────────

  it('reset restaura el estado inicial completo', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setValue('name', 'Modificado')
      result.current.setError('name', 'Error')
      result.current.setTouched('name', true)
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
  })

  it('resetField restaura solo el campo indicado', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setValue('name', 'Modificado')
      result.current.setValue('email', 'test@test.com')
    })
    act(() => {
      result.current.resetField('name')
    })

    expect(result.current.values.name).toBe('')
    expect(result.current.values.email).toBe('test@test.com') // sin cambio
  })

  // ── isSubmitting ──────────────────────────────────────────────────────────

  it('isSubmitting es true durante la ejecución de onSubmit', async () => {
    let resolve: () => void
    const promise = new Promise<void>((res) => { resolve = res })
    const onSubmit = vi.fn().mockReturnValue(promise)
    const { result } = renderHook(() => useForm({ initialValues, onSubmit }))

    act(() => { result.current.handleSubmit() })

    expect(result.current.isSubmitting).toBe(true)

    await act(async () => { resolve!() })

    expect(result.current.isSubmitting).toBe(false)
  })
})
