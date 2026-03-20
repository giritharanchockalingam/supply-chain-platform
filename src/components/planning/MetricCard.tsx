'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: number;
  isGood?: boolean;
  target?: number;
  icon?: React.ReactNode;
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  unit = '',
  trend,
  isGood = true,
  target,
  icon,
  loading = false,
}: MetricCardProps) {
  const trendIsPositive = trend !== undefined && ((isGood && trend > 0) || (!isGood && trend < 0));
  const bgColor = isGood ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';
  const textColor = isGood ? 'text-emerald-700' : 'text-red-700';

  return (
    <div className={`border rounded-lg p-4 ${bgColor}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      {loading ? (
        <div className="h-8 bg-slate-200 rounded animate-pulse mb-2" />
      ) : (
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-3xl font-bold ${textColor}`}>
            {value}
          </span>
          {unit && <span className="text-sm text-slate-600">{unit}</span>}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1">
          {trend !== undefined && (
            <>
              {trendIsPositive ? (
                <TrendingUp className="text-emerald-600" size={14} />
              ) : (
                <TrendingDown className="text-red-600" size={14} />
              )}
              <span className={trendIsPositive ? 'text-emerald-600' : 'text-red-600'}>
                {Math.abs(trend).toFixed(1)}%
              </span>
            </>
          )}
        </div>
        {target !== undefined && (
          <span>Target: {target}</span>
        )}
      </div>
    </div>
  );
}
