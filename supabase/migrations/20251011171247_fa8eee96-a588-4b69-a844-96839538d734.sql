-- Correction des problèmes de sécurité critiques

-- 1. Sécuriser la table students : restreindre l'accès aux enseignants de leurs propres élèves
DROP POLICY IF EXISTS "Authenticated users can view all students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

-- Politique pour voir seulement ses propres étudiants (ou tous si admin)
CREATE POLICY "Teachers can view their own students"
ON public.students FOR SELECT
TO authenticated
USING (
  auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Politique pour créer des étudiants (seulement pour ses propres classes)
CREATE POLICY "Teachers can create students for their classes"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Politique pour mettre à jour seulement ses propres étudiants
CREATE POLICY "Teachers can update their own students"
ON public.students FOR UPDATE
TO authenticated
USING (
  auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Politique pour supprimer seulement ses propres étudiants
CREATE POLICY "Teachers can delete their own students"
ON public.students FOR DELETE
TO authenticated
USING (
  auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Ajouter des politiques explicites de refus pour les données sensibles (teacher_profiles)
CREATE POLICY "Deny anonymous access to teacher profiles"
ON public.teacher_profiles FOR ALL
TO anon
USING (false);

-- 3. Ajouter des politiques explicites de refus pour teacher_invoices
CREATE POLICY "Deny anonymous access to teacher invoices"
ON public.teacher_invoices FOR ALL
TO anon
USING (false);

-- 4. Ajouter des politiques pour school_documents (permettre aux enseignants de gérer leurs documents)
CREATE POLICY "Teachers can create their own documents"
ON public.school_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own documents"
ON public.school_documents FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own documents"
ON public.school_documents FOR DELETE
TO authenticated
USING (auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Refuser l'accès anonyme aux documents
CREATE POLICY "Deny anonymous access to school documents"
ON public.school_documents FOR ALL
TO anon
USING (false);