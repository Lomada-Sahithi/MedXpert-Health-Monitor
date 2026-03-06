import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Pill, Calendar, FileText, Droplets, Bell, Download } from 'lucide-react';
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">Medical Reports</h1>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="lab_results">Lab Results</SelectItem>
              <SelectItem value="prescription">Prescriptions</SelectItem>
              <SelectItem value="discharge_summary">Discharge</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? <p>Loading...</p> : filtered.length === 0 ? (
          <Card className="card-elevated"><CardContent className="py-12 text-center text-muted-foreground">No reports found</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(report => (
              <Card key={report.id} className="card-elevated">
                <CardContent className="p-4 flex items-start gap-3">
                  <FileText className="w-8 h-8 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{report.title}</h3>
                    {report.description && <p className="text-xs text-muted-foreground">{report.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{report.category}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(report.upload_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={report.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
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

export default PatientReports;
