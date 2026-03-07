import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ALARM_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
const CHIME_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';

const playSound = (url: string) => {
  try {
    const audio = new Audio(url);
    audio.volume = 0.7;
    audio.play().catch(() => console.log('Sound autoplay blocked'));
  } catch {
    console.log('Sound playback failed');
  }
};

const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

const showBrowserNotification = (title: string, body: string, tag: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, tag, icon: '/favicon.ico' });
  }
};

export const useNotificationAlerts = () => {
  const { user, profile, patientRecord } = useAuth();
  const checkedMedsRef = useRef<Set<string>>(new Set());
  const checkedApptsRef = useRef<Set<string>>(new Set());

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Check medication times every 30 seconds
  const checkMedications = useCallback(async () => {
    if (!patientRecord || profile?.role !== 'patient') return;

    const { data: meds } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_id', patientRecord.id)
      .eq('active', true);

    if (!meds) return;

    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    for (const med of meds) {
      if (!med.times_array) continue;
      for (const time of med.times_array) {
        const medTime = time.substring(0, 5); // HH:MM
        const key = `${med.id}-${medTime}-${now.toDateString()}`;

        if (checkedMedsRef.current.has(key)) continue;

        // Check if within 1 minute of scheduled time
        const [medH, medM] = medTime.split(':').map(Number);
        const [curH, curM] = currentTime.split(':').map(Number);
        const medMinutes = medH * 60 + medM;
        const curMinutes = curH * 60 + curM;

        if (Math.abs(curMinutes - medMinutes) <= 1) {
          checkedMedsRef.current.add(key);
          playSound(ALARM_SOUND_URL);
          showBrowserNotification(
            '💊 Medication Reminder',
            `Time to take ${med.name} (${med.dosage})`,
            `med-${key}`
          );
          toast.info(`💊 Time to take ${med.name} (${med.dosage})`, {
            duration: 10000,
            action: { label: 'Dismiss', onClick: () => {} },
          });
        }
      }
    }
  }, [patientRecord, profile]);

  // Check appointments every 30 seconds
  const checkAppointments = useCallback(async () => {
    if (!patientRecord || profile?.role !== 'patient') return;

    const today = new Date().toISOString().split('T')[0];
    const { data: appts } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientRecord.id)
      .eq('date', today);

    if (!appts) return;

    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes();

    for (const appt of appts) {
      const key = `${appt.id}-${now.toDateString()}`;
      if (checkedApptsRef.current.has(key)) continue;

      const [apptH, apptM] = appt.time.split(':').map(Number);
      const apptMinutes = apptH * 60 + apptM;
      const diff = apptMinutes - curMinutes;

      // Alert 15 minutes before or at the time
      if (diff >= 0 && diff <= 15) {
        checkedApptsRef.current.add(key);
        playSound(CHIME_SOUND_URL);
        showBrowserNotification(
          '📅 Appointment Reminder',
          `${appt.title} at ${appt.time}${appt.doctor ? ` with ${appt.doctor}` : ''}`,
          `appt-${key}`
        );
        toast.info(`📅 ${appt.title} ${diff === 0 ? 'is now!' : `in ${diff} minutes`}`, {
          duration: 10000,
        });
      }
    }
  }, [patientRecord, profile]);

  // Realtime notifications subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const notif = payload.new;
          const isEmergency = notif.type === 'emergency';
          
          if (isEmergency) {
            playSound(ALARM_SOUND_URL);
          } else {
            playSound(CHIME_SOUND_URL);
          }

          showBrowserNotification(
            notif.title,
            notif.message,
            `notif-${notif.id}`
          );

          toast[isEmergency ? 'error' : 'info'](notif.title, {
            description: notif.message,
            duration: isEmergency ? 15000 : 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Emergency alerts subscription for caregivers
  useEffect(() => {
    if (!user || profile?.role !== 'caregiver') return;

    const channel = supabase
      .channel('emergency-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergency_alerts',
        },
        (payload: any) => {
          playSound(ALARM_SOUND_URL);
          showBrowserNotification(
            '🚨 EMERGENCY ALERT',
            'A patient has triggered an emergency alert!',
            `emergency-${payload.new.id}`
          );
          toast.error('🚨 EMERGENCY ALERT from a patient!', {
            duration: 30000,
            description: 'Check notifications for details.',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  // Run periodic checks for patients
  useEffect(() => {
    if (profile?.role !== 'patient') return;

    checkMedications();
    checkAppointments();

    const interval = setInterval(() => {
      checkMedications();
      checkAppointments();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [checkMedications, checkAppointments, profile]);
};
