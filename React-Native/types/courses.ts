// interfaces.ts
export interface CourseSettings {
  visibility: 'public' | 'private' | 'invitation';
  is_paid: boolean;
  price: number;
  currency: string;
  subscription_type: 'one-time' | 'monthly' | 'yearly';
  subscription_price: number;
  scheduled_release: boolean;
  release_date: string | null;
  module_release_schedule: { module_id: string; release_date: string }[];
  access_restrictions: 'all' | 'specific-roles' | 'specific-users';
  allowed_roles: string[];
  allowed_users: string[];
  notify_on_enrollment: boolean;
  notify_on_completion: boolean;
  notify_on_assessment_submission: boolean;
  is_archived: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  categories: string[];
  prerequisites: string;
  objectives: string[];
  modules: Module[];
  resources?: Resource[];
  enrollmentcount?: number;
  completionRate?: number;
  image?: string;
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
  course_settings?: CourseSettings;
  user_id?: string;
}

// 

export interface Lesson {
  id: number;
  title: string;
  content: string;
  type: string;
  duration: number;
  order: number;
  resources: Resource[];
  discussionEnabled: boolean; // Add this line
}

export interface Resource {
  id: string;
  type: 'pdf' | 'presentation' | 'link' | 'video';
  title: string;
  url: string;
  resource_id?: string; // ID for the resource in Supabase storage
}

export interface Assessment {
  id: number;
  title: string;
  description: string;
  type: 'quiz' | 'assignment';
  questions?: Question[];
  dueDate?: Date;
  totalPoints: number;
}

export interface Question {
  id: number;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correctAnswer?: string | number;
  points: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  moduleId?: string;
  description?: string;
  order?: number;
  resources?: Resource[];
}

export interface CourseFeedback {
  id: string;
  course_id: string;
  user_id?: string;
  rating: number;
  content_rating: number;
  teaching_rating: number;
  difficulty_rating: number;
  feedback_text: string;
  content_feedback?: string;
  teaching_feedback?: string;
  overall_feedback?: string;
  anonymous?: boolean;
  is_anonymous?: boolean;
  created_at: string;
}

export interface FeedbackAnalytics {
  average_rating: number;
  content_rating: number;
  teaching_rating: number;
  difficulty_rating: number;
  total_feedback: number;
  anonymous_count: number;
  common_themes: string[];
  sentiment_analysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recent_feedback: CourseFeedback[];
}