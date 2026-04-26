import React, { useRef } from 'react'
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { radius, shadows } from '../../theme'

interface FloatingChatButtonProps {
  bottomOffset?: number
}

export function FloatingChatButton({ bottomOffset = 80 }: FloatingChatButtonProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()

  const scale = useRef(new Animated.Value(1)).current

  // Badge: mensajes no leídos en in_app_notifications
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['floating-chat-unread', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0
      const { count } = await supabase
        .from('in_app_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'unread')
        .ilike('type', '%chat%')
      return count ?? 0
    },
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start()
  }

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // ConversacionList está en el RootStack (nivel raíz), accesible directamente.
    navigation.navigate('ConversacionList')
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: bottomOffset + insets.bottom, right: 16 }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={[
            styles.button,
            { backgroundColor: theme.primary, ...shadows.md },
          ]}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Badge de mensajes no leídos */}
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 999,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
})
