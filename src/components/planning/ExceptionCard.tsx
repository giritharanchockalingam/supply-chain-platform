'use client';

import { PlanningException } from '@/lib/types';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface ExceptionCardProps {
  exception: PlanningException;
  onResolve?: (id: string) => void;
}

const exceptionTypeLabels: Record<string, string> = {
  missing_data: 'Missing Data',
  duplicate_signal: 'Duplicate Signal',
  demand_spike: 'Demand Spike',
  demand_drop: 'Demand Drop',
  stale_data: 'Stale Data',
  quality_issue: 'Quality Issue',
  stockout_risk: 'Stockout Risk',
  overstock_risk: 'Overstock Risk',
};

export function ExceptionCard({ exception, onResolve }: ExceptionCardProps) {
  const isResolved = exception.resolvedAt !== null;

  let severityColor = 'bg-blue-50 border-blue-200';
  let severityBg = 'bg-blue-100';
  let severityText = 'text-blue-700';
  let SeverityIcon = Info;

  if (exception.severity === 'critical') {
    severityColor = 'bg-red-50 border-red-200';
    severityBg = 'bg-red-100';
    severityText = 'text-red-700';
    SeverityIcon = AlertTriangle;
  } else if (exception.severity === 'warning') {
    severityColor = 'bg-amber-50 border-amber-200';
    severityBg = 'bg-amber-100';
    severityText = 'text-amber-700';
    SeverityIcon = AlertCircle;
  }

  return (
    <div
      className={`border rounded-lg p-4 ${severityColor} ${
        isResolved ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <SeverityIcon className={`${severityText} flex-shrink-0 mt-0.5`} size={18} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${severityBg} ${severityText}`}>
              {exceptionTypeLabels[exception.type] || exception.type}
            </span>
            {isResolved && (
              <span className="text-xs font-medium text-slate-500">Resolved</span>
            )}
          </div>
          <p className="text-sm text-slate-700 mb-2">{exception.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">
              {new Date(exception.detectedAt).toLocaleDateString()} at{' '}
              {new Date(exception.detectedAt).toLocaleTimeString()}
            </span>
            {!isResolved && onResolve && (
              <button
                onClick={() => onResolve(exception.id)}
                className="text-xs font-medium text-slate-600 hover:text-slate-800 underline"
              >
                Resolve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
