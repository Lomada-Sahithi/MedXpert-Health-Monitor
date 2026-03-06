
-- Fix function search path for generate_patient_id
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    new_id := 'PAT-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.patients WHERE patient_id_unique = new_id) INTO exists_already;
    IF NOT exists_already THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$;

-- Fix overly permissive notification insert policy
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
