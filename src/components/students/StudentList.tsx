import { useState, useEffect, useCallback } from 'react';
import { Search, Edit, Trash2, Plus, Filter, X } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import type { Student, StudentListResponse, Class } from '../../types/student';

interface StudentListProps {
  onEdit?: (student: Student) => void;
  onAdd?: () => void;
}

export default function StudentList({ onEdit, onAdd }: StudentListProps) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isAdmin = user?.role === 'admin';

  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (selectedClass) {
        params.append('class_assigned', selectedClass);
      }

      if (activeFilter !== 'all') {
        params.append('is_active', activeFilter === 'active' ? 'true' : 'false');
      }

      const response = await api.get<StudentListResponse>(`/students/?${params.toString()}`);
      
      setStudents(response.results);
      setTotalCount(response.count);
    } catch (err: any) {
      setError(err.message || t('students.list.loadFailed'));
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, selectedClass, activeFilter, t]);

  // Fetch classes for filter
  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get<Class[]>('/classes/');
      setClasses(response);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Delete student
  const handleDelete = async (student: Student) => {
    if (!isAdmin) {
      alert(t('students.list.onlyAdminDelete'));
      return;
    }

    const confirmed = window.confirm(
      t('students.list.deleteConfirm', { name: `${student.first_name} ${student.last_name}` })
    );

    if (!confirmed) return;

    try {
      await api.delete(`/students/${student.id}/`);
      // Refresh list
      fetchStudents();
    } catch (err: any) {
      alert(err.message || t('students.list.deleteFailed'));
      console.error('Error deleting student:', err);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedClass('');
    setActiveFilter('all');
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasFilters = searchTerm || selectedClass || activeFilter !== 'all';

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E40AF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1E3A8A] font-['Fira_Code']">
            {t('students.list.title')}
          </h2>
          <p className="text-sm text-slate-600 font-['Fira_Sans'] mt-1">
            {t('students.list.total', { count: totalCount, suffix: totalCount !== 1 ? 's' : '' })}
          </p>
        </div>
        {isAdmin && onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" />
            {t('students.list.add')}
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
        <div className="flex gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('students.list.search')}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all duration-200 font-['Fira_Sans']"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
              showFilters || hasFilters
                ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            {t('students.list.filters')}
            {hasFilters && !showFilters && (
              <span className="bg-white text-[#1E40AF] text-xs px-2 py-0.5 rounded-full font-semibold">
                {t('students.list.active')}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 cursor-pointer font-['Fira_Sans']"
            >
              <X className="w-4 h-4" />
              {t('students.list.clear')}
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                {t('students.list.class')}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans']"
              >
                <option value="">{t('students.list.allClasses')}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.level}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-['Fira_Sans']">
                {t('students.list.status')}
              </label>
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E40AF] transition-all duration-200 cursor-pointer font-['Fira_Sans']"
              >
                <option value="all">{t('students.list.allStudents')}</option>
                <option value="active">{t('students.list.activeOnly')}</option>
                <option value="inactive">{t('students.list.inactiveOnly')}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-['Fira_Sans']">
          {error}
        </div>
      )}

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        {students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-['Fira_Sans']">
              {hasFilters ? t('students.list.noMatch') : t('students.list.noStudents')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('students.list.studentId')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('students.list.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('students.list.class')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('students.list.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                    {t('students.list.enrollment')}
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider font-['Fira_Code']">
                      {t('students.list.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-[#1E40AF] font-['Fira_Code']">
                        {student.student_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {student.photo ? (
                          <img
                            src={student.photo}
                            alt={`${student.first_name} ${student.last_name}`}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#1E40AF] text-white flex items-center justify-center text-sm font-bold font-['Fira_Code']">
                            {student.first_name[0]}
                            {student.last_name[0]}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-slate-900 font-['Fira_Sans']">
                            {student.first_name} {student.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 font-['Fira_Sans']">
                        {student.class_name || t('students.list.na')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-['Fira_Sans'] ${
                          student.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.is_active ? t('students.list.active') : t('students.list.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-['Fira_Sans']">
                      {new Date(student.enrollment_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onEdit?.(student)}
                            className="text-[#1E40AF] hover:text-[#3B82F6] transition-colors duration-150 cursor-pointer p-2 hover:bg-blue-50 rounded"
                            title={t('students.list.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-150 cursor-pointer p-2 hover:bg-red-50 rounded"
                            title={t('students.list.delete')}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-md border border-slate-200">
          <div className="text-sm text-slate-600 font-['Fira_Sans']">
            {t('students.list.showing', {
              from: (currentPage - 1) * pageSize + 1,
              to: Math.min(currentPage * pageSize, totalCount),
              total: totalCount,
              suffix: totalCount !== 1 ? 's' : '',
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all duration-200 cursor-pointer font-['Fira_Sans']"
            >
              {t('students.list.previous')}
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
                      currentPage === pageNum
                        ? 'bg-[#1E40AF] text-white'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all duration-200 cursor-pointer font-['Fira_Sans']"
            >
              {t('students.list.next')}
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && students.length > 0 && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF]"></div>
          </div>
        </div>
      )}
    </div>
  );
}
