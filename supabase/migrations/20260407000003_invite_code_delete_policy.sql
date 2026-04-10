-- Allow business owners and admins to DELETE invite code rows
-- (rows where employee_id IS NULL — pure invite codes not yet claimed).
-- Without this policy, DELETE was silently blocked by RLS (0 rows deleted, no error).
CREATE POLICY employee_join_requests_delete_admin
  ON public.employee_join_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = employee_join_requests.business_id
        AND businesses.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM business_roles
      WHERE business_roles.business_id = employee_join_requests.business_id
        AND business_roles.user_id = auth.uid()
        AND business_roles.role = 'admin'
    )
  );
