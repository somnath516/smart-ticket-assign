-- Create role enum
CREATE TYPE public.app_role AS ENUM ('customer', 'operator', 'manager');

-- Create priority enum
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create status enum
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'pending', 'resolved', 'closed');

-- Create category enum
CREATE TYPE public.ticket_category AS ENUM ('network', 'software', 'hardware', 'database');

-- Create skill enum
CREATE TYPE public.operator_skill AS ENUM ('network', 'software', 'hardware', 'database');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  UNIQUE(user_id, role)
);

-- Create SLA configuration table
CREATE TABLE public.sla_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority ticket_priority NOT NULL UNIQUE,
  response_hours INTEGER NOT NULL,
  resolution_hours INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default SLA configs
INSERT INTO public.sla_configs (priority, response_hours, resolution_hours) VALUES
  ('critical', 1, 4),
  ('high', 4, 24),
  ('medium', 8, 48),
  ('low', 24, 72);

-- Create operator_skills table
CREATE TABLE public.operator_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill operator_skill NOT NULL,
  proficiency_level INTEGER NOT NULL DEFAULT 1 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill)
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number SERIAL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Create ticket_comments table
CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ticket_history table for audit trail
CREATE TABLE public.ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;

-- Create helper function to check user role (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if user is manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'manager')
$$;

-- Create helper function to check if user is operator
CREATE OR REPLACE FUNCTION public.is_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'operator')
$$;

-- Create helper function to check if user is customer
CREATE OR REPLACE FUNCTION public.is_customer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'customer')
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- User roles policies (only managers can modify roles, but all can view own)
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_manager());

CREATE POLICY "Managers can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_manager());

CREATE POLICY "Managers can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

CREATE POLICY "Managers can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_manager());

-- Allow new users to get default role via trigger (service role)
CREATE POLICY "System can insert default role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- SLA configs policies
CREATE POLICY "Anyone can view SLA configs"
  ON public.sla_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage SLA configs"
  ON public.sla_configs FOR ALL
  TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- Operator skills policies
CREATE POLICY "Operators and managers can view skills"
  ON public.operator_skills FOR SELECT
  TO authenticated
  USING (public.is_operator() OR public.is_manager());

CREATE POLICY "Operators can manage own skills"
  ON public.operator_skills FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_operator());

CREATE POLICY "Operators can update own skills"
  ON public.operator_skills FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_operator())
  WITH CHECK (user_id = auth.uid() AND public.is_operator());

CREATE POLICY "Operators can delete own skills"
  ON public.operator_skills FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_operator());

CREATE POLICY "Managers can manage all skills"
  ON public.operator_skills FOR ALL
  TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- Tickets policies
CREATE POLICY "Customers can view own tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() 
    OR assigned_operator_id = auth.uid() 
    OR public.is_manager()
  );

CREATE POLICY "Customers can create tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Ticket owners and assignees can update"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (
    customer_id = auth.uid() 
    OR assigned_operator_id = auth.uid() 
    OR public.is_manager()
  )
  WITH CHECK (
    customer_id = auth.uid() 
    OR assigned_operator_id = auth.uid() 
    OR public.is_manager()
  );

CREATE POLICY "Managers can delete tickets"
  ON public.tickets FOR DELETE
  TO authenticated
  USING (public.is_manager());

-- Ticket comments policies
CREATE POLICY "Can view comments on accessible tickets"
  ON public.ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id 
      AND (
        t.customer_id = auth.uid() 
        OR t.assigned_operator_id = auth.uid() 
        OR public.is_manager()
      )
    )
    AND (
      NOT is_internal 
      OR public.is_operator() 
      OR public.is_manager()
    )
  );

CREATE POLICY "Can add comments to accessible tickets"
  ON public.ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id 
      AND (
        t.customer_id = auth.uid() 
        OR t.assigned_operator_id = auth.uid() 
        OR public.is_manager()
      )
    )
  );

-- Ticket history policies
CREATE POLICY "Can view history of accessible tickets"
  ON public.ticket_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id 
      AND (
        t.customer_id = auth.uid() 
        OR t.assigned_operator_id = auth.uid() 
        OR public.is_manager()
      )
    )
  );

CREATE POLICY "System can insert history"
  ON public.ticket_history FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Default role is customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sla_configs_updated_at
  BEFORE UPDATE ON public.sla_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_tickets_customer_id ON public.tickets(customer_id);
CREATE INDEX idx_tickets_assigned_operator_id ON public.tickets(assigned_operator_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_category ON public.tickets(category);
CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX idx_ticket_history_ticket_id ON public.ticket_history(ticket_id);
CREATE INDEX idx_operator_skills_user_id ON public.operator_skills(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable realtime for tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;