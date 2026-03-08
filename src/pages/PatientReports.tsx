import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Pill, Calendar, FileText, Droplets, Bell, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const patientNavItems = [
  { label: 'Home', path: '/patient', icon: <Home className="w-4 h-4" /> },
  { label: 'Medications', path: '/patient/medications', icon: <Pill className="w-4 h-4" /> },
  { label: 'Appointments', path: '/patient/appointments', icon: <Calendar className="w-4 h-4" /> },
  { label: 'Reports', path: '/patient/reports', icon: <FileText className="w-4 h-4" /> },
  { label: 'Water', path: '/patient/water', icon: <Droplets className="w-4 h-4" /> },
  { label: 'Notifications', path: '/notifications', icon: <Bell className="w-4 h-4" /> },
];

const categoryColors: Record<string, string> = {
  lab_results: 'bg-primary/10 text-primary',
  prescription: 'bg-success/10 text-success',
  discharge_summary: 'bg-warning/10 text-warning',
  other: 'bg-muted text-muted-foreground',
};

const PatientReports: React.FC = () => {
  const { patientRecord } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientRecord) return;
    supabase.from('medical_reports').select('*').eq('patient_id', patientRecord.id).order('upload_date', { ascending: false })
      .then(({ data }) => { setReports(data || []); setLoading(false); });
  }, [patientRecord]);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.category === filter);

  return (
    <AppLayout navItems={patientNavItems}>
      <div className="space-y-6 animate-fade-in">
        <div className="section-header">
          <div>
            <h1 className="text-2xl font-heading font-extrabold">Medical Reports</h1>
            <p className="text-sm text-muted-foreground">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="lab_results">Lab Results</SelectItem>
              <SelectItem value="prescription">Prescriptions</SelectItem>
              <SelectItem value="discharge_summary">Discharge</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[1,2,3,4].map(i => <Card key={i} className="card-elevated"><CardContent className="p-5 h-24 shimmer" /></Card>)}</div>
        ) : filtered.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="py-16 text-center">
              <div className="icon-badge-lg bg-muted mx-auto mb-4"><FileText className="w-6 h-6 text-muted-foreground" /></div>
              <h3 className="font-heading font-bold text-lg">No Reports</h3>
              <p className="text-muted-foreground text-sm mt-1">No medical reports found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(report => (
              <Card key={report.id} className="card-elevated overflow-hidden group">
                <CardContent className="p-0">
                  <div className="h-1 gradient-primary" />
                  <div className="p-4 flex items-start gap-3">
                    <div className="icon-badge bg-primary/10 mt-0.5">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-sm truncate">{report.title}</h3>
                      {report.description && <p className="text-xs text-muted-foreground truncate">{report.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className={`text-xs ${categoryColors[report.category] || categoryColors.other}`}>{report.category}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(report.upload_date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={async () => {
                        const filePath = report.file_url.replace('medical-reports/', '');
                        const { data } = await supabase.storage.from('medical-reports').createSignedUrl(filePath, 3600);
                        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                        else toast.error('Could not generate view link');
                      }}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={async () => {
                        const filePath = report.file_url.replace('medical-reports/', '');
                        const { data } = await supabase.storage.from('medical-reports').createSignedUrl(filePath, 3600, { download: true });
                        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                        else toast.error('Could not generate download link');
                      }}><Download className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PatientReports;
