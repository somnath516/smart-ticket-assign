import { cn } from '@/lib/utils';
import { TicketStatus } from '@/types/database';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'bg-status-open/10 text-status-open border-status-open/20',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-status-pending/10 text-status-pending border-status-pending/20',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-status-resolved/10 text-status-resolved border-status-resolved/20',
  },
  closed: {
    label: 'Closed',
    className: 'bg-status-closed/10 text-status-closed border-status-closed/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
