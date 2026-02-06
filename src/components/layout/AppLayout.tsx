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
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

const customerNav = [
  { href: '/portal', label: 'My Tickets', icon: Ticket },
  { href: '/portal/new', label: 'Submit Ticket', icon: HelpCircle },
];

const operatorNav = [
  { href: '/operator', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/operator/queue', label: 'Queue', icon: Ticket },
];

const managerNav = [
  { href: '/manager', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/manager/tickets', label: 'All Tickets', icon: Ticket },
  { href: '/manager/operators', label: 'Operators', icon: Users },
  { href: '/manager/reports', label: 'Reports', icon: BarChart3 },
  { href: '/manager/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  
  const isOperator = location.pathname.startsWith('/operator');
  const isManager = location.pathname.startsWith('/manager');
  
  const activeNav = isManager ? managerNav : isOperator ? operatorNav : customerNav;
  const roleLabel = isManager ? 'Manager' : isOperator ? 'Operator' : 'Customer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-lg">
                  <Ticket className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight">SupportDesk</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {roleLabel} Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
              <Link to="/portal">
                <Button
                  variant={!isOperator && !isManager ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs font-medium',
                    !isOperator && !isManager && 'shadow-sm'
                  )}
                >
                  Customer
                </Button>
              </Link>
              <Link to="/operator">
                <Button
                  variant={isOperator ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs font-medium',
                    isOperator && 'shadow-sm'
                  )}
                >
                  Operator
                </Button>
              </Link>
              <Link to="/manager">
                <Button
                  variant={isManager ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs font-medium',
                    isManager && 'shadow-sm'
                  )}
                >
                  Manager
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="sticky top-16 z-40 border-b bg-card/60 backdrop-blur-lg">
        <div className="container">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {activeNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && item.href !== '/portal' && location.pathname.startsWith(item.href));
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-2 h-9 px-4 font-medium transition-all whitespace-nowrap',
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Role Switcher */}
      <div className="sm:hidden border-b bg-card/40 backdrop-blur px-4 py-2">
        <div className="flex items-center gap-1 justify-center">
          <Link to="/portal">
            <Button
              variant={!isOperator && !isManager ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
            >
              Customer
            </Button>
          </Link>
          <Link to="/operator">
            <Button
              variant={isOperator ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
            >
              Operator
            </Button>
          </Link>
          <Link to="/manager">
            <Button
              variant={isManager ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
            >
              Manager
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/40 backdrop-blur py-6 mt-auto">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>SupportDesk Pro</span>
          </div>
          <span>© 2026 All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}