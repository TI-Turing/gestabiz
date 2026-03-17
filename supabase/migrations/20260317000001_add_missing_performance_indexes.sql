-- Migration: Add missing high-priority performance indexes
-- Identified via performance audit (Round 3) — March 2026
-- Complements 20260315000002_add_performance_indexes.sql

-- ─── appointments ────────────────────────────────────────────────────────────

-- Resource-based availability validation (useAssigneeAvailability, overlap checks)
CREATE INDEX IF NOT EXISTS idx_appointments_resource_start
  ON appointments(resource_id, start_time)
  WHERE resource_id IS NOT NULL;

-- Client appointment status lookup (useCompletedAppointments, review eligibility)
CREATE INDEX IF NOT EXISTS idx_appointments_client_status
  ON appointments(client_id, status);

-- ─── user_permissions ────────────────────────────────────────────────────────

-- Full business permission set (admin PermissionsManager, permission matrix)
CREATE INDEX IF NOT EXISTS idx_user_permissions_business_id
  ON user_permissions(business_id);

-- Per-user active permission lookup (PermissionGate on every protected action)
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_active
  ON user_permissions(user_id, is_active);

-- ─── business_employees ──────────────────────────────────────────────────────

-- Reverse lookup: "which businesses is this employee in?" (useEmployeeBusinesses)
CREATE INDEX IF NOT EXISTS idx_business_employees_employee_id
  ON business_employees(employee_id);

-- Active employee filter: admin employee listings (useAbsenceApprovals, etc.)
CREATE INDEX IF NOT EXISTS idx_business_employees_business_status
  ON business_employees(business_id, status);

-- ─── business_roles ──────────────────────────────────────────────────────────

-- Admin permission matrix: all active users in a business (permission checks)
CREATE INDEX IF NOT EXISTS idx_business_roles_business_active
  ON business_roles(business_id, is_active);

-- Role switching / multi-business access: user's active roles
CREATE INDEX IF NOT EXISTS idx_business_roles_user_active
  ON business_roles(user_id, is_active);
