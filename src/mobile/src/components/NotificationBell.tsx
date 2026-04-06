import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../contexts/AuthContext'
import { useInAppNotifications } from '../hooks/useInAppNotifications'
import { colors, radius } from '../theme'

export default function NotificationBell() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  const { unreadCount } = useInAppNotifications(user?.id)

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Notificaciones')}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { padding: 4, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.error ?? '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
})
