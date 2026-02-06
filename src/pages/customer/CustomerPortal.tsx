import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { TicketCard } from '@/components/tickets/TicketCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketWithRelations, TicketStatus } from '@/types/database';
import { Link } from 'react-router-dom';
import { Plus, Search, Loader2, Inbox, Sparkles, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function CustomerPortal() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

  useEffect(() => {
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
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data as TicketWithRelations[]);
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
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 text-primary-foreground shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Welcome back</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
              <p className="text-primary-foreground/80 max-w-md">
                Track your support requests, get updates, and communicate with our team in real-time.
              </p>
            </div>
            <Link to="/portal/new">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-lg gap-2 font-semibold"
              >
                <Plus className="h-5 w-5" />
                New Ticket
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="relative z-10 mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 opacity-70" />
                <span className="text-sm font-medium opacity-80">Active</span>
              </div>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 opacity-70" />
                <span className="text-sm font-medium opacity-80">Resolved</span>
              </div>
              <p className="text-2xl font-bold">{resolvedCount}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by title, description, or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 text-base bg-card border-border/50 shadow-sm focus-visible:ring-primary/20"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'resolved')}>
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="active" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
              <Clock className="h-4 w-4" />
              Active
              <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                {activeCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="resolved" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Resolved
              <span className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                {resolvedCount}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Loading your tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted/50 rounded-full p-6 mb-4">
                  <Inbox className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-lg">No active tickets</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  {searchQuery ? 'No tickets match your search criteria' : 'Need help? Submit a new ticket and our team will assist you.'}
                </p>
                {!searchQuery && (
                  <Link to="/portal/new" className="mt-4">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create your first ticket
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTickets.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} linkPrefix="/portal" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Loading your tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted/50 rounded-full p-6 mb-4">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-lg">No resolved tickets</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  {searchQuery ? 'No tickets match your search criteria' : 'Your resolved and closed tickets will appear here.'}
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