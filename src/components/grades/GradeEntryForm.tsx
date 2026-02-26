import { useState, useEffect, FormEvent } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { api, ValidationError } from '../../services/apiClient';
import type { Grade, GradeFormData, Subject, Semester } from '../../types/grade';

interface GradeEntryFormProps {
  grade?: Grade | null;
  studentId?: number;
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

export default function GradeEntryForm({
  grade,
  studentId,
  subjectId,
  semesterId,
  onSuccess,
  onCancel,
}: GradeEntryFormProps) {
  const isEdit = !!grade;

  // Form state
  const [formData, setFormData] = useState<GradeFormData>({
    student: grade?.student || studentId || 0,
    subject: grade?.subject || subjectId || 0,
    semester: grade?.semester || semesterId || 0,
    value: grade?.value?.toString() || '',
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch subjects and semesters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsData, semestersData] = await Promise.all([
          api.get<Subject[] | PaginatedResponse<Subject>>('/students/subjects/?page_size=200'),
          api.get<Semester[] | PaginatedResponse<Semester>>('/students/semesters/?page_size=200'),
        ]);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : subjectsData.results || []);
        setSemesters(Array.isArray(semestersData) ? semestersData : semestersData.results || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  // Client-side validation
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.student || formData.student === 0) {
      newErrors.student = 'Student is required';
    }

    if (!formData.subject || formData.subject === 0) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.semester || formData.semester === 0) {
      newErrors.semester = 'Semester is required';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Grade value is required';
    } else {
      const numValue = parseFloat(formData.value);
      if (isNaN(numValue)) {
        newErrors.value = 'Grade must be a valid number';
      } else if (numValue < 0 || numValue > 20) {
        newErrors.value = 'Grade must be between 0 and 20';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time value validation
  const handleValueChange = (value: string) => {
    setFormData({ ...formData, value });

    // Clear previous error
    if (errors.value) {
      setErrors({ ...errors, value: '' });
    }

    // Real-time validation feedback
    if (value.trim()) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        if (numValue < 0 || numValue > 20) {
          setErrors({ ...errors, value: 'Grade must be between 0 and 20' });
        }
      } else {
        setErrors({ ...errors, value: 'Grade must be a valid number' });
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess(false);

    try {
      const submitData = {
        student: formData.student,
        subject: formData.subject,
        semester: formData.semester,
        value: parseFloat(formData.value),
      };

      if (isEdit && grade) {
        // Update existing grade
        await api.put(`/grades/${grade.id}/`, submitData);
      } else {
        // Create new grade
        await api.post('/grades/', submitData);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      if (err instanceof ValidationError) {
        // Server-side validation errors
        setErrors(err.data);
      } else {
        // Generic error
        setErrors({
          general: err.message || 'Failed to save grade',
        });
      }
      console.error('Error saving grade:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get validation status for value input
  const getValueInputClass = () => {
    const baseClass =
      'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 font-["Fira_Code"] text-lg';

    if (errors.value) {
      return `${baseClass} border-red-500 focus:ring-red-500`;
    }

    if (formData.value.trim()) {
      const numValue = parseFloat(formData.value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
        return `${baseClass} border-green-500 focus:ring-green-500`;
      }
    }

    return `${baseClass} border-slate-300 focus:ring-[#1E40AF]`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-[#1E3A8A] font-['Fira_Code']">
            {isEdit ? 'Edit Grade' : 'Enter Grade'}
          </h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors duration-150 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2 font-['Fira_Sans']">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Grade saved successfully!</span>
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 font-['Fira_Sans']">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: parseInt(e.target.value) })
              }
              disabled={!!subjectId || isEdit}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
                errors.subject ? 'border-red-500' : 'border-slate-300'
              } ${(subjectId || isEdit) && 'bg-slate-50 cursor-not-allowed'}`}
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

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.semester}
              onChange={(e) =>
                setFormData({ ...formData, semester: parseInt(e.target.value) })
              }
              disabled={!!semesterId || isEdit}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
                errors.semester ? 'border-red-500' : 'border-slate-300'
              } ${(semesterId || isEdit) && 'bg-slate-50 cursor-not-allowed'}`}
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

          {/* Grade Value */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
              Grade (0-20) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="20"
              value={formData.value}
              onChange={(e) => handleValueChange(e.target.value)}
              className={getValueInputClass()}
              placeholder="e.g., 15.50"
              autoFocus
            />
            {errors.value ? (
              <p className="text-red-600 text-sm mt-1 font-['Fira_Sans'] flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.value}
              </p>
            ) : (
              <p className="text-slate-500 text-sm mt-1 font-['Fira_Sans']">
                Enter a value between 0 and 20
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading || success}
              className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 cursor-pointer font-['Fira_Sans'] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-6 py-2 bg-[#F59E0B] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Saving...' : success ? 'Saved!' : isEdit ? 'Update Grade' : 'Save Grade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
