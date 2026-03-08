import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Pill, Calendar, FileText, Droplets, Bell, Plus, Minus, Trophy, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const patientNavItems = [
  { label: 'Home', path: '/patient', icon: <Home className="w-4 h-4" /> },
  { label: 'Medications', path: '/patient/medications', icon: <Pill className="w-4 h-4" /> },
  { label: 'Appointments', path: '/patient/appointments', icon: <Calendar className="w-4 h-4" /> },
  { label: 'Reports', path: '/patient/reports', icon: <FileText className="w-4 h-4" /> },
  { label: 'Water', path: '/patient/water', icon: <Droplets className="w-4 h-4" /> },
  { label: 'Notifications', path: '/notifications', icon: <Bell className="w-4 h-4" /> },
];

const PatientWater: React.FC = () => {
  const { patientRecord } = useAuth();
  const [todayIntake, setTodayIntake] = useState<any>(null);
  const [weekHistory, setWeekHistory] = useState<any[]>([]);
  const [celebrate, setCelebrate] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchData = useCallback(async () => {
    if (!patientRecord) return;
    const [todayRes, historyRes] = await Promise.all([
      supabase.from('water_intake').select('*').eq('patient_id', patientRecord.id).eq('date', today).maybeSingle(),
      supabase.from('water_intake').select('*').eq('patient_id', patientRecord.id)
        .gte('date', format(subDays(new Date(), 6), 'yyyy-MM-dd')).order('date', { ascending: true }),
    ]);
    setTodayIntake(todayRes.data);
    setWeekHistory(historyRes.data || []);
  }, [patientRecord, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addGlass = async () => {
    if (!patientRecord) return;
    const current = todayIntake?.glasses_count || 0;
    const newCount = current + 1;
    const goal = todayIntake?.daily_goal || 8;
    if (todayIntake) await supabase.from('water_intake').update({ glasses_count: newCount }).eq('id', todayIntake.id);
    else await supabase.from('water_intake').insert({ patient_id: patientRecord.id, date: today, glasses_count: 1, daily_goal: 8 });
    if (newCount >= goal) { setCelebrate(true); setTimeout(() => setCelebrate(false), 2000); toast.success('🎉 Daily water goal reached!'); }
    else toast.success('+1 glass');
    fetchData();
  };

  const removeGlass = async () => {
    if (!todayIntake || todayIntake.glasses_count <= 0) return;
    await supabase.from('water_intake').update({ glasses_count: todayIntake.glasses_count - 1 }).eq('id', todayIntake.id);
    fetchData();
  };

  const glasses = todayIntake?.glasses_count || 0;
  const goal = todayIntake?.daily_goal || 8;
  const percent = Math.min((glasses / goal) * 100, 100);

  let streak = 0;
  for (let i = weekHistory.length - 1; i >= 0; i--) {
    if (weekHistory[i].glasses_count >= weekHistory[i].daily_goal) streak++;
    else break;
  }

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const dayData = weekHistory.find(w => w.date === date);
    return {
      day: format(subDays(new Date(), 6 - i), 'EEE'),
      glasses: dayData?.glasses_count || 0,
      goal: dayData?.daily_goal || 8,
      isToday: i === 6,
    };
  });

  const avgIntake = Math.round(chartData.reduce((s, d) => s + d.glasses, 0) / 7 * 10) / 10;

  return (
    <AppLayout navItems={patientNavItems}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-heading font-extrabold">Water Intake</h1>
          <p className="text-sm text-muted-foreground">Stay hydrated, stay healthy</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card">
            <div className="icon-badge bg-blue-500/10"><Droplets className="w-5 h-5 text-blue-500" /></div>
            <div>
              <p className="text-xl font-bold">{glasses}/{goal}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-badge bg-warning/10"><Trophy className="w-5 h-5 text-warning" /></div>
            <div>
              <p className="text-xl font-bold">{streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-badge bg-success/10"><TrendingUp className="w-5 h-5 text-success" /></div>
            <div>
              <p className="text-xl font-bold">{avgIntake}</p>
              <p className="text-xs text-muted-foreground">Avg/Day</p>
            </div>
          </div>
        </div>

        {/* Today's Progress */}
        <Card className={`card-elevated overflow-hidden ${celebrate ? 'animate-celebrate' : ''}`}>
          <div className="h-1 gradient-primary" />
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <div className="icon-badge bg-blue-500/10"><Droplets className="w-5 h-5 text-blue-500" /></div>
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-44 h-44 mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className="stroke-muted/40" />
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" stroke="url(#waterGradLg)"
                    strokeDasharray={`${percent * 2.64} 264`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                  <defs>
                    <linearGradient id="waterGradLg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(213 100% 58%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Droplets className="w-6 h-6 text-blue-500 mb-1" />
                  <span className="text-3xl font-extrabold">{glasses}</span>
                  <span className="text-xs text-muted-foreground">of {goal} glasses</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={removeGlass} disabled={glasses <= 0} className="rounded-xl h-11 w-11">
                  <Minus className="w-4 h-4" />
                </Button>
                <Button size="lg" onClick={addGlass} className="rounded-xl gradient-primary text-primary-foreground shadow-md px-8 h-12">
                  <Plus className="w-5 h-5 mr-2" /> Add Glass
                </Button>
                <div className="text-center w-11">
                  <p className="text-lg font-extrabold text-warning">{streak}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">streak</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Chart */}
        <Card className="card-elevated overflow-hidden">
          <div className="h-1 gradient-success" />
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <div className="icon-badge bg-success/10"><TrendingUp className="w-5 h-5 text-success" /></div>
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', boxShadow: 'var(--shadow-lg)' }}
                  formatter={(value: number) => [`${value} glasses`, 'Intake']}
                />
                <ReferenceLine y={goal} stroke="hsl(var(--success))" strokeDasharray="4 4" label={{ value: `Goal: ${goal}`, position: 'right', fontSize: 11, fill: 'hsl(var(--success))' }} />
                <Bar dataKey="glasses" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.glasses >= entry.goal ? 'hsl(var(--success))' : 'hsl(var(--primary))'} opacity={entry.isToday ? 1 : 0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PatientWater;
