import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, TicketWithRelations, Profile, SlaConfig, TicketStatus, TicketPriority } from '@/types/database';
import { Ticket as TicketIcon, Users, Clock, CheckCircle2, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TicketCard } from '@/components/tickets/TicketCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ManagerDashboard() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [operators, setOperators] = useState<Profile[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('manager-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    // Fetch all tickets
    const { data: ticketsData } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:profiles!tickets_customer_id_fkey(*),
        assigned_operator:profiles!tickets_assigned_operator_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (ticketsData) {
      setTickets(ticketsData as unknown as TicketWithRelations[]);
    }

    // Fetch operators (users with operator role)
    const { data: operatorRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'operator');

    if (operatorRoles) {
      const operatorIds = operatorRoles.map(r => r.user_id);
      const { data: operatorsData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', operatorIds);
      
      if (operatorsData) {
        setOperators(operatorsData as Profile[]);
      }
    }

    // Fetch SLA configs
    const { data: slaData } = await supabase
      .from('sla_configs')
      .select('*');

    if (slaData) {
      setSlaConfigs(slaData as SlaConfig[]);
    }

    setLoading(false);
  };

  const activeTickets = tickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status));
  const criticalTickets = activeTickets.filter(t => t.priority === 'critical');
  const unassignedTickets = activeTickets.filter(t => !t.assigned_operator_id);

  // Stats for charts
  const statusData = [
    { name: 'Open', value: tickets.filter(t => t.status === 'open').length, color: 'hsl(var(--status-open))' },
    { name: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, color: 'hsl(var(--status-in-progress))' },
    { name: 'Pending', value: tickets.filter(t => t.status === 'pending').length, color: 'hsl(var(--status-pending))' },
    { name: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: 'hsl(var(--status-resolved))' },
    { name: 'Closed', value: tickets.filter(t => t.status === 'closed').length, color: 'hsl(var(--status-closed))' },
  ];

  const priorityData = [
    { name: 'Critical', count: tickets.filter(t => t.priority === 'critical').length },
    { name: 'High', count: tickets.filter(t => t.priority === 'high').length },
    { name: 'Medium', count: tickets.filter(t => t.priority === 'medium').length },
    { name: 'Low', count: tickets.filter(t => t.priority === 'low').length },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of support operations</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Active</CardTitle>
              <TicketIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTickets.length}</div>
              <p className="text-xs text-muted-foreground">tickets open</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-priority-critical" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-priority-critical">{criticalTickets.length}</div>
              <p className="text-xs text-muted-foreground">need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{unassignedTickets.length}</div>
              <p className="text-xs text-muted-foreground">awaiting assignment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Operators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{operators.length}</div>
              <p className="text-xs text-muted-foreground">available</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tickets by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData.filter(d => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tickets by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical/Unassigned Tickets */}
        {(criticalTickets.length > 0 || unassignedTickets.length > 0) && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Attention Required
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...criticalTickets, ...unassignedTickets.filter(t => t.priority !== 'critical')]
                .slice(0, 6)
                .map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} linkPrefix="/manager" />
                ))}
            </div>
            <Link to="/manager/tickets" className="text-sm text-primary hover:underline">
              View all tickets →
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
