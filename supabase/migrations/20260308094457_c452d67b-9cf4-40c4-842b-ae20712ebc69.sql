
-- Enable realtime for emergency_alerts and notifications tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Storage RLS policies for medical-reports bucket
-- Allow caregivers to upload files for their patients
CREATE POLICY "Caregiver can upload medical reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-reports'
);

-- Allow authenticated users to read/download files
CREATE POLICY "Authenticated users can read medical reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-reports'
);
