
-- Fix: restrict the WITH CHECK to only allow authenticated users setting themselves as caregiver
DROP POLICY "Anyone can update unassigned patients" ON public.patients;
CREATE POLICY "Authenticated can claim unassigned patients" ON public.patients 
FOR UPDATE USING (caregiver_id IS NULL AND auth.role() = 'authenticated') 
WITH CHECK (caregiver_id = auth.uid());
