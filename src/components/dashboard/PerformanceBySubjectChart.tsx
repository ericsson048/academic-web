import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useI18n } from '../../context/I18nContext';

interface SubjectPerformance {
  subject: string;
  subject_code: string;
  average: number;
  student_count: number;
}

interface PerformanceBySubjectChartProps {
  data: SubjectPerformance[];
}

export function PerformanceBySubjectChart({ data }: PerformanceBySubjectChartProps) {
  const { t } = useI18n();
  // Custom tooltip for better UX
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-2">{data.subject}</p>
          <p className="text-sm text-slate-600">
            {t('dashboard.charts.average')}: <span className="font-medium text-blue-600">{data.average.toFixed(2)}/20</span>
          </p>
          <p className="text-sm text-slate-600">
            {t('dashboard.charts.students')}: <span className="font-medium">{data.student_count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Color bars based on performance level
  const getBarColor = (value: number) => {
    if (value >= 16) return '#22c55e'; // green - excellent
    if (value >= 14) return '#3b82f6'; // blue - good
    if (value >= 10) return '#f59e0b'; // amber - average
    return '#ef4444'; // red - poor
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Fira Code, monospace' }}>
        {t('dashboard.charts.performanceBySubject')}
      </h3>
      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-slate-500">
          {t('dashboard.charts.noData')}
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="subject_code"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 20]}
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: t('dashboard.charts.averageScore'), angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar
                dataKey="average"
                fill="#1E40AF"
                radius={[8, 8, 0, 0]}
                name={t('dashboard.charts.averageScore')}
                animationDuration={800}
                animationBegin={0}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
