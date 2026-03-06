import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { patientRecord } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientRecord) return;
    supabase.from('medications').select('*').eq('patient_id', patientRecord.id).order('created_at', { ascending: false })
      .then(({ data }) => { setMedications(data || []); setLoading(false); });
  }, [patientRecord]);

  const markTaken = async (medId: string) => {
    if (!patientRecord) return;
    await supabase.from('medication_logs').insert({
      medication_id: medId, patient_id: patientRecord.id,
      scheduled_time: new Date().toISOString(), taken_time: new Date().toISOString(), status: 'taken',
    });
    toast.success('Medication marked as taken ✓');
  };

  return (
    <AppLayout navItems={patientNavItems}>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold">Medications</h1>
        {loading ? <p>Loading...</p> : medications.length === 0 ? (
          <Card className="card-elevated"><CardContent className="py-12 text-center text-muted-foreground">No medications assigned</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {medications.map(med => (
              <Card key={med.id} className="card-elevated">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{med.name}</h3>
                      <Badge variant={med.active ? 'default' : 'secondary'}>{med.active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</p>
                    <p className="text-xs text-muted-foreground">{med.times_array?.join(', ')}</p>
                    {med.instructions && <p className="text-xs text-muted-foreground mt-1 italic">{med.instructions}</p>}
                  </div>
                  {med.active && (
                    <Button variant="success" size="sm" onClick={() => markTaken(med.id)}>
                      <Check className="w-4 h-4 mr-1" /> Taken
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PatientMedications;
