import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { ticket_id } = await req.json();

    if (!ticket_id) {
      return new Response(JSON.stringify({ error: 'ticket_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get operators with matching skill
    const { data: operatorSkills } = await supabase
      .from('operator_skills')
      .select('user_id, proficiency_level')
      .eq('skill', ticket.category)
      .order('proficiency_level', { ascending: false });

    if (!operatorSkills || operatorSkills.length === 0) {
      console.log('No operators with matching skill found');
      return new Response(JSON.stringify({ message: 'No matching operators' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current workload for each operator
    const operatorIds = operatorSkills.map(s => s.user_id);
    const { data: activeTickets } = await supabase
      .from('tickets')
      .select('assigned_operator_id')
      .in('assigned_operator_id', operatorIds)
      .in('status', ['open', 'in_progress', 'pending']);

    // Calculate workload per operator
    const workload: Record<string, number> = {};
    operatorIds.forEach(id => workload[id] = 0);
    activeTickets?.forEach(t => {
      if (t.assigned_operator_id) {
        workload[t.assigned_operator_id] = (workload[t.assigned_operator_id] || 0) + 1;
      }
    });

    // Score operators: higher skill + lower workload = better
    const scored = operatorSkills.map(op => ({
      user_id: op.user_id,
      score: op.proficiency_level * 10 - workload[op.user_id] * 3,
    }));

    scored.sort((a, b) => b.score - a.score);
    const bestOperator = scored[0];

    // Assign ticket
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ assigned_operator_id: bestOperator.user_id })
      .eq('id', ticket_id);

    if (updateError) {
      console.error('Failed to assign ticket:', updateError);
      return new Response(JSON.stringify({ error: 'Assignment failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Ticket ${ticket_id} assigned to ${bestOperator.user_id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      assigned_to: bestOperator.user_id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
