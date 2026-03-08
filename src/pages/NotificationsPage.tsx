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

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  medication: { icon: <Pill className="w-4 h-4" />, color: 'bg-primary/10 text-primary' },
  medication_taken: { icon: <Check className="w-4 h-4" />, color: 'bg-success/10 text-success' },
  appointment: { icon: <Calendar className="w-4 h-4" />, color: 'bg-accent text-accent-foreground' },
  emergency: { icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-emergency/10 text-emergency' },
  caregiver: { icon: <Users className="w-4 h-4" />, color: 'bg-success/10 text-success' },
  general: { icon: <Bell className="w-4 h-4" />, color: 'bg-muted text-muted-foreground' },
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
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    toast.success('All marked as read');
    fetchNotifications();
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppLayout navItems={navItems}>
      <div className="space-y-6 animate-fade-in">
        <div className="section-header">
          <div>
            <h1 className="text-2xl font-heading font-extrabold">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="rounded-xl">
              <CheckCheck className="w-4 h-4 mr-1" /> Mark All Read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="card-elevated"><CardContent className="p-4 h-16 shimmer" /></Card>)}</div>
        ) : notifications.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-heading font-bold text-lg">All Caught Up</h3>
              <p className="text-muted-foreground text-sm mt-1">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const config = typeConfig[n.type || 'general'] || typeConfig.general;
              return (
                <Card
                  key={n.id}
                  className={`card-elevated overflow-hidden cursor-pointer transition-all ${!n.read ? 'border-primary/20' : ''}`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <CardContent className="p-0">
                    {!n.read && <div className="h-0.5 gradient-primary" />}
                    <div className="p-4 flex items-start gap-3">
                      <div className={`icon-badge ${config.color} mt-0.5`}>{config.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-heading font-semibold text-sm">{n.title}</p>
                          {!n.read && <Badge className="gradient-primary text-primary-foreground border-0 text-[10px] px-1.5">New</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
