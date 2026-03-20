'use client';

import { PriorityLevel } from '@/lib/types';

const priorityConfig: Record<PriorityLevel, { bgColor: string; textColor: string; label: string }> = {
  critical: { bgColor: 'bg-red-100', textColor: 'text-red-700', label: 'Critical' },
  high: { bgColor: 'bg-orange-100', textColor: 'text-orange-700', label: 'High' },
  medium: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', label: 'Medium' },
  low: { bgColor: 'bg-green-100', textColor: 'text-green-700', label: 'Low' },
};

interface PriorityBadgeProps {
  level: PriorityLevel;
  score?: number;
}

export function PriorityBadge({ level, score }: PriorityBadgeProps) {
  const config = priorityConfig[level];

  return (
    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${config.bgColor} ${config.textColor}`}>
      {config.label} {score !== undefined && `(${score})`}
    </div>
  );
}
