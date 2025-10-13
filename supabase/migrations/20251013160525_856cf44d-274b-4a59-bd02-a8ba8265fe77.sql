-- Correction du search_path pour la fonction de logging
CREATE OR REPLACE FUNCTION log_sensitive_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
    'SENSITIVE_ACCESS',
    'teacher_profiles',
    NEW.id,
    jsonb_build_object('accessed_fields', 'bank_iban, bank_bic, siret')
  );
  RETURN NEW;
END;
$$;