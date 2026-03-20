'use client';

import { Dock, Truck } from '@/lib/types';
import { Activity } from 'lucide-react';

const dockStatusColors = {
  available: 'bg-emerald-500',
  assigned: 'bg-yellow-500',
  occupied: 'bg-blue-500',
  maintenance: 'bg-red-500',
  blocked: 'bg-gray-500',
};

interface DockCardProps {
  dock: Dock;
  currentTruck?: Truck | null;
  scheduledTruck?: Truck | null;
}

export function DockCard({ dock, currentTruck, scheduledTruck }: DockCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${dockStatusColors[dock.status]}`} />
          <h3 className="font-semibold text-gray-900">{dock.name}</h3>
        </div>
        <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded">
          {dock.utilizationToday}%
        </span>
      </div>

      <div className="space-y-3">
        {currentTruck && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <p className="text-xs text-gray-600 font-medium">Current</p>
            <p className="text-sm font-semibold text-gray-900">{currentTruck.licensePlate}</p>
            <p className="text-xs text-gray-600">{currentTruck.carrierName}</p>
          </div>
        )}

        {scheduledTruck && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <p className="text-xs text-gray-600 font-medium">Scheduled</p>
            <p className="text-sm font-semibold text-gray-900">{scheduledTruck.licensePlate}</p>
            <p className="text-xs text-gray-600">{scheduledTruck.carrierName}</p>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200 text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium">{dock.type.charAt(0).toUpperCase() + dock.type.slice(1)}</span>
          </div>
          <div className="flex justify-between">
            <span>Temp Capable:</span>
            <span className="font-medium">{dock.temperatureCapable ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span>Hazmat:</span>
            <span className="font-medium">{dock.hazmatCapable ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
