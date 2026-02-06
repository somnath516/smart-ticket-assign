import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { TicketCategory, TicketPriority } from '@/types/database';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories: { value: TicketCategory; label: string; description: string }[] = [
  { value: 'network', label: 'Network', description: 'Connectivity, VPN, firewall issues' },
  { value: 'software', label: 'Software', description: 'Application bugs, installation, updates' },
  { value: 'hardware', label: 'Hardware', description: 'Device, peripheral, equipment issues' },
  { value: 'database', label: 'Database', description: 'Data access, queries, performance' },
];

const priorities: { value: TicketPriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Minor issue, no immediate impact' },
  { value: 'medium', label: 'Medium', description: 'Moderate impact on work' },
  { value: 'high', label: 'High', description: 'Significant impact, workaround exists' },
  { value: 'critical', label: 'Critical', description: 'Severe impact, no workaround' },
];

export default function NewTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as TicketCategory | '',
    priority: 'medium' as TicketPriority,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // Generate a unique guest ID for anonymous ticket submission
    let guestId = localStorage.getItem('guest_customer_id');
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem('guest_customer_id', guestId);
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        customer_id: guestId,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: 'Error creating ticket',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Ticket submitted!',
        description: `Your ticket #${data.ticket_number} has been created and will be assigned shortly.`,
      });
      navigate('/portal');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Link to="/portal">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to tickets
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Submit a Support Ticket</CardTitle>
            <CardDescription>
              Describe your issue and we'll assign it to the right specialist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as TicketCategory })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex flex-col">
                          <span>{cat.label}</span>
                          <span className="text-xs text-muted-foreground">{cat.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((pri) => (
                      <SelectItem key={pri.value} value={pri.value}>
                        <div className="flex flex-col">
                          <span>{pri.label}</span>
                          <span className="text-xs text-muted-foreground">{pri.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about your issue, including any error messages, steps to reproduce, and what you've already tried..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={loading}
                  rows={6}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <Link to="/portal">
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading || !formData.title || !formData.description || !formData.category}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Ticket'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
