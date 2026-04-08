// =====================================================
// Hook: useMandatoryReviews (REFACTORIZADO v2.0)
// =====================================================
// ANTES: Hacía query propia a completed appointments + reviews
// AHORA: Recibe datos como parámetros (del hook useClientDashboard)
// Beneficio: Elimina queries duplicadas
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger'

export interface PendingReviewCheck {
  hasPendingReviews: boolean;
  count: number;
  shouldShowModal: boolean;
}

const REMIND_LATER_KEY = 'appointsync_remind_later_reviews';
const REMIND_LATER_DURATION = 5 * 60 * 1000; // 5 minutes
const LAST_CHECK_KEY = 'appointsync_last_review_check';
const CHECK_THROTTLE_DURATION = 60 * 60 * 1000; // 1 hour

interface RemindLaterEntry {
  userId: string;
  timestamp: number;
}

interface LastCheckEntry {
  userId: string;
  timestamp: number;
}

/**
 * Hook para gestionar modal de reviews obligatorias
 * 
 * @param userId - ID del usuario
 * @param completedAppointments - Citas completadas (del dashboard hook)
 * @param reviewedAppointmentIds - IDs de citas con review (del dashboard hook)
 * @returns Estado del modal y funciones de control
 */
export function useMandatoryReviews(
  userId: string | undefined,
  completedAppointments: any[] = [],
  reviewedAppointmentIds: string[] = []
) {
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // ✅ Calcular pending reviews SIN hacer query adicional
  const checkPendingReviews = useCallback(() => {
    // Indicar que estamos validando (pero NO mostrar modal aún)
    setIsValidating(true);
    
    // ✅ PRIMERO: Check throttling - solo verificar cada 1 hora (ANTES de cualquier otra validación)
    if (userId) {
      const lastCheckTime = getLastCheckTime(userId);
      const now = Date.now();
      const timeSinceLastCheck = now - lastCheckTime;

      // Si ya verificamos hace menos de 1 hora, no mostrar modal
      if (lastCheckTime > 0 && timeSinceLastCheck < CHECK_THROTTLE_DURATION) {
        setPendingReviewsCount(0);
        setShouldShowModal(false);
        setIsValidating(false);
        return;
      }
    }
    
    // SEGUNDO: Validar si hay userId y appointments
    // NO actualizar throttle timestamp si los datos aún no han cargado
    if (!userId || completedAppointments.length === 0) {
      setPendingReviewsCount(0);
      setShouldShowModal(false);
      setIsValidating(false);
      return;
    }

    // Actualizar timestamp AHORA (solo cuando tenemos datos reales para verificar)
    updateLastCheckTime(userId);

    // TERCERO: Check "remind later"
    const remindLater = getRemindLaterStatus(userId);
    if (remindLater) {
      setPendingReviewsCount(0);
      setShouldShowModal(false);
      setIsValidating(false);
      return;
    }

    // Calcular pending reviews (completed appointments sin review)
    const reviewedSet = new Set(reviewedAppointmentIds);
    const pendingCount = completedAppointments.filter(
      (apt) => !reviewedSet.has(apt.id)
    ).length;

    setPendingReviewsCount(pendingCount);
    
    // ✅ SOLO mostrar modal si definitivamente hay reviews pendientes
    // El modal NO se muestra durante la validación, solo cuando ya confirmamos que hay pendientes
    setShouldShowModal(pendingCount > 0);
    setIsValidating(false);
  }, [userId, completedAppointments, reviewedAppointmentIds]);

  useEffect(() => {
    checkPendingReviews();
  }, [checkPendingReviews]);

  const dismissModal = useCallback(() => {
    setShouldShowModal(false);
  }, []);

  const remindLater = useCallback(() => {
    if (!userId) return;

    const entry: RemindLaterEntry = {
      userId,
      timestamp: Date.now(),
    };

    try {
      const existing = localStorage.getItem(REMIND_LATER_KEY);
      const entries: RemindLaterEntry[] = existing ? JSON.parse(existing) : [];

      // Remove old entry for this user
      const filtered = entries.filter((e) => e.userId !== userId);

      // Add new entry
      filtered.push(entry);

      localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(filtered));
      setShouldShowModal(false);
    } catch (error) {
      void logger.error('useMandatoryReviews: operation failed', error instanceof Error ? error : new Error(String(error)), { component: 'useMandatoryReviews' })
      // eslint-disable-next-line no-console    }
  }, [userId]);

  const clearRemindLater = useCallback(() => {
    if (!userId) return;

    try {
      const existing = localStorage.getItem(REMIND_LATER_KEY);
      if (!existing) return;

      const entries: RemindLaterEntry[] = JSON.parse(existing);
      const filtered = entries.filter((e) => e.userId !== userId);

      if (filtered.length > 0) {
        localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(filtered));
      } else {
        localStorage.removeItem(REMIND_LATER_KEY);
      }
    } catch (error) {
      void logger.error('useMandatoryReviews: operation failed', error instanceof Error ? error : new Error(String(error)), { component: 'useMandatoryReviews' })
      // eslint-disable-next-line no-console    }
  }, [userId]);

  return {
    pendingReviewsCount,
    shouldShowModal,
    checkPendingReviews, // Ahora es síncrono (no async)
    dismissModal,
    remindLater,
    clearRemindLater,
  };
}

// Helper function to check remind later status
function getRemindLaterStatus(userId: string): boolean {
  try {
    const existing = localStorage.getItem(REMIND_LATER_KEY);
    if (!existing) return false;

    const entries: RemindLaterEntry[] = JSON.parse(existing);
    const userEntry = entries.find((e) => e.userId === userId);

    if (!userEntry) return false;

    // Check if remind later has expired
    const now = Date.now();
    const elapsed = now - userEntry.timestamp;

    if (elapsed >= REMIND_LATER_DURATION) {
      // Expired, remove entry
      const filtered = entries.filter((e) => e.userId !== userId);
      if (filtered.length > 0) {
        localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(filtered));
      } else {
        localStorage.removeItem(REMIND_LATER_KEY);
      }
      return false;
    }

    return true;
  } catch (error) {
    void logger.error('useMandatoryReviews: operation failed', error instanceof Error ? error : new Error(String(error)), { component: 'useMandatoryReviews' })
    // eslint-disable-next-line no-console    return false;
  }
}

// Cleanup expired entries periodically
export function cleanupExpiredRemindLater() {
  try {
    const existing = localStorage.getItem(REMIND_LATER_KEY);
    if (!existing) return;

    const entries: RemindLaterEntry[] = JSON.parse(existing);
    const now = Date.now();

    const filtered = entries.filter((entry) => {
      const elapsed = now - entry.timestamp;
      return elapsed < REMIND_LATER_DURATION;
    });

    if (filtered.length > 0) {
      localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(filtered));
    } else {
      localStorage.removeItem(REMIND_LATER_KEY);
    }
  } catch (error) {
    void logger.error('useMandatoryReviews: operation failed', error instanceof Error ? error : new Error(String(error)), { component: 'useMandatoryReviews' })
    // eslint-disable-next-line no-console  }
}

// ✅ NEW: Helper para obtener el timestamp del último check
function getLastCheckTime(userId: string): number {
  try {
    const existing = localStorage.getItem(LAST_CHECK_KEY);
    if (!existing) return 0;

    const entries: LastCheckEntry[] = JSON.parse(existing);
    const userEntry = entries.find((e) => e.userId === userId);

    return userEntry?.timestamp || 0;
  } catch (error) {
    void logger.error('useMandatoryReviews: operation failed', error instanceof Error ? error : new Error(String(error)), { component: 'useMandatoryReviews' })
    // eslint-disable-next-line no-console    return 0;
  }
}

// ✅ NEW: Helper para actualizar el timestamp del último check
function updateLastCheckTime(userId: string): void {
  try {
    const existing = localStorage.getItem(LAST_CHECK_KEY);
    const entries: LastCheckEntry[] = existing ? JSON.parse(existing) : [];

    // Remove old entry for this user
    const filtered = entries.filter((e) => e.userId !== userId);

    // Add new entry
    filtered.push({
      userId,
      timestamp: Date.now(),
    });

    localStorage.setItem(LAST_CHECK_KEY, JSON.stringify(filtered));
  } catch (error) {
    void logger.error('useMandatoryReviews: operation failed', error instanceof Error ? error : new Error(String(error)), { component: 'useMandatoryReviews' })
    // eslint-disable-next-line no-console  }
}
