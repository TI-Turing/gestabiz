import { useEffect } from 'react'

interface PageMetaProps {
  title?: string
  description?: string
  keywords?: string
  ogType?: string
  ogUrl?: string
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonical?: string
}

export function usePageMeta({
  title,
  description,
  keywords,
  ogType = 'website',
  ogUrl,
  ogImage,
  ogTitle,
  ogDescription,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonical,
}: PageMetaProps) {
  useEffect(() => {
    // Title
    if (title) {
      document.title = title
      setMetaTag('og:title', ogTitle || title)
      setMetaTag('twitter:title', twitterTitle || title)
    }

    // Description
    if (description) {
      setMetaTag('description', description)
      setMetaTag('og:description', ogDescription || description)
      setMetaTag('twitter:description', twitterDescription || description)
    }

    // Keywords
    if (keywords) {
      setMetaTag('keywords', keywords)
    }

    // OG type (website | article | local.business…)
    setMetaTag('og:type', ogType)

    // OG URL (canonical for social)
    if (ogUrl) {
      setMetaTag('og:url', ogUrl)
    }

    // OG image
    if (ogImage) {
      setMetaTag('og:image', ogImage)
    }

    // Twitter image (falls back to OG image)
    setMetaTag('twitter:image', twitterImage || ogImage || '')

    // Twitter card
    setMetaTag('twitter:card', twitterCard)

    // Canonical link tag
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!canonicalLink) {
        canonicalLink = document.createElement('link')
        canonicalLink.rel = 'canonical'
        document.head.appendChild(canonicalLink)
      }
      canonicalLink.href = canonical
    }
  }, [title, description, keywords, ogType, ogUrl, ogImage, ogTitle, ogDescription, twitterCard, twitterTitle, twitterDescription, twitterImage, canonical])
}

function setMetaTag(nameOrProperty: string, content: string) {
  if (!content) return

  // og:* uses property="", twitter:* uses name="", everything else uses name=""
  const isOgProperty = nameOrProperty.startsWith('og:') || nameOrProperty.startsWith('fb:')

  const selector = isOgProperty
    ? `meta[property="${nameOrProperty}"]`
    : `meta[name="${nameOrProperty}"]`

  let tag = document.querySelector(selector) as HTMLMetaElement | null

  if (!tag) {
    tag = document.createElement('meta')
    if (isOgProperty) {
      tag.setAttribute('property', nameOrProperty)
    } else {
      tag.setAttribute('name', nameOrProperty)
    }
    document.head.appendChild(tag)
  }

  tag.content = content
}
