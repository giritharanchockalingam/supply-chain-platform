'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  color?: 'blue' | 'emerald' | 'amber' | 'red';
  icon?: React.ReactNode;
}

const colorConfig = {
  blue: 'border-blue-200 bg-blue-50',
  emerald: 'border-emerald-200 bg-emerald-50',
  amber: 'border-amber-200 bg-amber-50',
  red: 'border-red-200 bg-red-50',
};

const trendColorConfig = {
  up: { blue: 'text-blue-600', emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' },
  down: { blue: 'text-blue-600', emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' },
};

export function MetricCard({ label, value, unit, trend, color = 'blue', icon }: MetricCardProps) {
  const isPositive = trend ? trend > 0 : false;

  return (
    <div className={`border rounded-lg p-4 ${colorConfig[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {unit && <p className="text-lg text-gray-500">{unit}</p>}
          </div>
          {trend !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{Math.abs(trend)}% {isPositive ? 'increase' : 'decrease'}</span>
            </div>
          )}
        </div>
        {icon && <div className="text-2xl text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}
