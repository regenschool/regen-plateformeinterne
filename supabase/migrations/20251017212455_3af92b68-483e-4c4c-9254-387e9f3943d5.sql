-- Permettre aux enseignants de marquer leurs propres tâches d'onboarding comme complétées
CREATE POLICY "Teachers can update their own checklist items"
ON public.onboarding_checklist
FOR UPDATE
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);