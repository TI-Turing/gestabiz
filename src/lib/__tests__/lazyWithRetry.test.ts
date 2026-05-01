import { lazyWithRetry } from '../lazyWithRetry'

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

const CHUNK_RELOAD_FLAG_PREFIX = 'lazy-reload-once:'

describe('lazyWithRetry', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.spyOn(globalThis, 'location', 'get').mockReturnValue({
      reload: vi.fn(),
    } as unknown as Location)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves when importer succeeds', async () => {
    const mockModule = { default: () => null }
    const importer = vi.fn().mockResolvedValue(mockModule)

    const result = await lazyWithRetry(importer, 'test-key')

    expect(result).toBe(mockModule)
  })

  it('rethrows non-chunk-load errors without reloading', async () => {
    const error = new Error('SyntaxError: unexpected token')
    const importer = vi.fn().mockRejectedValue(error)

    await expect(lazyWithRetry(importer, 'test-key')).rejects.toThrow('SyntaxError: unexpected token')
    expect(globalThis.location.reload).not.toHaveBeenCalled()
  })

  it('triggers reload on first chunk-load error', async () => {
    const error = new Error('Failed to fetch dynamically imported module: /chunk.js')
    const importer = vi.fn().mockRejectedValue(error)

    await expect(lazyWithRetry(importer, 'chunk-key')).rejects.toThrow()
    expect(sessionStorage.getItem(`${CHUNK_RELOAD_FLAG_PREFIX}chunk-key`)).toBe('1')
    expect(globalThis.location.reload).toHaveBeenCalledTimes(1)
  })

  it('does not reload again when flag is already set', async () => {
    const flagKey = `${CHUNK_RELOAD_FLAG_PREFIX}chunk-key2`
    sessionStorage.setItem(flagKey, '1')

    const error = new Error('Loading chunk 42 failed.')
    const importer = vi.fn().mockRejectedValue(error)

    await expect(lazyWithRetry(importer, 'chunk-key2')).rejects.toThrow()
    expect(globalThis.location.reload).not.toHaveBeenCalled()
  })

  it('handles non-Error chunk-load error (string)', async () => {
    const importer = vi.fn().mockRejectedValue('Failed to fetch dynamically imported module: /a.js')

    await expect(lazyWithRetry(importer, 'str-key')).rejects.toBeDefined()
    expect(globalThis.location.reload).toHaveBeenCalledTimes(1)
  })

  it('each cacheKey is isolated (different flags)', async () => {
    sessionStorage.setItem(`${CHUNK_RELOAD_FLAG_PREFIX}key-a`, '1')

    const error = new Error('Failed to fetch dynamically imported module: /b.js')
    const importer = vi.fn().mockRejectedValue(error)

    await expect(lazyWithRetry(importer, 'key-b')).rejects.toThrow()
    // key-b not yet flagged → should reload
    expect(globalThis.location.reload).toHaveBeenCalledTimes(1)
  })
})
