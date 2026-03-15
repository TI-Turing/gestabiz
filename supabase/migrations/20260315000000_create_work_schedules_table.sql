-- Migration: Create work_schedules table for employee work hours
-- Date: 2026-03-15
-- Description: Tabla para almacenar horarios laborales semanales de empleados

-- Create work_schedules table
CREATE TABLE IF NOT EXISTS public.work_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (employee_id, day_of_week)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_schedules_employee_id ON public.work_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_schedules_day_of_week ON public.work_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_work_schedules_is_working ON public.work_schedules(is_working);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_work_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_work_schedules_updated_at
    BEFORE UPDATE ON public.work_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_work_schedules_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Employees can view and edit their own schedules
CREATE POLICY "Employees can view own schedules"
    ON public.work_schedules
    FOR SELECT
    USING (auth.uid() = employee_id);

CREATE POLICY "Employees can insert own schedules"
    ON public.work_schedules
    FOR INSERT
    WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update own schedules"
    ON public.work_schedules
    FOR UPDATE
    USING (auth.uid() = employee_id)
    WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can delete own schedules"
    ON public.work_schedules
    FOR DELETE
    USING (auth.uid() = employee_id);

-- RLS Policy: Business owners/admins can view all employee schedules in their business
CREATE POLICY "Admins can view employee schedules"
    ON public.work_schedules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.business_employees be
            WHERE be.employee_id = work_schedules.employee_id
            AND be.business_id IN (
                SELECT id FROM public.businesses WHERE owner_id = auth.uid()
                UNION
                SELECT business_id FROM public.business_roles WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Add comment to table
COMMENT ON TABLE public.work_schedules IS 'Employee work schedules by day of week (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN public.work_schedules.day_of_week IS '0 = Sunday, 1 = Monday, ..., 6 = Saturday';
COMMENT ON COLUMN public.work_schedules.is_working IS 'Whether the employee is available to work on this day';
