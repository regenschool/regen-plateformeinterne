-- Lister toutes les fonctions qui ont un search_path non défini
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  CASE 
    WHEN p.proconfig IS NULL THEN 'No search_path set'
    ELSE 'search_path configured'
  END AS search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proconfig IS NULL
  AND p.prokind = 'f';

-- Corriger update_updated_at_column si elle existe
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;