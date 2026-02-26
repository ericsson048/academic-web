import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Edit, History, Plus, Search, Trash2, X } from 'lucide-react';
import { api, ValidationError } from '../services/apiClient';
import { useI18n } from '../context/I18nContext';

interface PaginatedResponse<T> {
  results: T[];
}

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  class_assigned?: number;
  is_active: boolean;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
  academic_year: string;
}

interface Class {
  id: number;
  name: string;
  level: string;
}

interface GradeRecord {
  id: number;
  student: {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    class_id: number;
    is_active: boolean;
  };
  subject: {
    id: number;
    name: string;
    code: string;
  };
  semester: {
    id: number;
    name: string;
    academic_year: string;
  };
  value: number;
  entered_by: {
    id: number;
    username: string;
    role: string;
  };
  entered_at: string;
  updated_at: string;
}

interface GradeHistoryEntry {
  id: number;
  old_value: number;
  new_value: number;
  modified_by: {
    id: number;
    username: string;
    role: string;
  };
  modified_at: string;
  reason?: string;
}

interface GradeFormData {
  student_id: number;
  subject_id: number;
  semester_id: number;
  value: string;
  reason: string;
}

interface FormErrors {
  [key: string]: string;
}

const DEFAULT_FORM: GradeFormData = {
  student_id: 0,
  subject_id: 0,
  semester_id: 0,
  value: '',
  reason: '',
};

const normalizeCollection = <T,>(data: T[] | PaginatedResponse<T>): T[] =>
  Array.isArray(data) ? data : data.results || [];

export default function Grades() {
  const { t, locale } = useI18n();

  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterSemesterId, setFilterSemesterId] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [formData, setFormData] = useState<GradeFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [historyGrade, setHistoryGrade] = useState<GradeRecord | null>(null);
  const [historyData, setHistoryData] = useState<GradeHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    const [studentsRaw, subjectsRaw, semestersRaw, classesRaw] = await Promise.all([
      api.get<Student[] | PaginatedResponse<Student>>('/students/?page_size=200&is_active=true'),
      api.get<Subject[] | PaginatedResponse<Subject>>('/students/subjects/?page_size=200'),
      api.get<Semester[] | PaginatedResponse<Semester>>('/students/semesters/?page_size=200'),
      api.get<Class[] | PaginatedResponse<Class>>('/students/classes/?page_size=200'),
    ]);

    setStudents(normalizeCollection(studentsRaw));
    setSubjects(normalizeCollection(subjectsRaw));
    setSemesters(normalizeCollection(semestersRaw));
    setClasses(normalizeCollection(classesRaw));
  }, []);

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page_size: '200' });
      if (filterStudentId) params.append('student_id', filterStudentId);
      if (filterSubjectId) params.append('subject_id', filterSubjectId);
      if (filterSemesterId) params.append('semester_id', filterSemesterId);

      const response = await api.get<GradeRecord[] | PaginatedResponse<GradeRecord>>(
        `/grades/?${params.toString()}`
      );
      setGrades(normalizeCollection(response));
    } catch (err: any) {
      setError(err.message || t('grades.list.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [filterSemesterId, filterStudentId, filterSubjectId, t]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await fetchOptions();
        await fetchGrades();
      } catch (err: any) {
        setError(err.message || t('grades.list.loadFailed'));
        setLoading(false);
      }
    };

    initialize();
  }, [fetchGrades, fetchOptions, t]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const filteredGrades = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return grades.filter((grade) => {
      const matchesClass = filterClassId
        ? String(grade.student.class_id) === filterClassId
        : true;
      const matchesSearch = term
        ? [
            grade.student.student_id,
            `${grade.student.first_name} ${grade.student.last_name}`,
            grade.subject.name,
            grade.subject.code,
          ]
            .join(' ')
            .toLowerCase()
            .includes(term)
        : true;

      return matchesClass && matchesSearch;
    });
  }, [grades, filterClassId, searchTerm]);

  const openCreateForm = () => {
    setEditingGrade(null);
    setFormData({
      student_id: filterStudentId ? parseInt(filterStudentId, 10) : 0,
      subject_id: filterSubjectId ? parseInt(filterSubjectId, 10) : 0,
      semester_id: filterSemesterId ? parseInt(filterSemesterId, 10) : 0,
      value: '',
      reason: '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (grade: GradeRecord) => {
    setEditingGrade(grade);
    setFormData({
      student_id: grade.student.id,
      subject_id: grade.subject.id,
      semester_id: grade.semester.id,
      value: String(grade.value),
      reason: '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGrade(null);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};
    const numericValue = Number(formData.value);

    if (!formData.student_id) {
      nextErrors.student_id = t('grades.form.validation.studentRequired');
    }
    if (!formData.subject_id) {
      nextErrors.subject_id = t('grades.form.validation.subjectRequired');
    }
    if (!formData.semester_id) {
      nextErrors.semester_id = t('grades.form.validation.semesterRequired');
    }
    if (formData.value.trim() === '') {
      nextErrors.value = t('grades.form.validation.valueRequired');
    } else if (Number.isNaN(numericValue)) {
      nextErrors.value = t('grades.form.validation.valueNumber');
    } else if (numericValue < 0 || numericValue > 20) {
      nextErrors.value = t('grades.form.validation.valueRange');
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const payload: Record<string, any> = {
      student_id: formData.student_id,
      subject_id: formData.subject_id,
      semester_id: formData.semester_id,
      value: Number(formData.value),
    };

    if (editingGrade && formData.reason.trim()) {
      payload.reason = formData.reason.trim();
    }

    try {
      setSaving(true);
      setFormErrors({});

      if (editingGrade) {
        await api.put(`/grades/${editingGrade.id}/`, payload);
      } else {
        await api.post('/grades/', payload);
      }

      closeForm();
      fetchGrades();
    } catch (err: any) {
      if (err instanceof ValidationError) {
        const nextErrors: FormErrors = {};
        Object.entries(err.fieldErrors || {}).forEach(([key, value]) => {
          nextErrors[key] = Array.isArray(value) ? String(value[0]) : String(value);
        });
        setFormErrors(
          Object.keys(nextErrors).length > 0
            ? nextErrors
            : { general: t('grades.form.saveFailed') }
        );
      } else {
        setFormErrors({ general: err.message || t('grades.form.saveFailed') });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (grade: GradeRecord) => {
    const confirmed = window.confirm(
      t('grades.list.deleteConfirm', {
        student: `${grade.student.first_name} ${grade.student.last_name}`,
        subject: grade.subject.name,
        semester: grade.semester.name,
      })
    );
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/grades/${grade.id}/`);
      fetchGrades();
    } catch (err: any) {
      alert(err.message || t('grades.list.deleteFailed'));
    }
  };

  const openHistory = async (grade: GradeRecord) => {
    setHistoryGrade(grade);
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await api.get<GradeHistoryEntry[]>(`/grades/${grade.id}/history/`);
      setHistoryData(response);
    } catch (err: any) {
      setHistoryError(err.message || t('grades.history.loadFailed'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryGrade(null);
    setHistoryData([]);
    setHistoryError(null);
  };

  if (loading && grades.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E40AF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A] font-['Fira_Code']">
            {t('grades.page.title')}
          </h1>
          <p className="text-slate-600 mt-1 font-['Fira_Sans']">
            {t('grades.page.subtitle')}
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" />
          {t('grades.list.add')}
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('grades.list.search')}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all duration-200 font-['Fira_Sans']"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans']"
          >
            <option value="">{t('grades.filters.allClasses')}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.level}
              </option>
            ))}
          </select>
          <select
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans']"
          >
            <option value="">{t('grades.filters.allStudents')}</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.student_id} - {student.first_name} {student.last_name}
              </option>
            ))}
          </select>
          <select
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans']"
          >
            <option value="">{t('grades.filters.allSubjects')}</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
          <select
            value={filterSemesterId}
            onChange={(e) => setFilterSemesterId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans']"
          >
            <option value="">{t('grades.filters.allSemesters')}</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name} ({semester.academic_year})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-['Fira_Sans']">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        {filteredGrades.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-['Fira_Sans']">{t('grades.list.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('grades.list.student')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('grades.list.subject')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('grades.list.semester')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('grades.list.value')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('grades.list.updated')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('grades.list.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm text-slate-800 font-['Fira_Sans']">
                      <div className="font-semibold text-[#1E3A8A]">{grade.student.student_id}</div>
                      <div>
                        {grade.student.first_name} {grade.student.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-['Fira_Sans']">
                      {grade.subject.name} ({grade.subject.code})
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-['Fira_Sans']">
                      {grade.semester.name} ({grade.semester.academic_year})
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#1E40AF] font-['Fira_Code']">
                      {Number(grade.value).toFixed(2)} / 20
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-['Fira_Sans']">
                      {new Date(grade.updated_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openHistory(grade)}
                          className="text-slate-600 hover:text-slate-900 transition-colors duration-150 cursor-pointer p-2 hover:bg-slate-100 rounded"
                          title={t('grades.list.history')}
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditForm(grade)}
                          className="text-[#1E40AF] hover:text-[#3B82F6] transition-colors duration-150 cursor-pointer p-2 hover:bg-blue-50 rounded"
                          title={t('grades.list.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(grade)}
                          className="text-red-600 hover:text-red-800 transition-colors duration-150 cursor-pointer p-2 hover:bg-red-50 rounded"
                          title={t('grades.list.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold text-[#1E3A8A] font-['Fira_Code']">
                {editingGrade ? t('grades.form.editTitle') : t('grades.form.addTitle')}
              </h2>
              <button
                onClick={closeForm}
                className="text-slate-400 hover:text-slate-600 transition-colors duration-150 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 font-['Fira_Sans']">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{formErrors.general}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                    {t('grades.form.student')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.student_id}
                    onChange={(e) =>
                      setFormData({ ...formData, student_id: Number(e.target.value) })
                    }
                    disabled={!!editingGrade}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
                      formErrors.student_id ? 'border-red-500' : 'border-slate-300'
                    } ${editingGrade ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                  >
                    <option value={0}>{t('grades.form.selectStudent')}</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.student_id} - {student.first_name} {student.last_name}
                      </option>
                    ))}
                  </select>
                  {formErrors.student_id && (
                    <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                      {formErrors.student_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                    {t('grades.form.subject')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) =>
                      setFormData({ ...formData, subject_id: Number(e.target.value) })
                    }
                    disabled={!!editingGrade}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
                      formErrors.subject_id ? 'border-red-500' : 'border-slate-300'
                    } ${editingGrade ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                  >
                    <option value={0}>{t('grades.form.selectSubject')}</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                  {formErrors.subject_id && (
                    <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                      {formErrors.subject_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                    {t('grades.form.semester')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.semester_id}
                    onChange={(e) =>
                      setFormData({ ...formData, semester_id: Number(e.target.value) })
                    }
                    disabled={!!editingGrade}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
                      formErrors.semester_id ? 'border-red-500' : 'border-slate-300'
                    } ${editingGrade ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                  >
                    <option value={0}>{t('grades.form.selectSemester')}</option>
                    {semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name} ({semester.academic_year})
                      </option>
                    ))}
                  </select>
                  {formErrors.semester_id && (
                    <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                      {formErrors.semester_id}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                  {t('grades.form.value')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Code'] ${
                    formErrors.value ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="15.50"
                />
                {formErrors.value && (
                  <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">{formErrors.value}</p>
                )}
              </div>

              {editingGrade && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                    {t('grades.form.reason')}
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Sans']"
                    placeholder={t('grades.form.reasonPlaceholder')}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 cursor-pointer font-['Fira_Sans'] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('grades.form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#F59E0B] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {saving
                    ? t('grades.form.saving')
                    : editingGrade
                    ? t('grades.form.update')
                    : t('grades.form.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyGrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1E3A8A] font-['Fira_Code']">
                {t('grades.history.title')}
              </h2>
              <button
                onClick={closeHistory}
                className="text-slate-400 hover:text-slate-600 transition-colors duration-150 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF]"></div>
                </div>
              ) : historyError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-['Fira_Sans']">
                  {historyError}
                </div>
              ) : historyData.length === 0 ? (
                <p className="text-slate-500 font-['Fira_Sans']">{t('grades.history.empty')}</p>
              ) : (
                historyData.map((entry) => (
                  <div key={entry.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 font-['Fira_Sans']">
                        {entry.modified_by?.username || t('grades.history.unknownUser')}
                      </p>
                      <p className="text-xs text-slate-500 font-['Fira_Sans']">
                        {new Date(entry.modified_at).toLocaleString(
                          locale === 'fr' ? 'fr-FR' : 'en-US'
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 mt-2 font-['Fira_Sans']">
                      {t('grades.history.changedFromTo', {
                        old: Number(entry.old_value).toFixed(2),
                        new: Number(entry.new_value).toFixed(2),
                      })}
                    </p>
                    {entry.reason && (
                      <p className="text-sm text-slate-600 mt-1 font-['Fira_Sans']">
                        {t('grades.history.reason')}: {entry.reason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
