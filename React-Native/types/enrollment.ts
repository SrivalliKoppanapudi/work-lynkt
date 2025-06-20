// Enrollment types
export interface Student {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  enrollmentDate: Date;
  status: EnrollmentStatus;
  progress: number;
  lastActive?: Date;
  completedModules?: number;
  totalModules?: number;
  courseId?: number;
}

export type EnrollmentStatus = 'active' | 'inactive' | 'completed' | 'dropped';

export interface EnrollmentStats {
  totalEnrollments: number;
  activeStudents: number;
  completedStudents: number;
  droppedStudents: number;
  averageProgress: number;
}

export interface EnrollmentFilters {
  status?: EnrollmentStatus | 'all';
  searchQuery?: string;
  sortBy?: 'name' | 'enrollmentDate' | 'progress' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
}

export interface InviteStudentData {
  courseId: string;
  emails: string[];
  message?: string;
}