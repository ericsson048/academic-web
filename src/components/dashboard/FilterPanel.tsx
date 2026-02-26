import { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useI18n } from '../../context/I18nContext';

interface FilterPanelProps {
  filters: {
    classId: string;
    semesterId: string;
    studentId: string;
  };
  onFilterChange: (filters: { classId: string; semesterId: string; studentId: string }) => void;
}

interface Class {
  id: number;
  name: string;
  level: string;
  academic_year: string;
}

interface Semester {
  id: number;
  name: string;
  academic_year: string;
}

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
}

interface PaginatedResponse<T> {
  results: T[];
}

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const { t } = useI18n();
  const [classes, setClasses] = useState<Class[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchStudents(searchTerm);
    } else {
      setStudents([]);
    }
  }, [searchTerm]);

  const loadFilterOptions = async () => {
    try {
      setLoading(true);
      const [classesData, semestersData] = await Promise.all([
        api.get<Class[] | PaginatedResponse<Class>>('/students/classes/?page_size=200'),
        api.get<Semester[] | PaginatedResponse<Semester>>('/students/semesters/?page_size=200'),
      ]);
      setClasses(Array.isArray(classesData) ? classesData : classesData.results || []);
      setSemesters(Array.isArray(semestersData) ? semestersData : semestersData.results || []);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = async (term: string) => {
    try {
      const data = await api.get<{ results: Student[] }>(`/students/?search=${encodeURIComponent(term)}`);
      setStudents(data.results || []);
    } catch (error) {
      console.error('Failed to search students:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFilterChange({
      classId: '',
      semesterId: '',
      studentId: '',
    });
  };

  const hasActiveFilters = filters.classId || filters.semesterId || filters.studentId;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter className="w-5 h-5" />
          <span>{t('dashboard.filter.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Fira Code, monospace' }}>
            {t('dashboard.filter.title')}
            </h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors duration-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
            {t('dashboard.filter.clearAll')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class Filter */}
        <div>
          <label htmlFor="class-filter" className="block text-sm font-medium text-slate-700 mb-2">
            {t('dashboard.filter.class')}
          </label>
          <select
            id="class-filter"
            value={filters.classId}
            onChange={(e) => handleFilterChange('classId', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
          >
            <option value="">{t('dashboard.filter.allClasses')}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.level}
              </option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div>
          <label htmlFor="semester-filter" className="block text-sm font-medium text-slate-700 mb-2">
            {t('dashboard.filter.semester')}
          </label>
          <select
            id="semester-filter"
            value={filters.semesterId}
            onChange={(e) => handleFilterChange('semesterId', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
          >
            <option value="">{t('dashboard.filter.allSemesters')}</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name} ({semester.academic_year})
              </option>
            ))}
          </select>
        </div>

        {/* Student Search */}
        <div>
          <label htmlFor="student-search" className="block text-sm font-medium text-slate-700 mb-2">
            {t('dashboard.filter.student')}
          </label>
          <input
            id="student-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('dashboard.filter.searchStudent')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
          {students.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    handleFilterChange('studentId', student.id.toString());
                    setSearchTerm(`${student.first_name} ${student.last_name}`);
                    setStudents([]);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                >
                  <div className="font-medium text-slate-900">
                    {student.first_name} {student.last_name}
                  </div>
                  <div className="text-sm text-slate-500">{student.student_id}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
