import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, Home, Pill, Calendar, FileText, Droplets, Users, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Notification = {
  id: string; title: string; message: string; type: string | null;
  read: boolean | null; created_at: string;
};

const typeIcons: Record<string, React.ReactNode> = {
  medication: <Pill className="w-4 h-4 text-primary" />,
  appointment: <Calendar className="w-4 h-4 text-primary" />,
  emergency: <AlertTriangle className="w-4 h-4 text-emergency" />,
  caregiver: <Users className="w-4 h-4 text-success" />,
  general: <Bell className="w-4 h-4 text-muted-foreground" />,
};

const NotificationsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const navItems = profile?.role === 'caregiver'
    ? [
        { label: 'Dashboard', path: '/caregiver', icon: <Users className="w-4 h-4" /> },
        { label: 'Notifications', path: '/notifications', icon: <Bell className="w-4 h-4" /> },
      ]
    : [
        { label: 'Home', path: '/patient', icon: <Home className="w-4 h-4" /> },
        { label: 'Medications', path: '/patient/medications', icon: <Pill className="w-4 h-4" /> },
        { label: 'Appointments', path: '/patient/appointments', icon: <Calendar className="w-4 h-4" /> },
        { label: 'Reports', path: '/patient/reports', icon: <FileText className="w-4 h-4" /> },
        { label: 'Water', path: '/patient/water', icon: <Droplets className="w-4 h-4" /> },
        { label: 'Notifications', path: '/notifications', icon: <Bell className="w-4 h-4" /> },
      ];

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    toast.success('All notifications marked as read');
    fetchNotifications();
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    fetchNotifications();
  };

  return (
    <AppLayout navItems={navItems}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">Notifications</h1>
          {notifications.some(n => !n.read) && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="w-4 h-4 mr-1" /> Mark All Read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="card-elevated animate-pulse"><CardContent className="p-4 h-16" /></Card>)}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Card key={n.id} className={`card-elevated cursor-pointer transition-colors ${!n.read ? 'border-primary/30 bg-primary/5' : ''}`} onClick={() => !n.read && markRead(n.id)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="mt-1">{typeIcons[n.type || 'general']}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{n.title}</p>
                      {!n.read && <Badge className="text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
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

export default NotificationsPage;
