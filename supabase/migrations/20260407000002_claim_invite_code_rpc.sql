-- claim_invite_code: SECURITY DEFINER RPC to claim an invite code server-side.
-- Uses auth.uid() from PostgreSQL JWT context (bypasses RLS WITH CHECK issues).
-- Handles unique partial index (employee_id, business_id) WHERE status='pending':
--   if employee already has a pending request for the same business, returns it as success.
CREATE OR REPLACE FUNCTION public.claim_invite_code(invite_code_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_business_id uuid;
  v_business_name text;
  v_owner_id uuid;
  v_expires_at timestamptz;
  v_existing_request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Find unclaimed invite code row
  SELECT id, business_id, invite_code_expires_at
  INTO v_request_id, v_business_id, v_expires_at
  FROM employee_join_requests
  WHERE invite_code = upper(trim(invite_code_input))
    AND employee_id IS NULL
    AND status = 'pending'
  LIMIT 1;

  -- If not found unclaimed, check if already claimed by this same employee (idempotent)
  IF v_request_id IS NULL THEN
    SELECT id, business_id INTO v_request_id, v_business_id
    FROM employee_join_requests
    WHERE invite_code = upper(trim(invite_code_input))
      AND employee_id = auth.uid()
      AND status = 'pending'
    LIMIT 1;

    IF v_request_id IS NOT NULL THEN
      SELECT b.name, b.owner_id INTO v_business_name, v_owner_id
      FROM businesses b WHERE b.id = v_business_id;
      RETURN jsonb_build_object(
        'request_id', v_request_id,
        'business_id', v_business_id,
        'business_name', v_business_name,
        'owner_id', v_owner_id
      );
    END IF;

    RAISE EXCEPTION 'Código no encontrado o ya fue usado';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'El código ha vencido';
  END IF;

  -- Check if employee already has a DIFFERENT pending request for this business.
  -- Unique partial index prevents two pending rows for same (employee_id, business_id).
  SELECT id INTO v_existing_request_id
  FROM employee_join_requests
  WHERE employee_id = auth.uid()
    AND business_id = v_business_id
    AND status = 'pending'
  LIMIT 1;

  IF v_existing_request_id IS NOT NULL THEN
    -- Already in queue for this business — return existing request as success
    SELECT b.name, b.owner_id INTO v_business_name, v_owner_id
    FROM businesses b WHERE b.id = v_business_id;
    RETURN jsonb_build_object(
      'request_id', v_existing_request_id,
      'business_id', v_business_id,
      'business_name', v_business_name,
      'owner_id', v_owner_id
    );
  END IF;

  -- Claim the code
  UPDATE employee_join_requests
  SET employee_id = auth.uid(), updated_at = now()
  WHERE id = v_request_id;

  SELECT b.name, b.owner_id
  INTO v_business_name, v_owner_id
  FROM businesses b WHERE b.id = v_business_id;

  RETURN jsonb_build_object(
    'request_id', v_request_id,
    'business_id', v_business_id,
    'business_name', v_business_name,
    'owner_id', v_owner_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_invite_code(text) TO anon;
