import { Users, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface SummaryCardsProps {
  data: {
    totalStudents: number;
    overallAverage: number;
    progressionRate: number;
    atRiskCount: number;
  };
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const { t } = useI18n();
  const cards = [
    {
      title: t('dashboard.summary.totalStudents'),
      value: data.totalStudents,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('dashboard.summary.overallAverage'),
      value: data.overallAverage.toFixed(2),
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      indicator: data.overallAverage >= 14 ? 'excellent' : data.overallAverage >= 10 ? 'good' : 'needs-improvement',
    },
    {
      title: t('dashboard.summary.progressionRate'),
      value: `${data.progressionRate >= 0 ? '+' : ''}${data.progressionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: data.progressionRate >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: data.progressionRate >= 0 ? 'bg-green-50' : 'bg-red-50',
      indicator: data.progressionRate >= 5 ? 'excellent' : data.progressionRate >= 0 ? 'good' : 'declining',
    },
    {
      title: t('dashboard.summary.atRisk'),
      value: data.atRiskCount,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      indicator: data.atRiskCount > 0 ? 'warning' : 'good',
    },
  ];

  const getIndicatorColor = (indicator?: string) => {
    switch (indicator) {
      case 'excellent':
        return 'border-green-500';
      case 'good':
        return 'border-blue-500';
      case 'needs-improvement':
        return 'border-amber-500';
      case 'declining':
      case 'warning':
        return 'border-red-500';
      default:
        return 'border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-white rounded-xl p-6 shadow-md border-l-4 ${getIndicatorColor(card.indicator)} transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-600">{card.title}</h3>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Fira Code, monospace' }}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
