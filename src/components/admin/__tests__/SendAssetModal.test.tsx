import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { toast } from 'sonner'
import type { MarketingVaultFile } from '@/types/types'

// ── hoisted mocks ─────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn())
const mockInvoke = vi.hoisted(() => vi.fn())
const mockRpc = vi.hoisted(() => vi.fn())
const mockStorageFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    storage: { from: mockStorageFrom },
    functions: { invoke: mockInvoke },
    rpc: mockRpc,
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'u-1' } })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { SendAssetModal } from '../marketing/SendAssetModal'

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeFile(overrides: Partial<MarketingVaultFile> = {}): MarketingVaultFile {
  return {
    name: 'promo.jpg',
    id: 'f-1',
    path: 'biz-1/Flyers/promo.jpg',
    url: 'https://cdn.example.com/promo.jpg',
    isImage: true,
    updated_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    last_accessed_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

const MOCK_PROFILES = [
  { id: 'c-1', full_name: 'Ana Lopez', email: 'ana@x.com', phone: '+57300000001' },
  { id: 'c-2', full_name: 'Carlos Perez', email: 'carlos@x.com', phone: null },
]

const MOCK_APPOINTMENTS = [
  { client_id: 'c-1' },
  { client_id: 'c-2' },
]

function setupTwoStepMock() {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'appointments') {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: MOCK_APPOINTMENTS, error: null }),
      }
      return chain
    }
    if (table === 'profiles') {
      const chain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: MOCK_PROFILES, error: null }),
      }
      return chain
    }
    return {
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
  })

  mockRpc.mockResolvedValue({ data: [], error: null })
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('SendAssetModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupTwoStepMock()
  })

  it('does not render when isOpen is false', () => {
    const { container } = renderWithProviders(
      <SendAssetModal
        file={makeFile()}
        businessId="biz-1"
        isOpen={false}
        onClose={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders file thumbnail/name in header when open', async () => {
    renderWithProviders(
      <SendAssetModal
        file={makeFile({ name: 'promo.jpg' })}
        businessId="biz-1"
        isOpen={true}
        onClose={vi.fn()}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('promo.jpg')).toBeInTheDocument()
    })
    expect(screen.getByText('Enviar archivo de marketing')).toBeInTheDocument()
  })

  it('tab WhatsApp is active by default', async () => {
    renderWithProviders(
      <SendAssetModal
        file={makeFile()}
        businessId="biz-1"
        isOpen={true}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('promo.jpg')).toBeInTheDocument()
    })

    // The footer send button shows WhatsApp label by default
    expect(screen.getByText(/Enviar por WhatsApp/)).toBeInTheDocument()
  })

  it('disables Send button when no recipients selected', async () => {
    renderWithProviders(
      <SendAssetModal
        file={makeFile()}
        businessId="biz-1"
        isOpen={true}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/Enviar por WhatsApp/)).toBeInTheDocument()
    })

    const sendButton = screen.getByRole('button', { name: /Enviar por WhatsApp/ })
    expect(sendButton).toBeDisabled()
  })

  it('adds recipient via RecipientPicker and enables Send', async () => {
    renderWithProviders(
      <SendAssetModal
        file={makeFile()}
        businessId="biz-1"
        isOpen={true}
        onClose={vi.fn()}
      />,
    )

    // Wait for recipients to load
    await waitFor(() => {
      expect(screen.getByText('Ana Lopez')).toBeInTheDocument()
    })

    // Ana has a phone so she is clickable on WhatsApp tab
    await userEvent.click(screen.getByText('Ana Lopez'))

    const sendButton = screen.getByRole('button', { name: /Enviar por WhatsApp/ })
    expect(sendButton).not.toBeDisabled()
  })

  it('calls send-marketing-whatsapp edge function with correct payload on submit', async () => {
    mockInvoke.mockResolvedValue({ data: {}, error: null })

    const onClose = vi.fn()
    renderWithProviders(
      <SendAssetModal
        file={makeFile({ path: 'biz-1/Flyers/promo.jpg' })}
        businessId="biz-1"
        isOpen={true}
        onClose={onClose}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Ana Lopez')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Ana Lopez'))

    const sendButton = screen.getByRole('button', { name: /Enviar por WhatsApp/ })
    await userEvent.click(sendButton)

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('send-marketing-whatsapp', {
        body: {
          businessId: 'biz-1',
          assetPath: 'biz-1/Flyers/promo.jpg',
          recipients: [{ phone: '+57300000001', name: 'Ana Lopez' }],
        },
      })
    })
  })

  it('shows success toast after successful whatsapp send', async () => {
    mockInvoke.mockResolvedValue({ data: {}, error: null })

    renderWithProviders(
      <SendAssetModal
        file={makeFile()}
        businessId="biz-1"
        isOpen={true}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getByText('Ana Lopez')).toBeInTheDocument())

    await userEvent.click(screen.getByText('Ana Lopez'))
    await userEvent.click(screen.getByRole('button', { name: /Enviar por WhatsApp/ }))

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        expect.stringContaining('WhatsApp enviado'),
      )
    })
  })

  it('shows error toast when edge function returns error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Function error' } })

    renderWithProviders(
      <SendAssetModal
        file={makeFile()}
        businessId="biz-1"
        isOpen={true}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getByText('Ana Lopez')).toBeInTheDocument())

    await userEvent.click(screen.getByText('Ana Lopez'))
    await userEvent.click(screen.getByRole('button', { name: /Enviar por WhatsApp/ }))

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Error al enviar por WhatsApp')
    })
  })

  it('tab Email renders subject and body fields', async () => {
    renderWithProviders(
      <SendAssetModal
        file={makeFile()}
        businessId="biz-1"
        isOpen={true}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getByText('promo.jpg')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /Email/i }))

    expect(screen.getByPlaceholderText('Asunto del correo')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Cuerpo del correo (opcional)')).toBeInTheDocument()
  })

  it('calls send-marketing-email with recipients, subject, body', async () => {
    mockInvoke.mockResolvedValue({ data: {}, error: null })

    const onClose = vi.fn()
    renderWithProviders(
      <SendAssetModal
        file={makeFile({ path: 'biz-1/Flyers/promo.jpg' })}
        businessId="biz-1"
        isOpen={true}
        onClose={onClose}
      />,
    )

    await waitFor(() => expect(screen.getByText('Ana Lopez')).toBeInTheDocument())

    // Switch to email tab
    await userEvent.click(screen.getByRole('button', { name: /Email/i }))

    // Select recipient (Ana has email)
    await userEvent.click(screen.getByText('Ana Lopez'))

    // Fill subject
    const subjectInput = screen.getByPlaceholderText('Asunto del correo')
    await userEvent.type(subjectInput, 'Oferta especial')

    // Fill body
    const bodyInput = screen.getByPlaceholderText('Cuerpo del correo (opcional)')
    await userEvent.type(bodyInput, 'Descuento del 20%')

    const sendButton = screen.getByRole('button', { name: /Enviar por Email/ })
    await userEvent.click(sendButton)

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('send-marketing-email', {
        body: {
          businessId: 'biz-1',
          assetPath: 'biz-1/Flyers/promo.jpg',
          recipients: [{ email: 'ana@x.com', name: 'Ana Lopez' }],
          subject: 'Oferta especial',
          body: 'Descuento del 20%',
        },
      })
    })
  })
})
