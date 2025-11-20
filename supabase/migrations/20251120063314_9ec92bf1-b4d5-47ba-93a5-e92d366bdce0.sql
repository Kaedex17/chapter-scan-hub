-- Add index on id_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_missionaries_id_number ON public.missionaries(id_number);

-- Add index on missionary_id for faster attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_missionary_id ON public.attendance_records(missionary_id);

-- Add index on scanned_at for date range queries
CREATE INDEX IF NOT EXISTS idx_attendance_scanned_at ON public.attendance_records(scanned_at DESC);

-- Add composite index for chapter-based queries
CREATE INDEX IF NOT EXISTS idx_missionaries_chapter ON public.missionaries(chapter);
CREATE INDEX IF NOT EXISTS idx_attendance_chapter_date ON public.attendance_records(chapter, scanned_at DESC);