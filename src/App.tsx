import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Customer Pages
import CustomerPortal from "./pages/customer/CustomerPortal";
import NewTicket from "./pages/customer/NewTicket";
import TicketDetail from "./pages/customer/TicketDetail";

// Operator Pages
import OperatorDashboard from "./pages/operator/OperatorDashboard";
import OperatorQueue from "./pages/operator/OperatorQueue";
import OperatorTicketDetail from "./pages/operator/OperatorTicketDetail";

// Manager Pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerAllTickets from "./pages/manager/ManagerAllTickets";
import ManagerOperators from "./pages/manager/ManagerOperators";
import ManagerReports from "./pages/manager/ManagerReports";
import ManagerSettings from "./pages/manager/ManagerSettings";

const queryClient = new QueryClient();

// Protected Route component
function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />

      {/* Customer Routes */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/new"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <NewTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/ticket/:id"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <TicketDetail />
          </ProtectedRoute>
        }
      />

      {/* Operator Routes */}
      <Route
        path="/operator"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/queue"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/ticket/:id"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorTicketDetail />
          </ProtectedRoute>
        }
      />

      {/* Manager Routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/tickets"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerAllTickets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/ticket/:id"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <TicketDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/operators"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerOperators />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/settings"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerSettings />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

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
