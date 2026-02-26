import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { api, ValidationError } from '../services/apiClient';
import type { Class } from '../types/student';

interface ClassListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Class[];
}

interface ClassFormData {
  name: string;
  level: string;
  academic_year: string;
}

interface FormErrors {
  [key: string]: string;
}

const DEFAULT_FORM: ClassFormData = {
  name: '',
  level: '',
  academic_year: '',
};

export default function Classes() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isAdmin = user?.role === 'admin';

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<ClassFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const extractClassList = (payload: ClassListResponse | Class[]): Class[] => {
    if (Array.isArray(payload)) {
      return payload;
    }
    return payload.results || [];
  };

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ClassListResponse | Class[]>('/students/classes/?page_size=200');
      setClasses(extractClassList(response));
    } catch (err: any) {
      setError(err.message || t('classes.list.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filteredClasses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return classes;
    }

    return classes.filter((cls) =>
      [cls.name, cls.level, cls.academic_year].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [classes, searchTerm]);

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setEditingClass(null);
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      level: cls.level,
      academic_year: cls.academic_year,
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
      nextErrors.name = t('classes.form.validation.nameRequired');
    }

    if (!formData.level.trim()) {
      nextErrors.level = t('classes.form.validation.levelRequired');
    }

    if (!formData.academic_year.trim()) {
      nextErrors.academic_year = t('classes.form.validation.academicYearRequired');
    } else if (!/^\d{4}-\d{4}$/.test(formData.academic_year.trim())) {
      nextErrors.academic_year = t('classes.form.validation.academicYearFormat');
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setFormErrors({ general: t('classes.list.onlyAdminEdit') });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setFormErrors({});

      const payload = {
        name: formData.name.trim(),
        level: formData.level.trim(),
        academic_year: formData.academic_year.trim(),
      };

      if (editingClass) {
        await api.put(`/students/classes/${editingClass.id}/`, payload);
      } else {
        await api.post('/students/classes/', payload);
      }

      handleCloseForm();
      fetchClasses();
    } catch (err: any) {
      if (err instanceof ValidationError) {
        const nextErrors: FormErrors = {};
        Object.entries(err.fieldErrors || {}).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            nextErrors[key] = String(value[0]);
          } else {
            nextErrors[key] = String(value);
          }
        });
        setFormErrors(
          Object.keys(nextErrors).length > 0
            ? nextErrors
            : { general: t('classes.form.saveFailed') }
        );
      } else {
        setFormErrors({ general: err.message || t('classes.form.saveFailed') });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cls: Class) => {
    if (!isAdmin) {
      alert(t('classes.list.onlyAdminDelete'));
      return;
    }

    const confirmed = window.confirm(
      t('classes.list.deleteConfirm', { name: cls.name, year: cls.academic_year })
    );
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/students/classes/${cls.id}/`);
      fetchClasses();
    } catch (err: any) {
      alert(err.message || t('classes.list.deleteFailed'));
    }
  };

  if (loading && classes.length === 0) {
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
            {t('classes.page.title')}
          </h1>
          <p className="text-slate-600 mt-1 font-['Fira_Sans']">
            {t('classes.page.subtitle')}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" />
            {t('classes.list.add')}
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg font-['Fira_Sans'] text-sm">
          {t('classes.page.readOnly')}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('classes.list.search')}
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
        {filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-['Fira_Sans']">
              {searchTerm ? t('classes.list.noMatch') : t('classes.list.empty')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('classes.list.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('classes.list.level')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('classes.list.year')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('classes.list.createdAt')}
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                      {t('classes.list.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 font-['Fira_Sans']">
                      {cls.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-['Fira_Sans']">
                      {cls.level}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-['Fira_Sans']">
                      {cls.academic_year}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-['Fira_Sans']">
                      {cls.created_at
                        ? new Date(cls.created_at).toLocaleDateString(
                            locale === 'fr' ? 'fr-FR' : 'en-US'
                          )
                        : t('classes.list.na')}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(cls)}
                            className="text-[#1E40AF] hover:text-[#3B82F6] transition-colors duration-150 cursor-pointer p-2 hover:bg-blue-50 rounded"
                            title={t('classes.list.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cls)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-150 cursor-pointer p-2 hover:bg-red-50 rounded"
                            title={t('classes.list.delete')}
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
                {editingClass ? t('classes.form.editTitle') : t('classes.form.addTitle')}
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
                  {t('classes.form.name')} <span className="text-red-500">*</span>
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
                  {t('classes.form.level')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 font-['Fira_Sans'] ${
                    formErrors.level ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {formErrors.level && (
                  <p className="text-red-600 text-sm mt-1 font-['Fira_Sans']">{formErrors.level}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                  {t('classes.form.academicYear')} <span className="text-red-500">*</span>
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

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={saving}
                  className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 cursor-pointer font-['Fira_Sans'] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('classes.form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#F59E0B] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {saving
                    ? t('classes.form.saving')
                    : editingClass
                    ? t('classes.form.update')
                    : t('classes.form.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
