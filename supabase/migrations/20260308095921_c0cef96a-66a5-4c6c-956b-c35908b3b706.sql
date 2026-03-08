-- Allow patients to view their caregiver's profile
CREATE POLICY "Patient can view caregiver profile"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.user_id = auth.uid()
      AND p.caregiver_id = profiles.user_id
  )
);