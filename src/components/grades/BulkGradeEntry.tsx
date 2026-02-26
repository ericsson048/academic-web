import { useState, useEffect, FormEvent } from 'react';
import { X, AlertCircle, CheckCircle, Loader, Save } from 'lucide-react';
import { api, ValidationError } from '../../services/apiClient';
import type { BulkGradeEntry, Subject, Semester } from '../../types/grade';

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
}

interface BulkGradeEntryProps {
  classId: number;
  subjectId?: number;
  semesterId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  [key: string]: string;
}

interface PaginatedResponse<T> {
  results: T[];
}

export default function BulkGradeEntryComponent({
  classId,
  subjectId,
  semesterId,
  onSuccess,
  onCancel,
}: BulkGradeEntryProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<number>(subjectId || 0);
  const [selectedSemester, setSelectedSemester] = useState<number>(semesterId || 0);
  
  const [grades, setGrades] = useState<BulkGradeEntry[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsData, subjectsData, semestersData] = await Promise.all([
          api.get<PaginatedResponse<Student> | Student[]>(
            `/students/?class_id=${classId}&is_active=true&page_size=200`
          ),
          api.get<Subject[] | PaginatedResponse<Subject>>('/students/subjects/?page_size=200'),
          api.get<Semester[] | PaginatedResponse<Semester>>('/students/semesters/?page_size=200'),
        ]);

        const normalizedStudents = Array.isArray(studentsData)
          ? studentsData
          : studentsData.results || [];
        const normalizedSubjects = Array.isArray(subjectsData)
          ? subjectsData
          : subjectsData.results || [];
        const normalizedSemesters = Array.isArray(semestersData)
          ? semestersData
          : semestersData.results || [];

        setStudents(normalizedStudents);
        setSubjects(normalizedSubjects);
        setSemesters(normalizedSemesters);
        
        // Initialize grades array
        setGrades(
          normalizedStudents.map((student) => ({
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            value: '',
          }))
        );
      } catch (err) {
        console.error('Error fetching data:', err);
        setErrors({ general: 'Failed to load students' });
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchData();
  }, [classId]);

  // Update grade value for a student
  const updateGradeValue = (studentId: number, value: string) => {
    setGrades((prev) =>
      prev.map((grade) => {
        if (grade.student_id === studentId) {
          // Validate value
          let error: string | undefined;
          if (value.trim()) {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              error = 'Invalid number';
            } else if (numValue < 0 || numValue > 20) {
              error = 'Must be 0-20';
            }
          }
          return { ...grade, value, error };
        }
        return grade;
      })
    );
  };

  // Validate all grades
  const validateGrades = (): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedSubject || selectedSubject === 0) {
      newErrors.subject = 'Subject is required';
    }

    if (!selectedSemester || selectedSemester === 0) {
      newErrors.semester = 'Semester is required';
    }

    // Check if at least one grade is entered
    const hasGrades = grades.some((g) => g.value.trim() !== '');
    if (!hasGrades) {
      newErrors.general = 'Please enter at least one grade';
    }

    // Check for validation errors in individual grades
    const hasInvalidGrades = grades.some((g) => g.error);
    if (hasInvalidGrades) {
      newErrors.general = 'Please fix validation errors before submitting';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateGrades()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess(false);

    // Filter grades with values
    const gradesToSubmit = grades
      .filter((g) => g.value.trim() !== '' && !g.error)
      .map((g) => ({
        student: g.student_id,
        subject: selectedSubject,
        semester: selectedSemester,
        value: parseFloat(g.value),
      }));

    setProgress({ current: 0, total: gradesToSubmit.length });

    try {
      // Submit grades in bulk
      await api.post('/grades/bulk/', { grades: gradesToSubmit });
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      if (err instanceof ValidationError) {
        // Handle bulk validation errors
        const errorData = err.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Map errors back to students
          setGrades((prev) =>
            prev.map((grade, index) => {
              const error = errorData.errors[index];
              return error ? { ...grade, error: error.value?.[0] || 'Error' } : grade;
            })
          );
        }
        setErrors({ general: errorData.message || 'Validation failed' });
      } else {
        setErrors({
          general: err.message || 'Failed to save grades',
        });
      }
      console.error('Error saving grades:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingStudents) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-[#1E40AF] animate-spin" />
          <p className="text-slate-600 font-['Fira_Sans']">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#1E3A8A] font-['Fira_Code']">
              Bulk Grade Entry
            </h2>
            <p className="text-sm text-slate-600 font-['Fira_Sans'] mt-1">
              {students.length} students in class
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors duration-150 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 flex-shrink-0">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2 font-['Fira_Sans']">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>All grades saved successfully!</span>
              </div>
            )}

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 font-['Fira_Sans']">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Subject and Semester Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(parseInt(e.target.value))}
                  disabled={!!subjectId || loading}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
                    errors.subject ? 'border-red-500' : 'border-slate-300'
                  } ${subjectId && 'bg-slate-50 cursor-not-allowed'}`}
                >
                  <option value={0}>Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                    {errors.subject}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                  disabled={!!semesterId || loading}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
                    errors.semester ? 'border-red-500' : 'border-slate-300'
                  } ${semesterId && 'bg-slate-50 cursor-not-allowed'}`}
                >
                  <option value={0}>Select a semester</option>
                  {semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name} ({semester.academic_year})
                    </option>
                  ))}
                </select>
                {errors.semester && (
                  <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                    {errors.semester}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Grades Table */}
          <div className="flex-1 overflow-y-auto px-6">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 font-['Fira_Sans']">
                    Student ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 font-['Fira_Sans']">
                    Student Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 font-['Fira_Sans'] w-32">
                    Grade (0-20)
                  </th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade, index) => {
                  const student = students.find((s) => s.id === grade.student_id);
                  return (
                    <tr
                      key={grade.student_id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="py-3 px-4 text-sm font-['Fira_Code'] text-slate-600">
                        {student?.student_id}
                      </td>
                      <td className="py-3 px-4 text-sm font-['Fira_Sans'] text-slate-700">
                        {grade.student_name}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          value={grade.value}
                          onChange={(e) =>
                            updateGradeValue(grade.student_id, e.target.value)
                          }
                          disabled={loading || success}
                          className={`w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 font-['Fira_Code'] text-sm ${
                            grade.error
                              ? 'border-red-500 focus:ring-red-500'
                              : grade.value.trim() &&
                                !isNaN(parseFloat(grade.value)) &&
                                parseFloat(grade.value) >= 0 &&
                                parseFloat(grade.value) <= 20
                              ? 'border-green-500 focus:ring-green-500'
                              : 'border-slate-300 focus:ring-[#1E40AF]'
                          } disabled:bg-slate-50 disabled:cursor-not-allowed`}
                          placeholder="--"
                        />
                        {grade.error && (
                          <p className="text-red-600 text-xs mt-1 font-['Fira_Sans']">
                            {grade.error}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Progress Bar */}
          {loading && progress.total > 0 && (
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <Loader className="w-5 h-5 text-[#1E40AF] animate-spin flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1E40AF] transition-all duration-300"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm text-slate-600 font-['Fira_Sans']">
                  {progress.current} / {progress.total}
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <p className="text-sm text-slate-600 font-['Fira_Sans']">
              {grades.filter((g) => g.value.trim() !== '').length} grades entered
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading || success}
                className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-all duration-200 cursor-pointer font-['Fira_Sans'] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="px-6 py-2 bg-[#F59E0B] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save All Grades
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
