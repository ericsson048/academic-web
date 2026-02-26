import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { api, ValidationError } from '../services/apiClient';

interface Semester {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  academic_year: string;
  is_current: boolean;
  created_at?: string;
}

interface PaginatedResponse<T> {
  results: T[];
}

interface SemesterFormData {
  name: string;
  start_date: string;
  end_date: string;
  academic_year: string;
  is_current: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const DEFAULT_FORM: SemesterFormData = {
  name: '',
  start_date: '',
  end_date: '',
  academic_year: '',
  is_current: false,
};

export default function Semesters() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isAdmin = user?.role === 'admin';

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [formData, setFormData] = useState<SemesterFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const fetchSemesters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Semester[] | PaginatedResponse<Semester>>(
        '/students/semesters/?page_size=200'
      );
      setSemesters(Array.isArray(response) ? response : response.results || []);
    } catch (err: any) {
      setError(err.message || t('semesters.list.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  const filteredSemesters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return semesters;
    }
    return semesters.filter((semester) =>
      [semester.name, semester.academic_year].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [semesters, searchTerm]);

  const resetForm = () => {
    setEditingSemester(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester);
    setFormData({
      name: semester.name,
      start_date: semester.start_date,
      end_date: semester.end_date,
      academic_year: semester.academic_year,
      is_current: semester.is_current,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = t('semesters.form.validation.nameRequired');
    }

    if (!formData.academic_year.trim()) {
      nextErrors.academic_year = t('semesters.form.validation.academicYearRequired');
    } else if (!/^\d{4}-\d{4}$/.test(formData.academic_year.trim())) {
      nextErrors.academic_year = t('semesters.form.validation.academicYearFormat');
    }

    if (!formData.start_date) {
      nextErrors.start_date = t('semesters.form.validation.startDateRequired');
    }

    if (!formData.end_date) {
      nextErrors.end_date = t('semesters.form.validation.endDateRequired');
    }

    if (formData.start_date && formData.end_date && formData.end_date <= formData.start_date) {
      nextErrors.end_date = t('semesters.form.validation.dateRange');
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setFormErrors({ general: t('semesters.list.onlyAdminEdit') });
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      start_date: formData.start_date,
      end_date: formData.end_date,
      academic_year: formData.academic_year.trim(),
      is_current: formData.is_current,
    };

    try {
      setSaving(true);
      setFormErrors({});

      if (editingSemester) {
        await api.put(`/students/semesters/${editingSemester.id}/`, payload);
      } else {
        await api.post('/students/semesters/', payload);
      }

      handleCloseForm();
      fetchSemesters();
    } catch (err: any) {
      if (err instanceof ValidationError) {
        const nextErrors: FormErrors = {};
        Object.entries(err.fieldErrors || {}).forEach(([key, value]) => {
          nextErrors[key] = Array.isArray(value) ? String(value[0]) : String(value);
        });
        setFormErrors(
          Object.keys(nextErrors).length > 0
            ? nextErrors
            : { general: t('semesters.form.saveFailed') }
        );
      } else {
        setFormErrors({ general: err.message || t('semesters.form.saveFailed') });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (semester: Semester) => {
    if (!isAdmin) {
      alert(t('semesters.list.onlyAdminDelete'));
      return;
    }

    const confirmed = window.confirm(
      t('semesters.list.deleteConfirm', { name: semester.name, year: semester.academic_year })
    );
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/students/semesters/${semester.id}/`);
      fetchSemesters();
    } catch (err: any) {
      alert(err.message || t('semesters.list.deleteFailed'));
    }
  };

  if (loading && semesters.length === 0) {
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
            {t('semesters.page.title')}
          </h1>
          <p className="text-slate-600 mt-1 font-['Fira_Sans']">
            {t('semesters.page.subtitle')}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" />
            {t('semesters.list.add')}
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg font-['Fira_Sans'] text-sm">
          {t('semesters.page.readOnly')}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('semesters.list.search')}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all duration-200 font-['Fira_Sans']"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-['Fira_Sans']">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        {filteredSemesters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-['Fira_Sans']">
              {searchTerm ? t('semesters.list.noMatch') : t('semesters.list.empty')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('semesters.list.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('semesters.list.year')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('semesters.list.period')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('semesters.list.current')}
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                      {t('semesters.list.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSemesters.map((semester) => (
                  <tr key={semester.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 font-['Fira_Sans']">
                      {semester.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-['Fira_Sans']">
                      {semester.academic_year}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-['Fira_Sans']">
                      {new Date(semester.start_date).toLocaleDateString(
                        locale === 'fr' ? 'fr-FR' : 'en-US'
                      )}{' '}
                      -{' '}
                      {new Date(semester.end_date).toLocaleDateString(
                        locale === 'fr' ? 'fr-FR' : 'en-US'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-['Fira_Sans']">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          semester.is_current
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {semester.is_current ? t('semesters.list.yes') : t('semesters.list.no')}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(semester)}
                            className="text-[#1E40AF] hover:text-[#3B82F6] transition-colors duration-150 cursor-pointer p-2 hover:bg-blue-50 rounded"
                            title={t('semesters.list.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(semester)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-150 cursor-pointer p-2 hover:bg-red-50 rounded"
                            title={t('semesters.list.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-slate-200">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold text-[#1E3A8A] font-['Fira_Code']">
                {editingSemester ? t('semesters.form.editTitle') : t('semesters.form.addTitle')}
              </h2>
              <button
                onClick={handleCloseForm}
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                  {t('semesters.form.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Sans'] ${
                    formErrors.name ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                  {t('semesters.form.academicYear')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) =>
                    setFormData({ ...formData, academic_year: e.target.value })
                  }
                  placeholder="2025-2026"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Code'] ${
                    formErrors.academic_year ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {formErrors.academic_year && (
                  <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                    {formErrors.academic_year}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                    {t('semesters.form.startDate')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Sans'] ${
                      formErrors.start_date ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.start_date && (
                    <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                      {formErrors.start_date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                    {t('semesters.form.endDate')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Sans'] ${
                      formErrors.end_date ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.end_date && (
                    <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">
                      {formErrors.end_date}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_current_semester"
                  checked={formData.is_current}
                  onChange={(e) =>
                    setFormData({ ...formData, is_current: e.target.checked })
                  }
                  className="w-4 h-4 text-[#1E40AF] border-slate-300 rounded focus:ring-[#1E40AF] cursor-pointer"
                />
                <label
                  htmlFor="is_current_semester"
                  className="text-sm font-medium text-slate-700 cursor-pointer font-['Fira_Sans']"
                >
                  {t('semesters.form.current')}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={saving}
                  className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 cursor-pointer font-['Fira_Sans'] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('semesters.form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#F59E0B] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {saving
                    ? t('semesters.form.saving')
                    : editingSemester
                    ? t('semesters.form.update')
                    : t('semesters.form.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
