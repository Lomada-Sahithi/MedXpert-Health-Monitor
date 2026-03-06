
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('caregiver', 'patient');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role app_role NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id_unique TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER,
  caregiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view own record" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Caregivers can view assigned patients" ON public.patients FOR SELECT USING (auth.uid() = caregiver_id);
CREATE POLICY "Users can insert own patient record" ON public.patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Caregivers can update assigned patients" ON public.patients FOR UPDATE USING (auth.uid() = caregiver_id);
CREATE POLICY "Patients can update own record" ON public.patients FOR UPDATE USING (auth.uid() = user_id);

-- Function to generate patient ID
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Medications table
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  times_array TEXT[] DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  instructions TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient can view own medications" ON public.medications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Caregiver can view patient medications" ON public.medications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Caregiver can insert medications" ON public.medications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Caregiver can update medications" ON public.medications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Caregiver can delete medications" ON public.medications FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);

-- Medication logs
CREATE TABLE public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  taken_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'late'))
);
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient can view own med logs" ON public.medication_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Caregiver can view patient med logs" ON public.medication_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Patient can insert own med logs" ON public.medication_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Patient can update own med logs" ON public.medication_logs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);

-- Appointments
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT DEFAULT '',
  doctor TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  reminder_time INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient can view own appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Caregiver can view patient appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Caregiver can insert appointments" ON public.appointments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Caregiver can update appointments" ON public.appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Caregiver can delete appointments" ON public.appointments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);

-- Medical reports
CREATE TABLE public.medical_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf',
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT DEFAULT 'other' CHECK (category IN ('lab_results', 'prescription', 'discharge_summary', 'other'))
);
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient can view own reports" ON public.medical_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Caregiver can view patient reports" ON public.medical_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Caregiver can insert reports" ON public.medical_reports FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Caregiver can delete reports" ON public.medical_reports FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);

-- Water intake
CREATE TABLE public.water_intake (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  glasses_count INTEGER NOT NULL DEFAULT 0,
  daily_goal INTEGER NOT NULL DEFAULT 8,
  UNIQUE(patient_id, date)
);
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient can view own water intake" ON public.water_intake FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Caregiver can view patient water intake" ON public.water_intake FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Patient can insert water intake" ON public.water_intake FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Patient can update water intake" ON public.water_intake FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);

-- Emergency alerts
CREATE TABLE public.emergency_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  caregiver_notified BOOLEAN DEFAULT false
);
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient can view own alerts" ON public.emergency_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Caregiver can view patient alerts" ON public.emergency_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);
CREATE POLICY "Patient can insert alerts" ON public.emergency_alerts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Patient can update own alerts" ON public.emergency_alerts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Caregiver can update patient alerts" ON public.emergency_alerts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.caregiver_id = auth.uid())
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('medication', 'appointment', 'emergency', 'caregiver', 'general')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-reports', 'medical-reports', false);
CREATE POLICY "Users can upload report files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medical-reports' AND auth.role() = 'authenticated');
CREATE POLICY "Users can view report files" ON storage.objects FOR SELECT USING (bucket_id = 'medical-reports' AND auth.role() = 'authenticated');
