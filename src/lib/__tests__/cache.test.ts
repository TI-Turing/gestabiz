import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getCache, setCache, withCache, invalidateCache } from '@/lib/cache'

describe('cache', () => {
  beforeEach(() => {
    invalidateCache()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('setCache + getCache', () => {
    it('almacena y recupera un valor', () => {
      setCache('k1', { v: 1 }, 1000)
      expect(getCache('k1')).toEqual({ v: 1 })
    })

    it('retorna undefined si no existe la key', () => {
      expect(getCache('missing')).toBeUndefined()
    })

    it('expira tras el TTL y retorna undefined', () => {
      setCache('k2', 'val', 100)
      vi.advanceTimersByTime(101)
      expect(getCache('k2')).toBeUndefined()
    })

    it('TTL negativo se trata como 0', () => {
      setCache('k3', 'val', -100)
      vi.advanceTimersByTime(1)
      expect(getCache('k3')).toBeUndefined()
    })
  })

  describe('withCache', () => {
    it('llama al fetcher solo la primera vez (HIT en segunda llamada)', async () => {
      const fetcher = vi.fn().mockResolvedValue('result')
      const r1 = await withCache('fk', fetcher, 1000)
      const r2 = await withCache('fk', fetcher, 1000)
      expect(r1).toBe('result')
      expect(r2).toBe('result')
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('coalesce requests concurrentes con la misma key', async () => {
      const fetcher = vi.fn().mockImplementation(
        () => new Promise(r => setTimeout(() => r('val'), 50))
      )
      const p1 = withCache('coal', fetcher, 1000)
      const p2 = withCache('coal', fetcher, 1000)
      vi.advanceTimersByTime(60)
      const [r1, r2] = await Promise.all([p1, p2])
      expect(r1).toBe('val')
      expect(r2).toBe('val')
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('vuelve a llamar fetcher tras expirar', async () => {
      const fetcher = vi.fn().mockResolvedValue('x')
      await withCache('exp', fetcher, 100)
      vi.advanceTimersByTime(150)
      await withCache('exp', fetcher, 100)
      expect(fetcher).toHaveBeenCalledTimes(2)
    })

    it('limpia inFlight si fetcher rechaza', async () => {
      const fetcher = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok')
      await expect(withCache('err', fetcher, 1000)).rejects.toThrow('boom')
      const r = await withCache('err', fetcher, 1000)
      expect(r).toBe('ok')
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })

  describe('invalidateCache', () => {
    it('sin argumento limpia todo el store', () => {
      setCache('a', 1, 1000)
      setCache('b', 2, 1000)
      invalidateCache()
      expect(getCache('a')).toBeUndefined()
      expect(getCache('b')).toBeUndefined()
    })

    it('con prefix limpia solo las keys matching', () => {
      setCache('user:1', 'a', 1000)
      setCache('user:2', 'b', 1000)
      setCache('post:1', 'c', 1000)
      invalidateCache('user:')
      expect(getCache('user:1')).toBeUndefined()
      expect(getCache('user:2')).toBeUndefined()
      expect(getCache('post:1')).toBe('c')
    })
  })
})
