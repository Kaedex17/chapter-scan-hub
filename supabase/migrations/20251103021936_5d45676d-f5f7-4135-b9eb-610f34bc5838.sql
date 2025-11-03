-- Create missionaries table
CREATE TABLE public.missionaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  missionary_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  chapter TEXT NOT NULL,
  id_number TEXT NOT NULL UNIQUE,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  missionary_id UUID NOT NULL REFERENCES public.missionaries(id) ON DELETE CASCADE,
  missionary_name TEXT NOT NULL,
  chapter TEXT NOT NULL,
  attendance_status TEXT NOT NULL DEFAULT 'Present',
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.missionaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required for this use case)
CREATE POLICY "Allow public read access to missionaries" 
ON public.missionaries 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to missionaries" 
ON public.missionaries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to missionaries" 
ON public.missionaries 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete from missionaries" 
ON public.missionaries 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public read access to attendance_records" 
ON public.attendance_records 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to attendance_records" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to attendance_records" 
ON public.attendance_records 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete from attendance_records" 
ON public.attendance_records 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_missionaries_updated_at
BEFORE UPDATE ON public.missionaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.missionaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;