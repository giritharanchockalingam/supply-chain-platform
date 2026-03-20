'use client';

interface QualityScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function QualityScoreBadge({ score, size = 'md' }: QualityScoreBadgeProps) {
  let bgColor = 'bg-red-100';
  let textColor = 'text-red-700';

  if (score >= 85) {
    bgColor = 'bg-emerald-100';
    textColor = 'text-emerald-700';
  } else if (score >= 70) {
    bgColor = 'bg-amber-100';
    textColor = 'text-amber-700';
  } else if (score >= 50) {
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-700';
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div className={`${bgColor} ${textColor} ${sizeClasses[size]} rounded-full font-semibold inline-block`}>
      {score}%
    </div>
  );
}
