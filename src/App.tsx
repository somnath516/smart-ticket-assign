import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<CustomerPortal />} />
          <Route path="/portal" element={<CustomerPortal />} />
          <Route path="/portal/new" element={<NewTicket />} />
          <Route path="/portal/ticket/:id" element={<TicketDetail />} />

          {/* Operator Routes */}
          <Route path="/operator" element={<OperatorDashboard />} />
          <Route path="/operator/queue" element={<OperatorQueue />} />
          <Route path="/operator/ticket/:id" element={<OperatorTicketDetail />} />

          {/* Manager Routes */}
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/tickets" element={<ManagerAllTickets />} />
          <Route path="/manager/ticket/:id" element={<TicketDetail />} />
          <Route path="/manager/operators" element={<ManagerOperators />} />
          <Route path="/manager/reports" element={<ManagerReports />} />
          <Route path="/manager/settings" element={<ManagerSettings />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
