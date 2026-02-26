import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useI18n } from '../../context/I18nContext';

interface PerformanceEvolution {
  semester: string;
  semester_name: string;
  overall_average: number;
  class_averages?: {
    class_name: string;
    average: number;
  }[];
}

interface PerformanceEvolutionChartProps {
  data: PerformanceEvolution[];
  showClassBreakdown?: boolean;
}

export function PerformanceEvolutionChart({ data, showClassBreakdown = false }: PerformanceEvolutionChartProps) {
  const { t } = useI18n();
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-slate-600">
              {entry.name}: <span className="font-medium" style={{ color: entry.color }}>{entry.value.toFixed(2)}/20</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Transform data for multiple series if class breakdown is enabled
  const chartData = data.map(item => {
    const point: any = {
      semester: item.semester_name,
      overall: item.overall_average,
    };
    
    if (showClassBreakdown && item.class_averages) {
      item.class_averages.forEach(cls => {
        point[cls.class_name] = cls.average;
      });
    }
    
    return point;
  });

  // Get all class names for legend
  const classNames = showClassBreakdown && data[0]?.class_averages
    ? data[0].class_averages.map(cls => cls.class_name)
    : [];

  const colors = ['#1E40AF', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Fira Code, monospace' }}>
        {t('dashboard.charts.performanceEvolution')} {t('dashboard.charts.overTime')}
      </h3>
      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-slate-500">
          {t('dashboard.charts.noData')}
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="semester"
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 20]}
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: t('dashboard.charts.averageScore'), angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="overall"
                stroke="#F59E0B"
                strokeWidth={3}
                name={t('dashboard.charts.overallAverage')}
                dot={{ fill: '#F59E0B', r: 5 }}
                activeDot={{ r: 7 }}
                animationDuration={1000}
                animationBegin={0}
              />
              {showClassBreakdown && classNames.map((className, index) => (
                <Line
                  key={className}
                  type="monotone"
                  dataKey={className}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  name={className}
                  dot={{ fill: colors[index % colors.length], r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={1000}
                  animationBegin={100 * (index + 1)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
