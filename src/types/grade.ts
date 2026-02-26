/**
 * Type definitions for Grade-related entities
 */

export interface Subject {
  id: number;
  name: string;
  code: string;
  coefficient: number;
  description?: string;
  created_at?: string;
}

export interface Semester {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  academic_year: string;
  is_current: boolean;
  created_at?: string;
}

export interface Grade {
  id: number;
  student: number;
  subject: number;
  semester: number;
  value: number;
  entered_by: number;
  entered_at: string;
  updated_at: string;
  // Nested data for display
  student_name?: string;
  subject_name?: string;
  semester_name?: string;
}

export interface GradeFormData {
  student: number;
  subject: number;
  semester: number;
  value: string;
}

export interface GradeHistory {
  id: number;
  grade: number;
  old_value: number;
  new_value: number;
  modified_by: number;
  modified_at: string;
  reason?: string;
  // Nested data
  modified_by_name?: string;
}

export interface BulkGradeEntry {
  student_id: number;
  student_name: string;
  value: string;
  error?: string;
}
