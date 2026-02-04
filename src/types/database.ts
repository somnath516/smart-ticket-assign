export type AppRole = 'customer' | 'operator' | 'manager';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketCategory = 'network' | 'software' | 'hardware' | 'database';
export type OperatorSkill = 'network' | 'software' | 'hardware' | 'database';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface SlaConfig {
  id: string;
  priority: TicketPriority;
  response_hours: number;
  resolution_hours: number;
  created_at: string;
  updated_at: string;
}

export interface OperatorSkillRecord {
  id: string;
  user_id: string;
  skill: OperatorSkill;
  proficiency_level: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: number;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  customer_id: string;
  assigned_operator_id: string | null;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface TicketWithRelations extends Ticket {
  customer?: Profile;
  assigned_operator?: Profile;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author?: Profile;
}

export interface TicketHistory {
  id: string;
  ticket_id: string;
  changed_by: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  changed_by_profile?: Profile;
}
