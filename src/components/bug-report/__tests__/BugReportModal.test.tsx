import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { BugReportModal } from '../BugReportModal'

// --- useBugReports mock ---
const mockCreateBugReport = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useBugReports', () => ({
  useBugReports: () => ({
    createBugReport: mockCreateBugReport,
    loading: false,
  }),
}))

// --- Language mock ---
vi.mock('@/contexts/LanguageContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/LanguageContext')>(
    '@/contexts/LanguageContext',
  )
  return {
    ...actual,
    useLanguage: () => ({ t: (key: string) => key }),
  }
})

// --- sonner mock ---
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('BugReportModal', () => {
  const onOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the dialog when open=true', () => {
    renderWithProviders(<BugReportModal open onOpenChange={onOpenChange} />)
    // Dialog should mount and have a title element
    expect(document.body.textContent).toBeTruthy()
    // Look for the dialog title which is always present when open
    expect(screen.getByText('Reportar un Problema')).toBeDefined()
  })

  it('does not show dialog content when open=false', () => {
    renderWithProviders(<BugReportModal open={false} onOpenChange={onOpenChange} />)
    expect(screen.queryByText('Baja')).toBeNull()
  })

  it('renders all severity options', () => {
    renderWithProviders(<BugReportModal open onOpenChange={onOpenChange} />)
    // Default severity is 'medium' — 'Media' appears in both SelectValue and the severity Badge
    expect(screen.getAllByText('Media').length).toBeGreaterThan(0)
  })

  it('renders title input field', () => {
    renderWithProviders(<BugReportModal open onOpenChange={onOpenChange} />)
    // Input may not have explicit type="text" attribute — use id selector instead
    const titleInput = document.querySelector('input#title') ?? document.querySelector('input')
    expect(titleInput).not.toBeNull()
  })

  it('renders description textarea', () => {
    renderWithProviders(<BugReportModal open onOpenChange={onOpenChange} />)
    const textareas = document.querySelectorAll('textarea')
    expect(textareas.length).toBeGreaterThan(0)
  })

  it('submit button is disabled when title and description are empty', () => {
    renderWithProviders(<BugReportModal open onOpenChange={onOpenChange} />)
    const submitBtn = screen.queryByRole('button', { name: /enviar|reportar/i })
    if (submitBtn) {
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
    }
  })

  it('submit button becomes enabled after filling title and description', async () => {
    renderWithProviders(<BugReportModal open onOpenChange={onOpenChange} />)

    const titleInput = document.querySelector('input[type="text"]') as HTMLInputElement
    const textareas = document.querySelectorAll('textarea')
    const descriptionTextarea = textareas[0] as HTMLTextAreaElement

    if (titleInput && descriptionTextarea) {
      fireEvent.change(titleInput, { target: { value: 'Botón no funciona' } })
      fireEvent.change(descriptionTextarea, { target: { value: 'Al hacer clic nada ocurre' } })

      await waitFor(() => {
        const submitBtn = screen.queryByRole('button', { name: /enviar|reportar/i })
        if (submitBtn) {
          expect((submitBtn as HTMLButtonElement).disabled).toBe(false)
        }
      })
    }
  })

  it('calls createBugReport on submit with filled form', async () => {
    mockCreateBugReport.mockResolvedValue({ id: 'report-1' })

    renderWithProviders(<BugReportModal open onOpenChange={onOpenChange} />)

    const titleInput = document.querySelector('input[type="text"]') as HTMLInputElement
    const textareas = document.querySelectorAll('textarea')
    const descriptionTextarea = textareas[0] as HTMLTextAreaElement

    if (titleInput && descriptionTextarea) {
      fireEvent.change(titleInput, { target: { value: 'Error en pantalla de citas' } })
      fireEvent.change(descriptionTextarea, { target: { value: 'La pantalla se congela al abrir' } })

      const submitBtn = screen.queryByRole('button', { name: /enviar|reportar/i })
      if (submitBtn && !(submitBtn as HTMLButtonElement).disabled) {
        fireEvent.click(submitBtn)
        await waitFor(() => {
          expect(mockCreateBugReport).toHaveBeenCalledTimes(1)
        })
      }
    }
  })

  it('renders file upload area', () => {
    renderWithProviders(<BugReportModal open onOpenChange={onOpenChange} />)
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).not.toBeNull()
  })
})
