'use client';

import { AlertTriangle, XCircle, Info } from 'lucide-react';
import { YardException } from '@/lib/types';

interface ExceptionAlertProps {
  exception: YardException;
  onResolve?: (id: string) => void;
}

const severityConfig = {
  critical: { icon: XCircle, bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700' },
  warning: { icon: AlertTriangle, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' },
  info: { icon: Info, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
};

const typeLabels: Record<YardException['type'], string> = {
  missing_bol: 'Missing BOL',
  mismatched_trailer: 'Trailer Mismatch',
  late_arrival: 'Late Arrival',
  temperature_breach: 'Temp Breach',
  dock_congestion: 'Dock Congestion',
  hazmat_violation: 'Hazmat Violation',
  overdue_dwell: 'Overdue Dwell',
  damaged_load: 'Damaged Load',
};

export function ExceptionAlert({ exception, onResolve }: ExceptionAlertProps) {
  const config = severityConfig[exception.severity];
  const Icon = config.icon;
  const isResolved = exception.resolvedAt !== null;

  return (
    <div className={`border rounded-lg p-4 ${config.bgColor} ${config.borderColor} border`}>
      <div className="flex gap-3">
        <Icon className={`flex-shrink-0 ${config.textColor}`} size={20} />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className={`font-semibold ${config.textColor}`}>{typeLabels[exception.type]}</h4>
              <p className="text-sm text-gray-700 mt-1">{exception.description}</p>
              {isResolved && (
                <p className="text-xs text-gray-500 mt-1">Resolved: {exception.resolution}</p>
              )}
            </div>
            {!isResolved && onResolve && (
              <button
                onClick={() => onResolve(exception.id)}
                className="px-3 py-1 text-sm font-medium rounded bg-white border border-gray-300 hover:bg-gray-50 whitespace-nowrap ml-2"
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
