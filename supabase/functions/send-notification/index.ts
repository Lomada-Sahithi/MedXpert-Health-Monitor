import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { patient_id, patient_name, type, medication_name } = await req.json();

    if (!patient_id || !type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the patient's caregiver
    const { data: patient } = await supabase
      .from('patients').select('caregiver_id').eq('id', patient_id).single();

    if (!patient?.caregiver_id) {
      return new Response(JSON.stringify({ error: 'No caregiver assigned' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let title = '';
    let message = '';

    switch (type) {
      case 'medication_taken':
        title = '💊 Medication Taken';
        message = `${patient_name} has taken their medication: ${medication_name}`;
        break;
      case 'medication_reminder':
        title = '💊 Medication Reminder';
        message = `It's time for ${patient_name} to take ${medication_name}`;
        break;
      case 'appointment_reminder':
        title = '📅 Appointment Reminder';
        message = `${patient_name} has an upcoming appointment`;
        break;
      default:
        title = '🔔 Notification';
        message = `Update from ${patient_name}`;
    }

    // Create in-app notification for caregiver
    await supabase.from('notifications').insert({
      user_id: patient.caregiver_id,
      title,
      message,
      type: type === 'medication_taken' ? 'medication' : type,
    });

    return new Response(JSON.stringify({ success: true, message: 'Notification sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Notification error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
