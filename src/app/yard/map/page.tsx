'use client';

import { useState } from 'react';
import { useTrucks, useDocks } from '@/hooks/useSupabaseData';
import { Truck, Dock } from '@/lib/types';
import { TruckDetailPanel } from '@/components/yard/TruckDetailPanel';
import { RefreshCw, Crosshair } from 'lucide-react';

const statusColors: Record<string, string> = {
  approaching: '#3b82f6',
  at_gate: '#8b5cf6',
  checked_in: '#06b6d4',
  in_yard: '#4f46e5',
  at_dock: '#eab308',
  unloading: '#f97316',
  loading: '#84cc16',
  completed: '#10b981',
  departed: '#9ca3af',
};

const dockStatusColors: Record<string, string> = {
  available: '#10b981',
  assigned: '#eab308',
  occupied: '#3b82f6',
  maintenance: '#ef4444',
  blocked: '#9ca3af',
};

export default function YardMap() {
  const { data: trucks, loading: trucksLoading } = useTrucks(25);
  const { data: docks, loading: docksLoading } = useDocks(20);
  const loading = trucksLoading || docksLoading;
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sort trucks by status priority for legend
  const sortedStatuses = Object.keys(statusColors).sort((a, b) => {
    const priority: Record<string, number> = {
      critical: 1, at_dock: 2, unloading: 3, loading: 4, in_yard: 5, checked_in: 6, at_gate: 7, approaching: 8, completed: 9, departed: 10
    };
    return (priority[a] || 99) - (priority[b] || 99);
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading yard map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Interactive Yard Map</h1>
            <p className="text-blue-100 text-sm mt-1">Real-time truck and dock positioning</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                autoRefresh
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-400 text-white opacity-50'
              }`}
            >
              <RefreshCw size={18} className={autoRefresh ? 'animate-spin' : ''} />
              {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
            </button>
          </div>
        </div>

        {/* Yard Map */}
        <div className="flex gap-6 p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-[600px]">
          {/* Main Map Area */}
          <div className="flex-1 relative bg-white rounded-lg shadow-lg border-2 border-gray-300">
            {/* Grid Background */}
            <svg className="absolute inset-0 w-full h-full" style={{ background: 'linear-gradient(45deg, #f9fafb 25%, transparent 25%, transparent 75%, #f9fafb 75%, #f9fafb), linear-gradient(45deg, #f9fafb 25%, transparent 25%, transparent 75%, #f9fafb 75%, #f9fafb)' }}>
            </svg>

            {/* Zone Labels */}
            <div className="absolute top-4 left-4 space-y-2">
              <div className="bg-white bg-opacity-90 px-3 py-1 rounded-lg text-xs font-semibold text-gray-700 border border-gray-300">
                Staging Zone
              </div>
              <div className="bg-white bg-opacity-90 px-3 py-1 rounded-lg text-xs font-semibold text-gray-700 border border-gray-300">
                Waiting Area
              </div>
            </div>

            {/* Gates (Left Side) */}
            <div className="absolute left-0 top-1/4 space-y-12 ml-2">
              {[1, 2, 3, 4].map((gate) => (
                <div key={gate} className="relative">
                  <div className="w-8 h-16 bg-red-500 rounded-lg border-2 border-red-700 flex items-center justify-center text-white text-xs font-bold">
                    G{gate}
                  </div>
                  <div className="absolute left-10 top-2 text-xs bg-yellow-300 text-yellow-900 px-2 py-1 rounded">
                    Camera
                  </div>
                </div>
              ))}
            </div>

            {/* Docks (Right Side) */}
            <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center gap-4 py-8">
              {docks.slice(0, 10).map((dock: Dock) => (
                <div key={dock.id} className="relative">
                  <div
                    className="w-12 h-32 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-shadow flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      backgroundColor: dockStatusColors[dock.status],
                      borderColor: dockStatusColors[dock.status],
                    }}
                    title={`${dock.name} - ${dock.status}`}
                  >
                    <div className="text-center">
                      <div>{dock.name}</div>
                      <div className="text-xs mt-1">{dock.utilizationToday}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trucks in Yard */}
            <div className="absolute inset-0">
              {trucks.map((truck: Truck) => (
                <div
                  key={truck.id}
                  className="absolute cursor-pointer group hover:z-50"
                  style={{
                    left: `${(truck.location.x / 1000) * 100}%`,
                    top: `${(truck.location.y / 800) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => setSelectedTruck(truck)}
                >
                  {/* Truck Icon */}
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-bold shadow-md hover:shadow-lg transition-shadow"
                    style={{ backgroundColor: statusColors[truck.status] }}
                    title={truck.licensePlate}
                  >
                    T
                  </div>
                  {/* Hover Label */}
                  <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
                      <div className="font-bold">{truck.licensePlate}</div>
                      <div className="text-gray-300">{truck.carrierName}</div>
                      <div className="text-yellow-300">Dwell: {truck.dwellTime}m</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Center Compass */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 border border-gray-300">
              <Crosshair size={24} className="text-gray-400" />
            </div>
          </div>

          {/* Legend */}
          <div className="w-64 bg-white rounded-lg shadow-lg p-6 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status Legend</h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Truck Status</h4>
                <div className="space-y-2">
                  {sortedStatuses.map((status) => (
                    <div key={status} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-gray-800"
                        style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
                      ></div>
                      <span className="text-sm text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Dock Status</h4>
                <div className="space-y-2">
                  {Object.entries(dockStatusColors).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-800"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Zones</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-700">Staging - Initial entry area</div>
                  <div className="text-gray-700">Waiting - Queue for docks</div>
                  <div className="text-gray-700">Loading - Active docks</div>
                  <div className="text-gray-700">Hazmat - Hazardous materials</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500">
                  Auto-refresh: {autoRefresh ? 'Every 30 seconds' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <TruckDetailPanel
        truck={selectedTruck}
        onClose={() => setSelectedTruck(null)}
      />
    </div>
  );
}
