'use client';

import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Filter } from 'lucide-react';
import { useTrucks, useDocks } from '@/hooks/useSupabaseData';
import { Truck } from '@/lib/types';

export default function YardReports() {
  const { data: trucks, loading: trucksLoading } = useTrucks(100);
  const { data: docks, loading: docksLoading } = useDocks(50);
  const loading = trucksLoading || docksLoading;

  // Build daily data from truck arrival times
  const dailyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const byDay: Record<string, { trucks: number; onTime: number; totalDwell: number }> = {};
    days.forEach(d => { byDay[d] = { trucks: 0, onTime: 0, totalDwell: 0 }; });

    trucks.forEach((t: Truck) => {
      const day = days[new Date(t.arrivalTime).getDay()];
      byDay[day].trucks++;
      if (t.dwellTime <= 240) byDay[day].onTime++;
      byDay[day].totalDwell += t.dwellTime;
    });

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      date: day,
      trucks: byDay[day].trucks,
      onTime: byDay[day].trucks > 0 ? Math.round((byDay[day].onTime / byDay[day].trucks) * 100) : 0,
      avgDwell: byDay[day].trucks > 0 ? Math.round(byDay[day].totalDwell / byDay[day].trucks) : 0,
    }));
  }, [trucks]);

  // Summary stats
  const summary = useMemo(() => {
    const totalTrucks = trucks.length;
    const onTimeTrucks = trucks.filter((t: Truck) => t.dwellTime <= 240).length;
    const avgDwell = totalTrucks > 0 ? Math.round(trucks.reduce((s: number, t: Truck) => s + t.dwellTime, 0) / totalTrucks) : 0;
    const docksOccupied = docks.filter(d => d.currentTruckId).length;
    const dockUtil = docks.length > 0 ? Math.round((docksOccupied / docks.length) * 100) : 0;

    return {
      totalTrucks,
      onTimePercent: totalTrucks > 0 ? Math.round((onTimeTrucks / totalTrucks) * 100 * 10) / 10 : 0,
      avgDwell,
      dockUtil,
    };
  }, [trucks, docks]);

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yard Reports</h1>
            <p className="text-gray-600 mt-2">Performance metrics and analytics</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            <Download size={20} />
            Export Report
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input type="date" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" defaultValue="2026-03-13" />
                <input type="date" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" defaultValue="2026-03-20" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
                <option>All Metrics</option>
                <option>Throughput</option>
                <option>On-Time %</option>
                <option>Dwell Time</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Throughput</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="trucks" fill="#3b82f6" name="Trucks Processed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">On-Time Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="onTime" stroke="#10b981" name="On-Time %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Average Dwell Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgDwell" stroke="#f59e0b" name="Avg Dwell (min)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="onTime" fill="#10b981" name="On-Time %" />
                <Bar dataKey="trucks" fill="#3b82f6" name="Trucks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Summary Statistics</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="text-sm text-gray-600">Total Trucks Processed</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalTrucks}</p>
              <p className="text-xs text-gray-500 mt-1">Current data</p>
            </div>
            <div className="border-l-4 border-emerald-600 pl-4">
              <p className="text-sm text-gray-600">Average On-Time %</p>
              <p className="text-3xl font-bold text-emerald-600">{summary.onTimePercent}%</p>
              <p className="text-xs text-gray-500 mt-1">Current data</p>
            </div>
            <div className="border-l-4 border-amber-600 pl-4">
              <p className="text-sm text-gray-600">Average Dwell Time</p>
              <p className="text-3xl font-bold text-amber-600">{summary.avgDwell}m</p>
              <p className="text-xs text-gray-500 mt-1">Current data</p>
            </div>
            <div className="border-l-4 border-purple-600 pl-4">
              <p className="text-sm text-gray-600">Dock Utilization</p>
              <p className="text-3xl font-bold text-purple-600">{summary.dockUtil}%</p>
              <p className="text-xs text-gray-500 mt-1">Current data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
