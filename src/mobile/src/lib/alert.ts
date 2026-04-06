import { Alert } from 'react-native'

interface AlertOptions {
  title?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  destructive?: boolean
}

/**
 * Alert informativo de una acción con un solo botón "Aceptar".
 */
export function mobileAlert(message: string, opts: AlertOptions = {}): void {
  Alert.alert(
    opts.title ?? 'Información',
    message,
    [{ text: opts.confirmText ?? 'Aceptar', onPress: opts.onConfirm }]
  )
}

/**
 * Alert de confirmación con botones "Cancelar" y "Confirmar".
 * Usar `destructive: true` para acciones irreversibles (eliminar, cancelar).
 */
export function mobileConfirm(
  message: string,
  onConfirm: () => void,
  opts: AlertOptions = {}
): void {
  Alert.alert(
    opts.title ?? 'Confirmar',
    message,
    [
      {
        text: opts.cancelText ?? 'Cancelar',
        style: 'cancel',
        onPress: opts.onCancel,
      },
      {
        text: opts.confirmText ?? 'Confirmar',
        style: opts.destructive ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ]
  )
}

/**
 * Alert de error estándar.
 */
export function mobileError(message: string, onDismiss?: () => void): void {
  Alert.alert('Error', message, [{ text: 'Cerrar', onPress: onDismiss }])
}
