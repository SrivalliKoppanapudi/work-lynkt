-- Add course_settings column to courses table

-- This migration adds a JSONB column to store course settings
-- The JSONB type is ideal for storing structured JSON data

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS course_settings JSONB DEFAULT '{}'::jsonb;

-- Comment on the column to document its purpose
COMMENT ON COLUMN courses.course_settings IS 'Stores course configuration settings as JSON';