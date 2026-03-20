'use client';

import Link from 'next/link';
import { Truck, TrendingUp, Activity, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { generateMockYardMetrics } from '@/lib/mock-data';

const metrics = generateMockYardMetrics();

export default function Home() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Supply Chain Command Center</h1>
          <p className="text-lg text-gray-600">Real-time visibility and control over your distribution center operations</p>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Yard Management Card */}
          <Link
            href="/yard/dashboard"
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-blue-600 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Yard Management</h2>
                <p className="text-gray-600">Real-time truck tracking and dock optimization</p>
              </div>
              <Truck className="text-blue-600" size={32} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Trucks in Yard</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalTrucksInYard}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Avg Dwell Time</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.averageDwellTime}m</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Docks Occupied</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.docksOccupied}/{metrics.docksOccupied + metrics.docksAvailable}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Open Exceptions</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.exceptionsOpen}</p>
              </div>
            </div>

            <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
              Open Yard Dashboard
              <ArrowRight size={20} className="ml-2" />
            </div>
          </Link>

          {/* Demand Planning Card */}
          <Link
            href="/planning/dashboard"
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-emerald-600 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Demand Planning</h2>
                <p className="text-gray-600">Forecast, replenish, and optimize inventory</p>
              </div>
              <TrendingUp className="text-emerald-600" size={32} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Service Level</p>
                <p className="text-2xl font-bold text-gray-900">94.2%</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Fill Rate</p>
                <p className="text-2xl font-bold text-gray-900">97.8%</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">MAPE</p>
                <p className="text-2xl font-bold text-gray-900">8.3%</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">Data Quality</p>
                <p className="text-2xl font-bold text-gray-900">92/100</p>
              </div>
            </div>

            <div className="flex items-center text-emerald-600 font-semibold group-hover:gap-2 transition-all">
              Open Planning Dashboard
              <ArrowRight size={20} className="ml-2" />
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Throughput Today</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.throughputToday}</p>
              </div>
              <Activity className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">On-Time Rate</p>
                <p className="text-3xl font-bold text-emerald-600">{metrics.onTimeUnload.toFixed(1)}%</p>
              </div>
              <CheckCircle className="text-emerald-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Critical Issues</p>
                <p className="text-3xl font-bold text-red-600">{metrics.exceptionsCritical}</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Detention Risk</p>
                <p className="text-3xl font-bold text-amber-600">{metrics.detentionAtRisk}</p>
              </div>
              <AlertCircle className="text-amber-600" size={32} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">System Health</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-700">All yard systems operational</span>
              </div>
              <span className="text-sm text-gray-500">Just now</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-700">Forecast engine running normally</span>
              </div>
              <span className="text-sm text-gray-500">5 min ago</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-gray-700">2 docks scheduled for maintenance today</span>
              </div>
              <span className="text-sm text-gray-500">22 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
