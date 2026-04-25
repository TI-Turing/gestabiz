import React from 'react'
import { View } from 'react-native'
import Screen from '../../components/ui/Screen'
import CalendarView from '../../components/client/CalendarView'
import { spacing } from '../../theme'

export default function CalendarScreen() {
  return (
    <Screen scrollable>
      <View style={{ paddingHorizontal: spacing.base }}>
        <CalendarView />
      </View>
    </Screen>
  )
}