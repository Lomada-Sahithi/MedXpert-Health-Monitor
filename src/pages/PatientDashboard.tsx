import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Home, Pill, Calendar, FileText, Droplets, Bell, AlertTriangle, Check, Plus, Copy, User, Phone, Clock, Sparkles } from 'lucide-react';
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

type WaterIntake = { id: string; glasses_count: number; daily_goal: number; date: string; };
type CaregiverInfo = { name: string; phone: string | null; };

const PatientDashboard: React.FC = () => {
  const { profile, patientRecord } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [takenMedIds, setTakenMedIds] = useState<Set<string>>(new Set());
  const [waterIntake, setWaterIntake] = useState<WaterIntake | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [celebrateWater, setCelebrateWater] = useState(false);
  const [caregiverInfo, setCaregiverInfo] = useState<CaregiverInfo | null>(null);

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
    if (patientRecord.caregiver_id) {
      const { data: cgProfile } = await supabase.from('profiles').select('name, phone').eq('user_id', patientRecord.caregiver_id).maybeSingle();
      setCaregiverInfo(cgProfile as CaregiverInfo | null);
    }
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
      await supabase.from('water_intake').insert({ patient_id: patientRecord.id, date: today, glasses_count: 1, daily_goal: 8 });
    }
    if (newCount >= goal) { setCelebrateWater(true); setTimeout(() => setCelebrateWater(false), 2000); toast.success('🎉 Daily water goal reached!'); }
    else toast.success('Water logged!');
    fetchData();
  };

  const markMedicationTaken = async (medId: string, medName: string) => {
    if (!patientRecord) return;
    await supabase.from('medication_logs').insert({
      medication_id: medId, patient_id: patientRecord.id,
      scheduled_time: new Date().toISOString(), taken_time: new Date().toISOString(), status: 'taken',
    });
    setTakenMedIds(prev => new Set(prev).add(medId));
    try { await supabase.functions.invoke('send-notification', { body: { patient_id: patientRecord.id, patient_name: profile?.name || patientRecord.name, type: 'medication_taken', medication_name: medName } }); } catch (err) { console.error(err); }
    toast.success(`${medName} marked as taken ✓`);
  };

  const handleEmergency = async () => {
    if (!patientRecord) return;
    setSendingAlert(true);
    try {
      let lat: number | null = null, lng: number | null = null;
      try { const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })); lat = pos.coords.latitude; lng = pos.coords.longitude; } catch {}
      const { error } = await supabase.from('emergency_alerts').insert({ patient_id: patientRecord.id, location_lat: lat, location_lng: lng, status: 'active' });
      if (error) throw error;
      await supabase.functions.invoke('emergency-alert', { body: { patient_id: patientRecord.id, patient_name: profile?.name || patientRecord.name, location_lat: lat, location_lng: lng } });
      toast.success('Emergency alert sent to your caregiver!');
      setEmergencyDialogOpen(false);
    } catch (err: any) { toast.error('Failed to send alert: ' + err.message); }
    setSendingAlert(false);
  };

  const copyPatientId = () => {
    if (patientRecord?.patient_id_unique) { navigator.clipboard.writeText(patientRecord.patient_id_unique); toast.success('Patient ID copied!'); }
  };

  const waterGoal = waterIntake?.daily_goal || 8;
  const waterCount = waterIntake?.glasses_count || 0;
  const waterPercent = Math.min((waterCount / waterGoal) * 100, 100);
  const takenCount = medications.filter(m => takenMedIds.has(m.id)).length;

  return (
    <AppLayout navItems={patientNavItems}>
      <div className="space-y-6 animate-fade-in">
        {/* Hero Welcome */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8 text-primary-foreground shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <p className="text-primary-foreground/80 text-sm font-medium">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold mt-1">{greeting}, {profile?.name?.split(' ')[0] || 'Patient'} 👋</h1>
            <div className="flex items-center gap-3 mt-3">
              <Badge className="bg-white/20 text-primary-foreground hover:bg-white/30 font-mono text-xs cursor-pointer border-0" onClick={copyPatientId}>
                <Copy className="w-3 h-3 mr-1" />
                {patientRecord?.patient_id_unique || 'N/A'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="stat-card">
            <div className="icon-badge bg-primary/10"><Pill className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{takenCount}/{medications.length}</p>
              <p className="text-xs text-muted-foreground">Meds Taken</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-badge bg-blue-500/10"><Droplets className="w-5 h-5 text-blue-500" /></div>
            <div>
              <p className="text-2xl font-bold">{waterCount}/{waterGoal}</p>
              <p className="text-xs text-muted-foreground">Water Glasses</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-badge bg-accent"><Calendar className="w-5 h-5 text-accent-foreground" /></div>
            <div>
              <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              <p className="text-xs text-muted-foreground">Appointments</p>
            </div>
          </div>
          {caregiverInfo && (
            <div className="stat-card">
              <div className="icon-badge bg-success/10"><User className="w-5 h-5 text-success" /></div>
              <div>
                <p className="text-sm font-semibold truncate">{caregiverInfo.name}</p>
                <p className="text-xs text-muted-foreground">Caregiver</p>
              </div>
            </div>
          )}
        </div>

        {/* Today's Medications */}
        <Card className="card-elevated overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <div className="icon-badge bg-primary/10"><Pill className="w-5 h-5 text-primary" /></div>
              Today's Medications
              {medications.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">{takenCount}/{medications.length} taken</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medications.length === 0 ? (
              <div className="text-center py-8">
                <div className="icon-badge-lg bg-muted mx-auto mb-3"><Pill className="w-6 h-6 text-muted-foreground" /></div>
                <p className="text-muted-foreground text-sm">No medications scheduled</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {medications.map(med => {
                  const isTaken = takenMedIds.has(med.id);
                  return (
                    <div key={med.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isTaken ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-transparent hover:border-border'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full ${isTaken ? 'bg-success' : 'bg-primary'}`} />
                        <div>
                          <p className="font-semibold text-sm">{med.name} <span className="text-muted-foreground font-normal">{med.dosage}</span></p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{med.times_array?.join(', ')}</p>
                        </div>
                      </div>
                      <Button
                        variant={isTaken ? 'outline' : 'default'}
                        size="sm"
                        disabled={isTaken}
                        onClick={() => markMedicationTaken(med.id, med.name)}
                        className={`rounded-xl ${isTaken ? 'bg-success/10 text-success border-success/30 hover:bg-success/10' : 'gradient-primary text-primary-foreground shadow-sm'}`}
                      >
                        <Check className="w-4 h-4 mr-1" /> {isTaken ? 'Done' : 'Take'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Water & Appointments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Water Intake */}
          <Card className={`card-elevated overflow-hidden ${celebrateWater ? 'animate-celebrate' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <div className="icon-badge bg-blue-500/10"><Droplets className="w-5 h-5 text-blue-500" /></div>
                Water Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-muted/50" />
                    <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" stroke="url(#waterGrad)"
                      strokeDasharray={`${waterPercent * 2.51} 251`} strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }}
                    />
                    <defs>
                      <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(213 100% 58%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{waterCount}</span>
                    <span className="text-[10px] text-muted-foreground">of {waterGoal}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">
                    {waterCount >= waterGoal ? '🎉 Goal reached!' : `${waterGoal - waterCount} glasses to go`}
                  </p>
                  <Button onClick={addWater} className="w-full rounded-xl gradient-primary text-primary-foreground shadow-sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Glass
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card className="card-elevated overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <div className="icon-badge bg-accent"><Calendar className="w-5 h-5 text-accent-foreground" /></div>
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <div className="icon-badge-lg bg-muted mx-auto mb-3"><Calendar className="w-6 h-6 text-muted-foreground" /></div>
                  <p className="text-muted-foreground text-sm">No upcoming appointments</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingAppointments.slice(0, 3).map((appt: any) => (
                    <div key={appt.id} className="p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors">
                      <p className="font-semibold text-sm">{appt.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {format(new Date(appt.date), 'MMM d')} at {appt.time}
                        {appt.doctor && <span className="ml-1">• {appt.doctor}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Caregiver Card */}
        {caregiverInfo && (
          <Card className="card-elevated overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-success flex items-center justify-center shadow-md">
                <User className="w-7 h-7 text-success-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your Caregiver</p>
                <p className="font-heading font-bold text-lg">{caregiverInfo.name}</p>
                {caregiverInfo.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {caregiverInfo.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="emergency"
            size="lg"
            className="rounded-full w-16 h-16 text-lg font-extrabold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            onClick={() => setEmergencyDialogOpen(true)}
          >
            SOS
          </Button>
        </div>

        <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-emergency flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-emergency flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-emergency-foreground" />
                </div>
                Emergency Alert
              </DialogTitle>
              <DialogDescription>
                Are you sure? Your location will be shared with your caregivers and they'll receive an immediate alert.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setEmergencyDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button variant="emergency" onClick={handleEmergency} disabled={sendingAlert} className="rounded-xl">
                {sendingAlert ? 'Sending...' : 'Send Emergency Alert'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default PatientDashboard;
