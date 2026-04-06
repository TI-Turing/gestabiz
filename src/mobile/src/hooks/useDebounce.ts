import { useState, useEffect } from 'react'

/**
 * Debounces a value by the specified delay (ms).
 * Returns the debounced value — updates are deferred until
 * `delay` ms have passed without the input changing.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
