
CREATE OR REPLACE FUNCTION public.link_patient_by_email(_caregiver_id uuid, _patient_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _patient_user_id uuid;
  _patient_record patients%ROWTYPE;
BEGIN
  SELECT id INTO _patient_user_id FROM auth.users WHERE email = LOWER(_patient_email) LIMIT 1;
  
  IF _patient_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No user found with that email');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = _patient_user_id AND role = 'patient') THEN
    RETURN json_build_object('success', false, 'error', 'This user is not registered as a patient');
  END IF;

  SELECT * INTO _patient_record FROM patients WHERE user_id = _patient_user_id LIMIT 1;
  
  IF _patient_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Patient record not found');
  END IF;

  IF _patient_record.caregiver_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'This patient is already assigned to a caregiver');
  END IF;

  UPDATE patients SET caregiver_id = _caregiver_id WHERE id = _patient_record.id;

  RETURN json_build_object('success', true, 'patient_name', _patient_record.name);
END;
$$;
