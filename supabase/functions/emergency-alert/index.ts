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
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { patient_id, patient_name, location_lat, location_lng } = await req.json();

    if (!patient_id || !patient_name) {
      return new Response(JSON.stringify({ error: 'Missing patient info' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the patient's caregiver
    const { data: patient } = await supabase
      .from('patients')
      .select('caregiver_id')
      .eq('id', patient_id)
      .single();

    if (!patient?.caregiver_id) {
      return new Response(JSON.stringify({ error: 'No caregiver assigned' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get caregiver's phone from profiles
    const { data: caregiverProfile } = await supabase
      .from('profiles')
      .select('phone, name')
      .eq('user_id', patient.caregiver_id)
      .single();

    const caregiverPhone = caregiverProfile?.phone;
    const mapsLink = location_lat && location_lng
      ? `https://maps.google.com/?q=${location_lat},${location_lng}`
      : 'Location unavailable';

    // Create notification for caregiver
    await supabase.from('notifications').insert({
      user_id: patient.caregiver_id,
      title: '🚨 EMERGENCY ALERT',
      message: `${patient_name} has triggered an emergency alert! Location: ${mapsLink}`,
      type: 'emergency',
    });

    // If Twilio is configured, send SMS and make a call
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && caregiverPhone) {
      const twilioBaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}`;
      const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      // Send SMS
      const smsBody = new URLSearchParams({
        To: caregiverPhone,
        From: TWILIO_PHONE_NUMBER,
        Body: `🚨 EMERGENCY ALERT from ${patient_name}! Location: ${mapsLink}. Please respond immediately.`,
      });

      const smsRes = await fetch(`${twilioBaseUrl}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: smsBody.toString(),
      });

      if (!smsRes.ok) {
        console.error('SMS failed:', await smsRes.text());
      } else {
        console.log('SMS sent successfully to', caregiverPhone);
      }

      // Make a call
      const callBody = new URLSearchParams({
        To: caregiverPhone,
        From: TWILIO_PHONE_NUMBER,
        Twiml: `<Response><Say voice="alice">Emergency alert from ${patient_name}. Please check the HealthGuard app immediately.</Say><Pause length="2"/><Say voice="alice">Emergency alert from ${patient_name}.</Say></Response>`,
      });

      const callRes = await fetch(`${twilioBaseUrl}/Calls.json`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: callBody.toString(),
      });

      if (!callRes.ok) {
        console.error('Call failed:', await callRes.text());
      } else {
        console.log('Call initiated to', caregiverPhone);
      }

      // Update alert as caregiver_notified
      await supabase
        .from('emergency_alerts')
        .update({ caregiver_notified: true })
        .eq('patient_id', patient_id)
        .eq('status', 'active')
        .order('timestamp', { ascending: false })
        .limit(1);

      return new Response(JSON.stringify({ 
        success: true, 
        sms_sent: smsRes.ok, 
        call_initiated: callRes.ok 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Without Twilio, still notify via in-app notification
    return new Response(JSON.stringify({ 
      success: true, 
      sms_sent: false, 
      call_initiated: false,
      message: 'Caregiver notified via in-app notification. SMS/Call not configured.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Emergency alert error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
