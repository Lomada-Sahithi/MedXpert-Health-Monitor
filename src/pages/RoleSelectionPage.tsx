import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Users } from 'lucide-react';
import { toast } from 'sonner';

const RoleSelectionPage: React.FC = () => {
  const { user, refreshProfile, refreshPatientRecord } = useAuth();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<'caregiver' | 'patient' | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: 'caregiver' | 'patient') => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRole || !name.trim()) return;
    setLoading(true);

    try {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: user.id,
        role: selectedRole,
        name: name.trim(),
        phone: phone.trim(),
      });
      if (profileError) throw profileError;

      // If patient, create patient record with generated ID
      if (selectedRole === 'patient') {
        const { data: patientId } = await supabase.rpc('generate_patient_id');
        const { error: patientError } = await supabase.from('patients').insert({
          user_id: user.id,
          patient_id_unique: patientId as string,
          name: name.trim(),
          age: age ? parseInt(age) : null,
        });
        if (patientError) throw patientError;
        await refreshPatientRecord();
      }

      await refreshProfile();
      toast.success('Profile created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create profile');
    }
    setLoading(false);
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground">Choose Your Role</h1>
            <p className="text-muted-foreground mt-2">How will you use HealthGuard?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="card-elevated cursor-pointer hover:border-primary transition-colors" onClick={() => handleRoleSelect('caregiver')}>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-semibold">Caregiver</h3>
                <p className="text-sm text-muted-foreground mt-2">Manage medications, appointments, and monitor patient health</p>
              </CardContent>
            </Card>
            <Card className="card-elevated cursor-pointer hover:border-primary transition-colors" onClick={() => handleRoleSelect('patient')}>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
                  <Stethoscope className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-heading font-semibold">Patient</h3>
                <p className="text-sm text-muted-foreground mt-2">Track medications, water intake, and access your health records</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="card-elevated">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="font-heading">Complete Your Profile</CardTitle>
              <CardDescription>
                {selectedRole === 'caregiver' ? 'Set up your caregiver account' : 'Set up your patient account'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
              {selectedRole === 'patient' && (
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Enter your age" min="1" max="150" />
                </div>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('role')} className="flex-1">Back</Button>
                <Button type="submit" className="flex-1" disabled={loading || !name.trim()}>
                  {loading ? 'Creating...' : 'Complete Setup'}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
