import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import type { MarketingVaultFolder } from '@/types/types'

// ── hoisted mocks ─────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn())
const mockStorageCreateSignedUrl = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: mockStorageCreateSignedUrl,
      })),
    },
  },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

// ── hook mocks ────────────────────────────────────────────────────────────────

const mockUseMarketingVault = vi.hoisted(() => vi.fn())
const mockMutateAsync = vi.hoisted(() => vi.fn())
const mockDeleteMutateAsync = vi.hoisted(() => vi.fn())
const mockCreateFolderMutateAsync = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useMarketingVault', () => ({
  useMarketingVault: mockUseMarketingVault,
  useUploadMarketingAsset: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
  useDeleteMarketingAsset: vi.fn(() => ({ mutateAsync: mockDeleteMutateAsync, isPending: false })),
  useCreateMarketingFolder: vi.fn(() => ({
    mutateAsync: mockCreateFolderMutateAsync,
    isPending: false,
  })),
}))

vi.mock('@/hooks/usePlanFeatures', () => ({
  usePlanFeatures: vi.fn(() => ({ planId: 'profesional' })),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user-1' } })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ui/PermissionGate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/admin/marketing/SendAssetModal', () => ({
  SendAssetModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="send-modal" /> : null,
}))

import { MarketingManager } from '../marketing/MarketingManager'
import { usePlanFeatures } from '@/hooks/usePlanFeatures'

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeFolder(name: string, fileCount = 1): MarketingVaultFolder {
  return {
    name,
    files: Array.from({ length: fileCount }, (_, i) => ({
      name: `file-${i}.jpg`,
      id: `${name}-file-${i}`,
      path: `biz-1/${name}/file-${i}.jpg`,
      url: `https://cdn.example.com/${name}/file-${i}.jpg`,
      isImage: true,
      updated_at: '2025-01-01T00:00:00Z',
      created_at: '2025-01-01T00:00:00Z',
      last_accessed_at: '2025-01-01T00:00:00Z',
    })),
  }
}

function setupVault(folders: MarketingVaultFolder[] = [], isLoading = false) {
  mockUseMarketingVault.mockReturnValue({
    data: folders,
    isLoading,
    error: null,
  })
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('MarketingManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePlanFeatures).mockReturnValue({ planId: 'profesional' } as ReturnType<typeof usePlanFeatures>)
    setupVault()
  })

  it('shows upsell banner when plan is free', () => {
    vi.mocked(usePlanFeatures).mockReturnValue({ planId: 'free' } as ReturnType<typeof usePlanFeatures>)
    renderWithProviders(<MarketingManager businessId="biz-1" />)
    expect(screen.getByText(/Profesional/)).toBeInTheDocument()
    expect(screen.getByText('Ver planes')).toBeInTheDocument()
  })

  it('shows upsell banner when plan is basico', () => {
    vi.mocked(usePlanFeatures).mockReturnValue({ planId: 'basico' } as ReturnType<typeof usePlanFeatures>)
    renderWithProviders(<MarketingManager businessId="biz-1" />)
    expect(screen.getByText(/Profesional/)).toBeInTheDocument()
  })

  it('renders folder list from vault data', async () => {
    setupVault([makeFolder('Flyers'), makeFolder('Redes Sociales')])
    renderWithProviders(<MarketingManager businessId="biz-1" />)

    // "Flyers" appears twice: in the folder list button and in the right panel header
    await waitFor(() => {
      expect(screen.getAllByText('Flyers').length).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getAllByText('Redes Sociales').length).toBeGreaterThanOrEqual(1)
  })

  it('renders asset grid for active folder', async () => {
    setupVault([makeFolder('Flyers', 2)])
    renderWithProviders(<MarketingManager businessId="biz-1" />)

    await waitFor(() => {
      expect(screen.getByText('file-0.jpg')).toBeInTheDocument()
    })
    expect(screen.getByText('file-1.jpg')).toBeInTheDocument()
  })

  it('shows empty state when vault is empty', async () => {
    setupVault([])
    renderWithProviders(<MarketingManager businessId="biz-1" />)

    await waitFor(() => {
      expect(screen.getByText('Sin carpetas')).toBeInTheDocument()
    })
  })

  it('shows loading skeleton while fetching', () => {
    setupVault([], true)
    renderWithProviders(<MarketingManager businessId="biz-1" />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('clicking "Nueva carpeta" shows inline input', async () => {
    setupVault([makeFolder('Flyers')])
    renderWithProviders(<MarketingManager businessId="biz-1" />)

    // "Flyers" appears in both folder list and panel header
    await waitFor(() => expect(screen.getAllByText('Flyers').length).toBeGreaterThanOrEqual(1))

    // The FolderPlus button in the panel header
    const folderPlusButtons = screen.getAllByTitle('Nueva carpeta')
    await userEvent.click(folderPlusButtons[0])

    expect(screen.getByPlaceholderText('Nombre carpeta')).toBeInTheDocument()
  })

  it('confirms new folder creation and resets input', async () => {
    mockCreateFolderMutateAsync.mockResolvedValue('Mi Carpeta')
    setupVault([makeFolder('Flyers')])
    renderWithProviders(<MarketingManager businessId="biz-1" />)

    await waitFor(() => expect(screen.getAllByText('Flyers').length).toBeGreaterThanOrEqual(1))

    const folderPlusButtons = screen.getAllByTitle('Nueva carpeta')
    await userEvent.click(folderPlusButtons[0])

    const input = screen.getByPlaceholderText('Nombre carpeta')
    await userEvent.type(input, 'Mi Carpeta')
    await userEvent.keyboard('{Enter}')

    expect(mockCreateFolderMutateAsync).toHaveBeenCalledWith('Mi Carpeta')
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Nombre carpeta')).not.toBeInTheDocument()
    })
  })

  it('clicking delete button calls deleteMutation', async () => {
    mockDeleteMutateAsync.mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    setupVault([makeFolder('Flyers', 1)])
    renderWithProviders(<MarketingManager businessId="biz-1" />)

    await waitFor(() => expect(screen.getByText('file-0.jpg')).toBeInTheDocument())

    // Hover triggers overlay; but we can query the delete button by title
    const deleteButton = screen.getByTitle('Eliminar')
    await userEvent.click(deleteButton)

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith('biz-1/Flyers/file-0.jpg')
  })

  it('clicking send button opens SendAssetModal', async () => {
    setupVault([makeFolder('Flyers', 1)])
    renderWithProviders(<MarketingManager businessId="biz-1" />)

    await waitFor(() => expect(screen.getByText('file-0.jpg')).toBeInTheDocument())

    const sendButton = screen.getByTitle('Enviar')
    await userEvent.click(sendButton)

    expect(screen.getByTestId('send-modal')).toBeInTheDocument()
  })

  it('copying URL writes to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })

    mockStorageCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed-url.example.com/promo.jpg' },
      error: null,
    })

    setupVault([makeFolder('Flyers', 1)])
    renderWithProviders(<MarketingManager businessId="biz-1" />)

    await waitFor(() => expect(screen.getByText('file-0.jpg')).toBeInTheDocument())

    const copyButton = screen.getByTitle('Copiar URL (1h)')
    await userEvent.click(copyButton)

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('https://signed-url.example.com/promo.jpg')
    })
  })
})
