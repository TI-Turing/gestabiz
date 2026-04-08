-- Fix RLS for employee_join_requests invite code claim flow
-- Allows invite code rows to be selected by authenticated users when the code is unclaimed,
-- and allows employees to claim those codes by updating employee_id/status.

DROP POLICY IF EXISTS "employee_join_requests_select_invite_code" ON public.employee_join_requests;
CREATE POLICY "employee_join_requests_select_invite_code"
  ON public.employee_join_requests
  AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (
    invite_code IS NOT NULL
    AND employee_id IS NULL
  );

DROP POLICY IF EXISTS "employee_join_requests_update_claim" ON public.employee_join_requests;
CREATE POLICY "employee_join_requests_update_claim"
  ON public.employee_join_requests
  AS PERMISSIVE FOR UPDATE TO PUBLIC
  USING (
    invite_code IS NOT NULL
    AND employee_id IS NULL
  )
  WITH CHECK (
    employee_id = auth.uid()
    AND status = 'pending'
    AND invite_code IS NOT NULL
  );

DROP POLICY IF EXISTS "employee_join_requests_insert_invite" ON public.employee_join_requests;
CREATE POLICY "employee_join_requests_insert_invite"
  ON public.employee_join_requests
  AS PERMISSIVE FOR INSERT TO PUBLIC
  WITH CHECK (
    employee_id IS NULL
    AND (
      EXISTS (
        SELECT 1 FROM businesses
        WHERE businesses.id = business_id
          AND businesses.owner_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM business_roles
        WHERE business_roles.business_id = business_id
          AND business_roles.user_id = auth.uid()
          AND business_roles.role = 'admin'
      )
    )
  );
