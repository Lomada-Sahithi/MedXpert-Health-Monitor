
-- Allow caregivers to update patients that have no caregiver yet (for linking by patient ID)
CREATE POLICY "Anyone can update unassigned patients" ON public.patients 
FOR UPDATE USING (caregiver_id IS NULL) 
WITH CHECK (true);
