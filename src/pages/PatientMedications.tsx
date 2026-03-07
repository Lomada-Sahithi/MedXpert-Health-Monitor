import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Pill, Calendar, FileText, Droplets, Bell, Check } from 'lucide-react';
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
      supabase.from('medication_logs').select('medication_id, scheduled_time')
        .eq('patient_id', patientRecord.id)
        .eq('status', 'taken')
        .gte('scheduled_time', `${today}T00:00:00`)
        .lte('scheduled_time', `${today}T23:59:59`),
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

    // Insert medication log
    await supabase.from('medication_logs').insert({
      medication_id: medId,
      patient_id: patientRecord.id,
      scheduled_time: new Date().toISOString(),
      taken_time: new Date().toISOString(),
      status: 'taken',
    });

    // Update local state immediately
    setTakenMedIds(prev => new Set(prev).add(medId));

    // Notify caregiver via edge function
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          patient_id: patientRecord.id,
          patient_name: profile?.name || patientRecord.name,
          type: 'medication_taken',
          medication_name: medName,
        },
      });
    } catch (err) {
      console.error('Notification error:', err);
    }

    toast.success(`${medName} marked as taken ✓`);
  };

  return (
    <AppLayout navItems={patientNavItems}>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold">Medications</h1>
        {loading ? <p>Loading...</p> : medications.length === 0 ? (
          <Card className="card-elevated"><CardContent className="py-12 text-center text-muted-foreground">No medications assigned</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {medications.map(med => {
              const isTaken = takenMedIds.has(med.id);
              return (
                <Card key={med.id} className="card-elevated">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{med.name}</h3>
                        <Badge variant={med.active ? 'default' : 'secondary'}>{med.active ? 'Active' : 'Inactive'}</Badge>
                        {isTaken && <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">✓ Taken Today</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</p>
                      <p className="text-xs text-muted-foreground">{med.times_array?.join(', ')}</p>
                      {med.instructions && <p className="text-xs text-muted-foreground mt-1 italic">{med.instructions}</p>}
                    </div>
                    {med.active && (
                      <Button
                        variant={isTaken ? 'outline' : 'default'}
                        size="sm"
                        disabled={isTaken}
                        onClick={() => markTaken(med.id, med.name)}
                        className={isTaken ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}
                      >
                        <Check className="w-4 h-4 mr-1" /> {isTaken ? 'Taken ✓' : 'Mark Taken'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PatientMedications;
