import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Appearance, useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getTheme, type ColorScheme, type ThemeColors } from '../theme'

const THEME_STORAGE_KEY = '@gestabiz:theme'

interface ThemeContextType {
  theme: ThemeColors
  colorScheme: ColorScheme
  isDark: boolean
  toggleTheme: () => void
  setColorScheme: (scheme: ColorScheme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

/**
 * ThemeProvider — proveedor global de tema claro/oscuro.
 *
 * Prioridad de resolución:
 * 1. Preferencia guardada por el usuario en AsyncStorage
 * 2. Preferencia del sistema operativo
 * 3. Fallback: dark
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme ?? 'dark')
  const [, setHydrated] = useState(false)

  // Cargar preferencia guardada al iniciar
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setColorSchemeState(saved)
        }
        setHydrated(true)
      })
      .catch(() => setHydrated(true))
  }, [])

  // Escuchar cambios del sistema si el usuario no tiene preferencia guardada
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: next }) => {
      AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
        if (!saved && (next === 'light' || next === 'dark')) {
          setColorSchemeState(next)
        }
      })
    })
    return () => subscription.remove()
  }, [])

  const setColorScheme = useCallback(async (scheme: ColorScheme) => {
    setColorSchemeState(scheme)
    await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
  }, [colorScheme, setColorScheme])

  const theme = useMemo(() => getTheme(colorScheme), [colorScheme])

  const value = useMemo(
    (): ThemeContextType => ({
      theme,
      colorScheme,
      isDark: colorScheme === 'dark',
      toggleTheme,
      setColorScheme,
    }),
    [theme, colorScheme, toggleTheme, setColorScheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook para consumir el tema activo.
 *
 * @example
 * const { theme, isDark, toggleTheme } = useTheme()
 * <View style={{ backgroundColor: theme.background }}>
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export default ThemeContext
