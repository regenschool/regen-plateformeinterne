-- Créer les périodes académiques pour 2025-2026
INSERT INTO public.academic_periods (school_year_id, label, start_date, end_date, is_active)
VALUES 
  ('79dd4fed-7eda-40d4-bf0a-16f9525a093f', 'Semestre 1', '2025-09-01', '2026-01-31', true),
  ('79dd4fed-7eda-40d4-bf0a-16f9525a093f', 'Semestre 2', '2026-02-01', '2026-06-30', false),
  ('79dd4fed-7eda-40d4-bf0a-16f9525a093f', 'Année complète', '2025-09-01', '2026-06-30', false);

-- Créer les périodes académiques pour 2026-2027
INSERT INTO public.academic_periods (school_year_id, label, start_date, end_date, is_active)
VALUES 
  ('ab2f1d89-5dcc-4a63-8051-b35c05165d47', 'Semestre 1', '2026-09-01', '2027-01-31', false),
  ('ab2f1d89-5dcc-4a63-8051-b35c05165d47', 'Semestre 2', '2027-02-01', '2027-06-30', false),
  ('ab2f1d89-5dcc-4a63-8051-b35c05165d47', 'Année complète', '2026-09-01', '2027-06-30', false);