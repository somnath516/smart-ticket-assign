import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketWithRelations } from '@/types/database';
import { Ticket, Users, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TicketCard } from '@/components/tickets/TicketCard';

export default function OperatorDashboard() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Realtime subscription
    const channel = supabase
      .channel('operator-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    // Fetch all tickets for demo (no auth)
    const { data: ticketsData } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:profiles!tickets_customer_id_fkey(*)
      `)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (ticketsData) {
      setTickets(ticketsData as unknown as TicketWithRelations[]);
    }

    setLoading(false);
  };

  const activeTickets = tickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status));
  const criticalTickets = activeTickets.filter(t => t.priority === 'critical');
  const resolvedToday = tickets.filter(t => {
    if (!t.resolved_at) return false;
    const today = new Date();
    const resolved = new Date(t.resolved_at);
    return resolved.toDateString() === today.toDateString();
  });

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
          <h1 className="text-2xl font-semibold">Operator Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your assigned tickets and workload overview
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTickets.length}</div>
              <p className="text-xs text-muted-foreground">In your queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-priority-critical" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-priority-critical">
                {criticalTickets.length}
              </div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{resolvedToday.length}</div>
              <p className="text-xs text-muted-foreground">Tickets closed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
              <p className="text-xs text-muted-foreground">All tickets</p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Tickets */}
        {criticalTickets.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-priority-critical" />
              <h2 className="text-lg font-medium">Critical Tickets</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {criticalTickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} linkPrefix="/operator" />
              ))}
            </div>
          </div>
        )}

        {/* Active Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Your Queue</h2>
            <Link to="/operator/queue" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          {activeTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-success/50 mb-4" />
                <h3 className="font-medium">All caught up!</h3>
                <p className="text-sm text-muted-foreground">No tickets assigned to you</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeTickets.slice(0, 6).map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} linkPrefix="/operator" />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
