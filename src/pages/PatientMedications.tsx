import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Pill, Calendar, FileText, Droplets, Bell, Check, Clock, Info } from 'lucide-react';
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

const PatientMedications: React.FC = () => {
  const { patientRecord, profile } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);
  const [takenMedIds, setTakenMedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchData = useCallback(async () => {
    if (!patientRecord) return;
    const [medsRes, logsRes] = await Promise.all([
      supabase.from('medications').select('*').eq('patient_id', patientRecord.id).order('created_at', { ascending: false }),
      supabase.from('medication_logs').select('medication_id, scheduled_time').eq('patient_id', patientRecord.id).eq('status', 'taken')
        .gte('scheduled_time', `${today}T00:00:00`).lte('scheduled_time', `${today}T23:59:59`),
    ]);
    setMedications(medsRes.data || []);
    const taken = new Set<string>();
    logsRes.data?.forEach((log: any) => taken.add(log.medication_id));
    setTakenMedIds(taken);
    setLoading(false);
  }, [patientRecord, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markTaken = async (medId: string, medName: string) => {
    if (!patientRecord) return;
    await supabase.from('medication_logs').insert({
      medication_id: medId, patient_id: patientRecord.id,
      scheduled_time: new Date().toISOString(), taken_time: new Date().toISOString(), status: 'taken',
    });
    setTakenMedIds(prev => new Set(prev).add(medId));
    try { await supabase.functions.invoke('send-notification', { body: { patient_id: patientRecord.id, patient_name: profile?.name || patientRecord.name, type: 'medication_taken', medication_name: medName } }); } catch (err) { console.error(err); }
    toast.success(`${medName} marked as taken ✓`);
  };

  const activeMeds = medications.filter(m => m.active);
  const inactiveMeds = medications.filter(m => !m.active);

  return (
    <AppLayout navItems={patientNavItems}>
      <div className="space-y-6 animate-fade-in">
        <div className="section-header">
          <div>
            <h1 className="text-2xl font-heading font-extrabold">Medications</h1>
            <p className="text-sm text-muted-foreground">{activeMeds.length} active medication{activeMeds.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="card-elevated"><CardContent className="p-5 h-20 shimmer" /></Card>)}</div>
        ) : medications.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="py-16 text-center">
              <div className="icon-badge-lg bg-muted mx-auto mb-4"><Pill className="w-6 h-6 text-muted-foreground" /></div>
              <h3 className="font-heading font-bold text-lg">No Medications</h3>
              <p className="text-muted-foreground text-sm mt-1">Your caregiver hasn't added any medications yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeMeds.length > 0 && (
              <div className="space-y-3">
                {activeMeds.map(med => {
                  const isTaken = takenMedIds.has(med.id);
                  return (
                    <Card key={med.id} className={`card-elevated overflow-hidden transition-all ${isTaken ? 'border-success/30' : ''}`}>
                      <CardContent className="p-0">
                        <div className={`h-1 ${isTaken ? 'bg-success' : 'gradient-primary'}`} />
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`icon-badge shrink-0 ${isTaken ? 'bg-success/10' : 'bg-primary/10'}`}>
                              <Pill className={`w-5 h-5 ${isTaken ? 'text-success' : 'text-primary'}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-heading font-bold">{med.name}</h3>
                                <Badge variant="secondary" className="text-xs">{med.dosage}</Badge>
                                {isTaken && <Badge className="bg-success/10 text-success border-success/30 text-xs">✓ Taken</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3 h-3" /> {med.frequency} • {med.times_array?.join(', ')}
                              </p>
                              {med.instructions && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> {med.instructions}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant={isTaken ? 'outline' : 'default'}
                            size="sm"
                            disabled={isTaken}
                            onClick={() => markTaken(med.id, med.name)}
                            className={`rounded-xl shrink-0 ${isTaken ? 'bg-success/10 text-success border-success/30 hover:bg-success/10' : 'gradient-primary text-primary-foreground shadow-sm'}`}
                          >
                            <Check className="w-4 h-4 mr-1" /> {isTaken ? 'Done' : 'Take'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            {inactiveMeds.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Inactive</h2>
                <div className="space-y-2">
                  {inactiveMeds.map(med => (
                    <Card key={med.id} className="card-elevated opacity-60">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="icon-badge bg-muted"><Pill className="w-5 h-5 text-muted-foreground" /></div>
                        <div>
                          <h3 className="font-semibold text-sm">{med.name} <span className="text-muted-foreground">{med.dosage}</span></h3>
                          <p className="text-xs text-muted-foreground">{med.frequency}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default PatientMedications;
