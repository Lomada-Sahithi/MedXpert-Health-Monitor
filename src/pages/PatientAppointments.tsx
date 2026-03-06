import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Pill, Calendar, FileText, Droplets, Bell } from 'lucide-react';
import { format } from 'date-fns';

const patientNavItems = [
  { label: 'Home', path: '/patient', icon: <Home className="w-4 h-4" /> },
  { label: 'Medications', path: '/patient/medications', icon: <Pill className="w-4 h-4" /> },
  { label: 'Appointments', path: '/patient/appointments', icon: <Calendar className="w-4 h-4" /> },
  { label: 'Reports', path: '/patient/reports', icon: <FileText className="w-4 h-4" /> },
  { label: 'Water', path: '/patient/water', icon: <Droplets className="w-4 h-4" /> },
  { label: 'Notifications', path: '/notifications', icon: <Bell className="w-4 h-4" /> },
];

const PatientAppointments: React.FC = () => {
  const { patientRecord } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientRecord) return;
    supabase.from('appointments').select('*').eq('patient_id', patientRecord.id).order('date', { ascending: true })
      .then(({ data }) => { setAppointments(data || []); setLoading(false); });
  }, [patientRecord]);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a => a.date >= today);
  const past = appointments.filter(a => a.date < today);

  return (
    <AppLayout navItems={patientNavItems}>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold">Appointments</h1>
        {loading ? <p>Loading...</p> : (
          <>
            <div>
              <h2 className="text-lg font-heading font-semibold mb-3">Upcoming</h2>
              {upcoming.length === 0 ? (
                <Card className="card-elevated"><CardContent className="py-8 text-center text-muted-foreground">No upcoming appointments</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(appt => (
                    <Card key={appt.id} className="card-elevated">
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{appt.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appt.date), 'MMM d, yyyy')} at {appt.time}
                          {appt.doctor && ` • ${appt.doctor}`}
                        </p>
                        {appt.location && <p className="text-xs text-muted-foreground">{appt.location}</p>}
                        {appt.notes && <p className="text-xs text-muted-foreground mt-1 italic">{appt.notes}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            {past.length > 0 && (
              <div>
                <h2 className="text-lg font-heading font-semibold mb-3">Past</h2>
                <div className="space-y-3">
                  {past.map(appt => (
                    <Card key={appt.id} className="card-elevated opacity-60">
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{appt.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appt.date), 'MMM d, yyyy')} at {appt.time}
                        </p>
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

export default PatientAppointments;
