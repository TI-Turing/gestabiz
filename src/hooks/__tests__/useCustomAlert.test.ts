import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

// ── Mock the context provider ────────────────────────────────────────────────
const mockShowAlert = vi.fn()
const mockHideAlert = vi.fn()

vi.mock('@/components/ui/custom-alert', () => ({
  useCustomAlert: () => ({ showAlert: mockShowAlert, hideAlert: mockHideAlert }),
}))

import { useCustomAlert } from '../useCustomAlert'

describe('useCustomAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all 7 methods', () => {
    const { result } = renderHook(() => useCustomAlert())
    expect(typeof result.current.alert).toBe('function')
    expect(typeof result.current.confirm).toBe('function')
    expect(typeof result.current.success).toBe('function')
    expect(typeof result.current.error).toBe('function')
    expect(typeof result.current.warning).toBe('function')
    expect(typeof result.current.info).toBe('function')
    expect(typeof result.current.hideAlert).toBe('function')
  })

  describe('alert()', () => {
    it('calls showAlert with type=info and showCancel=false', () => {
      const { result } = renderHook(() => useCustomAlert())
      result.current.alert('Hello world')
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Hello world',
          type: 'info',
          showCancel: false,
          confirmText: 'Aceptar',
        }),
      )
    })

    it('forwards custom title and confirmText', () => {
      const { result } = renderHook(() => useCustomAlert())
      result.current.alert('Msg', { title: 'My Title', confirmText: 'OK' })
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'My Title', confirmText: 'OK' }),
      )
    })
  })

  describe('confirm()', () => {
    it('calls showAlert with showCancel=true and forwards onConfirm', () => {
      const { result } = renderHook(() => useCustomAlert())
      const onConfirm = vi.fn()
      result.current.confirm('Are you sure?', onConfirm)
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Are you sure?',
          showCancel: true,
          onConfirm,
          type: 'warning',
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
        }),
      )
    })

    it('accepts custom options for confirm', () => {
      const { result } = renderHook(() => useCustomAlert())
      const onConfirm = vi.fn()
      const onCancel = vi.fn()
      result.current.confirm('Delete?', onConfirm, {
        title: 'Confirm Delete',
        confirmText: 'Yes, delete',
        cancelText: 'No',
        onCancel,
      })
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Confirm Delete',
          confirmText: 'Yes, delete',
          cancelText: 'No',
          onCancel,
        }),
      )
    })
  })

  describe('success()', () => {
    it('calls showAlert with type=success', () => {
      const { result } = renderHook(() => useCustomAlert())
      result.current.success('All done!')
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'All done!',
          type: 'success',
          showCancel: false,
          title: 'Éxito',
        }),
      )
    })
  })

  describe('error()', () => {
    it('calls showAlert with type=error', () => {
      const { result } = renderHook(() => useCustomAlert())
      result.current.error('Something broke')
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Something broke',
          type: 'error',
          showCancel: false,
          title: 'Error',
        }),
      )
    })
  })

  describe('warning()', () => {
    it('calls showAlert with type=warning', () => {
      const { result } = renderHook(() => useCustomAlert())
      result.current.warning('Watch out')
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Watch out',
          type: 'warning',
          showCancel: false,
          title: 'Advertencia',
        }),
      )
    })
  })

  describe('info()', () => {
    it('calls showAlert with type=info and default title', () => {
      const { result } = renderHook(() => useCustomAlert())
      result.current.info('FYI')
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'FYI',
          type: 'info',
          showCancel: false,
          title: 'Información',
        }),
      )
    })
  })

  describe('hideAlert()', () => {
    it('delegates directly to context hideAlert', () => {
      const { result } = renderHook(() => useCustomAlert())
      result.current.hideAlert()
      expect(mockHideAlert).toHaveBeenCalledTimes(1)
    })
  })
})
