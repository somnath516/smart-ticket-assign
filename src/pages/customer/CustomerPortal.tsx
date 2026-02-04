import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { TicketCard } from '@/components/tickets/TicketCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, TicketWithRelations, TicketStatus } from '@/types/database';
import { Link } from 'react-router-dom';
import { Plus, Search, Loader2, Inbox } from 'lucide-react';

export default function CustomerPortal() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

  useEffect(() => {
    if (user) {
      fetchTickets();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('customer-tickets')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
            filter: `customer_id=eq.${user.id}`,
          },
          () => {
            fetchTickets();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        assigned_operator:profiles!tickets_assigned_operator_id_fkey(*)
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data as unknown as TicketWithRelations[]);
    }
    setLoading(false);
  };

  const activeStatuses: TicketStatus[] = ['open', 'in_progress', 'pending'];
  const resolvedStatuses: TicketStatus[] = ['resolved', 'closed'];

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchQuery === '' || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_number.toString().includes(searchQuery);
    
    const matchesTab = activeTab === 'active' 
      ? activeStatuses.includes(ticket.status)
      : resolvedStatuses.includes(ticket.status);
    
    return matchesSearch && matchesTab;
  });

  const activeCount = tickets.filter(t => activeStatuses.includes(t.status)).length;
  const resolvedCount = tickets.filter(t => resolvedStatuses.includes(t.status)).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">My Tickets</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage your support requests
            </p>
          </div>
          <Link to="/portal/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'resolved')}>
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No active tickets</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? 'No tickets match your search' : 'Submit a new ticket to get started'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTickets.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} linkPrefix="/portal" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No resolved tickets</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? 'No tickets match your search' : 'Resolved tickets will appear here'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTickets.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} linkPrefix="/portal" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
