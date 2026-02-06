import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { TicketWithRelations } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { Clock, User, ArrowUpRight } from 'lucide-react';

interface TicketCardProps {
  ticket: TicketWithRelations;
  linkPrefix?: string;
}

export function TicketCard({ ticket, linkPrefix = '/portal' }: TicketCardProps) {
  return (
    <Link to={`${linkPrefix}/ticket/${ticket.id}`}>
      <Card className="group relative overflow-hidden bg-card hover:bg-accent/30 border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer">
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Priority indicator bar */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
            ticket.priority === 'critical' ? 'bg-priority-critical' :
            ticket.priority === 'high' ? 'bg-priority-high' :
            ticket.priority === 'medium' ? 'bg-priority-medium' :
            'bg-priority-low'
          }`}
        />
        
        <CardHeader className="pb-2 pl-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                  #{ticket.ticket_number}
                </span>
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
              <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {ticket.title}
              </h3>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 pl-5">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {ticket.description}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <CategoryBadge category={ticket.category} />
              {ticket.assigned_operator && (
                <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <User className="h-3 w-3" />
                  {ticket.assigned_operator.full_name ?? 'Assigned'}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}