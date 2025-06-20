-- Create course_resources table
CREATE TABLE IF NOT EXISTS public.course_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'presentation', 'link')),
    url TEXT NOT NULL,
    resource_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_course_resources_course_id ON public.course_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_module_id ON public.course_resources(module_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

-- Policy for viewing resources (anyone can view if they have access to the course)
CREATE POLICY "View course resources" ON public.course_resources
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_resources.course_id
            AND (
                c.visibility = 'public'
                OR c.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.course_enrollments ce
                    WHERE ce.course_id = c.id
                    AND ce.user_id = auth.uid()
                )
            )
        )
    );

-- Policy for inserting resources (only course owner can add resources)
CREATE POLICY "Insert course resources" ON public.course_resources
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_resources.course_id
            AND c.user_id = auth.uid()
        )
    );

-- Policy for updating resources (only course owner can update resources)
CREATE POLICY "Update course resources" ON public.course_resources
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_resources.course_id
            AND c.user_id = auth.uid()
        )
    );

-- Policy for deleting resources (only course owner can delete resources)
CREATE POLICY "Delete course resources" ON public.course_resources
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_resources.course_id
            AND c.user_id = auth.uid()
        )
    ); 