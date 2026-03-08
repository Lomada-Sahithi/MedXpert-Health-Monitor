import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Pill, Calendar, AlertTriangle, Plus, UserPlus, ArrowRight, Heart, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Patient = {
  id: string; patient_id_unique: string; name: string;
  age: number | null; caregiver_id: string | null; user_id: string | null;
};

const caregiverNavItems = [
  { label: 'Dashboard', path: '/caregiver', icon: <Users className="w-4 h-4" /> },
  { label: 'Notifications', path: '/notifications', icon: <AlertTriangle className="w-4 h-4" /> },
];

const CaregiverDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientEmailInput, setPatientEmailInput] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingPatient, setAddingPatient] = useState(false);

  const fetchPatients = async () => {
    if (!user) return;
    const { data } = await supabase.from('patients').select('*').eq('caregiver_id', user.id);
    setPatients((data as Patient[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, [user]);

  const handleAddPatient = async () => {
    if (!patientEmailInput.trim() || !user) return;
    setAddingPatient(true);
    const { data, error } = await supabase.rpc('link_patient_by_email', {
      _caregiver_id: user.id, _patient_email: patientEmailInput.trim().toLowerCase(),
    });
    const result = data as any;
    if (error || !result?.success) toast.error(result?.error || error?.message || 'Failed to add patient');
    else { toast.success(`Patient ${result.patient_name} added!`); setPatientEmailInput(''); setAddDialogOpen(false); fetchPatients(); }
    setAddingPatient(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <AppLayout navItems={caregiverNavItems}>
      <div className="space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8 text-primary-foreground shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium">{greeting}</p>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold mt-1">{profile?.name?.split(' ')[0] || 'Caregiver'}'s Dashboard</h1>
              <p className="text-primary-foreground/70 mt-1 text-sm">{patients.length} patient{patients.length !== 1 ? 's' : ''} under your care</p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 hover:bg-white/30 border-0 text-primary-foreground rounded-xl shadow-md backdrop-blur-sm">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-heading flex items-center gap-2">
                    <div className="icon-badge gradient-primary"><UserPlus className="w-5 h-5 text-primary-foreground" /></div>
                    Add a Patient
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Enter the patient's registered email to connect with them.</p>
                  <div className="space-y-2">
                    <Label>Patient Email</Label>
                    <Input type="email" value={patientEmailInput} onChange={e => setPatientEmailInput(e.target.value)} placeholder="patient@example.com" className="h-11 rounded-xl" />
                  </div>
                  <Button onClick={handleAddPatient} disabled={addingPatient || !patientEmailInput.trim()} className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-md">
                    {addingPatient ? 'Adding...' : 'Connect Patient'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="card-elevated">
                <CardContent className="p-6 h-44 shimmer" />
              </Card>
            ))}
          </div>
        ) : patients.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-5">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-heading font-bold">No Patients Yet</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">Add your first patient by clicking the "Add Patient" button above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient, idx) => {
              const colors = [
                'gradient-primary', 'gradient-success', 'gradient-warning',
                'bg-accent-foreground', 'bg-chart-1',
              ];
              const gradClass = colors[idx % colors.length];
              const initials = patient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

              return (
                <Card
                  key={patient.id}
                  className="card-interactive group overflow-hidden"
                  onClick={() => navigate(`/caregiver/patient/${patient.id}`)}
                >
                  <CardContent className="p-0">
                    <div className={`h-2 ${gradClass}`} />
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-2xl ${gradClass} flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-bold text-base truncate">{patient.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">{patient.patient_id_unique}</p>
                        </div>
                        {patient.age && <Badge variant="secondary" className="shrink-0">{patient.age} yrs</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50">
                          <Pill className="w-3.5 h-3.5" /> Medications
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50">
                          <Calendar className="w-3.5 h-3.5" /> Appointments
                        </div>
                      </div>
                      <Button variant="outline" className="w-full rounded-xl group-hover:gradient-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all" size="sm">
                        View Details <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
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

export default CaregiverDashboard;
