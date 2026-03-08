import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Pill, Calendar, FileText, Droplets, Bell, MapPin, Clock, User } from 'lucide-react';
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
        <div>
          <h1 className="text-2xl font-heading font-extrabold">Appointments</h1>
          <p className="text-sm text-muted-foreground">{upcoming.length} upcoming</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="card-elevated"><CardContent className="p-5 h-20 shimmer" /></Card>)}</div>
        ) : (
          <>
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Upcoming</h2>
              {upcoming.length === 0 ? (
                <Card className="card-elevated">
                  <CardContent className="py-12 text-center">
                    <div className="icon-badge-lg bg-muted mx-auto mb-3"><Calendar className="w-6 h-6 text-muted-foreground" /></div>
                    <p className="text-muted-foreground text-sm">No upcoming appointments</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((appt, idx) => {
                    const colors = ['gradient-primary', 'gradient-success', 'gradient-warning'];
                    return (
                      <Card key={appt.id} className="card-elevated overflow-hidden">
                        <CardContent className="p-0">
                          <div className={`h-1 ${colors[idx % colors.length]}`} />
                          <div className="p-4 flex items-start gap-3">
                            <div className="icon-badge bg-primary/10 mt-0.5">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-bold">{appt.title}</h3>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {format(new Date(appt.date), 'MMM d, yyyy')} at {appt.time}</span>
                                {appt.doctor && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {appt.doctor}</span>}
                                {appt.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {appt.location}</span>}
                              </div>
                              {appt.notes && <p className="text-xs text-muted-foreground mt-2 italic bg-muted/30 px-3 py-1.5 rounded-lg">{appt.notes}</p>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Past</h2>
                <div className="space-y-2">
                  {past.map(appt => (
                    <Card key={appt.id} className="card-elevated opacity-50">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="icon-badge bg-muted"><Calendar className="w-5 h-5 text-muted-foreground" /></div>
                        <div>
                          <h3 className="font-semibold text-sm">{appt.title}</h3>
                          <p className="text-xs text-muted-foreground">{format(new Date(appt.date), 'MMM d, yyyy')} at {appt.time}</p>
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

export default PatientAppointments;
