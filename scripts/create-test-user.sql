-- Script pour créer et configurer l'utilisateur de test pour les E2E tests
-- À exécuter après avoir créé l'utilisateur via le workflow GitHub

-- 1. Vérifier si l'utilisateur existe
-- Remplacez 'test-e2e@votre-domaine.com' par l'email que vous avez choisi
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Récupérer l'ID de l'utilisateur de test
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'test-e2e@votre-domaine.com';

  -- Si l'utilisateur existe, lui assigner le rôle admin
  IF test_user_id IS NOT NULL THEN
    -- Assigner le rôle admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (test_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Rôle admin assigné à l''utilisateur de test (ID: %)', test_user_id;
  ELSE
    RAISE NOTICE 'Utilisateur de test non trouvé. Exécutez d''abord le workflow GitHub "Setup Test User"';
  END IF;
END $$;

-- 2. Vérifier la configuration
SELECT 
  u.id,
  u.email,
  u.confirmed_at,
  ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'test-e2e@votre-domaine.com';
