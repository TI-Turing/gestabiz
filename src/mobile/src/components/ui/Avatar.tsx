import React from 'react'
import { View, Text, Image, ViewStyle, ImageStyle } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'

interface AvatarProps {
  uri?: string | null
  name?: string | null
  size?: number
  style?: ViewStyle
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({ uri, name, size = 40, style }: AvatarProps) {
  const { theme } = useTheme()
  const circleStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
  }

  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  }

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[imageStyle, style as ImageStyle]}
        resizeMode="cover"
      />
    )
  }

  const initials = name ? getInitials(name) : '?'
  const fontSize = Math.max(10, Math.round(size * 0.4))
  const placeholderStyle: ViewStyle = {
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <View style={[placeholderStyle, circleStyle, style]}>
      <Text style={{ color: theme.primaryForeground, fontWeight: '700', letterSpacing: 0.5, fontSize }}>
        {initials}
      </Text>
    </View>
  )
}
