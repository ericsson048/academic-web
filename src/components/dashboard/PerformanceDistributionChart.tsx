import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useI18n } from '../../context/I18nContext';

interface PerformanceDistribution {
  category: string;
  count: number;
  percentage: number;
}

interface PerformanceDistributionChartProps {
  data: PerformanceDistribution[];
}

export function PerformanceDistributionChart({ data }: PerformanceDistributionChartProps) {
  const { t } = useI18n();
  // Consistent color scheme based on performance categories
  const COLORS: Record<string, string> = {
    'Excellent (16-20)': '#22c55e',
    'Good (14-16)': '#3b82f6',
    'Average (10-14)': '#f59e0b',
    'Poor (<10)': '#ef4444',
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-2">{data.name}</p>
          <p className="text-sm text-slate-600">
            {t('dashboard.charts.students')}: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-sm text-slate-600">
            {t('dashboard.charts.percentage')}: <span className="font-medium">{data.payload.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie slices
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(1)}%`;
  };

  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.category,
    value: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Fira Code, monospace' }}>
        {t('dashboard.charts.performanceDistribution')}
      </h3>
      {data.length === 0 || data.every(d => d.count === 0) ? (
        <div className="h-80 flex items-center justify-center text-slate-500">
          {t('dashboard.charts.noData')}
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={60}
                paddingAngle={5}
                dataKey="value"
                animationDuration={800}
                animationBegin={0}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name] || '#94a3b8'}
                    className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry: any) => (
                  <span className="text-sm text-slate-700">
                    {value} ({entry.payload.value})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Summary statistics */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <div
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ backgroundColor: COLORS[item.category] || '#94a3b8' }}
              />
              <div className="text-xs text-slate-600">{item.category}</div>
              <div className="text-lg font-semibold text-slate-900">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
