import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { CategoryBadge } from '@/components/tickets/CategoryBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { TicketWithRelations, TicketComment, Profile, TicketStatus } from '@/types/database';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, Loader2, User, Clock, MessageSquare } from 'lucide-react';

export default function OperatorTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null);
  const [comments, setComments] = useState<(TicketComment & { author?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchComments();

      const channel = supabase
        .channel(`operator-ticket-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `id=eq.${id}` }, () => fetchTicket())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${id}` }, () => fetchComments())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const fetchTicket = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:profiles!tickets_customer_id_fkey(*),
        assigned_operator:profiles!tickets_assigned_operator_id_fkey(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setTicket(data as unknown as TicketWithRelations);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    if (!id) return;

    const { data } = await supabase
      .from('ticket_comments')
      .select(`*, author:profiles!ticket_comments_author_id_fkey(*)`)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data as unknown as (TicketComment & { author?: Profile })[]);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;

    setUpdatingStatus(true);

    const updates: Partial<TicketWithRelations> = { status: newStatus };
    
    if (newStatus === 'in_progress' && !ticket.first_response_at) {
      updates.first_response_at = new Date().toISOString();
    }
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    if (newStatus === 'closed') {
      updates.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticket.id);

    setUpdatingStatus(false);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      toast({ title: 'Status updated', description: `Ticket is now ${newStatus.replace('_', ' ')}` });
      fetchTicket();
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-medium">Ticket not found</h2>
          <Link to="/operator">
            <Button className="mt-4">Go back</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/operator">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground font-mono">#{ticket.ticket_number}</span>
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
                <CategoryBadge category={ticket.category} />
              </div>
              <h1 className="text-2xl font-semibold">{ticket.title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              By: {ticket.customer?.full_name ?? 'Customer'}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(comment.author?.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.author?.full_name ?? 'User'}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
                            {comment.is_internal && (
                              <span className="text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded">Internal</span>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => handleStatusChange(v as TicketStatus)}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer</span>
                  <p className="mt-1">{ticket.customer?.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{ticket.customer?.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="mt-1">{format(new Date(ticket.created_at), 'PPp')}</p>
                </div>
                {ticket.first_response_at && (
                  <div>
                    <span className="text-muted-foreground">First Response</span>
                    <p className="mt-1">{format(new Date(ticket.first_response_at), 'PPp')}</p>
                  </div>
                )}
                {ticket.resolved_at && (
                  <div>
                    <span className="text-muted-foreground">Resolved</span>
                    <p className="mt-1">{format(new Date(ticket.resolved_at), 'PPp')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
