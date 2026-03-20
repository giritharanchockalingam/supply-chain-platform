'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { generateMockTrucks, generateMockDocks, generateMockYardMetrics, generateMockExceptions, generateThroughputData, generateDwellTimeDistribution } from '@/lib/mock-data';
import { Truck } from '@/lib/types';
import { MetricCard } from '@/components/yard/MetricCard';
import { PriorityBadge } from '@/components/yard/PriorityBadge';
import { StatusBadge } from '@/components/yard/StatusBadge';
import { DockCard } from '@/components/yard/DockCard';
import { ExceptionAlert } from '@/components/yard/ExceptionAlert';
import { TruckDetailPanel } from '@/components/yard/TruckDetailPanel';
import { TrendingUp, TrendingDown, Truck as TruckIcon, Clock, AlertTriangle, Zap } from 'lucide-react';

export default function YardDashboard() {
  const trucks = generateMockTrucks(25);
  const docks = generateMockDocks(20);
  const metrics = generateMockYardMetrics();
  const exceptions = generateMockExceptions(12);
  const throughputData = generateThroughputData();
  const dwellTimeData = generateDwellTimeDistribution();

  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [sortField, setSortField] = useState<'priority' | 'dwell' | 'arrival'>('priority');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const sortedTrucks = useMemo(() => {
    let result = [...trucks];

    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    switch (sortField) {
      case 'dwell':
        result.sort((a, b) => b.dwellTime - a.dwellTime);
        break;
      case 'arrival':
        result.sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
        break;
      default:
        result.sort((a, b) => b.priorityScore - a.priorityScore);
    }

    return result;
  }, [sortField, filterStatus]);

  const openExceptions = exceptions.filter((e: typeof exceptions[number]) => !e.resolvedAt);
  const statusColors: Record<string, string> = {
    available: 'bg-emerald-500',
    assigned: 'bg-yellow-500',
    occupied: 'bg-blue-500',
    maintenance: 'bg-red-500',
  };

  return (
    <div className="p-8 space-y-8">
      {/* KPI Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Performance Indicators</h2>
        <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-4">
          <MetricCard
            label="Trucks in Yard"
            value={metrics.totalTrucksInYard}
            color="blue"
            trend={3.2}
            icon={<TruckIcon size={24} />}
          />
          <MetricCard
            label="Avg Dwell Time"
            value={metrics.averageDwellTime}
            unit="min"
            color="amber"
            trend={-1.5}
            icon={<Clock size={24} />}
          />
          <MetricCard
            label="Docks Occupied"
            value={`${metrics.docksOccupied}/${metrics.docksOccupied + metrics.docksAvailable}`}
            color="blue"
          />
          <MetricCard
            label="Open Exceptions"
            value={metrics.exceptionsOpen}
            color="red"
            trend={5}
            icon={<AlertTriangle size={24} />}
          />
          <MetricCard
            label="Throughput"
            value={metrics.throughputToday}
            unit="trucks"
            color="emerald"
            trend={8.2}
            icon={<Zap size={24} />}
          />
          <MetricCard
            label="On-Time %"
            value={metrics.onTimeUnload.toFixed(1)}
            unit="%"
            color="emerald"
            trend={1.2}
          />
          <MetricCard
            label="Detention Risk"
            value={metrics.detentionAtRisk}
            color="red"
            trend={-2}
          />
        </div>
      </div>

      {/* Priority Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Priority Queue</h2>
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="priority">Sort by Priority</option>
              <option value="dwell">Sort by Dwell Time</option>
              <option value="arrival">Sort by Arrival</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="in_yard">In Yard</option>
              <option value="at_dock">At Dock</option>
              <option value="unloading">Unloading</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Priority</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Truck/Trailer</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Carrier</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Arrival Time</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Dwell Time</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Assigned Dock</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedTrucks.slice(0, 15).map((truck) => {
                  const arrivalTime = new Date(truck.arrivalTime);
                  const timeStr = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={truck.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTruck(truck)}>
                      <td className="px-6 py-4">
                        <PriorityBadge level={truck.priorityLevel} score={truck.priorityScore} />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{truck.licensePlate}</p>
                          <p className="text-xs text-gray-500">{truck.trailerNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{truck.carrierName}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={truck.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-700">{timeStr}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${truck.dwellTime > 300 ? 'text-red-600' : 'text-gray-900'}`}>
                          {truck.dwellTime}m
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-blue-600">{truck.assignedDock || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTruck(truck);
                          }}
                          className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Throughput Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Throughput - Last 24 Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={throughputData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="trucks" fill="#3b82f6" name="Trucks Processed" />
              <Bar dataKey="onTime" fill="#10b981" name="On-Time" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dwell Time Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Dwell Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dwellTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" name="Truck Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dock Status Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dock Status Overview</h2>
        <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-4">
          {docks.slice(0, 15).map((dock) => {
            const currentTruck = dock.currentTruckId ? trucks.find((t: Truck) => t.id === dock.currentTruckId) : null;
            const scheduledTruck = dock.scheduledTruckId ? trucks.find((t: Truck) => t.id === dock.scheduledTruckId) : null;

            return (
              <DockCard
                key={dock.id}
                dock={dock}
                currentTruck={currentTruck}
                scheduledTruck={scheduledTruck}
              />
            );
          })}
        </div>
      </div>

      {/* Exceptions Panel */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Active Exceptions ({openExceptions.length})</h2>
        </div>
        <div className="space-y-3">
          {openExceptions.slice(0, 8).map((exception: typeof openExceptions[number]) => (
            <ExceptionAlert
              key={exception.id}
              exception={exception}
              onResolve={(id: string) => {
                console.log('Resolve exception:', id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Truck Detail Panel */}
      <TruckDetailPanel
        truck={selectedTruck}
        onClose={() => setSelectedTruck(null)}
      />
    </div>
  );
}
