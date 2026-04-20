import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { NotificationBell } from '../NotificationBell'

// ---------- mocks ----------

const mockRefetch = vi.fn()
let mockUnreadCount = 3

vi.mock('@/hooks/useInAppNotifications', () => ({
  useInAppNotifications: vi.fn(() => ({
    unreadCount: mockUnreadCount,
    notifications: [],
    loading: false,
    refetch: mockRefetch,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  })),
}))

let mockIsMobile = false
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => mockIsMobile),
}))

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'notifications.title': 'Notificaciones',
      }
      return map[k] ?? k
    },
    language: 'es',
  })),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/lib/analytics', () => ({
  trackNotificationEvent: vi.fn(),
  NotificationEvents: {
    NOTIFICATION_CENTER_OPENED: 'opened',
    NOTIFICATION_CENTER_CLOSED: 'closed',
  },
}))

vi.mock('@/lib/animations', () => ({
  animations: { hoverScale: '', badgeBounce: '' },
}))

vi.mock('../NotificationCenter', () => ({
  NotificationCenter: (props: Record<string, unknown>) => (
    <div data-testid="notification-center">
      <button onClick={props.onClose as () => void}>close-center</button>
    </div>
  ),
}))

vi.mock('../NotificationErrorBoundary', () => ({
  NotificationErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ---------- tests ----------

const defaultProps = {
  userId: 'user-1',
}

describe('NotificationBell', () => {
  beforeEach(() => {
    mockUnreadCount = 3
    mockIsMobile = false
  })

  it('renders bell button', () => {
    renderWithProviders(<NotificationBell {...defaultProps} />)
    expect(screen.getByRole('button', { name: /notificaciones/i })).toBeInTheDocument()
  })

  it('shows unread badge with count', () => {
    renderWithProviders(<NotificationBell {...defaultProps} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('hides badge when unread count is 0', () => {
    mockUnreadCount = 0
    renderWithProviders(<NotificationBell {...defaultProps} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows 99+ when unread count exceeds 99', () => {
    mockUnreadCount = 150
    renderWithProviders(<NotificationBell {...defaultProps} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('has correct aria-label with unread count', () => {
    renderWithProviders(<NotificationBell {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Notificaciones (3)' })).toBeInTheDocument()
  })

  it('has plain aria-label when no unread', () => {
    mockUnreadCount = 0
    renderWithProviders(<NotificationBell {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument()
  })

  it('opens popover on click (desktop)', async () => {
    renderWithProviders(<NotificationBell {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /notificaciones/i }))
    expect(await screen.findByTestId('notification-center')).toBeInTheDocument()
  })

  it('opens dialog on click (mobile)', async () => {
    mockIsMobile = true
    renderWithProviders(<NotificationBell {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /notificaciones/i }))
    expect(await screen.findByTestId('notification-center')).toBeInTheDocument()
  })

  it('refetches on open', () => {
    renderWithProviders(<NotificationBell {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /notificaciones/i }))
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('passes className prop', () => {
    renderWithProviders(<NotificationBell {...defaultProps} className="extra-cls" />)
    const btn = screen.getByRole('button', { name: /notificaciones/i })
    expect(btn.className).toContain('extra-cls')
  })
})
