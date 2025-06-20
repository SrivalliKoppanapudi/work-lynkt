import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/Superbase';
import { Student, EnrollmentStatus, EnrollmentStats, EnrollmentFilters, InviteStudentData } from '../../types/enrollment';

// Define the initial state
interface EnrollmentState {
  students: Student[];
  filteredStudents: Student[];
  selectedCourseId: string | null;
  stats: EnrollmentStats;
  filters: EnrollmentFilters;
  loading: boolean;
  error: string | null;
  inviteStatus: 'idle' | 'loading' | 'success' | 'failed';
  inviteError: string | null;
}

const initialState: EnrollmentState = {
  students: [],
  filteredStudents: [],
  selectedCourseId: null,
  stats: {
    totalEnrollments: 0,
    activeStudents: 0,
    completedStudents: 0,
    droppedStudents: 0,
    averageProgress: 0,
  },
  filters: {
    status: 'all',
    searchQuery: '',
    sortBy: 'enrollmentDate',
    sortOrder: 'desc',
  },
  loading: false,
  error: null,
  inviteStatus: 'idle',
  inviteError: null,
};

// Helper function to get course UUID
async function getCourseUUID(courseId: string | number): Promise<string> {
  // Convert to string if it's a number
  const courseIdStr = typeof courseId === 'number' ? courseId.toString() : courseId;
  
  // If it's already a UUID format, return as is
  if (typeof courseIdStr === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseIdStr)) {
    return courseIdStr;
  }

  // Otherwise, try to fetch the course to get its UUID
  try {
    console.log('Fetching UUID for course ID:', courseIdStr);
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseIdStr)
      .single();

    if (error) {
      console.error('Error in getCourseUUID query:', error);
      throw error;
    }
    if (!data) {
      console.error('Course not found for ID:', courseIdStr);
      throw new Error('Course not found');
    }

    console.log('Found course UUID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error fetching course UUID:', error);
    throw error;
  }
}

// Async thunks for API calls
export const fetchEnrollments = createAsyncThunk(
  'enrollment/fetchEnrollments',
  async (courseId: string | number, { rejectWithValue }) => {
    try {
      console.log('Fetching enrollments for course ID:', courseId);
      
      // Get the actual course UUID
      const actualCourseId = await getCourseUUID(courseId);
      console.log('Using actual course UUID:', actualCourseId);
      
      // Fetch enrollments from Supabase
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          student_id,
          status,
          enrollment_date,
          progress,
          last_active,
          created_at,
          updated_at
        `)
        .eq('course_id', actualCourseId);

      if (enrollmentsError) throw enrollmentsError;
      
      console.log('Enrollment data:', enrollments);

      // If no enrollments, return empty
      if (!enrollments || enrollments.length === 0) {
        console.log('No enrollments found for this course');
        return { 
          students: [], 
          stats: {
            totalEnrollments: 0,
            activeStudents: 0,
            completedStudents: 0,
            droppedStudents: 0,
            averageProgress: 0,
          } 
        };
      }

      // Get student details for these enrollments
      const studentIds = enrollments.map(e => e.student_id);
      console.log('Student IDs from enrollments:', studentIds);
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', studentIds);

      if (studentsError) {
        console.error('Error fetching student profiles:', studentsError);
        throw studentsError;
      }
      
      console.log('Student profiles data:', studentsData);

      // Create a map of student details for quick lookup
      const studentsMap = new Map();
      if (!studentsData || studentsData.length === 0) {
        console.warn('No student profiles found for the enrolled students');
      }
      
      studentsData?.forEach(student => {
        console.log('Mapping student profile:', student.id, student.full_name);
        studentsMap.set(student.id, {
          name: student.full_name,
          email: student.email,
          profilePicture: student.avatar_url
        });
      });
      
      console.log('Student map size:', studentsMap.size);

      // Map enrollments to students
      console.log('Mapping enrollments to students...');
      const students: Student[] = [];
      
      enrollments.forEach(enrollment => {
        console.log('Processing enrollment for student ID:', enrollment.student_id);
        
        // Check if we have student info for this enrollment
        if (!enrollment.student_id) {
          console.warn('Enrollment missing student_id:', enrollment);
          return; // Skip this enrollment
        }
        
        const studentInfo = studentsMap.get(enrollment.student_id);
        if (!studentInfo) {
          console.warn(`No profile found for student ID: ${enrollment.student_id}`);
        }
        
        // Create student object even if profile is missing
        const studentData = {
          id: enrollment.student_id,
          name: studentInfo?.name || 'Unknown Student',
          email: studentInfo?.email || '',
          profilePicture: studentInfo?.profilePicture || '',
          enrollmentDate: new Date(enrollment.enrollment_date || enrollment.created_at),
          status: enrollment.status as EnrollmentStatus || 'active',
          progress: enrollment.progress || 0,
          lastActive: enrollment.last_active ? new Date(enrollment.last_active) : undefined,
          completedModules: 0,
          totalModules: 0,
        };
        
        console.log('Created student object:', studentData.id, studentData.name);
        students.push(studentData);
      });
      
      console.log('Total students mapped:', students.length);

      // Calculate stats
      const stats: EnrollmentStats = {
        totalEnrollments: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        completedStudents: students.filter(s => s.status === 'completed').length,
        droppedStudents: students.filter(s => s.status === 'dropped').length,
        averageProgress: students.length > 0 
          ? students.reduce((sum, student) => sum + student.progress, 0) / students.length 
          : 0,
      };

      return { students, stats };
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      return rejectWithValue(error.message || 'Failed to fetch enrollments');
    }
  }
);

export const updateEnrollmentStatus = createAsyncThunk(
  'enrollment/updateStatus',
  async ({ studentId, courseId, status }: { studentId: string; courseId: number | string; status: EnrollmentStatus }, { rejectWithValue }) => {
    try {
      const actualCourseId = await getCourseUUID(courseId);
      
      const { error } = await supabase
        .from('enrollments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('student_id', studentId)
        .eq('course_id', actualCourseId);

      if (error) throw error;

      return { studentId, status };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update enrollment status');
    }
  }
);

export const inviteStudents = createAsyncThunk(
  'enrollment/inviteStudents',
  async (inviteData: InviteStudentData, { rejectWithValue }) => {
    try {
      const actualCourseId = await getCourseUUID(inviteData.courseId);
      
      const { error } = await supabase.rpc('invite_students_to_course', {
        p_course_id: actualCourseId,
        p_emails: inviteData.emails,
        p_message: inviteData.message || ''
      });

      if (error) throw error;

      return { success: true, emails: inviteData.emails };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to invite students');
    }
  }
);

export const addTestEnrollments = createAsyncThunk(
  'enrollment/addTestEnrollments',
  async (courseId: number | string, { rejectWithValue }) => {
    try {
      console.log('Adding test enrollments for course ID:', courseId);
      
      const actualCourseId = await getCourseUUID(courseId);
      console.log('Using actual course UUID:', actualCourseId);
      
      // Sample test data
      const testEnrollments = [
        {
          course_id: actualCourseId,
          student_id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'active',
          enrollment_date: new Date().toISOString(),
          progress: 25,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
      ];
      
      const { data, error } = await supabase
        .from('enrollments')
        .insert(testEnrollments)
        .select();
        
      if (error) throw error;
      
      console.log('Added test enrollments:', data);
      
      return { count: testEnrollments.length };
    } catch (error: any) {
      console.error('Error adding test enrollments:', error);
      return rejectWithValue(error.message || 'Failed to add test enrollments');
    }
  }
);

// Create the slice
const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState,
  reducers: {
    setCourseId: (state, action: PayloadAction<string>) => {
      state.selectedCourseId = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<EnrollmentFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      
      // Apply filters and sorting to the students array
      let filtered = [...state.students];
      
      // Filter by status
      if (state.filters.status && state.filters.status !== 'all') {
        filtered = filtered.filter(student => student.status === state.filters.status);
      }
      
      // Filter by search query
      if (state.filters.searchQuery) {
        const query = state.filters.searchQuery.toLowerCase();
        filtered = filtered.filter(student => 
          student.name.toLowerCase().includes(query) || 
          student.email.toLowerCase().includes(query)
        );
      }
      
      // Sort the results
      if (state.filters.sortBy) {
        filtered.sort((a, b) => {
          const sortOrder = state.filters.sortOrder === 'asc' ? 1 : -1;
          
          switch (state.filters.sortBy) {
            case 'name':
              return sortOrder * a.name.localeCompare(b.name);
            case 'enrollmentDate':
              return sortOrder * (a.enrollmentDate.getTime() - b.enrollmentDate.getTime());
            case 'progress':
              return sortOrder * (a.progress - b.progress);
            case 'lastActive':
              if (!a.lastActive) return sortOrder;
              if (!b.lastActive) return -sortOrder;
              return sortOrder * (a.lastActive.getTime() - b.lastActive.getTime());
            default:
              return 0;
          }
        });
      }
      
      state.filteredStudents = filtered;
    },
    clearFilters: (state) => {
      state.filters = {
        status: 'all',
        searchQuery: '',
        sortBy: 'enrollmentDate',
        sortOrder: 'desc',
      };
      state.filteredStudents = state.students;
    },
    resetInviteStatus: (state) => {
      state.inviteStatus = 'idle';
      state.inviteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchEnrollments
      .addCase(fetchEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.students;
        state.filteredStudents = action.payload.students;
        state.stats = action.payload.stats;
      })
      .addCase(fetchEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Handle updateEnrollmentStatus
      .addCase(updateEnrollmentStatus.fulfilled, (state, action) => {
        const { studentId, status } = action.payload;
        
        // Update the student in both arrays
        const updateStudent = (student: Student) => {
          if (student.id === studentId) {
            return { ...student, status };
          }
          return student;
        };
        
        state.students = state.students.map(updateStudent);
        state.filteredStudents = state.filteredStudents.map(updateStudent);
        
        // Update stats
        state.stats = {
          totalEnrollments: state.students.length,
          activeStudents: state.students.filter(s => s.status === 'active').length,
          completedStudents: state.students.filter(s => s.status === 'completed').length,
          droppedStudents: state.students.filter(s => s.status === 'dropped').length,
          averageProgress: state.students.length > 0 
            ? state.students.reduce((sum, student) => sum + student.progress, 0) / state.students.length 
            : 0,
        };
      })
      
      // Handle inviteStudents
      .addCase(inviteStudents.pending, (state) => {
        state.inviteStatus = 'loading';
        state.inviteError = null;
      })
      .addCase(inviteStudents.fulfilled, (state) => {
        state.inviteStatus = 'success';
      })
      .addCase(inviteStudents.rejected, (state, action) => {
        state.inviteStatus = 'failed';
        state.inviteError = action.payload as string;
      })
      
      // Handle addTestEnrollments
      .addCase(addTestEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTestEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        console.log(`Added ${action.payload.count} test enrollments`);
      })
      .addCase(addTestEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCourseId, setFilters, clearFilters, resetInviteStatus } = enrollmentSlice.actions;

export default enrollmentSlice.reducer;