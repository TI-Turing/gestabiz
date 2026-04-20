import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import ChatWithAdminModal from '../ChatWithAdminModal'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const {
  authState,
  adminHookState,
  employeesHookState,
  configHookState,
  createOrGetConversationMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  authState: { user: { id: 'client-1' } as null | { id: string } },
  adminHookState: { admins: [] as Array<Record<string, unknown>>, loading: false, error: null as string | null },
  employeesHookState: { employees: [] as Array<Record<string, unknown>>, loading: false, error: null as string | null },
  configHookState: { config: { allow_professional_chat: false, locations: [] as Array<Record<string, unknown>> }, isLoading: false },
  createOrGetConversationMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}))

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('@/hooks/useBusinessAdmins', () => ({
  useBusinessAdmins: () => adminHookState,
}))

vi.mock('@/hooks/useBusinessEmployeesForChat', () => ({
  useBusinessEmployeesForChat: () => employeesHookState,
}))

vi.mock('@/hooks/useBusinessChatConfig', () => ({
  useBusinessChatConfig: () => configHookState,
}))

vi.mock('@/hooks/useChat', () => ({
  useChat: () => ({
    createOrGetConversation: createOrGetConversationMock,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}))

function renderModal(overrides: Partial<React.ComponentProps<typeof ChatWithAdminModal>> = {}) {
  const props: React.ComponentProps<typeof ChatWithAdminModal> = {
    businessId: 'biz-1',
    businessName: 'Negocio Demo',
    onClose: vi.fn(),
    onChatStarted: vi.fn(),
    onCloseParent: vi.fn(),
    userLocation: null,
    ...overrides,
  }

  return {
    ...renderWithProviders(<ChatWithAdminModal {...props} />),
    props,
  }
}

describe('ChatWithAdminModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = { id: 'client-1' }
    adminHookState.admins = [
      {
        user_id: 'admin-1',
        full_name: 'Laura Admin',
        email: 'laura@negocio.com',
        avatar_url: null,
      },
    ]
    adminHookState.loading = false
    adminHookState.error = null
    employeesHookState.employees = [
      {
        employee_id: 'emp-1',
        full_name: 'Carlos Chat',
        email: 'carlos@negocio.com',
        avatar_url: null,
        location_name: 'Sede Centro',
      },
    ]
    employeesHookState.loading = false
    employeesHookState.error = null
    configHookState.config = { allow_professional_chat: false, locations: [] }
    configHookState.isLoading = false
    createOrGetConversationMock.mockResolvedValue('conv-1')
  })

  it('renders a loading indicator while hook data is still loading', () => {
    adminHookState.loading = true

    const { container } = renderModal()

    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('renders the error state and retries by reloading the page', () => {
    const reloadMock = vi.fn()
    adminHookState.error = 'Error cargando admins'
    const originalLocation = globalThis.location
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadMock },
    })

    renderModal()

    expect(screen.getByText('Error cargando admins')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(reloadMock).toHaveBeenCalledTimes(1)

    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('starts a direct chat with the resolved admin when professional chat is disabled', async () => {
    const { props } = renderModal()

    expect(screen.getByText(/Administrador de Negocio Demo/i)).toBeInTheDocument()
    expect(screen.getByText('Laura Admin')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Chatear' }))

    await waitFor(() => {
      expect(createOrGetConversationMock).toHaveBeenCalledWith({
        other_user_id: 'admin-1',
        business_id: 'biz-1',
        initial_message: 'Hola Laura Admin, me interesa conocer más sobre Negocio Demo',
      })
    })

    expect(toastSuccessMock).toHaveBeenCalledWith('Conversación iniciada')
    expect(props.onClose).toHaveBeenCalledTimes(1)
    expect(props.onCloseParent).toHaveBeenCalledTimes(1)
    expect(props.onChatStarted).toHaveBeenCalledWith('conv-1')
  })

  it('renders available employees and starts a chat with the selected employee when professional chat is enabled', async () => {
    configHookState.config = {
      allow_professional_chat: true,
      locations: [],
    }

    const { props } = renderModal()

    expect(screen.getByText('Carlos Chat')).toBeInTheDocument()
    expect(screen.getByText('Empleados disponibles (1)')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Chatear' })[0])

    await waitFor(() => {
      expect(createOrGetConversationMock).toHaveBeenCalledWith({
        other_user_id: 'emp-1',
        business_id: 'biz-1',
        initial_message: 'Hola Carlos Chat, me interesa conocer más sobre Negocio Demo',
      })
    })

    expect(toastSuccessMock).toHaveBeenCalledWith('Chat iniciado con Carlos Chat')
    expect(props.onClose).toHaveBeenCalledTimes(1)
    expect(props.onCloseParent).toHaveBeenCalledTimes(1)
    expect(props.onChatStarted).toHaveBeenCalledWith('conv-1')
  })

  it('shows the empty admin state when there are no administrators available', () => {
    adminHookState.admins = []
    configHookState.config = { allow_professional_chat: false, locations: [] }

    renderModal()

    expect(screen.getByText('No hay administradores disponibles en este momento.')).toBeInTheDocument()
  })
})