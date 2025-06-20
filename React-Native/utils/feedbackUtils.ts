import { CourseFeedback, FeedbackAnalytics } from '../types/courses';

export const calculateFeedbackAnalytics = (feedback: CourseFeedback[]): FeedbackAnalytics => {
  if (feedback.length === 0) {
    return {
      average_rating: 0,
      content_rating: 0,
      teaching_rating: 0,
      difficulty_rating: 0,
      total_feedback: 0,
      anonymous_count: 0,
      common_themes: [],
      sentiment_analysis: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      recent_feedback: [],
    };
  }

  // Calculate average ratings
  const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
  const totalContentRating = feedback.reduce((sum, f) => sum + f.content_rating, 0);
  const totalTeachingRating = feedback.reduce((sum, f) => sum + f.teaching_rating, 0);
  const totalDifficultyRating = feedback.reduce((sum, f) => sum + f.difficulty_rating, 0);

  const averageRating = totalRating / feedback.length;
  const contentRating = totalContentRating / feedback.length;
  const teachingRating = totalTeachingRating / feedback.length;
  const difficultyRating = totalDifficultyRating / feedback.length;

  // Count anonymous submissions
  const anonymousCount = feedback.filter((f) => f.anonymous || f.is_anonymous).length;

  // Analyze sentiment and extract common themes
  const allFeedbackText = feedback.map((f) => f.feedback_text.toLowerCase()).join(' ');
  const words = allFeedbackText.split(/\s+/);
  
  const wordCount: Record<string, number> = {};
  words.forEach((word) => {
    if (word.length > 3) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });

  const commonThemes = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);

  // Simple sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'enjoy'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'disappointing', 'hate', 'difficult'];

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  feedback.forEach((f) => {
    // Handle both feedback_text and different field names for feedback content
    const text = f.feedback_text?.toLowerCase() || 
                 (f.content_feedback || f.teaching_feedback || f.overall_feedback || '').toLowerCase();
    const hasPositive = positiveWords.some((word) => text.includes(word));
    const hasNegative = negativeWords.some((word) => text.includes(word));

    if (hasPositive && !hasNegative) {
      positiveCount++;
    } else if (hasNegative && !hasPositive) {
      negativeCount++;
    } else {
      neutralCount++;
    }
  });

  // Get recent feedback (last 5)
  const recentFeedback = [...feedback]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return {
    average_rating: averageRating,
    content_rating: contentRating,
    teaching_rating: teachingRating,
    difficulty_rating: difficultyRating,
    total_feedback: feedback.length,
    anonymous_count: anonymousCount,
    common_themes: commonThemes,
    sentiment_analysis: {
      positive: (positiveCount / feedback.length) * 100,
      neutral: (neutralCount / feedback.length) * 100,
      negative: (negativeCount / feedback.length) * 100,
    },
    recent_feedback: recentFeedback,
  };
};

export const validateFeedback = (feedback: Partial<CourseFeedback>): string | null => {
  if (!feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
    return 'Please provide a valid rating between 1 and 5';
  }

  if (!feedback.content_rating || feedback.content_rating < 1 || feedback.content_rating > 5) {
    return 'Please provide a valid content rating between 1 and 5';
  }

  if (!feedback.teaching_rating || feedback.teaching_rating < 1 || feedback.teaching_rating > 5) {
    return 'Please provide a valid teaching rating between 1 and 5';
  }

  if (!feedback.difficulty_rating || feedback.difficulty_rating < 1 || feedback.difficulty_rating > 5) {
    return 'Please provide a valid difficulty rating between 1 and 5';
  }

  // Check for feedback text in either feedback_text or component-specific fields
  const hasValidFeedback = 
    (feedback.feedback_text && feedback.feedback_text.trim().length >= 10) ||
    (feedback.content_feedback && feedback.content_feedback.trim().length >= 10) ||
    (feedback.teaching_feedback && feedback.teaching_feedback.trim().length >= 10) ||
    (feedback.overall_feedback && feedback.overall_feedback.trim().length >= 10);
  
  if (!hasValidFeedback) {
    return 'Please provide detailed feedback (minimum 10 characters)';
  }

  return null;
};