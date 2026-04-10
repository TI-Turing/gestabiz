-- Backfill: copiar el precio del servicio a las citas que no tienen precio registrado.
-- Esto afecta citas creadas antes de que se incluyera el campo price en el wizard.
-- Deshabilita triggers temporalmente para evitar falsos conflictos en datos históricos.
SET session_replication_role = replica;

UPDATE public.appointments a
SET price = s.price
FROM public.services s
WHERE a.service_id = s.id
  AND a.price IS NULL
  AND a.service_id IS NOT NULL;

SET session_replication_role = DEFAULT;
