-- Create course_feedback table
CREATE TABLE IF NOT EXISTS course_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content_rating INTEGER NOT NULL CHECK (content_rating >= 1 AND content_rating <= 5),
    teaching_rating INTEGER NOT NULL CHECK (teaching_rating >= 1 AND teaching_rating <= 5),
    difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    anonymous BOOLEAN DEFAULT false,
    feedback_text TEXT NOT NULL,
    teacher_response TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, user_id)
);

-- Create RLS policies
ALTER TABLE course_feedback ENABLE ROW LEVEL SECURITY;

-- Policy for students to view feedback (including anonymous)
CREATE POLICY "Students can view course feedback"
    ON course_feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM course_enrollments
            WHERE course_enrollments.course_id = course_feedback.course_id
            AND course_enrollments.user_id = auth.uid()
        )
    );

-- Policy for students to create feedback
CREATE POLICY "Students can create feedback"
    ON course_feedback
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM course_enrollments
            WHERE course_enrollments.course_id = course_feedback.course_id
            AND course_enrollments.user_id = auth.uid()
        )
    );

-- Policy for students to update their own feedback
CREATE POLICY "Students can update their own feedback"
    ON course_feedback
    FOR UPDATE
    USING (
        user_id = auth.uid()
        AND created_at > NOW() - INTERVAL '24 hours'
    );

-- Policy for instructors to view all feedback
CREATE POLICY "Instructors can view all feedback"
    ON course_feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = course_feedback.course_id
            AND courses.user_id = auth.uid()
        )
    );

-- Policy for instructors to respond to feedback
CREATE POLICY "Instructors can respond to feedback"
    ON course_feedback
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = course_feedback.course_id
            AND courses.user_id = auth.uid()
        )
    )
    WITH CHECK (
        teacher_response IS NOT NULL
        AND response_date IS NOT NULL
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_course_feedback_updated_at
    BEFORE UPDATE ON course_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_course_feedback_course_id ON course_feedback(course_id);
CREATE INDEX idx_course_feedback_user_id ON course_feedback(user_id);
CREATE INDEX idx_course_feedback_created_at ON course_feedback(created_at); 