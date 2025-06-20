CREATE TABLE IF NOT EXISTS course_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invitation')),
  is_paid BOOLEAN DEFAULT false,
  price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  subscription_type TEXT DEFAULT 'one-time' CHECK (subscription_type IN ('one-time', 'monthly', 'yearly')),
  subscription_price DECIMAL(10, 2) DEFAULT 0,
  scheduled_release BOOLEAN DEFAULT false,
  release_date TIMESTAMP WITH TIME ZONE,
  module_release_schedule JSONB DEFAULT '[]'::jsonb,
  access_restrictions TEXT DEFAULT 'all' CHECK (access_restrictions IN ('all', 'specific-roles', 'specific-users')),
  allowed_roles JSONB DEFAULT '[]'::jsonb,
  allowed_users JSONB DEFAULT '[]'::jsonb,
  notify_on_enrollment BOOLEAN DEFAULT true,
  notify_on_completion BOOLEAN DEFAULT true,
  notify_on_assessment_submission BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id)
);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_settings_updated_at
BEFORE UPDATE ON course_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 