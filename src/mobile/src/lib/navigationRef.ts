import { createNavigationContainerRef } from '@react-navigation/native'

/**
 * Referencia global al NavigationContainer.
 *
 * Permite navegar desde fuera de componentes React (ej: NotificationContext,
 * Edge Functions handlers, background tasks).
 *
 * Uso en App.tsx:
 *   import { navigationRef } from './src/lib/navigationRef'
 *   <NavigationContainer ref={navigationRef} ...>
 *
 * Uso en cualquier parte de la app:
 *   import { navigate } from './src/lib/navigationRef'
 *   navigate('Citas')
 */
export const navigationRef = createNavigationContainerRef<ReactNavigation.RootParamList>()

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // @ts-expect-error — tipos genéricos de ReactNavigation
    navigationRef.navigate(name, params)
  } else {  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack()
  }
}

export function getCurrentRoute() {
  return navigationRef.getCurrentRoute()
}

export default navigationRef
