import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Ticket, SlaConfig, TicketPriority } from '@/types/database';
import { Loader2, BarChart3, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { differenceInHours } from 'date-fns';

export default function ManagerReports() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [ticketsRes, slaRes] = await Promise.all([
      supabase.from('tickets').select('*'),
      supabase.from('sla_configs').select('*'),
    ]);

    if (ticketsRes.data) setTickets(ticketsRes.data as Ticket[]);
    if (slaRes.data) setSlaConfigs(slaRes.data as SlaConfig[]);
    
    setLoading(false);
  };

  const getSlaConfig = (priority: TicketPriority) => {
    return slaConfigs.find(s => s.priority === priority);
  };

  const calculateSlaCompliance = (priority: TicketPriority) => {
    const priorityTickets = tickets.filter(t => 
      t.priority === priority && 
      (t.status === 'resolved' || t.status === 'closed') &&
      t.first_response_at
    );

    if (priorityTickets.length === 0) return { compliance: 100, total: 0, met: 0 };

    const sla = getSlaConfig(priority);
    if (!sla) return { compliance: 100, total: 0, met: 0 };

    const metSla = priorityTickets.filter(t => {
      const responseTime = differenceInHours(
        new Date(t.first_response_at!),
        new Date(t.created_at)
      );
      return responseTime <= sla.response_hours;
    });

    return {
      compliance: Math.round((metSla.length / priorityTickets.length) * 100),
      total: priorityTickets.length,
      met: metSla.length,
    };
  };

  const priorityOrder: TicketPriority[] = ['critical', 'high', 'medium', 'low'];

  const priorityLabels: Record<TicketPriority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const overallStats = {
    totalResolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    totalActive: tickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status)).length,
    avgResolutionTime: (() => {
      const resolved = tickets.filter(t => t.resolved_at);
      if (resolved.length === 0) return 0;
      const totalHours = resolved.reduce((sum, t) => {
        return sum + differenceInHours(new Date(t.resolved_at!), new Date(t.created_at));
      }, 0);
      return Math.round(totalHours / resolved.length);
    })(),
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">SLA Reports</h1>
          <p className="text-sm text-muted-foreground">Track SLA compliance and performance metrics</p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalResolved}</div>
              <p className="text-xs text-muted-foreground">tickets completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalActive}</div>
              <p className="text-xs text-muted-foreground">in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.avgResolutionTime}h</div>
              <p className="text-xs text-muted-foreground">average hours</p>
            </CardContent>
          </Card>
        </div>

        {/* SLA Compliance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              SLA Compliance by Priority
            </CardTitle>
            <CardDescription>
              Response time compliance based on configured SLA targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Response Target</TableHead>
                  <TableHead>Resolution Target</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Compliance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorityOrder.map(priority => {
                  const sla = getSlaConfig(priority);
                  const compliance = calculateSlaCompliance(priority);

                  return (
                    <TableRow key={priority}>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={
                            priority === 'critical' ? 'border-priority-critical text-priority-critical' :
                            priority === 'high' ? 'border-priority-high text-priority-high' :
                            priority === 'medium' ? 'border-priority-medium text-priority-medium' :
                            'border-priority-low text-priority-low'
                          }
                        >
                          {priorityLabels[priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>{sla?.response_hours ?? '-'}h</TableCell>
                      <TableCell>{sla?.resolution_hours ?? '-'}h</TableCell>
                      <TableCell>{compliance.met}/{compliance.total}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[150px]">
                          <Progress 
                            value={compliance.compliance} 
                            className="h-2"
                          />
                          <span className={`text-sm font-medium ${
                            compliance.compliance >= 90 ? 'text-success' :
                            compliance.compliance >= 70 ? 'text-warning' :
                            'text-destructive'
                          }`}>
                            {compliance.compliance}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* SLA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Configuration</CardTitle>
            <CardDescription>
              Current SLA targets by priority level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {priorityOrder.map(priority => {
                const sla = getSlaConfig(priority);
                return (
                  <div 
                    key={priority}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="font-medium mb-2">{priorityLabels[priority]}</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Response: {sla?.response_hours ?? '-'} hours</div>
                      <div>Resolution: {sla?.resolution_hours ?? '-'} hours</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
