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
import { TicketWithRelations, TicketComment, Profile } from '@/types/database';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, Loader2, User, Clock, MessageSquare } from 'lucide-react';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null);
  const [comments, setComments] = useState<(TicketComment & { author?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchComments();

      // Realtime subscription
      const channel = supabase
        .channel(`ticket-${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
            filter: `id=eq.${id}`,
          },
          () => fetchTicket()
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ticket_comments',
            filter: `ticket_id=eq.${id}`,
          },
          () => fetchComments()
        )
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

    const { data, error } = await supabase
      .from('ticket_comments')
      .select(`
        *,
        author:profiles!ticket_comments_author_id_fkey(*)
      `)
      .eq('ticket_id', id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data as unknown as (TicketComment & { author?: Profile })[]);
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
          <p className="text-muted-foreground mt-2">
            This ticket may not exist or you don't have access to it.
          </p>
          <Link to="/portal">
            <Button className="mt-4">Go back</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link to="/portal">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        {/* Ticket Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground font-mono">
                  #{ticket.ticket_number}
                </span>
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
              Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </span>
            {ticket.assigned_operator && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Assigned to {ticket.assigned_operator.full_name}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(comment.author?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {comment.author?.full_name ?? 'User'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                            </span>
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
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <div className="mt-1">
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority</span>
                  <div className="mt-1">
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <div className="mt-1">
                    <CategoryBadge category={ticket.category} />
                  </div>
                </div>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="mt-1">{format(new Date(ticket.created_at), 'PPp')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated</span>
                  <p className="mt-1">{format(new Date(ticket.updated_at), 'PPp')}</p>
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
