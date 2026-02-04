import { cn } from '@/lib/utils';
import { TicketPriority } from '@/types/database';

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'bg-priority-critical/10 text-priority-critical border-priority-critical/20',
  },
  high: {
    label: 'High',
    className: 'bg-priority-high/10 text-priority-high border-priority-high/20',
  },
  medium: {
    label: 'Medium',
    className: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
  },
  low: {
    label: 'Low',
    className: 'bg-priority-low/10 text-priority-low border-priority-low/20',
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  
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
