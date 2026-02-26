import { useState, useEffect } from 'react';
import { FileText, Filter, Loader2 } from 'lucide-react';
import { api } from '../services/apiClient';
import { useI18n } from '../context/I18nContext';
import { ReportGenerator } from '../components/reports';
import type { Student } from '../types/student';

export default function Reports() {
  const { t } = useI18n();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ results: Student[] }>('/students/');
      setStudents(data.results || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError(t('reports.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">{t('reports.loadingStudents')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchStudents}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('reports.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('reports.title')}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('reports.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            {t('reports.filter')}
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">{t('reports.noStudents')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {student.first_name[0]}
                  {student.last_name[0]}
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {student.student_id}
                </span>
              </div>

              <h3 className="font-semibold text-slate-900">
                {student.last_name} {student.first_name}
              </h3>
                <p className="text-sm text-slate-500 mb-6">
                  {student.class_name || t('reports.noClass')}
                </p>

              <ReportGenerator
                studentId={student.id}
                studentName={`${student.first_name} ${student.last_name}`}
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
