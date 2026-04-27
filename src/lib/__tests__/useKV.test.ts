import { renderHook, act } from '@testing-library/react'
import { useKV } from '../useKV'

describe('useKV', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns initial value when key does not exist', () => {
    const { result } = renderHook(() => useKV('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('returns parsed value from localStorage if it already exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))
    const { result } = renderHook(() => useKV('test-key', 'default'))
    expect(result.current[0]).toBe('stored-value')
  })

  it('persists new value to localStorage after update', async () => {
    const { result } = renderHook(() => useKV('test-key', 0))

    await act(async () => {
      await result.current[1](42)
    })

    expect(result.current[0]).toBe(42)
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe(42)
  })

  it('accepts updater function like setState', async () => {
    const { result } = renderHook(() => useKV('counter', 0))

    await act(async () => {
      await result.current[1](prev => prev + 5)
    })

    expect(result.current[0]).toBe(5)
  })

  it('works with object values', async () => {
    const { result } = renderHook(() => useKV<{ name: string }>('obj', { name: 'Alice' }))

    expect(result.current[0]).toEqual({ name: 'Alice' })

    await act(async () => {
      await result.current[1]({ name: 'Bob' })
    })

    expect(result.current[0]).toEqual({ name: 'Bob' })
  })

  it('returns initial value when localStorage contains invalid JSON', () => {
    localStorage.setItem('bad-key', '{not-valid-json}')
    const { result } = renderHook(() => useKV('bad-key', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })

  it('the update promise resolves with the new value', async () => {
    const { result } = renderHook(() => useKV('test-key', 'old'))

    let resolved: string | undefined
    await act(async () => {
      resolved = await result.current[1]('new-value')
    })

    expect(resolved).toBe('new-value')
  })

  it('works with array values', async () => {
    const { result } = renderHook(() => useKV<number[]>('arr', []))

    await act(async () => {
      await result.current[1]([1, 2, 3])
    })

    expect(result.current[0]).toEqual([1, 2, 3])
  })
})
