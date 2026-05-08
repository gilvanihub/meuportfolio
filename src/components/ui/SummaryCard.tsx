import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  variant = 'default'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white';
      case 'success':
        return 'bg-green-50 text-green-800';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800';
      default:
        return 'bg-white text-gray-800';
    }
  };

  const getChangeColor = () => {
    if (!change) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeIcon = () => {
    if (!change) return <Minus size={14} />;
    if (change > 0) return <TrendingUp size={14} />;
    return <TrendingDown size={14} />;
  };

  return (
    <div className={`rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${getVariantStyles()}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium opacity-80">{title}</span>
        {icon && <div className="opacity-50">{icon}</div>}
      </div>
      <div className="text-2xl lg:text-3xl font-bold mb-1">{value}</div>
      <div className="flex items-center gap-2">
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-sm font-medium ${getChangeColor()}`}>
            {getChangeIcon()}
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        )}
        {subtitle && (
          <span className="text-sm opacity-60">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;