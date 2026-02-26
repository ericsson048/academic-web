import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { api, ValidationError } from '../../services/apiClient';
import { useI18n } from '../../context/I18nContext';
import type { Student, StudentFormData, Class } from '../../types/student';

interface StudentFormProps {
  student?: Student | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export default function StudentForm({ student, onSuccess, onCancel }: StudentFormProps) {
  const { t } = useI18n();
  const isEdit = !!student;

  // Form state
  const [formData, setFormData] = useState<StudentFormData>({
    student_id: student?.student_id || '',
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    class_assigned: student?.class_assigned || 0,
    enrollment_date: student?.enrollment_date || '',
    photo: null,
    is_active: student?.is_active ?? true,
  });

  const [classes, setClasses] = useState<Class[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    student?.photo || null
  );

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get<Class[]>('/classes/');
        setClasses(response);
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };

    fetchClasses();
  }, []);

  // Client-side validation
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.student_id.trim()) {
      newErrors.student_id = t('students.form.validation.studentId');
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('students.form.validation.firstName');
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t('students.form.validation.lastName');
    }

    if (!formData.class_assigned || formData.class_assigned === 0) {
      newErrors.class_assigned = t('students.form.validation.class');
    }

    if (!formData.enrollment_date) {
      newErrors.enrollment_date = t('students.form.validation.enrollmentDate');
    }

    // Validate photo file if provided
    if (formData.photo) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

      if (formData.photo.size > maxSize) {
        newErrors.photo = t('students.form.validation.photoSize');
      }

      if (!allowedTypes.includes(formData.photo.type)) {
        newErrors.photo = t('students.form.validation.photoType');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle photo upload
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, photo: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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

    try {
      // Prepare form data for multipart/form-data
      const submitData = new FormData();
      submitData.append('student_id', formData.student_id);
      submitData.append('first_name', formData.first_name);
      submitData.append('last_name', formData.last_name);
      submitData.append('class_assigned', formData.class_assigned.toString());
      submitData.append('enrollment_date', formData.enrollment_date);
      submitData.append('is_active', formData.is_active.toString());

      if (formData.photo) {
        submitData.append('photo', formData.photo);
      }

      if (isEdit && student) {
        // Update existing student
        await api.put(`/students/${student.id}/`, submitData, {
          headers: {
            // Let browser set Content-Type with boundary for multipart/form-data
            'Content-Type': undefined as any,
          },
        });
      } else {
        // Create new student
        await api.post('/students/', submitData, {
          headers: {
            'Content-Type': undefined as any,
          },
        });
      }

      onSuccess();
    } catch (err: any) {
      if (err instanceof ValidationError) {
        // Server-side validation errors
        setErrors(err.data);
      } else {
          // Generic error
          setErrors({
            general: err.message || t('students.form.saveFailed'),
          });
      }
      console.error('Error saving student:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#1E3A8A] font-['Fira_Code']">
            {isEdit ? t('students.form.editTitle') : t('students.form.addTitle')}
          </h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors duration-150 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 font-['Fira_Sans']">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
              {t('students.form.photo')}
            </label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                    alt={t('students.form.photoAlt')}
                  className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-block px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 cursor-pointer font-['Fira_Sans']"
                >
                  {t('students.form.choosePhoto')}
                </label>
                <p className="text-xs text-slate-500 mt-2 font-['Fira_Sans']">
                  {t('students.form.photoHelp')}
                </p>
              </div>
            </div>
            {errors.photo && (
              <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">{errors.photo}</p>
            )}
          </div>

          {/* Student ID */}
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                {t('students.form.studentId')} <span className="text-red-500">*</span>
              </label>
            <input
              type="text"
              value={formData.student_id}
              onChange={(e) =>
                setFormData({ ...formData, student_id: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Code'] ${
                errors.student_id ? 'border-red-500' : 'border-slate-300'
              }`}
                placeholder="ex: STU2024001"
              disabled={isEdit} // Student ID cannot be changed
            />
            {errors.student_id && (
              <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                {errors.student_id}
              </p>
            )}
          </div>

          {/* First Name and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                {t('students.form.firstName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Sans'] ${
                  errors.first_name ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Jean"
              />
              {errors.first_name && (
                <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                  {errors.first_name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                {t('students.form.lastName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Sans'] ${
                  errors.last_name ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Dupont"
              />
              {errors.last_name && (
                <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                  {errors.last_name}
                </p>
              )}
            </div>
          </div>

          {/* Class and Enrollment Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                {t('students.form.class')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.class_assigned}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    class_assigned: parseInt(e.target.value),
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
                  errors.class_assigned ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value={0}>{t('students.form.selectClass')}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.level} ({cls.academic_year})
                  </option>
                ))}
              </select>
              {errors.class_assigned && (
                <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                  {errors.class_assigned}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                {t('students.form.enrollmentDate')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.enrollment_date}
                onChange={(e) =>
                  setFormData({ ...formData, enrollment_date: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Sans'] ${
                  errors.enrollment_date ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.enrollment_date && (
                <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                  {errors.enrollment_date}
                </p>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="w-4 h-4 text-[#1E40AF] border-slate-300 rounded focus:ring-[#1E40AF] cursor-pointer"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-slate-700 cursor-pointer font-['Fira_Sans']"
            >
              {t('students.form.activeStudent')}
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 cursor-pointer font-['Fira_Sans'] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('students.form.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#F59E0B] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? t('students.form.saving') : isEdit ? t('students.form.update') : t('students.form.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
