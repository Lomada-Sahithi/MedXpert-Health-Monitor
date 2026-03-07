import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Pill, Calendar, AlertTriangle, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Patient = {
  id: string;
  patient_id_unique: string;
  name: string;
  age: number | null;
  caregiver_id: string | null;
  user_id: string | null;
};

const caregiverNavItems = [
  { label: 'Dashboard', path: '/caregiver', icon: <Users className="w-4 h-4" /> },
  { label: 'Notifications', path: '/notifications', icon: <AlertTriangle className="w-4 h-4" /> },
];

const CaregiverDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientEmailInput, setPatientEmailInput] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingPatient, setAddingPatient] = useState(false);

  const fetchPatients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('caregiver_id', user.id);
    setPatients((data as Patient[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const handleAddPatient = async () => {
    if (!patientEmailInput.trim() || !user) return;
    setAddingPatient(true);

    const { data, error } = await supabase.rpc('link_patient_by_email', {
      _caregiver_id: user.id,
      _patient_email: patientEmailInput.trim().toLowerCase(),
    });

    const result = data as any;
    if (error || !result?.success) {
      toast.error(result?.error || error?.message || 'Failed to add patient');
    } else {
      toast.success(`Patient ${result.patient_name} added successfully!`);
      setPatientEmailInput('');
      setAddDialogOpen(false);
      fetchPatients();
    }
    setAddingPatient(false);
  };

  return (
    <AppLayout navItems={caregiverNavItems}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Your Patients</h1>
            <p className="text-muted-foreground">Manage and monitor your patients' health</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Patient</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Add a Patient</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Enter the patient's registered email address to connect with them.</p>
                <div className="space-y-2">
                  <Label>Patient Email</Label>
                  <Input
                    type="email"
                    value={patientEmailInput}
                    onChange={e => setPatientEmailInput(e.target.value)}
                    placeholder="patient@example.com"
                  />
                </div>
                <Button onClick={handleAddPatient} disabled={addingPatient || !patientEmailInput.trim()} className="w-full">
                  {addingPatient ? 'Adding...' : 'Add Patient'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="card-elevated animate-pulse">
                <CardContent className="p-6 h-40" />
              </Card>
            ))}
          </div>
        ) : patients.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-heading font-semibold">No Patients Yet</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">Add a patient by entering their unique Patient ID. Patients can find their ID on their dashboard.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map(patient => (
              <Card key={patient.id} className="card-elevated hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/caregiver/patient/${patient.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-lg">{patient.name}</CardTitle>
                    <Badge variant="secondary">{patient.age ? `${patient.age} yrs` : 'N/A'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{patient.patient_id_unique}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Pill className="w-4 h-4" />
                      <span>Medications</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Appointments</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    View Details →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CaregiverDashboard;
