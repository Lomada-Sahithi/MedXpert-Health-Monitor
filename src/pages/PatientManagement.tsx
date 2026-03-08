import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Pill, Calendar, FileText, Bell, Plus, Trash2, Users, AlertTriangle, Download, Eye, Droplets, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const caregiverNavItems = [
  { label: 'Dashboard', path: '/caregiver', icon: <Users className="w-4 h-4" /> },
  { label: 'Notifications', path: '/notifications', icon: <AlertTriangle className="w-4 h-4" /> },
];

type Medication = {
  id: string; name: string; dosage: string; frequency: string;
  times_array: string[]; start_date: string; end_date: string | null;
  instructions: string | null; active: boolean | null;
};
type Appointment = { id: string; title: string; date: string; time: string; location: string | null; doctor: string | null; notes: string | null; };
type Report = { id: string; title: string; description: string | null; file_url: string; file_type: string | null; upload_date: string; category: string | null; };

const PatientManagement: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [waterHistory, setWaterHistory] = useState<any[]>([]);

  const [medDialog, setMedDialog] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('daily');
  const [medTimes, setMedTimes] = useState(['08:00']);
  const [medStartDate, setMedStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [medEndDate, setMedEndDate] = useState('');
  const [medInstructions, setMedInstructions] = useState('');
  const [medSaving, setMedSaving] = useState(false);

  const [apptDialog, setApptDialog] = useState(false);
  const [apptTitle, setApptTitle] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptLocation, setApptLocation] = useState('');
  const [apptDoctor, setApptDoctor] = useState('');
  const [apptNotes, setApptNotes] = useState('');
  const [apptSaving, setApptSaving] = useState(false);

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => { fetchAll(); }, [patientId]);

  const fetchAll = async () => {
    if (!patientId) return;
    const [patientRes, medsRes, apptsRes, reportsRes, waterRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', patientId).single(),
      supabase.from('medications').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
      supabase.from('appointments').select('*').eq('patient_id', patientId).order('date', { ascending: true }),
      supabase.from('medical_reports').select('*').eq('patient_id', patientId).order('upload_date', { ascending: false }),
      supabase.from('water_intake').select('*').eq('patient_id', patientId).gte('date', format(subDays(new Date(), 6), 'yyyy-MM-dd')).order('date', { ascending: true }),
    ]);
    setPatient(patientRes.data);
    setMedications((medsRes.data as Medication[]) || []);
    setAppointments((apptsRes.data as Appointment[]) || []);
    setReports((reportsRes.data as Report[]) || []);
    setWaterHistory(waterRes.data || []);
  };

  const addMedication = async () => {
    if (!medName || !medDosage || !patientId) return;
    setMedSaving(true);
    const { error } = await supabase.from('medications').insert({
      patient_id: patientId, name: medName, dosage: medDosage, frequency: medFrequency,
      times_array: medTimes, start_date: medStartDate, end_date: medEndDate || null, instructions: medInstructions || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Medication added');
      setMedDialog(false); resetMedForm(); fetchAll();
      if (patient?.user_id) await supabase.from('notifications').insert({ user_id: patient.user_id, title: 'New Medication Added', message: `${medName} ${medDosage} has been added.`, type: 'medication' });
    }
    setMedSaving(false);
  };

  const resetMedForm = () => { setMedName(''); setMedDosage(''); setMedFrequency('daily'); setMedTimes(['08:00']); setMedStartDate(format(new Date(), 'yyyy-MM-dd')); setMedEndDate(''); setMedInstructions(''); };
  const deleteMedication = async (id: string) => { const { error } = await supabase.from('medications').delete().eq('id', id); if (error) toast.error(error.message); else { toast.success('Deleted'); fetchAll(); } };

  const addAppointment = async () => {
    if (!apptTitle || !apptDate || !apptTime || !patientId) return;
    setApptSaving(true);
    const { error } = await supabase.from('appointments').insert({ patient_id: patientId, title: apptTitle, date: apptDate, time: apptTime, location: apptLocation || null, doctor: apptDoctor || null, notes: apptNotes || null });
    if (error) toast.error(error.message);
    else {
      toast.success('Appointment added'); setApptDialog(false);
      setApptTitle(''); setApptDate(''); setApptTime(''); setApptLocation(''); setApptDoctor(''); setApptNotes(''); fetchAll();
      if (patient?.user_id) await supabase.from('notifications').insert({ user_id: patient.user_id, title: 'New Appointment', message: `${apptTitle} on ${apptDate} at ${apptTime}`, type: 'appointment' });
    }
    setApptSaving(false);
  };
  const deleteAppointment = async (id: string) => { const { error } = await supabase.from('appointments').delete().eq('id', id); if (error) toast.error(error.message); else { toast.success('Deleted'); fetchAll(); } };

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientId || !patient?.user_id) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `${patient.user_id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('medical-reports').upload(filePath, file);
    if (uploadError) { toast.error('Upload failed: ' + uploadError.message); return; }
    const { error } = await supabase.from('medical_reports').insert({ patient_id: patientId, title: file.name, file_url: `medical-reports/${filePath}`, file_type: fileExt || 'unknown', category: 'other' });
    if (error) toast.error(error.message);
    else { toast.success('Report uploaded'); fetchAll(); }
  };
  const deleteReport = async (id: string) => { const { error } = await supabase.from('medical_reports').delete().eq('id', id); if (error) toast.error(error.message); else { toast.success('Deleted'); fetchAll(); } };

  const sendNotification = async () => {
    if (!notifTitle || !notifMessage || !patient?.user_id) return;
    setNotifSaving(true);
    const { error } = await supabase.from('notifications').insert({ user_id: patient.user_id, title: notifTitle, message: notifMessage, type: 'caregiver' });
    if (error) toast.error(error.message);
    else { toast.success('Notification sent'); setNotifTitle(''); setNotifMessage(''); }
    setNotifSaving(false);
  };

  const addTimeSlot = () => setMedTimes([...medTimes, '12:00']);
  const removeTimeSlot = (idx: number) => setMedTimes(medTimes.filter((_, i) => i !== idx));
  const updateTimeSlot = (idx: number, val: string) => { const t = [...medTimes]; t[idx] = val; setMedTimes(t); };

  if (!patient) return <AppLayout navItems={caregiverNavItems}><div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AppLayout>;

  const initials = patient.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AppLayout navItems={caregiverNavItems}>
      <div className="space-y-6 animate-fade-in">
        {/* Patient Header */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-primary-foreground shadow-lg">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/caregiver')} className="text-primary-foreground hover:bg-white/20 rounded-xl shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-lg font-bold backdrop-blur-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-heading font-extrabold">{patient.name}</h1>
              <p className="text-primary-foreground/70 text-sm font-mono">{patient.patient_id_unique} {patient.age ? `• ${patient.age} years` : ''}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="medications" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="medications" className="rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm"><Pill className="w-4 h-4 mr-1 hidden sm:inline" />Meds</TabsTrigger>
            <TabsTrigger value="appointments" className="rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm"><Calendar className="w-4 h-4 mr-1 hidden sm:inline" />Appts</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm"><FileText className="w-4 h-4 mr-1 hidden sm:inline" />Reports</TabsTrigger>
            <TabsTrigger value="water" className="rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm"><Droplets className="w-4 h-4 mr-1 hidden sm:inline" />Water</TabsTrigger>
            <TabsTrigger value="notify" className="rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm"><Bell className="w-4 h-4 mr-1 hidden sm:inline" />Notify</TabsTrigger>
          </TabsList>

          {/* MEDICATIONS */}
          <TabsContent value="medications" className="space-y-4">
            <div className="section-header">
              <h2 className="text-lg font-heading font-bold">Medications</h2>
              <Dialog open={medDialog} onOpenChange={setMedDialog}>
                <DialogTrigger asChild><Button size="sm" className="rounded-xl gradient-primary text-primary-foreground shadow-sm"><Plus className="w-4 h-4 mr-1" />Add</Button></DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto rounded-2xl">
                  <DialogHeader><DialogTitle className="font-heading flex items-center gap-2"><div className="icon-badge gradient-primary"><Pill className="w-5 h-5 text-primary-foreground" /></div>Add Medication</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>Name</Label><Input value={medName} onChange={e => setMedName(e.target.value)} placeholder="Lisinopril" className="rounded-xl" /></div>
                      <div className="space-y-2"><Label>Dosage</Label><Input value={medDosage} onChange={e => setMedDosage(e.target.value)} placeholder="10mg" className="rounded-xl" /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={medFrequency} onValueChange={setMedFrequency}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="twice_daily">Twice Daily</SelectItem><SelectItem value="three_times">Three Times</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Times</Label>
                      {medTimes.map((t, i) => (<div key={i} className="flex gap-2 items-center"><Input type="time" value={t} onChange={e => updateTimeSlot(i, e.target.value)} className="rounded-xl" />{medTimes.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeTimeSlot(i)} className="rounded-xl"><Trash2 className="w-4 h-4 text-destructive" /></Button>}</div>))}
                      <Button variant="outline" size="sm" onClick={addTimeSlot} className="rounded-xl"><Plus className="w-3 h-3 mr-1" />Add Time</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>Start</Label><Input type="date" value={medStartDate} onChange={e => setMedStartDate(e.target.value)} className="rounded-xl" /></div>
                      <div className="space-y-2"><Label>End (opt.)</Label><Input type="date" value={medEndDate} onChange={e => setMedEndDate(e.target.value)} className="rounded-xl" /></div>
                    </div>
                    <div className="space-y-2"><Label>Instructions</Label><Textarea value={medInstructions} onChange={e => setMedInstructions(e.target.value)} placeholder="Take with food..." className="rounded-xl" /></div>
                    <Button onClick={addMedication} disabled={medSaving || !medName || !medDosage} className="w-full rounded-xl gradient-primary text-primary-foreground shadow-md h-11">{medSaving ? 'Saving...' : 'Add Medication'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {medications.length === 0 ? (
              <Card className="card-elevated"><CardContent className="py-12 text-center"><div className="icon-badge-lg bg-muted mx-auto mb-3"><Pill className="w-6 h-6 text-muted-foreground" /></div><p className="text-muted-foreground">No medications added yet</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {medications.map(med => (
                  <Card key={med.id} className="card-elevated overflow-hidden">
                    <CardContent className="p-0">
                      <div className={`h-1 ${med.active ? 'gradient-primary' : 'bg-muted'}`} />
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`icon-badge ${med.active ? 'bg-primary/10' : 'bg-muted'}`}><Pill className={`w-5 h-5 ${med.active ? 'text-primary' : 'text-muted-foreground'}`} /></div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-heading font-bold">{med.name}</h3>
                              <Badge variant="secondary" className="text-xs">{med.dosage}</Badge>
                              <Badge variant={med.active ? 'default' : 'secondary'} className="text-xs">{med.active ? 'Active' : 'Inactive'}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{med.frequency} • {med.times_array?.join(', ')}</p>
                            {med.instructions && <p className="text-xs text-muted-foreground mt-0.5">{med.instructions}</p>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteMedication(med.id)} className="rounded-xl hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* APPOINTMENTS */}
          <TabsContent value="appointments" className="space-y-4">
            <div className="section-header">
              <h2 className="text-lg font-heading font-bold">Appointments</h2>
              <Dialog open={apptDialog} onOpenChange={setApptDialog}>
                <DialogTrigger asChild><Button size="sm" className="rounded-xl gradient-primary text-primary-foreground shadow-sm"><Plus className="w-4 h-4 mr-1" />Add</Button></DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader><DialogTitle className="font-heading flex items-center gap-2"><div className="icon-badge gradient-primary"><Calendar className="w-5 h-5 text-primary-foreground" /></div>Add Appointment</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={apptTitle} onChange={e => setApptTitle(e.target.value)} placeholder="Cardiology Follow-up" className="rounded-xl" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>Date</Label><Input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} className="rounded-xl" /></div>
                      <div className="space-y-2"><Label>Time</Label><Input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)} className="rounded-xl" /></div>
                    </div>
                    <div className="space-y-2"><Label>Location</Label><Input value={apptLocation} onChange={e => setApptLocation(e.target.value)} placeholder="Hospital, clinic..." className="rounded-xl" /></div>
                    <div className="space-y-2"><Label>Doctor</Label><Input value={apptDoctor} onChange={e => setApptDoctor(e.target.value)} placeholder="Dr. Smith" className="rounded-xl" /></div>
                    <div className="space-y-2"><Label>Notes</Label><Textarea value={apptNotes} onChange={e => setApptNotes(e.target.value)} placeholder="Additional notes..." className="rounded-xl" /></div>
                    <Button onClick={addAppointment} disabled={apptSaving || !apptTitle || !apptDate || !apptTime} className="w-full rounded-xl gradient-primary text-primary-foreground shadow-md h-11">{apptSaving ? 'Saving...' : 'Add Appointment'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {appointments.length === 0 ? (
              <Card className="card-elevated"><CardContent className="py-12 text-center"><div className="icon-badge-lg bg-muted mx-auto mb-3"><Calendar className="w-6 h-6 text-muted-foreground" /></div><p className="text-muted-foreground">No appointments scheduled</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt, idx) => {
                  const colors = ['gradient-primary', 'gradient-success', 'gradient-warning'];
                  return (
                    <Card key={appt.id} className="card-elevated overflow-hidden">
                      <CardContent className="p-0">
                        <div className={`h-1 ${colors[idx % colors.length]}`} />
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="icon-badge bg-primary/10 mt-0.5"><Calendar className="w-5 h-5 text-primary" /></div>
                            <div>
                              <h3 className="font-heading font-bold">{appt.title}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(appt.date), 'MMM d, yyyy')} at {appt.time}{appt.doctor && ` • ${appt.doctor}`}</p>
                              {appt.location && <p className="text-xs text-muted-foreground">{appt.location}</p>}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deleteAppointment(appt.id)} className="rounded-xl hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* REPORTS */}
          <TabsContent value="reports" className="space-y-4">
            <div className="section-header">
              <h2 className="text-lg font-heading font-bold">Medical Reports</h2>
              <label>
                <Button size="sm" asChild className="rounded-xl gradient-primary text-primary-foreground shadow-sm"><span><Plus className="w-4 h-4 mr-1" />Upload</span></Button>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleReportUpload} />
              </label>
            </div>
            {reports.length === 0 ? (
              <Card className="card-elevated"><CardContent className="py-12 text-center"><div className="icon-badge-lg bg-muted mx-auto mb-3"><FileText className="w-6 h-6 text-muted-foreground" /></div><p className="text-muted-foreground">No reports uploaded</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reports.map(report => (
                  <Card key={report.id} className="card-elevated overflow-hidden group">
                    <CardContent className="p-0">
                      <div className="h-1 gradient-primary" />
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="icon-badge bg-primary/10"><FileText className="w-5 h-5 text-primary" /></div>
                            <div className="min-w-0">
                              <h3 className="font-heading font-semibold text-sm truncate">{report.title}</h3>
                              <p className="text-xs text-muted-foreground">{format(new Date(report.upload_date), 'MMM d, yyyy')}</p>
                              <Badge variant="secondary" className="text-xs mt-1">{report.category}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={async () => { const p = report.file_url.replace('medical-reports/', ''); const { data } = await supabase.storage.from('medical-reports').createSignedUrl(p, 3600); if (data?.signedUrl) window.open(data.signedUrl, '_blank'); else toast.error('Error'); }}><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={async () => { const p = report.file_url.replace('medical-reports/', ''); const { data } = await supabase.storage.from('medical-reports').createSignedUrl(p, 3600, { download: true }); if (data?.signedUrl) window.open(data.signedUrl, '_blank'); else toast.error('Error'); }}><Download className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-destructive/10" onClick={() => deleteReport(report.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* NOTIFY */}
          <TabsContent value="notify" className="space-y-4">
            <h2 className="text-lg font-heading font-bold">Send Notification</h2>
            <Card className="card-elevated overflow-hidden">
              <div className="h-1 gradient-primary" />
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Message title" className="rounded-xl" /></div>
                <div className="space-y-2"><Label>Message</Label><Textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Write your message..." className="rounded-xl" /></div>
                <Button onClick={sendNotification} disabled={notifSaving || !notifTitle || !notifMessage} className="rounded-xl gradient-primary text-primary-foreground shadow-md">
                  <Send className="w-4 h-4 mr-2" />{notifSaving ? 'Sending...' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WATER */}
          <TabsContent value="water" className="space-y-4">
            <h2 className="text-lg font-heading font-bold">Water Intake (This Week)</h2>
            {(() => {
              const chartData = Array.from({ length: 7 }, (_, i) => {
                const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
                const dayData = waterHistory.find((w: any) => w.date === date);
                return { day: format(subDays(new Date(), 6 - i), 'EEE'), glasses: dayData?.glasses_count || 0, goal: dayData?.daily_goal || 8, isToday: i === 6 };
              });
              const todayData = chartData[6];
              const defaultGoal = waterHistory.length > 0 ? waterHistory[0].daily_goal : 8;

              return (
                <Card className="card-elevated overflow-hidden">
                  <div className="h-1 gradient-primary" />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-sm text-muted-foreground">Today</p>
                        <p className="text-3xl font-extrabold">{todayData.glasses} <span className="text-sm font-normal text-muted-foreground">/ {todayData.goal} glasses</span></p>
                      </div>
                      <div className="icon-badge-lg bg-blue-500/10"><Droplets className="w-6 h-6 text-blue-500" /></div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', boxShadow: 'var(--shadow-lg)' }} formatter={(value: number) => [`${value} glasses`, 'Intake']} />
                        <ReferenceLine y={defaultGoal} stroke="hsl(var(--success))" strokeDasharray="4 4" label={{ value: `Goal: ${defaultGoal}`, position: 'right', fontSize: 11, fill: 'hsl(var(--success))' }} />
                        <Bar dataKey="glasses" radius={[6, 6, 0, 0]}>
                          {chartData.map((entry, index) => (<Cell key={index} fill={entry.glasses >= entry.goal ? 'hsl(var(--success))' : 'hsl(var(--primary))'} opacity={entry.isToday ? 1 : 0.7} />))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PatientManagement;
