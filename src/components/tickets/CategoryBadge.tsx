import { cn } from '@/lib/utils';
import { TicketCategory } from '@/types/database';
import { Network, Monitor, HardDrive, Database } from 'lucide-react';

interface CategoryBadgeProps {
  category: TicketCategory;
  className?: string;
}

const categoryConfig: Record<TicketCategory, { label: string; icon: typeof Network }> = {
  network: { label: 'Network', icon: Network },
  software: { label: 'Software', icon: Monitor },
  hardware: { label: 'Hardware', icon: HardDrive },
  database: { label: 'Database', icon: Database },
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
