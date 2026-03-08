import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const AuthPage: React.FC = () => {
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) toast.error(error.message);
    else toast.success('Account created! Check your email to verify.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent-foreground/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary mb-5 shadow-lg animate-float">
            <Heart className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-heading font-extrabold text-gradient-primary">MedXpert</h1>
          <p className="text-muted-foreground mt-2 text-base">Your smart health monitoring companion</p>
        </div>

        <Card className="glass-card overflow-hidden">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 bg-muted/50" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="signin" className="rounded-lg data-[state=active]:shadow-sm">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-xl">Welcome Back</CardTitle>
                  <CardDescription>Sign in to continue to your dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="pl-10 h-11 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="pl-10 h-11 rounded-xl" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
                    {loading ? 'Signing in...' : <>Sign In <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-xl">Create Account</CardTitle>
                  <CardDescription>Get started with MedXpert today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="pl-10 h-11 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required className="pl-10 h-11 rounded-xl" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
                    {loading ? 'Creating account...' : <>Create Account <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="flex items-center justify-center gap-8 mt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-success" />
            </div>
            <span>HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-primary" />
            </div>
            <span>Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
