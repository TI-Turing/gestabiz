import * as Sentry from '@sentry/react'

const CHUNK_RELOAD_FLAG_PREFIX = 'lazy-reload-once:'

/**
 * Retry one time for chunk-load failures caused by stale cached bundles after deploy.
 */
export function lazyWithRetry<T>(
  importer: () => Promise<{ default: T }>,
  cacheKey: string
): Promise<{ default: T }> {
  return importer().catch((error: unknown) => {
    let message: string
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'object' && error !== null) {
      message = JSON.stringify(error)
    } else if (typeof error === 'string') {
      message = error
    } else {
      message = 'Unknown lazy import error'
    }
    const isChunkLoadError =
      /Failed to fetch dynamically imported module/i.test(message) ||
      /Loading chunk \d+ failed/i.test(message)

    if (!isChunkLoadError) {
      throw error
    }

    const flagKey = `${CHUNK_RELOAD_FLAG_PREFIX}${cacheKey}`
    const alreadyReloaded = sessionStorage.getItem(flagKey) === '1'

    Sentry.captureException(error instanceof Error ? error : new Error(message), {
      tags: {
        component: 'lazyWithRetry',
        cache_key: cacheKey,
      },
      extra: {
        alreadyReloaded,
      },
    })

    if (!alreadyReloaded) {
      sessionStorage.setItem(flagKey, '1')
      globalThis.location.reload()
    }

    throw error
  })
}
