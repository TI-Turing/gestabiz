import { useCallback, useState } from 'react'
import { Platform, Dimensions } from 'react-native'
import Constants from 'expo-constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '../components/ui/Toast'

export type BugReportSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface CreateBugReportData {
  title: string
  description: string
  stepsToReproduce?: string
  severity: BugReportSeverity
  category?: string
  affectedPage?: string
}

interface UseBugReportsReturn {
  loading: boolean
  error: string | null
  createBugReport: (data: CreateBugReportData) => Promise<boolean>
}

/**
 * Hook mobile para reportar bugs.
 *
 * Espejo simplificado del hook web `src/hooks/useBugReports.ts`:
 * - Inserta en `bug_reports` (status: 'open').
 * - Llama a Edge Function `send-bug-report-email` para notificar al equipo.
 * - Por ahora SIN attachments (se agregarán con expo-image-picker en una fase posterior).
 */
export function useBugReports(): UseBugReportsReturn {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getTechnicalInfo = useCallback(() => {
    const { width, height } = Dimensions.get('window')
    const appVersion = (Constants.expoConfig?.version ?? 'unknown') as string
    const userAgent = `Gestabiz Mobile ${appVersion} - ${Platform.OS} ${Platform.Version}`
    const deviceType = Platform.OS === 'ios' || Platform.OS === 'android' ? 'Mobile' : 'Desktop'
    return {
      userAgent,
      browserVersion: `${Platform.OS} ${Platform.Version}`,
      deviceType,
      screenResolution: `${Math.round(width)}x${Math.round(height)}`,
    }
  }, [])

  const createBugReport = useCallback(
    async (data: CreateBugReportData): Promise<boolean> => {
      if (!user) {
        toast.error('Debes iniciar sesión para reportar un problema')
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tech = getTechnicalInfo()

        const { data: bugReport, error: insertError } = await supabase
          .from('bug_reports')
          .insert({
            user_id: user.id,
            title: data.title,
            description: data.description,
            steps_to_reproduce: data.stepsToReproduce,
            severity: data.severity,
            category: data.category,
            affected_page: data.affectedPage ?? 'mobile-app',
            user_agent: tech.userAgent,
            browser_version: tech.browserVersion,
            device_type: tech.deviceType,
            screen_resolution: tech.screenResolution,
            status: 'open',
            priority: data.severity === 'critical' || data.severity === 'high' ? 'high' : 'normal',
          })
          .select()
          .single()

        if (insertError) throw insertError
        if (!bugReport) throw new Error('No se pudo crear el reporte')

        // Obtener perfil para el email (best effort)
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        try {
          await supabase.functions.invoke('send-bug-report-email', {
            body: {
              bugReportId: bugReport.id,
              userId: user.id,
              title: data.title,
              description: data.description,
              stepsToReproduce: data.stepsToReproduce,
              severity: data.severity,
              userEmail: profile?.email ?? user.email ?? 'unknown',
              userName: profile?.full_name ?? 'Usuario móvil',
              userAgent: tech.userAgent,
              browserVersion: tech.browserVersion,
              deviceType: tech.deviceType,
              screenResolution: tech.screenResolution,
              affectedPage: data.affectedPage ?? 'mobile-app',
            },
          })
        } catch {
          // No fallar el reporte si el email falla
        }

        toast.success('Reporte enviado. Nuestro equipo lo revisará pronto.')
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al enviar el reporte'
        setError(message)
        toast.error(message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [user, getTechnicalInfo]
  )

  return { loading, error, createBugReport }
}
