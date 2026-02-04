import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { TicketCard } from '@/components/tickets/TicketCard';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketWithRelations, TicketStatus, TicketPriority, TicketCategory } from '@/types/database';
import { Search, Loader2, Inbox } from 'lucide-react';

export default function ManagerAllTickets() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'all'>('active');

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('manager-all-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchTickets())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:profiles!tickets_customer_id_fkey(*),
        assigned_operator:profiles!tickets_assigned_operator_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setTickets(data as unknown as TicketWithRelations[]);
    }
    setLoading(false);
  };

  const activeStatuses: TicketStatus[] = ['open', 'in_progress', 'pending'];
  const resolvedStatuses: TicketStatus[] = ['resolved', 'closed'];

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchQuery === '' || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_number.toString().includes(searchQuery);
    
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    let matchesTab = true;
    if (activeTab === 'active') {
      matchesTab = activeStatuses.includes(ticket.status);
    } else if (activeTab === 'resolved') {
      matchesTab = resolvedStatuses.includes(ticket.status);
    }
    
    return matchesSearch && matchesPriority && matchesCategory && matchesTab;
  });

  const activeCount = tickets.filter(t => activeStatuses.includes(t.status)).length;
  const resolvedCount = tickets.filter(t => resolvedStatuses.includes(t.status)).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">All Tickets</h1>
          <p className="text-sm text-muted-foreground">View and manage all support tickets</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TicketPriority | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as TicketCategory | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="network">Network</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="database">Database</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'resolved' | 'all')}>
          <TabsList>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedCount})</TabsTrigger>
            <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          </TabsList>

          {['active', 'resolved', 'all'].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium">No tickets found</h3>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTickets.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} linkPrefix="/manager" />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
