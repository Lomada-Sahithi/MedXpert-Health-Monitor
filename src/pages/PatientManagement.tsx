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
import { ArrowLeft, Pill, Calendar, FileText, Bell, Plus, Trash2, Edit, Users, AlertTriangle, Download, Eye, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const caregiverNavItems = [
  { label: 'Dashboard', path: '/caregiver', icon: <Users className="w-4 h-4" /> },
  { label: 'Notifications', path: '/notifications', icon: <AlertTriangle className="w-4 h-4" /> },
];

type Medication = {
  id: string; name: string; dosage: string; frequency: string;
  times_array: string[]; start_date: string; end_date: string | null;
  instructions: string | null; active: boolean | null;
};

type Appointment = {
  id: string; title: string; date: string; time: string;
  location: string | null; doctor: string | null; notes: string | null;
};

type Report = {
  id: string; title: string; description: string | null;
  file_url: string; file_type: string | null; upload_date: string;
  category: string | null;
};

const PatientManagement: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [waterHistory, setWaterHistory] = useState<any[]>([]);

  // Medication form
  const [medDialog, setMedDialog] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('daily');
  const [medTimes, setMedTimes] = useState(['08:00']);
  const [medStartDate, setMedStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [medEndDate, setMedEndDate] = useState('');
  const [medInstructions, setMedInstructions] = useState('');
  const [medSaving, setMedSaving] = useState(false);

  // Appointment form
  const [apptDialog, setApptDialog] = useState(false);
  const [apptTitle, setApptTitle] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptLocation, setApptLocation] = useState('');
  const [apptDoctor, setApptDoctor] = useState('');
  const [apptNotes, setApptNotes] = useState('');
  const [apptSaving, setApptSaving] = useState(false);

  // Notification form
  const [notifDialog, setNotifDialog] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [patientId]);

  const fetchAll = async () => {
    if (!patientId) return;
    const [patientRes, medsRes, apptsRes, reportsRes, waterRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', patientId).single(),
      supabase.from('medications').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
      supabase.from('appointments').select('*').eq('patient_id', patientId).order('date', { ascending: true }),
      supabase.from('medical_reports').select('*').eq('patient_id', patientId).order('upload_date', { ascending: false }),
      supabase.from('water_intake').select('*').eq('patient_id', patientId)
        .gte('date', format(subDays(new Date(), 6), 'yyyy-MM-dd'))
        .order('date', { ascending: true }),
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
      patient_id: patientId,
      name: medName,
      dosage: medDosage,
      frequency: medFrequency,
      times_array: medTimes,
      start_date: medStartDate,
      end_date: medEndDate || null,
      instructions: medInstructions || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Medication added');
      setMedDialog(false);
      resetMedForm();
      fetchAll();
      // Send notification to patient
      if (patient?.user_id) {
        await supabase.from('notifications').insert({
          user_id: patient.user_id,
          title: 'New Medication Added',
          message: `${medName} ${medDosage} has been added to your medications.`,
          type: 'medication',
        });
      }
    }
    setMedSaving(false);
  };

  const resetMedForm = () => {
    setMedName(''); setMedDosage(''); setMedFrequency('daily');
    setMedTimes(['08:00']); setMedStartDate(format(new Date(), 'yyyy-MM-dd'));
    setMedEndDate(''); setMedInstructions('');
  };

  const deleteMedication = async (id: string) => {
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Medication deleted'); fetchAll(); }
  };

  const addAppointment = async () => {
    if (!apptTitle || !apptDate || !apptTime || !patientId) return;
    setApptSaving(true);
    const { error } = await supabase.from('appointments').insert({
      patient_id: patientId,
      title: apptTitle, date: apptDate, time: apptTime,
      location: apptLocation || null, doctor: apptDoctor || null, notes: apptNotes || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Appointment added');
      setApptDialog(false);
      setApptTitle(''); setApptDate(''); setApptTime('');
      setApptLocation(''); setApptDoctor(''); setApptNotes('');
      fetchAll();
      if (patient?.user_id) {
        await supabase.from('notifications').insert({
          user_id: patient.user_id,
          title: 'New Appointment',
          message: `${apptTitle} on ${apptDate} at ${apptTime}`,
          type: 'appointment',
        });
      }
    }
    setApptSaving(false);
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Appointment deleted'); fetchAll(); }
  };

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientId || !patient?.user_id) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${patient.user_id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('medical-reports').upload(filePath, file);
    if (uploadError) { toast.error('Upload failed: ' + uploadError.message); return; }

    // Store the file path (not public URL) since bucket is private - use signed URLs for access
    const { error } = await supabase.from('medical_reports').insert({
      patient_id: patientId,
      title: file.name,
      file_url: `medical-reports/${filePath}`,
      file_type: fileExt || 'unknown',
      category: 'other',
    });
    if (error) toast.error(error.message);
    else { toast.success('Report uploaded'); fetchAll(); }
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from('medical_reports').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Report deleted'); fetchAll(); }
  };

  const sendNotification = async () => {
    if (!notifTitle || !notifMessage || !patient?.user_id) return;
    setNotifSaving(true);
    const { error } = await supabase.from('notifications').insert({
      user_id: patient.user_id,
      title: notifTitle,
      message: notifMessage,
      type: 'caregiver',
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Notification sent');
      setNotifDialog(false);
      setNotifTitle(''); setNotifMessage('');
    }
    setNotifSaving(false);
  };

  const addTimeSlot = () => setMedTimes([...medTimes, '12:00']);
  const removeTimeSlot = (idx: number) => setMedTimes(medTimes.filter((_, i) => i !== idx));
  const updateTimeSlot = (idx: number, val: string) => {
    const newTimes = [...medTimes];
    newTimes[idx] = val;
    setMedTimes(newTimes);
  };

  if (!patient) return <AppLayout navItems={caregiverNavItems}><div className="text-center py-12">Loading...</div></AppLayout>;

  return (
    <AppLayout navItems={caregiverNavItems}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/caregiver')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold">{patient.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{patient.patient_id_unique} • {patient.age ? `${patient.age} years old` : ''}</p>
          </div>
        </div>

        <Tabs defaultValue="medications" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="medications" className="text-xs sm:text-sm"><Pill className="w-4 h-4 mr-1 hidden sm:inline" />Meds</TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs sm:text-sm"><Calendar className="w-4 h-4 mr-1 hidden sm:inline" />Appts</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm"><FileText className="w-4 h-4 mr-1 hidden sm:inline" />Reports</TabsTrigger>
            <TabsTrigger value="notify" className="text-xs sm:text-sm"><Bell className="w-4 h-4 mr-1 hidden sm:inline" />Notify</TabsTrigger>
          </TabsList>

          {/* MEDICATIONS TAB */}
          <TabsContent value="medications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-heading font-semibold">Medications</h2>
              <Dialog open={medDialog} onOpenChange={setMedDialog}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="font-heading">Add Medication</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Medication Name</Label>
                        <Input value={medName} onChange={e => setMedName(e.target.value)} placeholder="e.g., Lisinopril" />
                      </div>
                      <div className="space-y-2">
                        <Label>Dosage</Label>
                        <Input value={medDosage} onChange={e => setMedDosage(e.target.value)} placeholder="e.g., 10mg" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={medFrequency} onValueChange={setMedFrequency}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="twice_daily">Twice Daily</SelectItem>
                          <SelectItem value="three_times">Three Times Daily</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Times</Label>
                      {medTimes.map((t, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <Input type="time" value={t} onChange={e => updateTimeSlot(i, e.target.value)} />
                          {medTimes.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeTimeSlot(i)}><Trash2 className="w-4 h-4" /></Button>}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addTimeSlot}><Plus className="w-3 h-3 mr-1" />Add Time</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={medStartDate} onChange={e => setMedStartDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date (optional)</Label>
                        <Input type="date" value={medEndDate} onChange={e => setMedEndDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Instructions</Label>
                      <Textarea value={medInstructions} onChange={e => setMedInstructions(e.target.value)} placeholder="Take with food..." />
                    </div>
                    <Button onClick={addMedication} disabled={medSaving || !medName || !medDosage} className="w-full">
                      {medSaving ? 'Saving...' : 'Add Medication'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {medications.length === 0 ? (
              <Card className="card-elevated"><CardContent className="py-8 text-center text-muted-foreground">No medications added yet</CardContent></Card>
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
                        <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency} • {med.times_array?.join(', ')}</p>
                        {med.instructions && <p className="text-xs text-muted-foreground mt-1">{med.instructions}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteMedication(med.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* APPOINTMENTS TAB */}
          <TabsContent value="appointments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-heading font-semibold">Appointments</h2>
              <Dialog open={apptDialog} onOpenChange={setApptDialog}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-heading">Add Appointment</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={apptTitle} onChange={e => setApptTitle(e.target.value)} placeholder="e.g., Cardiology Follow-up" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>Date</Label><Input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Time</Label><Input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)} /></div>
                    </div>
                    <div className="space-y-2"><Label>Location</Label><Input value={apptLocation} onChange={e => setApptLocation(e.target.value)} placeholder="Hospital, clinic..." /></div>
                    <div className="space-y-2"><Label>Doctor</Label><Input value={apptDoctor} onChange={e => setApptDoctor(e.target.value)} placeholder="Dr. Smith" /></div>
                    <div className="space-y-2"><Label>Notes</Label><Textarea value={apptNotes} onChange={e => setApptNotes(e.target.value)} placeholder="Additional notes..." /></div>
                    <Button onClick={addAppointment} disabled={apptSaving || !apptTitle || !apptDate || !apptTime} className="w-full">
                      {apptSaving ? 'Saving...' : 'Add Appointment'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {appointments.length === 0 ? (
              <Card className="card-elevated"><CardContent className="py-8 text-center text-muted-foreground">No appointments scheduled</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {appointments.map(appt => (
                  <Card key={appt.id} className="card-elevated">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{appt.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appt.date), 'MMM d, yyyy')} at {appt.time}
                          {appt.doctor && ` • ${appt.doctor}`}
                        </p>
                        {appt.location && <p className="text-xs text-muted-foreground">{appt.location}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteAppointment(appt.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-heading font-semibold">Medical Reports</h2>
              <label>
                <Button size="sm" asChild><span><Plus className="w-4 h-4 mr-1" />Upload</span></Button>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleReportUpload} />
              </label>
            </div>
            {reports.length === 0 ? (
              <Card className="card-elevated"><CardContent className="py-8 text-center text-muted-foreground">No reports uploaded</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reports.map(report => (
                  <Card key={report.id} className="card-elevated">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-primary" />
                          <div>
                            <h3 className="font-semibold text-sm">{report.title}</h3>
                            <p className="text-xs text-muted-foreground">{format(new Date(report.upload_date), 'MMM d, yyyy')}</p>
                            <Badge variant="secondary" className="text-xs mt-1">{report.category}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={async () => {
                            const filePath = report.file_url.replace('medical-reports/', '');
                            const { data } = await supabase.storage.from('medical-reports').createSignedUrl(filePath, 3600);
                            if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                            else toast.error('Could not generate view link');
                          }}><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={async () => {
                            const filePath = report.file_url.replace('medical-reports/', '');
                            const { data } = await supabase.storage.from('medical-reports').createSignedUrl(filePath, 3600, { download: true });
                            if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                            else toast.error('Could not generate download link');
                          }}><Download className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteReport(report.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* NOTIFY TAB */}
          <TabsContent value="notify" className="space-y-4">
            <h2 className="text-lg font-heading font-semibold">Send Notification</h2>
            <Card className="card-elevated">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Message title" /></div>
                <div className="space-y-2"><Label>Message</Label><Textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Write your message..." /></div>
                <Button onClick={sendNotification} disabled={notifSaving || !notifTitle || !notifMessage}>
                  {notifSaving ? 'Sending...' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PatientManagement;
