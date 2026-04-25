import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  KEYBOARD_SHORTCUTS,
  isShortcut,
  aria,
  trapFocus,
} from '../accessibility'

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

function makeKeyEvent(
  key: string,
  {
    ctrlKey = false,
    metaKey = false,
    shiftKey = false,
    altKey = false,
  } = {}
): KeyboardEvent {
  return {
    key,
    ctrlKey,
    metaKey,
    shiftKey,
    altKey,
  } as KeyboardEvent
}

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — isShortcut
// ──────────────────────────────────────────────────────────────────────────────

describe('isShortcut', () => {
  describe('teclas simples', () => {
    it('detecta ESCAPE', () => {
      expect(isShortcut(makeKeyEvent('Escape'), KEYBOARD_SHORTCUTS.ESCAPE)).toBe(true)
    })

    it('detecta ENTER', () => {
      expect(isShortcut(makeKeyEvent('Enter'), KEYBOARD_SHORTCUTS.ENTER)).toBe(true)
    })

    it('detecta TAB', () => {
      expect(isShortcut(makeKeyEvent('Tab'), KEYBOARD_SHORTCUTS.TAB)).toBe(true)
    })

    it('detecta SPACE', () => {
      expect(isShortcut(makeKeyEvent(' '), KEYBOARD_SHORTCUTS.SPACE)).toBe(true)
    })

    it('BACKSPACE no tiene case en isShortcut (retorna false)', () => {
      // La función isShortcut no implementa BACKSPACE/DELETE/arrows en su switch
      expect(isShortcut(makeKeyEvent('Backspace'), KEYBOARD_SHORTCUTS.BACKSPACE)).toBe(false)
    })

    it('DELETE no tiene case en isShortcut (retorna false)', () => {
      expect(isShortcut(makeKeyEvent('Delete'), KEYBOARD_SHORTCUTS.DELETE)).toBe(false)
    })

    it('ARROW_UP no tiene case en isShortcut (retorna false)', () => {
      expect(isShortcut(makeKeyEvent('ArrowUp'), KEYBOARD_SHORTCUTS.ARROW_UP)).toBe(false)
    })

    it('ARROW_DOWN no tiene case en isShortcut (retorna false)', () => {
      expect(isShortcut(makeKeyEvent('ArrowDown'), KEYBOARD_SHORTCUTS.ARROW_DOWN)).toBe(false)
    })

    it('ARROW_LEFT no tiene case en isShortcut (retorna false)', () => {
      expect(isShortcut(makeKeyEvent('ArrowLeft'), KEYBOARD_SHORTCUTS.ARROW_LEFT)).toBe(false)
    })

    it('ARROW_RIGHT no tiene case en isShortcut (retorna false)', () => {
      expect(isShortcut(makeKeyEvent('ArrowRight'), KEYBOARD_SHORTCUTS.ARROW_RIGHT)).toBe(false)
    })
  })

  describe('combinaciones de teclas', () => {
    it('detecta CTRL+ENTER (ctrlKey)', () => {
      expect(
        isShortcut(makeKeyEvent('Enter', { ctrlKey: true }), KEYBOARD_SHORTCUTS.CTRL_ENTER)
      ).toBe(true)
    })

    it('detecta CTRL+ENTER (metaKey)', () => {
      expect(
        isShortcut(makeKeyEvent('Enter', { metaKey: true }), KEYBOARD_SHORTCUTS.CTRL_ENTER)
      ).toBe(true)
    })

    it('no detecta CTRL_ENTER sin modificador', () => {
      expect(isShortcut(makeKeyEvent('Enter'), KEYBOARD_SHORTCUTS.CTRL_ENTER)).toBe(false)
    })

    it('detecta SHIFT+TAB', () => {
      expect(
        isShortcut(makeKeyEvent('Tab', { shiftKey: true }), KEYBOARD_SHORTCUTS.SHIFT_TAB)
      ).toBe(true)
    })

    it('no detecta SHIFT_TAB sin shift', () => {
      expect(isShortcut(makeKeyEvent('Tab'), KEYBOARD_SHORTCUTS.SHIFT_TAB)).toBe(false)
    })

    it('detecta CMD_K (ctrlKey + k)', () => {
      expect(
        isShortcut(makeKeyEvent('k', { ctrlKey: true }), KEYBOARD_SHORTCUTS.CMD_K)
      ).toBe(true)
    })

    it('detecta CMD_K (metaKey + k)', () => {
      expect(
        isShortcut(makeKeyEvent('k', { metaKey: true }), KEYBOARD_SHORTCUTS.CMD_K)
      ).toBe(true)
    })

    it('detecta CTRL_K (alias de CMD_K)', () => {
      expect(
        isShortcut(makeKeyEvent('k', { ctrlKey: true }), KEYBOARD_SHORTCUTS.CTRL_K)
      ).toBe(true)
    })

    it('no detecta CMD_K sin modificador', () => {
      expect(isShortcut(makeKeyEvent('k'), KEYBOARD_SHORTCUTS.CMD_K)).toBe(false)
    })
  })

  describe('retorna false por defecto', () => {
    it('retorna false para shortcut desconocido', () => {
      const unknownShortcut = { key: 'F99' } as any
      expect(isShortcut(makeKeyEvent('F99'), unknownShortcut)).toBe(false)
    })

    it('retorna false cuando la tecla no coincide', () => {
      expect(isShortcut(makeKeyEvent('a'), KEYBOARD_SHORTCUTS.ESCAPE)).toBe(false)
    })
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — aria helpers
// ──────────────────────────────────────────────────────────────────────────────

describe('aria helpers', () => {
  // ── aria.button ───────────────────────────────────────────────────────────

  describe('aria.button', () => {
    it('retorna role y aria-label', () => {
      const attrs = aria.button('Guardar')
      expect(attrs.role).toBe('button')
      expect(attrs['aria-label']).toBe('Guardar')
    })

    it('incluye aria-pressed cuando pressed=true', () => {
      const attrs = aria.button('Toggle', true)
      expect(attrs['aria-pressed']).toBe(true)
    })

    it('incluye aria-pressed=false cuando pressed=false', () => {
      const attrs = aria.button('Toggle', false)
      expect(attrs['aria-pressed']).toBe(false)
    })

    it('no incluye aria-pressed cuando no se pasa', () => {
      const attrs = aria.button('Guardar')
      expect('aria-pressed' in attrs).toBe(false)
    })
  })

  // ── aria.link ─────────────────────────────────────────────────────────────

  describe('aria.link', () => {
    it('retorna role link y aria-label', () => {
      const attrs = aria.link('Ir a inicio')
      expect(attrs.role).toBe('link')
      expect(attrs['aria-label']).toBe('Ir a inicio')
    })
  })

  // ── aria.dialog ───────────────────────────────────────────────────────────

  describe('aria.dialog', () => {
    it('retorna role dialog sin props opcionales', () => {
      const attrs = aria.dialog()
      expect(attrs.role).toBe('dialog')
    })

    it('incluye aria-labelledby cuando se pasa', () => {
      const attrs = aria.dialog('modal-title')
      expect(attrs['aria-labelledby']).toBe('modal-title')
    })

    it('incluye aria-describedby cuando se pasa', () => {
      const attrs = aria.dialog('modal-title', 'modal-desc')
      expect(attrs['aria-describedby']).toBe('modal-desc')
    })
  })

  // ── aria.listbox ──────────────────────────────────────────────────────────

  describe('aria.listbox', () => {
    it('retorna role listbox', () => {
      const attrs = aria.listbox('Opciones', false)
      expect(attrs.role).toBe('listbox')
      expect(attrs['aria-label']).toBe('Opciones')
    })

    it('incluye aria-expanded', () => {
      expect(aria.listbox('Opciones', true)['aria-expanded']).toBe(true)
      expect(aria.listbox('Opciones', false)['aria-expanded']).toBe(false)
    })
  })

  // ── aria.option ───────────────────────────────────────────────────────────

  describe('aria.option', () => {
    it('retorna role option', () => {
      const attrs = aria.option('Opción 1', false)
      expect(attrs.role).toBe('option')
    })

    it('incluye aria-selected', () => {
      expect(aria.option('Opción 1', true)['aria-selected']).toBe(true)
      expect(aria.option('Opción 1', false)['aria-selected']).toBe(false)
    })
  })

  // ── aria.tab / aria.tabpanel ──────────────────────────────────────────────

  describe('aria.tab', () => {
    it('retorna role tab con aria-selected y aria-controls', () => {
      const attrs = aria.tab('Pestaña 1', true, 'panel-1')
      expect(attrs.role).toBe('tab')
      expect(attrs['aria-selected']).toBe(true)
      expect(attrs['aria-controls']).toBe('panel-1')
    })
  })

  describe('aria.tabpanel', () => {
    it('retorna role tabpanel con aria-labelledby', () => {
      const attrs = aria.tabpanel('tab-1')
      expect(attrs.role).toBe('tabpanel')
      expect(attrs['aria-labelledby']).toBe('tab-1')
    })
  })

  // ── aria.alert / aria.status ──────────────────────────────────────────────

  describe('aria.alert', () => {
    it('retorna role alert con aria-live=polite por defecto', () => {
      const attrs = aria.alert()
      expect(attrs.role).toBe('alert')
      expect(attrs['aria-live']).toBe('polite')
    })

    it('permite forzar aria-live=assertive', () => {
      const attrs = aria.alert('Alerta', 'assertive')
      expect(attrs['aria-live']).toBe('assertive')
    })

    it('incluye aria-label cuando se pasa', () => {
      const attrs = aria.alert('Nueva alerta')
      expect(attrs['aria-label']).toBe('Nueva alerta')
    })
  })

  describe('aria.status', () => {
    it('retorna role status', () => {
      const attrs = aria.status()
      expect(attrs.role).toBe('status')
    })
  })

  // ── aria.loading ──────────────────────────────────────────────────────────

  describe('aria.loading', () => {
    it('retorna aria-busy="true" (string ARIA)', () => {
      // Los atributos ARIA son strings; aria-busy se retorna como '"true"'
      const attrs = aria.loading()
      expect(attrs['aria-busy']).toBe('true')
    })

    it('incluye aria-label personalizado', () => {
      const attrs = aria.loading('Cargando datos...')
      expect(attrs['aria-label']).toBe('Cargando datos...')
    })
  })

  // ── aria.hidden ───────────────────────────────────────────────────────────

  describe('aria.hidden', () => {
    it('retorna aria-hidden="true" (string ARIA)', () => {
      // Los atributos ARIA son strings; aria-hidden se retorna como '"true"'
      const attrs = aria.hidden()
      expect(attrs['aria-hidden']).toBe('true')
    })
  })

  // ── aria.expandable ───────────────────────────────────────────────────────

  describe('aria.expandable', () => {
    it('retorna aria-expanded=true cuando expandido', () => {
      const attrs = aria.expandable(true)
      expect(attrs['aria-expanded']).toBe(true)
    })

    it('retorna aria-expanded=false cuando colapsado', () => {
      const attrs = aria.expandable(false)
      expect(attrs['aria-expanded']).toBe(false)
    })

    it('incluye aria-controls cuando se pasa', () => {
      const attrs = aria.expandable(true, 'menu-dropdown')
      expect(attrs['aria-controls']).toBe('menu-dropdown')
    })
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — trapFocus
// ──────────────────────────────────────────────────────────────────────────────

describe('trapFocus', () => {
  it('retorna una función cleanup', () => {
    const el = document.createElement('div')
    const cleanup = trapFocus(el)
    expect(typeof cleanup).toBe('function')
  })

  it('cleanup no lanza cuando se llama', () => {
    const el = document.createElement('div')
    const cleanup = trapFocus(el)
    expect(() => cleanup()).not.toThrow()
  })

  it('añade listener de keydown al elemento', () => {
    const el = document.createElement('div')
    const addSpy = vi.spyOn(el, 'addEventListener')
    trapFocus(el)
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('cleanup elimina el listener de keydown', () => {
    const el = document.createElement('div')
    const removeSpy = vi.spyOn(el, 'removeEventListener')
    const cleanup = trapFocus(el)
    cleanup()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})
