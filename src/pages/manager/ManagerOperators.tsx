import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Profile, OperatorSkillRecord, TicketWithRelations } from '@/types/database';
import { Loader2, Users } from 'lucide-react';

interface OperatorWithData extends Profile {
  skills: OperatorSkillRecord[];
  activeTickets: number;
  resolvedCount: number;
}

export default function ManagerOperators() {
  const [operators, setOperators] = useState<OperatorWithData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    // Get operator user IDs
    const { data: operatorRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'operator');

    if (!operatorRoles) {
      setLoading(false);
      return;
    }

    const operatorIds = operatorRoles.map(r => r.user_id);

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', operatorIds);

    // Get skills
    const { data: skills } = await supabase
      .from('operator_skills')
      .select('*')
      .in('user_id', operatorIds);

    // Get tickets
    const { data: tickets } = await supabase
      .from('tickets')
      .select('assigned_operator_id, status')
      .in('assigned_operator_id', operatorIds);

    if (profiles) {
      const operatorsWithData = profiles.map(profile => {
        const operatorSkills = skills?.filter(s => s.user_id === profile.id) ?? [];
        const operatorTickets = tickets?.filter(t => t.assigned_operator_id === profile.id) ?? [];
        const activeTickets = operatorTickets.filter(t => 
          ['open', 'in_progress', 'pending'].includes(t.status)
        ).length;
        const resolvedCount = operatorTickets.filter(t => 
          ['resolved', 'closed'].includes(t.status)
        ).length;

        return {
          ...profile,
          skills: operatorSkills as OperatorSkillRecord[],
          activeTickets,
          resolvedCount,
        };
      });

      setOperators(operatorsWithData);
    }

    setLoading(false);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const skillLabels: Record<string, string> = {
    network: 'Network',
    software: 'Software',
    hardware: 'Hardware',
    database: 'Database',
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
          <h1 className="text-2xl font-semibold">Operators</h1>
          <p className="text-sm text-muted-foreground">Manage operator assignments and skills</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Overview ({operators.length} operators)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {operators.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No operators found. Assign the operator role to users to see them here.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-center">Resolved</TableHead>
                    <TableHead className="text-center">Workload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operators.map(operator => (
                    <TableRow key={operator.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(operator.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{operator.full_name ?? 'Unnamed'}</div>
                            <div className="text-xs text-muted-foreground">{operator.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {operator.skills.length === 0 ? (
                            <span className="text-muted-foreground text-sm">No skills</span>
                          ) : (
                            operator.skills.map(skill => (
                              <Badge key={skill.id} variant="secondary" className="text-xs">
                                {skillLabels[skill.skill]} (L{skill.proficiency_level})
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{operator.activeTickets}</TableCell>
                      <TableCell className="text-center">{operator.resolvedCount}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={operator.activeTickets > 5 ? 'destructive' : operator.activeTickets > 2 ? 'outline' : 'secondary'}
                        >
                          {operator.activeTickets > 5 ? 'High' : operator.activeTickets > 2 ? 'Medium' : 'Low'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
