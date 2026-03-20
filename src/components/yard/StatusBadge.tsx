'use client';

import { TruckStatus } from '@/lib/types';

const statusConfig: Record<TruckStatus, { bgColor: string; textColor: string; label: string }> = {
  approaching: { bgColor: 'bg-blue-100', textColor: 'text-blue-700', label: 'Approaching' },
  at_gate: { bgColor: 'bg-purple-100', textColor: 'text-purple-700', label: 'At Gate' },
  checked_in: { bgColor: 'bg-cyan-100', textColor: 'text-cyan-700', label: 'Checked In' },
  in_yard: { bgColor: 'bg-indigo-100', textColor: 'text-indigo-700', label: 'In Yard' },
  at_dock: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', label: 'At Dock' },
  unloading: { bgColor: 'bg-orange-100', textColor: 'text-orange-700', label: 'Unloading' },
  loading: { bgColor: 'bg-lime-100', textColor: 'text-lime-700', label: 'Loading' },
  completed: { bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', label: 'Completed' },
  departed: { bgColor: 'bg-gray-100', textColor: 'text-gray-700', label: 'Departed' },
};

interface StatusBadgeProps {
  status: TruckStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
}
