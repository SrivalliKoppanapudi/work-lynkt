-- Create the course-resources bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-resources', 'course-resources', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for course-resources bucket

-- Enable Row Level Security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own objects
CREATE POLICY "Users can upload course resources" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'course-resources');

-- Create policy to allow users to update their own objects
CREATE POLICY "Users can update course resources" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'course-resources');

-- Create policy to allow users to read their own objects
CREATE POLICY "Users can read course resources" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'course-resources');

-- Create policy to allow users to delete their own objects
CREATE POLICY "Users can delete course resources" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'course-resources');

-- Create policy to allow public read access to all course resources
CREATE POLICY "Public can view all course resources" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'course-resources'); 