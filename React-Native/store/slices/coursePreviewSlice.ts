import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, Module, Lesson, Resource } from '../../types/courses';
import { supabase } from '../../lib/Superbase';

// Types
interface CoursePreviewState {
  course: Course | null;
  loading: boolean;
  error: string | null;
  studentViewMode: boolean;
  feedback: FeedbackItem[];
  feedbackSyncing: boolean;
  feedbackSyncError: string | null;
}

interface FeedbackItem {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: number;
  text: string;
  createdAt: Date;
  author: string;
}

// Async thunks
export const fetchCourseById = createAsyncThunk(
  'coursePreview/fetchCourseById',
  async (courseId: string, { rejectWithValue }) => {
    try {
      console.log('Fetching course preview for ID:', courseId);
      
      // Ensure courseId is properly formatted
      if (!courseId) {
        console.error('Invalid course ID provided:', courseId);
        return rejectWithValue('Invalid course ID provided');
      }
      
      // Fetch course data from Supabase
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) {
        console.error('Error fetching course data:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No course found with ID:', courseId);
        throw new Error('Course not found');
      }
      
      // Fetch modules for the course
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (modulesError) throw modulesError;

      // For each module, fetch its lessons
      const modulesWithLessons = await Promise.all(
        modulesData.map(async (module) => {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', module.id)
            .order('order', { ascending: true });

          if (lessonsError) throw lessonsError;

          // For each lesson, fetch its resources
          const lessonsWithResources = await Promise.all(
            lessonsData.map(async (lesson) => {
              const { data: resourcesData, error: resourcesError } = await supabase
                .from('resources')
                .select('*')
                .eq('lesson_id', lesson.id);

              if (resourcesError) throw resourcesError;

              return {
                ...lesson,
                resources: resourcesData || [],
              };
            })
          );

          return {
            ...module,
            lessons: lessonsWithResources || [],
          };
        })
      );

      // Construct the complete course object
      const courseWithModules = {
        ...data,
        modules: modulesWithLessons || [],
      };

      return courseWithModules as Course;
    } catch (error: any) {
      console.error('Error fetching course:', error);
      return rejectWithValue(error.message || 'Failed to fetch course');
    }
  }
);

export const saveFeedback = createAsyncThunk(
  'coursePreview/saveFeedback',
  async (feedback: FeedbackItem[], { rejectWithValue }) => {
    try {
      // First save to AsyncStorage as backup
      await AsyncStorage.setItem('course_feedback', JSON.stringify(feedback));
      
      // Then sync with Supabase
      const { error } = await supabase
        .from('course_feedback')
        .upsert(
          feedback.map(item => ({
            id: item.id,
            course_id: item.courseId,
            module_id: item.moduleId,
            lesson_id: item.lessonId,
            text: item.text,
            created_at: item.createdAt,
            author: item.author
          }))
        );

      if (error) throw error;
      
      return feedback;
    } catch (error: any) {
      console.error('Error saving feedback:', error);
      return rejectWithValue(error.message || 'Failed to save feedback');
    }
  }
);

export const loadFeedbackFromStorage = createAsyncThunk(
  'coursePreview/loadFeedbackFromStorage',
  async (_, { rejectWithValue }) => {
    try {
      const storedFeedback = await AsyncStorage.getItem('course_feedback');
      return storedFeedback ? JSON.parse(storedFeedback) as FeedbackItem[] : [];
    } catch (error: any) {
      console.error('Error loading feedback from storage:', error);
      return rejectWithValue(error.message || 'Failed to load feedback');
    }
  }
);

// Initial state
const initialState: CoursePreviewState = {
  course: null,
  loading: false,
  error: null,
  studentViewMode: false,
  feedback: [],
  feedbackSyncing: false,
  feedbackSyncError: null,
};

// Slice
const coursePreviewSlice = createSlice({
  name: 'coursePreview',
  initialState,
  reducers: {
    toggleStudentViewMode: (state) => {
      state.studentViewMode = !state.studentViewMode;
    },
    addFeedback: (state, action: PayloadAction<Omit<FeedbackItem, 'id' | 'createdAt'>>) => {
      const newFeedback = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      state.feedback.push(newFeedback);
    },
    removeFeedback: (state, action: PayloadAction<string>) => {
      state.feedback = state.feedback.filter(item => item.id !== action.payload);
    },
    updateFeedback: (state, action: PayloadAction<{ id: string, text: string }>) => {
      const index = state.feedback.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.feedback[index].text = action.payload.text;
      }
    },
    clearFeedback: (state) => {
      state.feedback = [];
    },
    resetCoursePreview: () => initialState,
  },
  extraReducers: (builder) => {
    // Handle fetchCourseById
    builder
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false;
        state.course = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
    // Handle saveFeedback
    builder
      .addCase(saveFeedback.pending, (state) => {
        state.feedbackSyncing = true;
        state.feedbackSyncError = null;
      })
      .addCase(saveFeedback.fulfilled, (state, action) => {
        state.feedbackSyncing = false;
        state.feedback = action.payload;
      })
      .addCase(saveFeedback.rejected, (state, action) => {
        state.feedbackSyncing = false;
        state.feedbackSyncError = action.payload as string;
      })
      
    // Handle loadFeedbackFromStorage
    builder
      .addCase(loadFeedbackFromStorage.fulfilled, (state, action) => {
        state.feedback = action.payload;
      });
  },
});

export const {
  toggleStudentViewMode,
  addFeedback,
  removeFeedback,
  updateFeedback,
  clearFeedback,
  resetCoursePreview,
} = coursePreviewSlice.actions;

export default coursePreviewSlice.reducer;