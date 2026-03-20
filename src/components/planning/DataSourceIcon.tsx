'use client';

import { DataSourceType } from '@/lib/types';
import { Mail, FileText, Sheet, PieChart, Hand, Cable } from 'lucide-react';

interface DataSourceIconProps {
  source: DataSourceType;
  size?: number;
  className?: string;
}

export function DataSourceIcon({ source, size = 16, className = '' }: DataSourceIconProps) {
  const iconProps = { size, className };

  switch (source) {
    case 'edi':
      return <Cable {...iconProps} className={`text-blue-600 ${className}`} />;
    case 'email':
      return <Mail {...iconProps} className={`text-purple-600 ${className}`} />;
    case 'spreadsheet':
      return <Sheet {...iconProps} className={`text-green-600 ${className}`} />;
    case 'pdf':
      return <FileText {...iconProps} className={`text-red-600 ${className}`} />;
    case 'manual':
      return <Hand {...iconProps} className={`text-amber-600 ${className}`} />;
    case 'api':
      return <PieChart {...iconProps} className={`text-indigo-600 ${className}`} />;
    default:
      return <FileText {...iconProps} className={`text-gray-600 ${className}`} />;
  }
}
