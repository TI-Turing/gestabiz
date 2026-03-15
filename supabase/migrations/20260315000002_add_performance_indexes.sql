/**
 * Índices de rendimiento para queries frecuentes
 *
 * Todos con IF NOT EXISTS para idempotencia.
 * Nota: CONCURRENTLY no puede usarse dentro de una transacción (db push),
 * por lo que se usan CREATE INDEX normales. El impacto de bloqueo es
 * mínimo en tablas pequeñas de BETA.
 *
 * Tablas cubiertas:
 *   appointments, in_app_notifications, chat_messages,
 *   chat_participants, employee_absences, transactions
 */

-- ============================================================
-- appointments
-- ============================================================

-- Citas por negocio + fecha (dashboard admin, reportes)
CREATE INDEX IF NOT EXISTS idx_appointments_business_start
  ON appointments(business_id, start_time);

-- Citas por empleado + fecha (agenda empleado, validación solapamientos)
CREATE INDEX IF NOT EXISTS idx_appointments_employee_start
  ON appointments(employee_id, start_time)
  WHERE employee_id IS NOT NULL;

-- Citas por cliente + fecha (historial cliente, validación reviews)
CREATE INDEX IF NOT EXISTS idx_appointments_client_start
  ON appointments(client_id, start_time);

-- Citas por estado (filtros de agenda)
CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments(status);

-- Citas activas por sede (validación disponibilidad)
CREATE INDEX IF NOT EXISTS idx_appointments_location_start
  ON appointments(location_id, start_time)
  WHERE status NOT IN ('cancelled', 'no_show');

-- ============================================================
-- in_app_notifications
-- ============================================================

-- Notificaciones no leídas por usuario (badge de campana)
CREATE INDEX IF NOT EXISTS idx_notifications_user_status
  ON in_app_notifications(user_id, status);

-- Notificaciones por usuario + fecha (paginación)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON in_app_notifications(user_id, created_at DESC);

-- Notificaciones de chat por usuario (limpieza al marcar leído)
CREATE INDEX IF NOT EXISTS idx_notifications_user_type
  ON in_app_notifications(user_id, type);

-- ============================================================
-- chat_messages
-- ============================================================

-- Mensajes por conversación ordenados (fetchMessages + LATERAL JOIN en RPC)
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created
  ON chat_messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================
-- chat_participants
-- ============================================================

-- Participantes activos por conversación (LATERAL JOIN en RPC)
CREATE INDEX IF NOT EXISTS idx_chat_participants_conv_active
  ON chat_participants(conversation_id, user_id)
  WHERE left_at IS NULL;

-- Participante activo de otro usuario en una conversación directa
-- (Usado en el JOIN lateral para el other_user)
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_active
  ON chat_participants(user_id, conversation_id)
  WHERE left_at IS NULL;

-- ============================================================
-- employee_absences
-- ============================================================

-- Ausencias por negocio + estado (panel de aprobaciones del admin)
CREATE INDEX IF NOT EXISTS idx_absences_business_status
  ON employee_absences(business_id, status);

-- Ausencias por empleado + fechas (solapamiento con citas en wizard)
CREATE INDEX IF NOT EXISTS idx_absences_employee_dates
  ON employee_absences(employee_id, start_date, end_date);

-- ============================================================
-- transactions
-- ============================================================

-- Transacciones por negocio + tipo + fecha (dashboard financiero)
CREATE INDEX IF NOT EXISTS idx_transactions_business_type_date
  ON transactions(business_id, type, created_at DESC);

-- Transacciones por período fiscal (reportes contables)
CREATE INDEX IF NOT EXISTS idx_transactions_business_fiscal
  ON transactions(business_id, fiscal_period)
  WHERE fiscal_period IS NOT NULL;
