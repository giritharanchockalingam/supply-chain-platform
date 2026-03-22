'use client';

import { useState, useMemo } from 'react';
import { useTrucks, useDocks } from '@/hooks/useSupabaseData';
import { Truck, Dock } from '@/lib/types';
import { TruckDetailPanel } from '@/components/yard/TruckDetailPanel';
import { RefreshCw, Search, Filter, Thermometer, AlertTriangle, Clock, ArrowRightLeft, Snowflake, Flame } from 'lucide-react';

// ========== TEMP CLASS ICONS ==========
function TempBadge({ tempClass }: { tempClass: string }) {
  if (tempClass === 'refrigerated' || tempClass === 'frozen') {
    return <Snowflake size={10} className="text-cyan-300" />;
  }
  if (tempClass === 'hazmat') {
    return <Flame size={10} className="text-orange-300" />;
  }
  return null;
}

// ========== TRUCK MARKER COMPONENT ==========
function TruckMarker({
  truck,
  color,
  onClick,
}: {
  truck: Truck;
  color: string;
  onClick: () => void;
}) {
  const isPriority = truck.dwellTime > 300;
  const isDetentionRisk = truck.dwellTime > 180;
  const carrierInitials = truck.carrierName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative cursor-pointer group hover:z-50" onClick={onClick}>
      {/* Detention risk pulse */}
      {isPriority && (
        <div
          className="absolute rounded-full animate-ping opacity-30"
          style={{
            backgroundColor: '#ef4444',
            width: '44px',
            height: '44px',
            left: '-6px',
            top: '-6px',
          }}
        />
      )}

      {/* Main marker */}
      <div
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-lg hover:scale-125 transition-transform border-2 border-white"
        style={{ backgroundColor: color }}
      >
        {carrierInitials}

        {/* Temperature badge */}
        {(truck.temperatureClass === 'refrigerated' || truck.temperatureClass === 'frozen' || truck.temperatureClass === 'hazmat') && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center border border-gray-600">
            <TempBadge tempClass={truck.temperatureClass} />
          </div>
        )}

        {/* Exception badge */}
        {truck.exceptions.length > 0 && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-white">
            <span className="text-[8px] text-white font-bold">{truck.exceptions.length}</span>
          </div>
        )}
      </div>

      {/* Dwell time tag (always visible for high dwell) */}
      {isDetentionRisk && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-md">
          {truck.dwellTime}m
        </div>
      )}

      {/* Hover tooltip */}
      <div className="absolute top-full mt-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
        <div className="bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="font-bold text-sm">{truck.licensePlate}</div>
            <div className="text-gray-400 text-[10px]">{truck.trailerNumber}</div>
          </div>
          <div className="px-3 py-2 space-y-1.5">
            <div className="flex justify-between gap-3 lg:gap-6">
              <span className="text-gray-400">Carrier</span>
              <span className="font-medium">{truck.carrierName}</span>
            </div>
            <div className="flex justify-between gap-3 lg:gap-6">
              <span className="text-gray-400">Status</span>
              <span className="capitalize" style={{ color }}>{truck.status.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between gap-3 lg:gap-6">
              <span className="text-gray-400">Dwell</span>
              <span className={truck.dwellTime > 300 ? 'text-red-400 font-bold' : truck.dwellTime > 180 ? 'text-amber-400' : 'text-green-400'}>
                {Math.floor(truck.dwellTime / 60)}h {truck.dwellTime % 60}m
              </span>
            </div>
            <div className="flex justify-between gap-3 lg:gap-6">
              <span className="text-gray-400">Dock</span>
              <span className="text-blue-400">{truck.assignedDock || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between gap-3 lg:gap-6">
              <span className="text-gray-400">Priority</span>
              <span className={
                truck.priorityLevel === 'critical' ? 'text-red-400' :
                truck.priorityLevel === 'high' ? 'text-orange-400' :
                truck.priorityLevel === 'medium' ? 'text-amber-400' : 'text-gray-400'
              }>{truck.priorityScore} ({truck.priorityLevel})</span>
            </div>
            {truck.temperatureClass !== 'ambient' && (
              <div className="flex justify-between gap-3 lg:gap-6">
                <span className="text-gray-400">Temp</span>
                <span className="capitalize text-cyan-400">{truck.temperatureClass}</span>
              </div>
            )}
          </div>
          {truck.exceptions.length > 0 && (
            <div className="px-3 py-2 bg-red-500/10 border-t border-red-500/20">
              <div className="text-red-400 font-semibold text-[10px]">
                {truck.exceptions.length} Active Exception{truck.exceptions.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== STATUS COLORS ==========
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

const statusLabels: Record<string, string> = {
  approaching: 'Approaching',
  at_gate: 'At Gate',
  checked_in: 'Checked In',
  in_yard: 'In Yard',
  at_dock: 'At Dock',
  unloading: 'Unloading',
  loading: 'Loading',
  completed: 'Completed',
  departed: 'Departed',
};

const dockGradients: Record<string, string> = {
  available: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  assigned: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
  occupied: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  maintenance: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  blocked: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
};

const dockStatusColors: Record<string, string> = {
  available: '#10b981',
  assigned: '#eab308',
  occupied: '#3b82f6',
  maintenance: '#ef4444',
  blocked: '#9ca3af',
};

// ========== MAIN COMPONENT ==========
export default function YardMap() {
  const { data: trucks, loading: trucksLoading } = useTrucks(50);
  const { data: docks, loading: docksLoading } = useDocks(20);
  const loading = trucksLoading || docksLoading;
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAlerts, setShowAlerts] = useState(true);

  // Filtered trucks
  const filteredTrucks = useMemo(() => {
    let result = [...trucks];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t => t.licensePlate.toLowerCase().includes(q) ||
             t.carrierName.toLowerCase().includes(q) ||
             t.trailerNumber.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    return result;
  }, [trucks, searchQuery, statusFilter]);

  // Stats
  const totalTrucks = trucks.length;
  const avgDwellTime = trucks.length > 0
    ? Math.round(trucks.reduce((sum, t) => sum + t.dwellTime, 0) / trucks.length)
    : 0;
  const dockUtilization = docks.length > 0
    ? Math.round((docks.filter((d: Dock) => d.status === 'occupied' || d.status === 'assigned').length / docks.length) * 100)
    : 0;
  const detentionRiskCount = trucks.filter(t => t.dwellTime > 180).length;
  const exceptionCount = trucks.reduce((sum, t) => sum + t.exceptions.length, 0);

  // Zone counts
  const zoneFromLocation = (x: number): string => {
    const pct = (x / 1000) * 100;
    if (pct < 15) return 'gate';
    if (pct < 35) return 'staging';
    if (pct < 65) return 'yard';
    return 'dock';
  };
  const zoneCounts = trucks.reduce((acc, t) => {
    const zone = zoneFromLocation(t.location.x);
    acc[zone] = (acc[zone] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const zoneCapacities: Record<string, number> = { gate: 8, staging: 12, yard: 20, dock: 10 };

  // Status distribution for filter pills
  const statusCounts = trucks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent activity (simulated from truck data)
  const recentActivity = useMemo(() => {
    return trucks
      .slice(0, 8)
      .map(t => ({
        id: t.id,
        plate: t.licensePlate,
        carrier: t.carrierName,
        status: t.status,
        dwell: t.dwellTime,
        time: new Date(t.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
  }, [trucks]);

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading yard map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-0 sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search plate, carrier, trailer..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1.5 overflow-x-auto mobile-tabs pb-1 sm:pb-0 sm:flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({totalTrucks})
            </button>
            {Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === status
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={statusFilter === status ? { backgroundColor: statusColors[status] } : {}}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColors[status] }}
                  />
                  {statusLabels[status] || status} ({count})
                </button>
              ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showAlerts ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <AlertTriangle size={14} />
              Alerts {detentionRiskCount > 0 && `(${detentionRiskCount})`}
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                autoRefresh ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'In Yard', value: totalTrucks, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Avg Dwell', value: `${Math.floor(avgDwellTime / 60)}h ${avgDwellTime % 60}m`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Dock Util.', value: `${dockUtilization}%`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Detention Risk', value: detentionRiskCount, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          { label: 'Exceptions', value: exceptionCount, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'Throughput', value: trucks.filter(t => t.status === 'completed' || t.status === 'departed').length, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
        ].map((kpi, i) => (
          <div key={i} className={`${kpi.bg} ${kpi.border} border rounded-xl px-4 py-3`}>
            <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[11px] text-gray-500 font-medium mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 340px)', minHeight: '500px' }}>
        {/* Map */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative h-[400px] sm:h-[500px] lg:h-auto">
          {/* Zone backgrounds */}
          <div className="absolute inset-0 flex">
            {[
              { name: 'Gates', zone: 'gate', width: '12%', bg: 'bg-red-50/70', border: 'border-red-200', color: 'text-red-600', barColor: 'bg-red-400' },
              { name: 'Staging', zone: 'staging', width: '20%', bg: 'bg-amber-50/70', border: 'border-amber-200', color: 'text-amber-600', barColor: 'bg-amber-400' },
              { name: 'Yard', zone: 'yard', width: '33%', bg: 'bg-blue-50/50', border: 'border-blue-200', color: 'text-blue-600', barColor: 'bg-blue-400' },
              { name: 'Docks', zone: 'dock', width: '35%', bg: 'bg-emerald-50/50', border: 'border-emerald-200', color: 'text-emerald-600', barColor: 'bg-emerald-400' },
            ].map((z, i) => (
              <div
                key={z.zone}
                className={`h-full ${z.bg} ${i < 3 ? `border-r border-dashed ${z.border}` : ''}`}
                style={{ width: z.width }}
              >
                <div className="px-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold ${z.color} uppercase tracking-wider`}>{z.name}</span>
                    <span className="text-[9px] text-gray-400 font-medium">
                      {zoneCounts[z.zone] || 0}/{zoneCapacities[z.zone]}
                    </span>
                  </div>
                  {/* Zone capacity bar */}
                  <div className="w-full h-1 bg-gray-200/60 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full ${z.barColor} rounded-full transition-all`}
                      style={{ width: `${Math.min(100, ((zoneCounts[z.zone] || 0) / zoneCapacities[z.zone]) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Gates */}
          <div className="absolute left-1 top-[15%] space-y-6 z-10">
            {[1, 2, 3, 4].map(gate => (
              <div key={gate} className="relative group">
                <div className="w-8 h-12 bg-gradient-to-b from-red-500 to-red-600 rounded-md border border-red-700 flex flex-col items-center justify-center text-white shadow-lg">
                  <ArrowRightLeft size={10} className="mb-0.5 opacity-70" />
                  <span className="text-[9px] font-bold">G{gate}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Docks */}
          <div className="absolute right-1 sm:right-2 top-8 bottom-8 z-10 w-[80px] sm:w-[110px] lg:w-[130px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full auto-rows-fr">
              {docks.slice(0, 10).map((dock: Dock) => {
                const assignedTruck = dock.currentTruckId
                  ? trucks.find(t => t.id === dock.currentTruckId)
                  : null;
                return (
                  <div
                    key={dock.id}
                    className="rounded-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center text-white overflow-hidden relative group"
                    style={{
                      background: dockGradients[dock.status],
                      boxShadow: `0 2px 8px -1px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
                    }}
                    title={`${dock.name} - ${dock.status}${assignedTruck ? ` - ${assignedTruck.licensePlate}` : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/10 pointer-events-none" />
                    <div className="text-center leading-tight relative z-10 py-1">
                      <div className="text-[11px] font-bold">{dock.name}</div>
                      {assignedTruck ? (
                        <div className="text-[8px] opacity-90 mt-0.5 px-1 truncate max-w-full">{assignedTruck.licensePlate}</div>
                      ) : (
                        <div className="text-[8px] opacity-70 mt-0.5 capitalize">{dock.status}</div>
                      )}
                      {/* Utilization bar */}
                      <div className="w-8 h-0.5 bg-white/20 rounded-full mt-1 mx-auto overflow-hidden">
                        <div
                          className="h-full bg-white/60 rounded-full"
                          style={{ width: `${dock.utilizationToday}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Truck markers */}
          <div className="absolute inset-0 right-[85px] sm:right-[115px] lg:right-[140px]">
            {filteredTrucks.map((truck: Truck) => {
              const xPercent = Math.min(92, Math.max(4, (truck.location.x / 1000) * 100));
              const yPercent = Math.min(90, Math.max(12, (truck.location.y / 800) * 100));
              return (
                <div
                  key={truck.id}
                  className="absolute"
                  style={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <TruckMarker
                    truck={truck}
                    color={statusColors[truck.status]}
                    onClick={() => setSelectedTruck(truck)}
                  />
                </div>
              );
            })}
          </div>

          {/* Bottom info bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between z-20">
            <div className="flex items-center gap-4 text-[11px] text-gray-500">
              <span className="font-semibold text-gray-700">{filteredTrucks.length} truck{filteredTrucks.length !== 1 ? 's' : ''} shown</span>
              {searchQuery && <span className="text-blue-600">Filtered by &quot;{searchQuery}&quot;</span>}
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              {autoRefresh && (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live - 30s refresh
                </span>
              )}
              <span className="text-gray-400">Last: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Legend + Activity */}
        <div className="w-72 flex flex-col gap-4">
          {/* Detention Alerts */}
          {showAlerts && detentionRiskCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-h-[200px] overflow-y-auto">
              <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <AlertTriangle size={14} />
                Detention Risk ({detentionRiskCount})
              </h3>
              <div className="space-y-2">
                {trucks
                  .filter(t => t.dwellTime > 180)
                  .sort((a, b) => b.dwellTime - a.dwellTime)
                  .slice(0, 5)
                  .map(t => (
                    <div
                      key={t.id}
                      className="bg-white rounded-lg px-3 py-2 border border-red-100 cursor-pointer hover:border-red-300 transition-colors"
                      onClick={() => setSelectedTruck(t)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-gray-900">{t.licensePlate}</div>
                          <div className="text-[10px] text-gray-500">{t.carrierName}</div>
                        </div>
                        <div className="text-xs font-bold text-red-600 flex items-center gap-1">
                          <Clock size={10} />
                          {Math.floor(t.dwellTime / 60)}h {t.dwellTime % 60}m
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Status Legend</h3>

            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Trucks</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
                  {Object.entries(statusLabels).map(([status, label]) => {
                    const count = statusCounts[status] || 0;
                    return (
                      <div key={status} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[status] }} />
                        <span className="text-[10px] text-gray-600 truncate">{label}</span>
                        {count > 0 && <span className="text-[9px] text-gray-400 ml-auto">{count}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Docks</h4>
                <div className="space-y-1.5">
                  {Object.entries(dockStatusColors).map(([status, color]) => {
                    const count = docks.filter((d: Dock) => d.status === status).length;
                    return (
                      <div key={status} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: color }} />
                        <span className="text-[10px] text-gray-600 capitalize flex-1">{status}</span>
                        <span className="text-[9px] text-gray-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Markers</h4>
                <div className="space-y-1.5 text-[10px] text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Snowflake size={10} className="text-cyan-500" />
                    <span>Refrigerated / Frozen</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame size={10} className="text-orange-500" />
                    <span>Hazmat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[7px] text-white font-bold">!</span>
                    </div>
                    <span>Exception count</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border-2 border-red-400 animate-pulse" />
                    <span>Detention risk (&gt;3h)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-h-[250px] overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Recent Activity
            </h3>
            <div className="space-y-2">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-center gap-2 text-[11px]">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[a.status] }} />
                  <span className="font-medium text-gray-800 truncate flex-1">{a.plate}</span>
                  <span className="text-gray-400 capitalize text-[10px]">{a.status.replace('_', ' ')}</span>
                  <span className="text-gray-300 text-[10px]">{a.time}</span>
                </div>
              ))}
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
