-- Create levels table for managing academic levels (Bachelor, Master, MBA, etc.)
CREATE TABLE public.levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

-- Create policies for levels
CREATE POLICY "Anyone authenticated can view levels"
  ON public.levels
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage levels"
  ON public.levels
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_levels_updated_at
  BEFORE UPDATE ON public.levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default levels
INSERT INTO public.levels (name, is_active) VALUES
  ('Bachelor', true),
  ('Master', true),
  ('MBA', true),
  ('Autre', true);