import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Users, Heart, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
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
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: user.id, role: selectedRole, name: name.trim(), phone: phone.trim(),
      });
      if (profileError) throw profileError;

      if (selectedRole === 'patient') {
        const { data: patientId } = await supabase.rpc('generate_patient_id');
        const { error: patientError } = await supabase.from('patients').insert({
          user_id: user.id, patient_id_unique: patientId as string, name: name.trim(), age: age ? parseInt(age) : null,
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
      <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent-foreground/5 blur-3xl" />

        <div className="w-full max-w-lg animate-fade-in relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Welcome to MedXpert
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-foreground">Choose Your Role</h1>
            <p className="text-muted-foreground mt-2">How will you be using the platform?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Card className="card-interactive group border-2 border-transparent hover:border-primary/30" onClick={() => handleRoleSelect('caregiver')}>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Users className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-heading font-bold">Caregiver</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Manage medications, appointments & monitor patient health</p>
              </CardContent>
            </Card>
            <Card className="card-interactive group border-2 border-transparent hover:border-success/30" onClick={() => handleRoleSelect('patient')}>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-2xl gradient-success flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Stethoscope className="w-10 h-10 text-success-foreground" />
                </div>
                <h3 className="text-lg font-heading font-bold">Patient</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Track medications, water intake & access health records</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="w-full max-w-md animate-fade-in relative z-10">
        <Card className="glass-card">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole === 'caregiver' ? 'gradient-primary' : 'gradient-success'}`}>
                  {selectedRole === 'caregiver' ? <Users className="w-4 h-4 text-primary-foreground" /> : <Stethoscope className="w-4 h-4 text-success-foreground" />}
                </div>
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                {selectedRole === 'caregiver' ? 'Set up your caregiver account' : 'Set up your patient account'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" required className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="h-11 rounded-xl" />
              </div>
              {selectedRole === 'patient' && (
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Enter your age" min="1" max="150" className="h-11 rounded-xl" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep('role')} className="flex-1 h-11 rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button type="submit" className="flex-1 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-md" disabled={loading || !name.trim()}>
                  {loading ? 'Creating...' : <>Complete <ArrowRight className="w-4 h-4 ml-1" /></>}
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
