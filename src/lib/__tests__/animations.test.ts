import {
  animations,
  transitionDurations,
  easings,
  smoothScrollTo,
  scrollToBottom,
  isNearBottom,
  getStaggerDelay,
  getStaggerClass,
} from '../animations'

describe('animations constants', () => {
  it('exports animations object with expected keys', () => {
    expect(animations).toHaveProperty('messageSlideIn')
    expect(animations).toHaveProperty('typingFadeIn')
    expect(animations).toHaveProperty('badgeBounce')
    expect(animations).toHaveProperty('modalFadeIn')
    expect(animations).toHaveProperty('shimmer')
    expect(animations).toHaveProperty('spin')
  })

  it('all animation values are non-empty strings', () => {
    for (const value of Object.values(animations)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('transitionDurations has fast < normal < slow < slowest', () => {
    expect(transitionDurations.fast).toBeLessThan(transitionDurations.normal)
    expect(transitionDurations.normal).toBeLessThan(transitionDurations.slow)
    expect(transitionDurations.slow).toBeLessThan(transitionDurations.slowest)
  })

  it('easings values are CSS cubic-bezier strings', () => {
    for (const value of Object.values(easings)) {
      expect(value).toMatch(/cubic-bezier/)
    }
  })
})

describe('getStaggerDelay', () => {
  it('returns "0ms" for index 0 with default base', () => {
    expect(getStaggerDelay(0)).toBe('0ms')
  })

  it('returns "50ms" for index 1 with default base', () => {
    expect(getStaggerDelay(1)).toBe('50ms')
  })

  it('uses custom baseDelay', () => {
    expect(getStaggerDelay(2, 100)).toBe('200ms')
  })
})

describe('getStaggerClass', () => {
  it('returns a non-empty string class', () => {
    const cls = getStaggerClass(0)
    expect(typeof cls).toBe('string')
    expect(cls.length).toBeGreaterThan(0)
  })

  it('includes animation delay in class', () => {
    const cls = getStaggerClass(1)
    expect(cls).toContain('animation-delay')
  })

  it('caps delay at maxItems * 50', () => {
    const cls10 = getStaggerClass(20, 10)
    // Delay capped at 10 * 50 = 500ms
    expect(cls10).toContain('500ms')
  })
})

describe('smoothScrollTo', () => {
  it('calls element.scrollIntoView with smooth behavior', () => {
    const element = document.createElement('div')
    element.scrollIntoView = vi.fn()
    smoothScrollTo(element)
    expect(element.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    )
  })

  it('merges custom options', () => {
    const element = document.createElement('div')
    element.scrollIntoView = vi.fn()
    smoothScrollTo(element, { block: 'start' })
    expect(element.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'start', behavior: 'smooth' })
    )
  })
})

describe('scrollToBottom', () => {
  it('calls container.scrollTo when smooth=true (default)', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'scrollHeight', { value: 500, configurable: true })
    container.scrollTo = vi.fn()
    scrollToBottom(container)
    expect(container.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth', top: 500 })
    )
  })

  it('sets scrollTop directly when smooth=false', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'scrollHeight', { value: 300, configurable: true })
    container.scrollTo = vi.fn()
    scrollToBottom(container, false)
    expect(container.scrollTop).toBe(300)
    expect(container.scrollTo).not.toHaveBeenCalled()
  })
})

describe('isNearBottom', () => {
  function makeContainer(scrollTop: number, scrollHeight: number, clientHeight: number): HTMLElement {
    const el = document.createElement('div')
    Object.defineProperties(el, {
      scrollTop: { value: scrollTop, writable: true, configurable: true },
      scrollHeight: { value: scrollHeight, configurable: true },
      clientHeight: { value: clientHeight, configurable: true },
    })
    return el
  }

  it('returns true when within default threshold (100)', () => {
    const el = makeContainer(900, 1000, 50)
    // remaining = 1000 - 900 - 50 = 50 < 100 → near bottom
    expect(isNearBottom(el)).toBe(true)
  })

  it('returns false when far from bottom', () => {
    const el = makeContainer(0, 1000, 100)
    // remaining = 1000 - 0 - 100 = 900 > 100
    expect(isNearBottom(el)).toBe(false)
  })

  it('respects custom threshold', () => {
    const el = makeContainer(0, 1000, 100)
    // remaining = 900, threshold = 950 → near bottom
    expect(isNearBottom(el, 950)).toBe(true)
  })
})
