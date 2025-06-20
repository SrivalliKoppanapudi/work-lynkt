-- Set up storage policies for course-images bucket

-- Enable Row Level Security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own objects
CREATE POLICY "Users can upload their own course images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'course-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create policy to allow users to update their own objects
CREATE POLICY "Users can update their own course images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'course-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create policy to allow users to read their own objects
CREATE POLICY "Users can read their own course images" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'course-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create policy to allow users to delete their own objects
CREATE POLICY "Users can delete their own course images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'course-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create policy to allow public read access to all course images
CREATE POLICY "Public can view all course images" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'course-images');

-- Set up storage policies for course-resources bucket

-- Create policy to allow authenticated users to upload course resources
CREATE POLICY "Users can upload course resources" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'course-resources');

-- Create policy to allow authenticated users to update their own resources
CREATE POLICY "Users can update course resources" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'course-resources');

-- Create policy to allow authenticated users to read course resources
CREATE POLICY "Users can read course resources" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'course-resources');

-- Create policy to allow public read access to all course resources
CREATE POLICY "Public can view all course resources" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'course-resources');

-- Create policy to allow authenticated users to delete their own resources
CREATE POLICY "Users can delete course resources" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'course-resources');