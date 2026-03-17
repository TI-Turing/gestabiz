-- =====================================================
-- Employee Join Requests
-- Flow: employee sends request → admin approves/rejects
-- Optional: admin generates invite code → employee uses it
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_join_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id           UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  message               TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected')),
  -- Admin-generated invite code (optional)
  invite_code           TEXT,
  invite_code_expires_at TIMESTAMPTZ,
  -- Review info
  reviewed_by           UUID REFERENCES auth.users(id),
  reviewed_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One active request per employee per business
CREATE UNIQUE INDEX IF NOT EXISTS employee_join_requests_unique_emp_biz
  ON employee_join_requests(employee_id, business_id)
  WHERE employee_id IS NOT NULL AND status = 'pending';

-- Invite codes are globally unique and non-null
CREATE UNIQUE INDEX IF NOT EXISTS employee_join_requests_invite_code
  ON employee_join_requests(invite_code)
  WHERE invite_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS employee_join_requests_business_id
  ON employee_join_requests(business_id, status);

CREATE INDEX IF NOT EXISTS employee_join_requests_employee_id
  ON employee_join_requests(employee_id);

-- RLS
ALTER TABLE employee_join_requests ENABLE ROW LEVEL SECURITY;

-- Employees can view their own requests
CREATE POLICY "employee_join_requests_select_own"
  ON employee_join_requests FOR SELECT
  USING (auth.uid() = employee_id);

-- Employees can insert their own requests
CREATE POLICY "employee_join_requests_insert_own"
  ON employee_join_requests FOR INSERT
  WITH CHECK (auth.uid() = employee_id);

-- Business owners and admins can view all requests for their business
CREATE POLICY "employee_join_requests_select_admin"
  ON employee_join_requests FOR SELECT
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

-- Business owners and admins can update (approve/reject) requests
CREATE POLICY "employee_join_requests_update_admin"
  ON employee_join_requests FOR UPDATE
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

-- Business owners and admins can also insert invite codes (employee_id = NULL)
CREATE POLICY "employee_join_requests_insert_invite"
  ON employee_join_requests FOR INSERT
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

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_employee_join_requests_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_employee_join_requests_updated_at
  BEFORE UPDATE ON employee_join_requests
  FOR EACH ROW EXECUTE FUNCTION update_employee_join_requests_updated_at();
