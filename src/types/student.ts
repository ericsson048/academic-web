/**
 * Student-related TypeScript types for APAS
 */

export interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  class_assigned: number;
  class_name?: string;
  enrollment_date: string;
  photo?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudentFormData {
  student_id: string;
  first_name: string;
  last_name: string;
  class_assigned: number;
  enrollment_date: string;
  photo?: File | null;
  is_active?: boolean;
}

export interface StudentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Student[];
}

export interface StudentPerformance {
  average: number;
  rank: number | null;
  progression_percentage: number | null;
  total_students?: number;
}

export interface Class {
  id: number;
  name: string;
  level: string;
  academic_year: string;
}
