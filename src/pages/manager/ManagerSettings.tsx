import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { SlaConfig, TicketPriority, AppRole, Profile, UserRole } from '@/types/database';
import { Loader2, Settings, Clock, Users } from 'lucide-react';

export default function ManagerSettings() {
  const [slaConfigs, setSlaConfigs] = useState<SlaConfig[]>([]);
  const [users, setUsers] = useState<(Profile & { role: AppRole })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch SLA configs
    const { data: slaData } = await supabase
      .from('sla_configs')
      .select('*')
      .order('priority');

    if (slaData) {
      setSlaConfigs(slaData as SlaConfig[]);
    }

    // Fetch users with roles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');

    const { data: roles } = await supabase
      .from('user_roles')
      .select('*');

    if (profiles && roles) {
      const usersWithRoles = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role as AppRole) ?? 'customer',
        };
      });
      setUsers(usersWithRoles);
    }

    setLoading(false);
  };

  const handleSlaUpdate = async (priority: TicketPriority, field: 'response_hours' | 'resolution_hours', value: number) => {
    const config = slaConfigs.find(s => s.priority === priority);
    if (!config) return;

    const { error } = await supabase
      .from('sla_configs')
      .update({ [field]: value })
      .eq('id', config.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update SLA config', variant: 'destructive' });
    } else {
      setSlaConfigs(prev => prev.map(s => 
        s.priority === priority ? { ...s, [field]: value } : s
      ));
      toast({ title: 'Updated', description: 'SLA configuration saved' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setSaving(true);

    // Delete existing role
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: newRole });

    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    } else {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      toast({ title: 'Updated', description: 'User role changed successfully' });
    }
  };

  const priorityLabels: Record<TicketPriority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const priorityOrder: TicketPriority[] = ['critical', 'high', 'medium', 'low'];

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
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure SLA targets and user roles</p>
        </div>

        {/* SLA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              SLA Configuration
            </CardTitle>
            <CardDescription>
              Set response and resolution time targets for each priority level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Response Time (hours)</TableHead>
                  <TableHead>Resolution Time (hours)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorityOrder.map(priority => {
                  const config = slaConfigs.find(s => s.priority === priority);
                  return (
                    <TableRow key={priority}>
                      <TableCell className="font-medium">{priorityLabels[priority]}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          className="w-24"
                          value={config?.response_hours ?? 0}
                          onChange={(e) => handleSlaUpdate(priority, 'response_hours', parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          className="w-24"
                          value={config?.resolution_hours ?? 0}
                          onChange={(e) => handleSlaUpdate(priority, 'resolution_hours', parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Role Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Roles
            </CardTitle>
            <CardDescription>
              Assign roles to users. Customers submit tickets, operators resolve them, managers oversee operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name ?? 'Unnamed'}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(v) => handleRoleChange(user.id, v as AppRole)}
                        disabled={saving}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="operator">Operator</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
