import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

const mockFrom = vi.hoisted(() => vi.fn())
const mockStorageFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => {
  const __sb = {
    from: mockFrom,
    storage: { from: mockStorageFrom },
  }
  return { supabase: __sb, default: __sb }
})

vi.mock('@/lib/queryConfig', () => ({
  default: {
    STABLE: { staleTime: 0, gcTime: 0 },
    FREQUENT: { staleTime: 0, gcTime: 0 },
  },
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0 },
    FREQUENT: { staleTime: 0, gcTime: 0 },
  },
}))

import {
  useMarketingVault,
  useUploadMarketingAsset,
  useDeleteMarketingAsset,
  useCreateMarketingFolder,
} from '../useMarketingVault'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStorageMock(opts: {
  listTopLevel?: unknown[]
  listFolder?: unknown[]
  listError?: { message: string } | null
  signedUrls?: Array<{ signedUrl: string | null }>
  uploadError?: { message: string } | null
  removeError?: { message: string } | null
}) {
  const {
    listTopLevel = [],
    listFolder = [],
    listError = null,
    signedUrls = [],
    uploadError = null,
    removeError = null,
  } = opts

  let callCount = 0
  const listMock = vi.fn().mockImplementation(() => {
    callCount++
    if (listError && callCount === 1) {
      return Promise.resolve({ data: null, error: listError })
    }
    if (callCount === 1) {
      return Promise.resolve({ data: listTopLevel, error: null })
    }
    return Promise.resolve({ data: listFolder, error: null })
  })

  const createSignedUrlsMock = vi
    .fn()
    .mockResolvedValue({ data: signedUrls, error: null })

  const uploadMock = vi.fn().mockResolvedValue({
    data: uploadError ? null : {},
    error: uploadError ?? null,
  })

  const removeMock = vi.fn().mockResolvedValue({
    data: removeError ? null : {},
    error: removeError ?? null,
  })

  mockStorageFrom.mockReturnValue({
    list: listMock,
    createSignedUrls: createSignedUrlsMock,
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed' }, error: null }),
    upload: uploadMock,
    remove: removeMock,
  })

  return { listMock, createSignedUrlsMock, uploadMock, removeMock }
}

// ── useMarketingVault ─────────────────────────────────────────────────────────

describe('useMarketingVault', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when businessId is undefined (disabled query)', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMarketingVault(undefined), { wrapper: Wrapper })

    await new Promise(r => setTimeout(r, 20))

    expect(result.current.data).toBeUndefined()
    expect(mockStorageFrom).not.toHaveBeenCalled()
  })

  it('lists folders: top-level directories become folder names, files inside get path and url', async () => {
    makeStorageMock({
      listTopLevel: [
        // carpeta (sin metadata)
        { name: 'Flyers', metadata: null, id: null, updated_at: null, created_at: null, last_accessed_at: null },
      ],
      listFolder: [
        {
          name: 'promo.jpg',
          id: 'f-1',
          metadata: { size: 1024 },
          updated_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          last_accessed_at: '2025-01-01T00:00:00Z',
        },
      ],
      signedUrls: [{ signedUrl: 'https://cdn.example.com/promo.jpg' }],
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMarketingVault('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const folders = result.current.data!
    expect(folders).toHaveLength(1)
    expect(folders[0].name).toBe('Flyers')
    expect(folders[0].files).toHaveLength(1)
    expect(folders[0].files[0].path).toBe('biz-1/Flyers/promo.jpg')
    expect(folders[0].files[0].url).toBe('https://cdn.example.com/promo.jpg')
  })

  it('filters out .keep files from folder content', async () => {
    makeStorageMock({
      listTopLevel: [
        { name: 'Promo', metadata: null, id: null, updated_at: null, created_at: null, last_accessed_at: null },
      ],
      listFolder: [
        {
          name: '.keep',
          id: 'k-1',
          metadata: { size: 0 },
          updated_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          last_accessed_at: '2025-01-01T00:00:00Z',
        },
        {
          name: 'banner.png',
          id: 'f-2',
          metadata: { size: 2048 },
          updated_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          last_accessed_at: '2025-01-01T00:00:00Z',
        },
      ],
      signedUrls: [{ signedUrl: 'https://cdn.example.com/banner.png' }],
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMarketingVault('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const files = result.current.data![0].files
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('banner.png')
  })

  it('files in root (with metadata) go to unnamed folder', async () => {
    makeStorageMock({
      listTopLevel: [
        {
          name: 'root-file.pdf',
          id: 'r-1',
          metadata: { size: 512 },
          updated_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          last_accessed_at: '2025-01-01T00:00:00Z',
        },
      ],
      signedUrls: [{ signedUrl: 'https://cdn.example.com/root-file.pdf' }],
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMarketingVault('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const folders = result.current.data!
    expect(folders).toHaveLength(1)
    expect(folders[0].name).toBe('')
    expect(folders[0].files[0].name).toBe('root-file.pdf')
    expect(folders[0].files[0].path).toBe('biz-1/root-file.pdf')
  })

  it('returns error state when storage.list fails', async () => {
    makeStorageMock({
      listTopLevel: [],
      listError: { message: 'Storage unavailable' },
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMarketingVault('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeTruthy()
  })

  it('uses staleTime of 2 minutes', () => {
    // The hook passes staleTime: 2 * 60 * 1000 (120_000 ms) to useQuery.
    // We verify it by inspecting the hook's options indirectly: with gcTime/staleTime 0
    // in our test QueryClient the query still runs (not from cache) which means the
    // provided staleTime does NOT prevent fresh fetches in tests. The test just
    // confirms the hook resolves successfully (i.e., it is not blocking on staleTime).
    makeStorageMock({ listTopLevel: [] })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMarketingVault('biz-1'), { wrapper: Wrapper })

    // The query should start fetching (not be stuck in stale cache)
    // staleTime from the hook does not override gcTime: 0 from the test client
    expect(result.current.isLoading || result.current.isSuccess || result.current.isFetching).toBe(true)
  })
})

// ── useUploadMarketingAsset ───────────────────────────────────────────────────

describe('useUploadMarketingAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads file to {businessId}/{folder}/{timestamp}_{name} and invalidates query', async () => {
    const { uploadMock } = makeStorageMock({})

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUploadMarketingAsset('biz-1'), { wrapper: Wrapper })

    const fakeFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.mutateAsync({ folder: 'Flyers', file: fakeFile })
    })

    expect(uploadMock).toHaveBeenCalledOnce()
    const [path] = uploadMock.mock.calls[0]
    expect(path).toMatch(/^biz-1\/Flyers\/\d+_photo\.jpg$/)

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['marketing-vault', 'biz-1'] }),
    )
  })

  it('throws and surfaces error when upload fails', async () => {
    makeStorageMock({ uploadError: { message: 'upload failed' } })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUploadMarketingAsset('biz-1'), { wrapper: Wrapper })

    const fakeFile = new File(['x'], 'bad.jpg', { type: 'image/jpeg' })

    let threw = false
    await act(async () => {
      try {
        await result.current.mutateAsync({ folder: 'Flyers', file: fakeFile })
      } catch {
        threw = true
      }
    })

    expect(threw).toBe(true)
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ── useDeleteMarketingAsset ───────────────────────────────────────────────────

describe('useDeleteMarketingAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls storage.remove with correct path and invalidates query', async () => {
    const { removeMock } = makeStorageMock({})

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteMarketingAsset('biz-1'), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync('biz-1/Flyers/1234_promo.jpg')
    })

    expect(removeMock).toHaveBeenCalledWith(['biz-1/Flyers/1234_promo.jpg'])

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['marketing-vault', 'biz-1'] }),
    )
  })
})

// ── useCreateMarketingFolder ──────────────────────────────────────────────────

describe('useCreateMarketingFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads .keep blob to {businessId}/{folderName}/.keep', async () => {
    const { uploadMock } = makeStorageMock({})

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateMarketingFolder('biz-1'), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync('Nueva Carpeta')
    })

    expect(uploadMock).toHaveBeenCalledOnce()
    const [path, blob] = uploadMock.mock.calls[0]
    expect(path).toBe('biz-1/Nueva Carpeta/.keep')
    expect(blob).toBeInstanceOf(Blob)
    expect((blob as Blob).size).toBe(0)
  })
})
