'use client';

import { useState } from 'react';
import { useTrucks, useDocks } from '@/hooks/useSupabaseData';
import { Truck, Dock } from '@/lib/types';
import { Clock, TrendingUp, Users } from 'lucide-react';

export default function DockSchedulePage() {
  const { data: allDocks, loading: docksLoading } = useDocks(20);
  const { data: trucks, loading: trucksLoading } = useTrucks(25);
  const loading = docksLoading || trucksLoading;
  const docks = allDocks.slice(0, 10);
  const [expandedDock, setExpandedDock] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dock data...</p>
        </div>
      </div>
    );
  }

  const dockStatusColors: Record<string, string> = {
    available: 'bg-emerald-500',
    assigned: 'bg-yellow-500',
    occupied: 'bg-blue-500',
    maintenance: 'bg-red-500',
    blocked: 'bg-gray-500',
  };

  // Generate timeline events for each dock
  const getTimelineBlocks = (dock: Dock) => {
    const blocks: Array<{ id: string; type: string; label: string; truck: Truck | undefined }> = [];
    const now = new Date();

    // Current truck
    if (dock.currentTruckId) {
      blocks.push({
        id: dock.currentTruckId,
        type: 'current',
        label: 'Current',
        truck: trucks.find((t: Truck) => t.id === dock.currentTruckId),
      });
    }

    // Scheduled truck
    if (dock.scheduledTruckId) {
      blocks.push({
        id: dock.scheduledTruckId,
        type: 'scheduled',
        label: 'Scheduled',
        truck: trucks.find((t: Truck) => t.id === dock.scheduledTruckId),
      });
    }

    return blocks;
  };

  return (
    <div className="p-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dock Schedule</h1>
          <p className="text-gray-600 mt-2">Real-time dock assignments and scheduling</p>
        </div>

        {/* Timeline View */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <h2 className="text-2xl font-bold">Timeline View</h2>
          </div>

          <div className="overflow-x-auto">
            <div className="p-6 space-y-4 min-w-max">
              {docks.map((dock: Dock) => {
                const blocks = getTimelineBlocks(dock);
                return (
                  <div key={dock.id} className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    {/* Dock Label */}
                    <div className="w-40 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-3 h-3 rounded-full ${dockStatusColors[dock.status]}`}
                        ></div>
                        <h3 className="font-bold text-gray-900">{dock.name}</h3>
                      </div>
                      <p className="text-xs text-gray-500">{dock.status}</p>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 flex items-center gap-3 h-12">
                      {blocks.map((block) => (
                        <div
                          key={block.id}
                          className={`h-10 rounded-lg px-3 flex items-center gap-2 text-white text-sm font-medium cursor-pointer hover:shadow-lg transition-shadow ${
                            block.type === 'current'
                              ? 'bg-blue-500 flex-grow'
                              : 'bg-yellow-500 min-w-max'
                          }`}
                          title={block.truck?.licensePlate}
                        >
                          <span className="truncate">{block.truck?.licensePlate}</span>
                        </div>
                      ))}

                      {blocks.length === 0 && (
                        <div className="h-10 rounded-lg px-3 flex items-center text-sm text-gray-500 bg-gray-100">
                          Available
                        </div>
                      )}
                    </div>

                    {/* Utilization */}
                    <div className="w-20 flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900">{dock.utilizationToday}%</p>
                      <p className="text-xs text-gray-500">Util.</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dock Details Cards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dock Details</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docks.map((dock) => {
              const currentTruck = dock.currentTruckId ? trucks.find(t => t.id === dock.currentTruckId) : null;
              const scheduledTruck = dock.scheduledTruckId ? trucks.find(t => t.id === dock.scheduledTruckId) : null;

              return (
                <div key={dock.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{dock.name}</h3>
                        <p className={`text-xs font-medium capitalize px-2 py-1 rounded inline-block mt-1 ${
                          dock.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                          dock.status === 'occupied' ? 'bg-blue-100 text-blue-700' :
                          dock.status === 'assigned' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {dock.status}
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedDock(expandedDock === dock.id ? null : dock.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedDock === dock.id ? '−' : '+'}
                      </button>
                    </div>

                    {/* Status */}
                    <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium text-gray-900 capitalize">{dock.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Utilization:</span>
                        <span className="font-medium text-gray-900">{dock.utilizationToday}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Temp Capable:</span>
                        <span className="font-medium text-gray-900">{dock.temperatureCapable ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Hazmat:</span>
                        <span className="font-medium text-gray-900">{dock.hazmatCapable ? 'Yes' : 'No'}</span>
                      </div>
                    </div>

                    {/* Current Assignment */}
                    {currentTruck && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 font-semibold mb-2">CURRENT</p>
                        <p className="font-bold text-gray-900">{currentTruck.licensePlate}</p>
                        <p className="text-xs text-gray-600">{currentTruck.carrierName}</p>
                        <p className="text-xs text-gray-500 mt-1">Dwell: {currentTruck.dwellTime}m</p>
                      </div>
                    )}

                    {/* Scheduled Assignment */}
                    {scheduledTruck && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs text-yellow-600 font-semibold mb-2">SCHEDULED</p>
                        <p className="font-bold text-gray-900">{scheduledTruck.licensePlate}</p>
                        <p className="text-xs text-gray-600">{scheduledTruck.carrierName}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                      <button className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                        Reassign Truck
                      </button>
                      {dock.status === 'occupied' && (
                        <button className="w-full px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors">
                          Complete Unload
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedDock === dock.id && (
                    <div className="bg-gray-50 border-t border-gray-200 p-4 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Activity:</span>
                        <span className="font-medium">{new Date(dock.lastActivity).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Trailer:</span>
                        <span className="font-medium">{dock.maxTrailerLength} ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Position:</span>
                        <span className="font-medium">({dock.position.x}, {dock.position.y})</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dock KPIs */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Avg Utilization</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {Math.round(docks.reduce((sum: number, d: Dock) => sum + d.utilizationToday, 0) / docks.length)}%
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Occupied Docks</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {docks.filter((d: Dock) => d.status === 'occupied').length}
                </p>
              </div>
              <Users className="text-emerald-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Available</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {docks.filter((d: Dock) => d.status === 'available').length}
                </p>
              </div>
              <Clock className="text-amber-600" size={32} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
