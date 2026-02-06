import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Ticket,
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  const navItems = [
    // Customer links
    { href: '/portal', label: 'My Tickets', icon: Ticket },
    { href: '/portal/new', label: 'Submit Ticket', icon: HelpCircle },
    // Operator links
    { href: '/operator', label: 'Operator Dashboard', icon: LayoutDashboard },
    { href: '/operator/queue', label: 'Ticket Queue', icon: Ticket },
    // Manager links
    { href: '/manager', label: 'Manager Dashboard', icon: LayoutDashboard },
    { href: '/manager/tickets', label: 'All Tickets', icon: Ticket },
    { href: '/manager/operators', label: 'Operators', icon: Users },
    { href: '/manager/reports', label: 'SLA Reports', icon: BarChart3 },
    { href: '/manager/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Ticket className="h-5 w-5 text-primary" />
              <span>SupportDesk</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'gap-2',
                        isActive && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-card px-4 py-2 overflow-x-auto">
        <div className="flex gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}
