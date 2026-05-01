import { renderHook } from '@testing-library/react'
import { usePageMeta } from '../usePageMeta'

function getMeta(name: string): string | null {
  const el =
    document.querySelector(`meta[name="${name}"]`) ||
    document.querySelector(`meta[property="${name}"]`)
  return el ? el.getAttribute('content') : null
}

describe('usePageMeta', () => {
  beforeEach(() => {
    document.title = ''
    document.head.querySelectorAll('meta').forEach(el => el.remove())
    document.head.querySelectorAll('link[rel="canonical"]').forEach(el => el.remove())
  })

  it('sets document.title when title is provided', () => {
    renderHook(() => usePageMeta({ title: 'Mi página' }))
    expect(document.title).toBe('Mi página')
  })

  it('sets og:title and twitter:title from title prop when not overridden', () => {
    renderHook(() => usePageMeta({ title: 'Título' }))
    expect(getMeta('og:title')).toBe('Título')
    expect(getMeta('twitter:title')).toBe('Título')
  })

  it('uses explicit ogTitle over title for og:title', () => {
    renderHook(() => usePageMeta({ title: 'Título', ogTitle: 'OG Título' }))
    expect(getMeta('og:title')).toBe('OG Título')
    expect(document.title).toBe('Título')
  })

  it('sets meta description', () => {
    renderHook(() => usePageMeta({ description: 'Descripción de la página' }))
    expect(getMeta('description')).toBe('Descripción de la página')
  })

  it('sets og:description and twitter:description from description', () => {
    renderHook(() => usePageMeta({ description: 'Desc' }))
    expect(getMeta('og:description')).toBe('Desc')
    expect(getMeta('twitter:description')).toBe('Desc')
  })

  it('sets keywords meta tag', () => {
    renderHook(() => usePageMeta({ keywords: 'citas, negocio, spa' }))
    expect(getMeta('keywords')).toBe('citas, negocio, spa')
  })

  it('sets og:type to "website" by default', () => {
    renderHook(() => usePageMeta({}))
    expect(getMeta('og:type')).toBe('website')
  })

  it('sets og:type to custom value when provided', () => {
    renderHook(() => usePageMeta({ ogType: 'article' }))
    expect(getMeta('og:type')).toBe('article')
  })

  it('sets og:url when provided', () => {
    renderHook(() => usePageMeta({ ogUrl: 'https://gestabiz.com/negocio/spa' }))
    expect(getMeta('og:url')).toBe('https://gestabiz.com/negocio/spa')
  })

  it('sets og:image when provided', () => {
    renderHook(() => usePageMeta({ ogImage: 'https://cdn.example.com/img.jpg' }))
    expect(getMeta('og:image')).toBe('https://cdn.example.com/img.jpg')
  })

  it('sets twitter:card to "summary_large_image" by default', () => {
    renderHook(() => usePageMeta({}))
    expect(getMeta('twitter:card')).toBe('summary_large_image')
  })

  it('creates a canonical link element when canonical is provided', () => {
    renderHook(() => usePageMeta({ canonical: 'https://gestabiz.com/negocio/salon' }))
    const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    expect(link).not.toBeNull()
    expect(link.href).toBe('https://gestabiz.com/negocio/salon')
  })

  it('reuses existing canonical link rather than creating duplicates', () => {
    renderHook(() => usePageMeta({ canonical: 'https://gestabiz.com/a' }))
    renderHook(() => usePageMeta({ canonical: 'https://gestabiz.com/b' }))
    const links = document.querySelectorAll('link[rel="canonical"]')
    expect(links.length).toBe(1)
    expect((links[0] as HTMLLinkElement).href).toBe('https://gestabiz.com/b')
  })
})
