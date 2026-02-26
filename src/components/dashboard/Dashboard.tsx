import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useI18n } from '../../context/I18nContext';
import { SummaryCards } from './SummaryCards';
import { FilterPanel } from './FilterPanel';
import { PerformanceBySubjectChart } from './PerformanceBySubjectChart';
import { PerformanceEvolutionChart } from './PerformanceEvolutionChart';
import { PerformanceDistributionChart } from './PerformanceDistributionChart';

interface DashboardData {
  summary: {
    totalStudents: number;
    overallAverage: number;
    progressionRate: number;
    atRiskCount: number;
  };
  performanceBySubject: Array<{
    subject: string;
    subject_code: string;
    average: number;
    student_count: number;
  }>;
  performanceEvolution: Array<{
    semester: string;
    semester_name: string;
    overall_average: number;
    class_averages?: Array<{
      class_name: string;
      average: number;
    }>;
  }>;
  performanceDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

interface SummaryResponse {
  total_students: number;
  overall_average: number;
  progression_rate: number;
  performance_distribution?: {
    excellent?: number;
    good?: number;
    average?: number;
    poor?: number;
  };
}

interface SubjectPerformanceResponse {
  subject_name?: string;
  subject_code: string;
  average: number;
  student_count: number;
}

interface EvolutionResponse {
  semester_name: string;
  average: number;
}

export function Dashboard() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    classId: '',
    semesterId: '',
    studentId: '',
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.classId) params.append('class_id', filters.classId);
      if (filters.semesterId) params.append('semester_id', filters.semesterId);
      if (filters.studentId) params.append('student_id', filters.studentId);
      const queryString = params.toString();

      // Fetch analytics data available in the Django backend
      const [summaryRaw, performanceBySubjectRaw, performanceEvolutionRaw] = await Promise.all([
        api.get<SummaryResponse>(`/analytics/summary/${queryString ? `?${queryString}` : ''}`),
        api.get<SubjectPerformanceResponse[]>(`/analytics/performance-by-subject/${queryString ? `?${queryString}` : ''}`),
        api.get<EvolutionResponse[]>(`/analytics/performance-evolution/${queryString ? `?${queryString}` : ''}`),
      ]);

      const summary = {
        totalStudents: summaryRaw.total_students ?? 0,
        overallAverage: summaryRaw.overall_average ?? 0,
        progressionRate: summaryRaw.progression_rate ?? 0,
        atRiskCount: summaryRaw.performance_distribution?.poor ?? 0,
      };

      const performanceBySubject = (performanceBySubjectRaw || []).map((item) => ({
        subject: item.subject_name || item.subject_code,
        subject_code: item.subject_code,
        average: item.average,
        student_count: item.student_count,
      }));

      const performanceEvolution = (performanceEvolutionRaw || []).map((item) => ({
        semester: item.semester_name,
        semester_name: item.semester_name,
        overall_average: item.average,
      }));

      const distribution = summaryRaw.performance_distribution || {};
      const totalForDistribution = Object.values(distribution).reduce(
        (acc, val) => acc + (val || 0),
        0
      );

      const performanceDistribution = [
        {
          category: 'Excellent (16-20)',
          count: distribution.excellent || 0,
          percentage: totalForDistribution ? ((distribution.excellent || 0) / totalForDistribution) * 100 : 0,
        },
        {
          category: 'Good (14-16)',
          count: distribution.good || 0,
          percentage: totalForDistribution ? ((distribution.good || 0) / totalForDistribution) * 100 : 0,
        },
        {
          category: 'Average (10-14)',
          count: distribution.average || 0,
          percentage: totalForDistribution ? ((distribution.average || 0) / totalForDistribution) * 100 : 0,
        },
        {
          category: 'Poor (<10)',
          count: distribution.poor || 0,
          percentage: totalForDistribution ? ((distribution.poor || 0) / totalForDistribution) * 100 : 0,
        },
      ];

      setData({
        summary,
        performanceBySubject,
        performanceEvolution,
        performanceDistribution,
      });
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || t('dashboard.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, t]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle filter changes with debouncing
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Auto-refresh every 30 seconds if no filters are active
  useEffect(() => {
    if (!filters.classId && !filters.semesterId && !filters.studentId) {
      const interval = setInterval(() => {
        fetchDashboardData(true);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [filters, fetchDashboardData]);

  // Loading state
  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('dashboard.errorTitle')}</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
          >
            {t('dashboard.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Fira Code, monospace' }}>
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('dashboard.lastUpdated')}: {lastUpdate.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US')}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}</span>
        </button>
      </div>

      {/* Filters */}
      <FilterPanel filters={filters} onFilterChange={handleFilterChange} />

      {/* Summary Cards */}
      {data?.summary && <SummaryCards data={data.summary} />}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Subject */}
        {data?.performanceBySubject && (
          <PerformanceBySubjectChart data={data.performanceBySubject} />
        )}

        {/* Performance Distribution */}
        {data?.performanceDistribution && (
          <PerformanceDistributionChart data={data.performanceDistribution} />
        )}
      </div>

      {/* Performance Evolution - Full Width */}
      {data?.performanceEvolution && (
        <PerformanceEvolutionChart
          data={data.performanceEvolution}
          showClassBreakdown={!filters.classId && !filters.studentId}
        />
      )}

      {/* Error notification for refresh failures */}
      {error && data && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">{t('dashboard.refreshFailed')}</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
