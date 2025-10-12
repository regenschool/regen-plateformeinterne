-- Création des tables de référentiels pour structurer les données
-- Ces tables évitent la saisie de texte libre et garantissent la cohérence

-- 1. Années scolaires
CREATE TABLE public.school_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE, -- Ex: "2024-2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_year_period CHECK (end_date > start_date)
);

ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view school years"
ON public.school_years
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage school years"
ON public.school_years
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Classes
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- Ex: "B3", "M1"
  level TEXT, -- Ex: "Bachelor", "Master"
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view classes"
ON public.classes
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage classes"
ON public.classes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Semestres/Périodes académiques
CREATE TABLE public.academic_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- "Semestre 1", "Semestre 2", "Année complète"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_period CHECK (end_date > start_date),
  UNIQUE (school_year_id, label)
);

ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view academic periods"
ON public.academic_periods
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage academic periods"
ON public.academic_periods
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Trigger pour updated_at
CREATE TRIGGER update_school_years_updated_at
BEFORE UPDATE ON public.school_years
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academic_periods_updated_at
BEFORE UPDATE ON public.academic_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Index pour les recherches fréquentes
CREATE INDEX idx_school_years_active ON public.school_years(is_active) WHERE is_active = true;
CREATE INDEX idx_classes_active ON public.classes(is_active) WHERE is_active = true;
CREATE INDEX idx_academic_periods_active ON public.academic_periods(is_active) WHERE is_active = true;
CREATE INDEX idx_academic_periods_school_year ON public.academic_periods(school_year_id);

-- 6. Données initiales pour démarrer
INSERT INTO public.school_years (label, start_date, end_date, is_active) VALUES
  ('2024-2025', '2024-09-01', '2025-08-31', true),
  ('2025-2026', '2025-09-01', '2026-08-31', false),
  ('2026-2027', '2026-09-01', '2027-08-31', false);

INSERT INTO public.classes (name, level, is_active) VALUES
  ('B1', 'Bachelor', true),
  ('B2', 'Bachelor', true),
  ('B3', 'Bachelor', true),
  ('M1', 'Master', true),
  ('M2', 'Master', true);

-- Insérer les périodes académiques pour 2024-2025
INSERT INTO public.academic_periods (school_year_id, label, start_date, end_date, is_active)
SELECT 
  id,
  'Semestre 1',
  '2024-09-01',
  '2025-01-31',
  true
FROM public.school_years WHERE label = '2024-2025';

INSERT INTO public.academic_periods (school_year_id, label, start_date, end_date, is_active)
SELECT 
  id,
  'Semestre 2',
  '2025-02-01',
  '2025-08-31',
  false
FROM public.school_years WHERE label = '2024-2025';

INSERT INTO public.academic_periods (school_year_id, label, start_date, end_date, is_active)
SELECT 
  id,
  'Année complète',
  '2024-09-01',
  '2025-08-31',
  true
FROM public.school_years WHERE label = '2024-2025';

COMMENT ON TABLE public.school_years IS 'Référentiel des années scolaires pour éviter la saisie de texte libre';
COMMENT ON TABLE public.classes IS 'Référentiel des classes pour garantir la cohérence des noms';
COMMENT ON TABLE public.academic_periods IS 'Périodes académiques (semestres) liées aux années scolaires';