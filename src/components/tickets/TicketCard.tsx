import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { TicketWithRelations } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { Clock, User } from 'lucide-react';

interface TicketCardProps {
  ticket: TicketWithRelations;
  linkPrefix?: string;
}

export function TicketCard({ ticket, linkPrefix = '/portal' }: TicketCardProps) {
  return (
    <Link to={`${linkPrefix}/ticket/${ticket.id}`}>
      <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground font-mono">
                  #{ticket.ticket_number}
                </span>
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
              <h3 className="font-medium text-sm leading-tight line-clamp-2">
                {ticket.title}
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {ticket.description}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <CategoryBadge category={ticket.category} />
              {ticket.assigned_operator && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {ticket.assigned_operator.full_name ?? 'Assigned'}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
