import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, Heart, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

type NavItem = { label: string; path: string; icon?: React.ReactNode };

const AppLayout: React.FC<{ children: React.ReactNode; navItems: NavItem[] }> = ({ children, navItems }) => {
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-heading font-bold text-gradient-primary">MedXpert</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-accent" onClick={() => navigate('/notifications')}>
              <Bell className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-2.5 ml-1 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">{profile?.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{profile?.role}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar - desktop */}
        <aside className="hidden lg:block w-60 min-h-[calc(100vh-4rem)] p-4 sticky top-16">
          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'gradient-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm'
                  }`}
                >
                  <span className={isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed left-0 top-16 bottom-0 w-72 bg-card/95 backdrop-blur-xl border-r border-border/50 p-4 z-50 shadow-2xl">
              <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-xl bg-accent/50">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-sm">{profile?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {navItems.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'gradient-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
