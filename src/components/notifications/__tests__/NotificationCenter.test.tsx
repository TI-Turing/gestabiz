import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { NotificationCenter } from '../NotificationCenter'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const {
  notificationsState,
  markAsReadMock,
  markAllAsReadMock,
  archiveMock,
  deleteMock,
  toastSuccessMock,
  roleSwitchHandlerMock,
  getNavigationMock,
} = vi.hoisted(() => ({
  notificationsState: {
    notifications: [] as Array<Record<string, unknown>>,
    unreadCount: 0,
    loading: false,
  },
  markAsReadMock: vi.fn(),
  markAllAsReadMock: vi.fn(),
  archiveMock: vi.fn(),
  deleteMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  roleSwitchHandlerMock: vi.fn(),
  getNavigationMock: vi.fn(),
}))

vi.mock('@/hooks/useInAppNotifications', () => ({
  useInAppNotifications: () => ({
    notifications: notificationsState.notifications,
    unreadCount: notificationsState.unreadCount,
    loading: notificationsState.loading,
    markAsRead: markAsReadMock,
    markAllAsRead: markAllAsReadMock,
    archive: archiveMock,
    deleteNotification: deleteMock,
  }),
}))

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'notifications.moreActions': 'Más acciones',
        'notifications.markAllAsRead': 'Marcar todas como leídas',
      }
      return map[key] ?? key
    },
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
  },
}))

vi.mock('../NotificationErrorBoundary', () => ({
  NotificationItemErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}))

vi.mock('@/components/ui/tabs', () => {
  const React = require('react') as typeof import('react')
  const TabsContext = React.createContext<{ value: string; setValue: (value: string) => void }>({
    value: 'unread',
    setValue: () => {},
  })

  const Tabs = ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => {
    const contextValue = React.useMemo(() => ({ value, setValue: onValueChange }), [value, onValueChange])
    return <TabsContext.Provider value={contextValue}>{children}</TabsContext.Provider>
  }

  const TabsList = ({ children }: { children: React.ReactNode }) => <div>{children}</div>

  const TabsTrigger = ({ children, value }: { children: React.ReactNode; value: string }) => {
    const context = React.useContext(TabsContext)
    return (
      <button type="button" onClick={() => context.setValue(value)}>
        {children}
      </button>
    )
  }

  const TabsContent = ({ children, value }: { children: React.ReactNode; value: string }) => {
    const context = React.useContext(TabsContext)
    return context.value === value ? <div>{children}</div> : null
  }

  return { Tabs, TabsList, TabsTrigger, TabsContent }
})

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: (event: { preventDefault: () => void }) => void }) => (
    <button type="button" onClick={() => onSelect?.({ preventDefault: () => {} })}>
      {children}
    </button>
  ),
}))

vi.mock('@/lib/notificationRoleMapping', () => ({
  handleNotificationWithRoleSwitch: roleSwitchHandlerMock,
}))

vi.mock('@/lib/notificationNavigation', () => ({
  getNotificationNavigation: getNavigationMock,
}))

const notifications = [
  {
    id: 'n1',
    title: 'Cita nueva',
    body: 'Se creó una cita',
    message: 'Se creó una cita',
    type: 'appointment_created',
    status: 'unread',
    priority: 0,
    created_at: '2026-04-20T12:00:00.000Z',
    updated_at: '2026-04-20T12:00:00.000Z',
    user_id: 'user-1',
    data: { appointmentId: 'apt-1' },
    is_deleted: false,
  },
  {
    id: 'n2',
    title: 'Sistema',
    body: 'Mantenimiento',
    message: 'Mantenimiento',
    type: 'system_announcement',
    status: 'read',
    priority: 1,
    created_at: '2026-04-19T12:00:00.000Z',
    updated_at: '2026-04-19T12:00:00.000Z',
    user_id: 'user-1',
    data: {},
    is_deleted: false,
  },
  {
    id: 'n3',
    title: 'Archivada',
    body: 'Antigua',
    message: 'Antigua',
    type: 'appointment_cancelled',
    status: 'archived',
    priority: -1,
    created_at: '2026-04-18T12:00:00.000Z',
    updated_at: '2026-04-18T12:00:00.000Z',
    user_id: 'user-1',
    data: {},
    is_deleted: false,
  },
]

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notificationsState.notifications = notifications
    notificationsState.unreadCount = 1
    notificationsState.loading = false
    markAllAsReadMock.mockResolvedValue(undefined)
    roleSwitchHandlerMock.mockResolvedValue(undefined)
    getNavigationMock.mockReturnValue({ destination: 'internal', path: '/citas/apt-1', modalProps: { appointmentId: 'apt-1' } })
  })

  it('renders loading state', () => {
    notificationsState.loading = true

    renderWithProviders(
      <NotificationCenter userId="user-1" />,
    )

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('shows unread notifications by default and marks all as read', async () => {
    renderWithProviders(
      <NotificationCenter userId="user-1" />,
    )

    expect(screen.getByRole('button', { name: /Cita nueva\. No leída\./i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sistema\. Leída\./i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Marcar todas' }))

    await waitFor(() => {
      expect(markAllAsReadMock).toHaveBeenCalledTimes(1)
    })

    expect(toastSuccessMock).toHaveBeenCalledWith('1 notificación marcada como leída')
  })

  it('filters notifications through tabs', () => {
    renderWithProviders(
      <NotificationCenter userId="user-1" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Todas' }))
    expect(screen.getByRole('button', { name: /Cita nueva\. No leída\./i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sistema\. Leída\./i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Archivada\./i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sistema' }))
    expect(screen.queryByRole('button', { name: /Cita nueva\. No leída\./i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sistema\. Leída\./i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Archivadas' }))
    expect(screen.getByRole('button', { name: /Archivada\. Leída\./i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sistema\. Leída\./i })).not.toBeInTheDocument()
  })

  it('marks unread notification and routes with role-switch handler when configured', async () => {
    const onClose = vi.fn()
    const onNavigateToPage = vi.fn()
    const onRoleSwitch = vi.fn()

    renderWithProviders(
      <NotificationCenter
        userId="user-1"
        onClose={onClose}
        onNavigateToPage={onNavigateToPage}
        currentRole="client"
        onRoleSwitch={onRoleSwitch}
        availableRoles={['client', 'employee']}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Cita nueva/i }))

    await waitFor(() => {
      expect(markAsReadMock).toHaveBeenCalledWith('n1')
      expect(roleSwitchHandlerMock).toHaveBeenCalledTimes(1)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses fallback internal navigation when role switch callback is not provided', async () => {
    const onNavigateToPage = vi.fn()

    renderWithProviders(
      <NotificationCenter
        userId="user-1"
        onNavigateToPage={onNavigateToPage}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Cita nueva/i }))

    await waitFor(() => {
      expect(onNavigateToPage).toHaveBeenCalledWith('appointments', { appointmentId: 'apt-1' })
    })
  })

  it('executes per-item actions from dropdown menu', () => {
    renderWithProviders(
      <NotificationCenter userId="user-1" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como leída' }))
    fireEvent.click(screen.getByRole('button', { name: 'Archivar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(markAsReadMock).toHaveBeenCalledWith('n1')
    expect(archiveMock).toHaveBeenCalledWith('n1')
    expect(deleteMock).toHaveBeenCalledWith('n1')
  })
})