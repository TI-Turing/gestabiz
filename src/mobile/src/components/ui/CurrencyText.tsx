import React from 'react'
import { Text, TextStyle } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { typography } from '../../theme'

interface CurrencyTextProps {
  /** Valor en cents o unidades enteras de COP */
  amount: number
  /** Si true, los centavos se muestran. Para COP generalmente false */
  showCents?: boolean
  /** Tamaño de fuente base */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  /** Resaltar en color primario */
  highlight?: boolean
  style?: TextStyle
}

const sizeMap: Record<NonNullable<CurrencyTextProps['size']>, number> = {
  xs: typography.xs,
  sm: typography.sm,
  base: typography.base,
  lg: typography.lg,
  xl: typography.xl,
  '2xl': typography['2xl'],
}

/** Formatea moneda colombiana COP. Ej: 150000 → "$150.000" */
export function CurrencyText({
  amount,
  showCents = false,
  size = 'base',
  highlight = false,
  style,
}: CurrencyTextProps) {
  const { theme } = useTheme()

  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: showCents ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(amount)

  return (
    <Text
      style={[
        {
          fontSize: sizeMap[size],
          fontWeight: '600',
          color: highlight ? theme.primary : theme.text,
        },
        style,
      ]}
    >
      {formatted}
    </Text>
  )
}
