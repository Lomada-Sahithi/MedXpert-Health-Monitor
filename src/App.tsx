import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import PatientManagement from "./pages/PatientManagement";
import PatientDashboard from "./pages/PatientDashboard";
import PatientMedications from "./pages/PatientMedications";
import PatientAppointments from "./pages/PatientAppointments";
import PatientReports from "./pages/PatientReports";
import PatientWater from "./pages/PatientWater";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  if (!profile) {
    return (
      <Routes>
        <Route path="*" element={<RoleSelectionPage />} />
      </Routes>
    );
  }

  if (profile.role === 'caregiver') {
    return (
      <Routes>
        <Route path="/caregiver" element={<CaregiverDashboard />} />
        <Route path="/caregiver/patient/:patientId" element={<PatientManagement />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/" element={<Navigate to="/caregiver" replace />} />
        <Route path="*" element={<Navigate to="/caregiver" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/patient" element={<PatientDashboard />} />
      <Route path="/patient/medications" element={<PatientMedications />} />
      <Route path="/patient/appointments" element={<PatientAppointments />} />
      <Route path="/patient/reports" element={<PatientReports />} />
      <Route path="/patient/water" element={<PatientWater />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/" element={<Navigate to="/patient" replace />} />
      <Route path="*" element={<Navigate to="/patient" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
