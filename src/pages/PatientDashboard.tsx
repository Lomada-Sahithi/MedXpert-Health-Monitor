import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Home, Pill, Calendar, FileText, Droplets, Bell, AlertTriangle, Check, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const patientNavItems = [
  { label: 'Home', path: '/patient', icon: <Home className="w-4 h-4" /> },
  { label: 'Medications', path: '/patient/medications', icon: <Pill className="w-4 h-4" /> },
  { label: 'Appointments', path: '/patient/appointments', icon: <Calendar className="w-4 h-4" /> },
  { label: 'Reports', path: '/patient/reports', icon: <FileText className="w-4 h-4" /> },
  { label: 'Water', path: '/patient/water', icon: <Droplets className="w-4 h-4" /> },
  { label: 'Notifications', path: '/notifications', icon: <Bell className="w-4 h-4" /> },
];

type Medication = {
  id: string; name: string; dosage: string; frequency: string;
  times_array: string[]; active: boolean | null;
};

type WaterIntake = {
  id: string; glasses_count: number; daily_goal: number; date: string;
};

const PatientDashboard: React.FC = () => {
  const { profile, patientRecord } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [takenMedIds, setTakenMedIds] = useState<Set<string>>(new Set());
  const [waterIntake, setWaterIntake] = useState<WaterIntake | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [celebrateWater, setCelebrateWater] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const fetchData = useCallback(async () => {
    if (!patientRecord) return;

    const [medsRes, waterRes, apptsRes, logsRes] = await Promise.all([
      supabase.from('medications').select('*').eq('patient_id', patientRecord.id).eq('active', true),
      supabase.from('water_intake').select('*').eq('patient_id', patientRecord.id).eq('date', today).maybeSingle(),
      supabase.from('appointments').select('*').eq('patient_id', patientRecord.id).gte('date', today).order('date').limit(5),
      supabase.from('medication_logs').select('medication_id')
        .eq('patient_id', patientRecord.id).eq('status', 'taken')
        .gte('scheduled_time', `${today}T00:00:00`).lte('scheduled_time', `${today}T23:59:59`),
    ]);

    setMedications((medsRes.data as Medication[]) || []);
    setWaterIntake(waterRes.data as WaterIntake | null);
    setUpcomingAppointments(apptsRes.data || []);

    const taken = new Set<string>();
    logsRes.data?.forEach((log: any) => taken.add(log.medication_id));
    setTakenMedIds(taken);
  }, [patientRecord, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addWater = async () => {
    if (!patientRecord) return;
    const current = waterIntake?.glasses_count || 0;
    const newCount = current + 1;
    const goal = waterIntake?.daily_goal || 8;

    if (waterIntake) {
      await supabase.from('water_intake').update({ glasses_count: newCount }).eq('id', waterIntake.id);
    } else {
      await supabase.from('water_intake').insert({
        patient_id: patientRecord.id,
        date: today,
        glasses_count: 1,
        daily_goal: 8,
      });
    }

    if (newCount >= goal) {
      setCelebrateWater(true);
      setTimeout(() => setCelebrateWater(false), 2000);
      toast.success('🎉 Daily water goal reached!');
    } else {
      toast.success('Water logged!');
    }
    fetchData();
  };

  const markMedicationTaken = async (medId: string) => {
    if (!patientRecord) return;
    await supabase.from('medication_logs').insert({
      medication_id: medId,
      patient_id: patientRecord.id,
      scheduled_time: new Date().toISOString(),
      taken_time: new Date().toISOString(),
      status: 'taken',
    });
    toast.success('Medication marked as taken ✓');
  };

  const handleEmergency = async () => {
    if (!patientRecord) return;
    setSendingAlert(true);

    try {
      let lat: number | null = null, lng: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        console.log('Location unavailable');
      }

      const { error } = await supabase.from('emergency_alerts').insert({
        patient_id: patientRecord.id,
        location_lat: lat,
        location_lng: lng,
        status: 'active',
      });

      if (error) throw error;

      // Call edge function to notify caregiver via SMS, call, and in-app notification
      const { error: fnError } = await supabase.functions.invoke('emergency-alert', {
        body: {
          patient_id: patientRecord.id,
          patient_name: profile?.name || patientRecord.name,
          location_lat: lat,
          location_lng: lng,
        },
      });

      if (fnError) console.error('Edge function error:', fnError);

      toast.success('Emergency alert sent to your caregiver!');
      setEmergencyDialogOpen(false);
    } catch (err: any) {
      toast.error('Failed to send alert: ' + err.message);
    }
    setSendingAlert(false);
  };

  const copyPatientId = () => {
    if (patientRecord?.patient_id_unique) {
      navigator.clipboard.writeText(patientRecord.patient_id_unique);
      toast.success('Patient ID copied!');
    }
  };

  const waterGoal = waterIntake?.daily_goal || 8;
  const waterCount = waterIntake?.glasses_count || 0;
  const waterPercent = Math.min((waterCount / waterGoal) * 100, 100);

  return (
    <AppLayout navItems={patientNavItems}>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-heading font-bold">{greeting}, {profile?.name || 'Patient'} 👋</h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="font-mono text-xs cursor-pointer" onClick={copyPatientId}>
              <Copy className="w-3 h-3 mr-1" />
              {patientRecord?.patient_id_unique || 'N/A'}
            </Badge>
          </div>
        </div>

        {/* Today's Medications */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Today's Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medications.length === 0 ? (
              <p className="text-muted-foreground text-sm">No medications scheduled</p>
            ) : (
              <div className="space-y-3">
                {medications.map(med => (
                  <div key={med.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{med.name} <span className="text-muted-foreground">{med.dosage}</span></p>
                      <p className="text-xs text-muted-foreground">{med.times_array?.join(', ')}</p>
                    </div>
                    <Button variant="success" size="sm" onClick={() => markMedicationTaken(med.id)}>
                      <Check className="w-4 h-4 mr-1" /> Taken
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Water & Appointments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Water Intake */}
          <Card className={`card-elevated ${celebrateWater ? 'animate-celebrate' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary" />
                Water Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-muted" />
                    <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-primary"
                      strokeDasharray={`${waterPercent * 2.51} 251`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {waterCount}/{waterGoal}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">
                    {waterCount >= waterGoal ? '🎉 Goal reached!' : `${waterGoal - waterCount} glasses to go`}
                  </p>
                  <Button onClick={addWater} className="w-full">
                    <Plus className="w-4 h-4 mr-1" /> Add Glass
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No upcoming appointments</p>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 3).map((appt: any) => (
                    <div key={appt.id} className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium text-sm">{appt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appt.date), 'MMM d')} at {appt.time}
                        {appt.doctor && ` • ${appt.doctor}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Emergency Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="emergency"
            size="lg"
            className="rounded-full w-16 h-16 text-lg font-bold shadow-lg"
            onClick={() => setEmergencyDialogOpen(true)}
          >
            SOS
          </Button>
        </div>

        <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-emergency flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Emergency Alert
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to send an emergency alert? Your location will be shared with your caregivers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setEmergencyDialogOpen(false)}>Cancel</Button>
              <Button variant="emergency" onClick={handleEmergency} disabled={sendingAlert}>
                {sendingAlert ? 'Sending Alert...' : 'Send Emergency Alert'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default PatientDashboard;
