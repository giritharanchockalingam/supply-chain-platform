'use client';

import { useState } from 'react';
import { useTrucks, useDocks } from '@/hooks/useSupabaseData';
import { Truck, Dock } from '@/lib/types';
import { TruckDetailPanel } from '@/components/yard/TruckDetailPanel';
import { RefreshCw } from 'lucide-react';

// SVG Truck Icon Component
function TruckIcon({ color, isPulsing }: { color: string; isPulsing: boolean }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      className={`drop-shadow-md ${isPulsing ? 'animate-pulse' : ''}`}
    >
      {/* Truck Body */}
      <rect x="2" y="14" width="18" height="10" rx="2" fill={color} stroke="white" strokeWidth="1.5" />
      {/* Truck Cab */}
      <rect x="16" y="8" width="8" height="10" rx="1" fill={color} stroke="white" strokeWidth="1.5" />
      {/* Wheel 1 */}
      <circle cx="8" cy="26" r="3" fill="#374151" stroke="white" strokeWidth="1" />
      {/* Wheel 2 */}
      <circle cx="20" cy="26" r="3" fill="#374151" stroke="white" strokeWidth="1" />
      {/* Window */}
      <rect x="17" y="10" width="5" height="4" rx="1" fill="#e0f2fe" opacity="0.7" />
    </svg>
  );
}

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

const dockGradients: Record<string, string> = {
  available: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  assigned: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
  occupied: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  maintenance: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  blocked: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
};

export default function YardMap() {
  const { data: trucks, loading: trucksLoading } = useTrucks(25);
  const { data: docks, loading: docksLoading } = useDocks(20);
  const loading = trucksLoading || docksLoading;
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Calculate stats
  const totalTrucks = trucks.length;
  const avgDwellTime =
    trucks.length > 0
      ? Math.round(trucks.reduce((sum, t) => sum + t.dwellTime, 0) / trucks.length)
      : 0;
  const dockUtilization =
    docks.length > 0
      ? Math.round(
          (docks.filter((d: Dock) => d.status === 'occupied' || d.status === 'assigned').length /
            docks.length) *
            100
        )
      : 0;

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

        {/* Stats Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalTrucks}</div>
                <div className="text-xs text-gray-600 mt-1">Total Trucks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{avgDwellTime}m</div>
                <div className="text-xs text-gray-600 mt-1">Avg Dwell Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{dockUtilization}%</div>
                <div className="text-xs text-gray-600 mt-1">Dock Utilization</div>
              </div>
            </div>
          </div>
        </div>

        {/* Yard Map */}
        <div className="flex gap-6 p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-[600px]">
          {/* Main Map Area */}
          <div
            className="flex-1 relative bg-white rounded-lg shadow-lg border-2 border-gray-300 min-h-[600px] overflow-hidden"
            style={{
              backgroundImage: `
                linear-gradient(rgba(226, 232, 240, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(226, 232, 240, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          >
            {/* Zone Background Shading */}
            <div className="absolute inset-0 flex">
              {/* Gate Zone - 15% */}
              <div className="h-full bg-red-50 border-r border-dashed border-red-200" style={{ width: '15%' }}>
                <div className="text-center pt-4">
                  <div className="inline-block">
                    <span className="text-sm font-bold text-red-700 uppercase tracking-wider block">Gates</span>
                    <div className="h-1 bg-red-500 mt-2 rounded-full" style={{ width: '50px' }}></div>
                  </div>
                </div>
              </div>
              {/* Staging Zone - 20% */}
              <div className="h-full bg-amber-50 border-r border-dashed border-amber-200" style={{ width: '20%' }}>
                <div className="text-center pt-4">
                  <div className="inline-block">
                    <span className="text-sm font-bold text-amber-700 uppercase tracking-wider block">Staging</span>
                    <div className="h-1 bg-amber-500 mt-2 rounded-full" style={{ width: '50px' }}></div>
                  </div>
                </div>
              </div>
              {/* Yard Zone - 30% */}
              <div className="h-full bg-blue-50 border-r border-dashed border-blue-200" style={{ width: '30%' }}>
                <div className="text-center pt-4">
                  <div className="inline-block">
                    <span className="text-sm font-bold text-blue-700 uppercase tracking-wider block">Yard</span>
                    <div className="h-1 bg-blue-500 mt-2 rounded-full" style={{ width: '40px' }}></div>
                  </div>
                </div>
              </div>
              {/* Dock Zone - 35% */}
              <div className="h-full bg-emerald-50" style={{ width: '35%' }}>
                <div className="text-center pt-4">
                  <div className="inline-block">
                    <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider block">Docks</span>
                    <div className="h-1 bg-emerald-500 mt-2 rounded-full" style={{ width: '50px' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gates (Left Side) */}
            <div className="absolute left-0 top-1/4 space-y-8 ml-1 z-10">
              {[1, 2, 3, 4].map((gate) => (
                <div key={gate} className="relative">
                  <div className="w-7 h-14 bg-red-500 rounded border-2 border-red-700 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    G{gate}
                  </div>
                </div>
              ))}
            </div>

            {/* Docks (Right Side) - 2 columns of 5 */}
            <div className="absolute right-2 top-6 bottom-6 z-10" style={{ width: '120px' }}>
              <div className="grid grid-cols-2 gap-3 h-full auto-rows-fr">
                {docks.slice(0, 10).map((dock: Dock) => (
                  <div
                    key={dock.id}
                    className="rounded-lg border-2 border-opacity-60 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center text-white text-xs font-bold overflow-hidden relative group"
                    style={{
                      background: dockGradients[dock.status],
                      borderColor: dockStatusColors[dock.status],
                      boxShadow: `0 4px 12px -2px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                    }}
                    title={`${dock.name} - ${dock.status}`}
                  >
                    {/* 3D Depth Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/5 pointer-events-none" />
                    <div className="text-center leading-tight relative z-10">
                      <div className="text-xs font-semibold">{dock.name}</div>
                      <div className="text-[10px] opacity-90 mt-0.5">{dock.utilizationToday}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trucks in Yard */}
            <div className="absolute inset-0" style={{ right: '130px' }}>
              {trucks.map((truck: Truck) => {
                const xPercent = Math.min(95, Math.max(5, (truck.location.x / 1000) * 100));
                const yPercent = Math.min(92, Math.max(8, (truck.location.y / 800) * 100));
                const isPriority = truck.dwellTime > 300;
                return (
                  <div
                    key={truck.id}
                    className="absolute cursor-pointer group hover:z-50"
                    style={{
                      left: `${xPercent}%`,
                      top: `${yPercent}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => setSelectedTruck(truck)}
                  >
                    {/* Priority Pulse Ring */}
                    {isPriority && (
                      <div
                        className="absolute inset-0 rounded-full border-2 animate-pulse"
                        style={{
                          borderColor: statusColors[truck.status],
                          width: '48px',
                          height: '48px',
                          left: '-8px',
                          top: '-8px',
                        }}
                      />
                    )}
                    {/* Truck SVG Icon */}
                    <div
                      className="w-8 h-8 hover:scale-125 transition-transform"
                      title={truck.licensePlate}
                    >
                      <TruckIcon color={statusColors[truck.status]} isPulsing={isPriority} />
                    </div>
                    {/* Hover Label with Shadow */}
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-2xl border border-gray-700">
                        <div className="font-bold text-white">{truck.licensePlate}</div>
                        <div className="text-gray-300 text-[11px]">{truck.carrierName}</div>
                        <div className={`text-[11px] mt-1 ${truck.dwellTime > 300 ? 'text-red-400 font-semibold' : 'text-yellow-300'}`}>
                          Dwell: {truck.dwellTime}m
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Truck Count Badge */}
            <div className="absolute bottom-3 left-3 bg-white rounded-lg shadow-lg px-3 py-2 border border-gray-200 z-10">
              <span className="text-xs font-semibold text-gray-700">{trucks.length} trucks in yard</span>
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
