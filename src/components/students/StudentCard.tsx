import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, BarChart3 } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useI18n } from '../../context/I18nContext';
import type { Student, StudentPerformance } from '../../types/student';

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
}

export default function StudentCard({ student, onClick }: StudentCardProps) {
  const { t } = useI18n();
  const [performance, setPerformance] = useState<StudentPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const response = await api.get<StudentPerformance>(
          `/analytics/student/${student.id}/`
        );
        setPerformance(response);
      } catch (err) {
        console.error('Error fetching student performance:', err);
        // Set default values if API fails
        setPerformance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [student.id]);

  // Format progression percentage
  const formatProgression = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Get progression color
  const getProgressionColor = (value: number | null) => {
    if (value === null || value === undefined) return 'text-slate-500';
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  // Get progression icon
  const getProgressionIcon = (value: number | null) => {
    if (value === null || value === undefined) return null;
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  // Get average color based on value
  const getAverageColor = (avg: number) => {
    if (avg >= 16) return 'text-green-600 bg-green-50 border-green-200';
    if (avg >= 14) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (avg >= 10) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1"
    >
      {/* Student Header */}
      <div className="flex items-start gap-4 mb-4">
        {student.photo ? (
          <img
            src={student.photo}
            alt={`${student.first_name} ${student.last_name}`}
            className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#1E40AF] text-white flex items-center justify-center text-xl font-bold font-['Fira_Code']">
            {student.first_name[0]}
            {student.last_name[0]}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[#1E3A8A] truncate font-['Fira_Code']">
            {student.first_name} {student.last_name}
          </h3>
          <p className="text-sm text-slate-600 font-['Fira_Code']">
            {student.student_id}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-['Fira_Sans']">
            {student.class_name || t('student.card.noClass')}
          </p>
        </div>

        {/* Status Badge */}
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-['Fira_Sans'] ${
            student.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {student.is_active ? t('student.card.active') : t('student.card.inactive')}
        </span>
      </div>

      {/* Performance Metrics */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF]"></div>
        </div>
      ) : performance ? (
        <div className="grid grid-cols-3 gap-3">
          {/* Average */}
          <div
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${getAverageColor(
              performance.average
            )}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-medium font-['Fira_Sans']">{t('student.card.average')}</span>
            </div>
            <p className="text-2xl font-bold font-['Fira_Code']">
              {performance.average.toFixed(2)}
            </p>
            <p className="text-xs opacity-75 font-['Fira_Sans']">/ 20</p>
          </div>

          {/* Rank */}
          <div className="p-3 rounded-lg border-2 bg-purple-50 text-purple-600 border-purple-200 transition-all duration-200">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium font-['Fira_Sans']">{t('student.card.rank')}</span>
            </div>
            <p className="text-2xl font-bold font-['Fira_Code']">
              {performance.rank !== null ? `#${performance.rank}` : 'N/A'}
            </p>
            {performance.total_students && (
              <p className="text-xs opacity-75 font-['Fira_Sans']">
                {t('student.card.of')} {performance.total_students}
              </p>
            )}
          </div>

          {/* Progression */}
          <div
            className={`p-3 rounded-lg border-2 bg-slate-50 border-slate-200 transition-all duration-200 ${getProgressionColor(
              performance.progression_percentage
            )}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {getProgressionIcon(performance.progression_percentage)}
              <span className="text-xs font-medium font-['Fira_Sans']">{t('student.card.progress')}</span>
            </div>
            <p className="text-2xl font-bold font-['Fira_Code']">
              {formatProgression(performance.progression_percentage)}
            </p>
            <p className="text-xs opacity-75 font-['Fira_Sans']">{t('student.card.vsLastSemester')}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 font-['Fira_Sans']">
          <p className="text-sm">{t('student.card.noPerformance')}</p>
        </div>
      )}

      {/* View Details Link */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <button className="text-sm text-[#1E40AF] hover:text-[#3B82F6] font-medium transition-colors duration-150 font-['Fira_Sans'] flex items-center gap-1">
          {t('student.card.details')}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
