-- Create teacher profiles table
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  siret TEXT,
  bank_iban TEXT,
  bank_bic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for teacher_profiles
CREATE POLICY "Teachers can view their own profile"
ON public.teacher_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can update their own profile"
ON public.teacher_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can insert their own profile"
ON public.teacher_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.teacher_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.teacher_profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create school documents table (documents FROM school TO teacher)
CREATE TABLE IF NOT EXISTS public.school_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.school_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for school_documents
CREATE POLICY "Teachers can view their own documents"
ON public.school_documents
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can manage all documents"
ON public.school_documents
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create teacher invoices table
CREATE TABLE IF NOT EXISTS public.teacher_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  description TEXT NOT NULL,
  hours NUMERIC(10, 2),
  rate_per_hour NUMERIC(10, 2),
  other_amount NUMERIC(10, 2),
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(teacher_id, invoice_number)
);

-- Enable RLS
ALTER TABLE public.teacher_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for teacher_invoices
CREATE POLICY "Teachers can view their own invoices"
ON public.teacher_invoices
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own invoices"
ON public.teacher_invoices
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own invoices"
ON public.teacher_invoices
FOR UPDATE
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own invoices"
ON public.teacher_invoices
FOR DELETE
USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can view all invoices"
ON public.teacher_invoices
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-documents', 'school-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-invoices', 'teacher-invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for school-documents
CREATE POLICY "Teachers can view their documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'school-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can upload school documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'school-documents' AND
  public.has_role(auth.uid(), 'admin')
);

-- Storage policies for teacher-invoices
CREATE POLICY "Teachers can view their invoice PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'teacher-invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can upload their invoice PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'teacher-invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger for updating updated_at
CREATE TRIGGER update_teacher_profiles_updated_at
BEFORE UPDATE ON public.teacher_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_invoices_updated_at
BEFORE UPDATE ON public.teacher_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();