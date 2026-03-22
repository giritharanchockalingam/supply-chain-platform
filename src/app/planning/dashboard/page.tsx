'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { MetricCard } from '@/components/planning/MetricCard';
import { ExceptionCard } from '@/components/planning/ExceptionCard';
import { usePlanningDashboard } from '@/hooks/useSupabaseData';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

export default function DemandDashboard() {
  const { forecasts, replenishments, exceptions: rawExceptions, customers, metrics: rawMetrics, loading } = usePlanningDashboard();
  const [exceptions, setExceptions] = useState(rawExceptions);
  const metrics = rawMetrics;

  useEffect(() => {
    if (rawExceptions.length > 0) {
      setExceptions(rawExceptions);
    }
  }, [rawExceptions]);

  const exceptionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      missing_data: 0,
      demand_spike: 0,
      quality_issue: 0,
      stockout_risk: 0,
    };
    exceptions.forEach(exc => {
      if (exc.type in counts) counts[exc.type]++;
    });
    return counts;
  }, [exceptions]);

  const handleResolveException = (id: string) => {
    setExceptions(prev =>
      prev.map(exc =>
        exc.id === id
          ? { ...exc, resolvedAt: new Date().toISOString() }
          : exc
      )
    );
  };

  const stockoutRisks = useMemo(() => {
    return replenishments
      .filter(r => r.expectedStockoutDate)
      .sort((a, b) => new Date(a.expectedStockoutDate!).getTime() - new Date(b.expectedStockoutDate!).getTime())
      .slice(0, 5);
  }, [replenishments]);

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: months[i],
        mape: Math.floor(Math.random() * 15) + 7,
        target: 12,
      };
    });
  }, []);

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading planning data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Demand Planning Dashboard</h1>
          <p className="text-slate-600">Monitor forecasts, inventory, and planning exceptions</p>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Forecast Accuracy (MAPE)"
            value={metrics.overallMape}
            unit="%"
            isGood={metrics.overallMape < 15}
            target={12}
            trend={-2.5}
            icon={<BarChart3 size={20} />}
          />
          <MetricCard
            label="Service Level"
            value={metrics.serviceLevel}
            unit="%"
            isGood={metrics.serviceLevel > 90}
            target={95}
            trend={2.1}
          />
          <MetricCard
            label="Fill Rate"
            value={metrics.fillRate}
            unit="%"
            isGood={metrics.fillRate > 90}
            target={95}
            trend={1.3}
          />
          <MetricCard
            label="Data Quality"
            value={metrics.dataQualityAvg}
            unit="%"
            isGood={metrics.dataQualityAvg > 75}
            target={85}
            trend={1.8}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Stockout Rate"
            value={metrics.stockoutRate}
            unit="%"
            isGood={metrics.stockoutRate < 5}
            target={2}
            trend={-1.2}
          />
          <MetricCard
            label="Weeks of Supply"
            value={metrics.weeksOfSupply}
            unit="weeks"
            isGood={metrics.weeksOfSupply >= 2}
            target={3}
            trend={0.5}
          />
          <MetricCard
            label="Inventory Turns"
            value={metrics.inventoryTurns}
            unit="turns/yr"
            isGood={metrics.inventoryTurns > 5}
            target={6}
            trend={2.3}
          />
          <MetricCard
            label="Active Exceptions"
            value={metrics.activeExceptions}
            unit="items"
            isGood={metrics.activeExceptions < 10}
            trend={-2.1}
          />
        </div>

        {/* Forecast Accuracy Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Forecast Accuracy Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="mape"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="MAPE"
                  dot={{ fill: '#ef4444', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Target"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Exception Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Exception Summary</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-600">Stockout Risk</span>
                  <AlertTriangle className="text-red-600" size={18} />
                </div>
                <div className="text-xl lg:text-2xl font-bold text-red-600">{exceptionCounts.stockout_risk}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-600">Demand Spike</span>
                  <TrendingUp className="text-amber-600" size={18} />
                </div>
                <div className="text-xl lg:text-2xl font-bold text-amber-600">{exceptionCounts.demand_spike}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-600">Missing Data</span>
                  <Package className="text-blue-600" size={18} />
                </div>
                <div className="text-xl lg:text-2xl font-bold text-blue-600">{exceptionCounts.missing_data}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-600">Quality Issue</span>
                  <AlertTriangle className="text-purple-600" size={18} />
                </div>
                <div className="text-xl lg:text-2xl font-bold text-purple-600">{exceptionCounts.quality_issue}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Stockout Risks */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Stockout Risks</h2>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">SKU</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Customer</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Urgency</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Current Inv</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Days to Stockout</th>
                </tr>
              </thead>
              <tbody>
                {stockoutRisks.map((risk) => (
                  <tr key={risk.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-800">{risk.skuName}</td>
                    <td className="py-3 px-3 text-slate-600">{risk.customerName}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
                        {risk.urgency.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700">{risk.currentInventory}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-semibold text-red-600">
                        {Math.ceil(
                          (new Date(risk.expectedStockoutDate!).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Planning Exceptions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Planning Exceptions</h2>
          <div className="space-y-3">
            {exceptions.slice(0, 6).map(exception => (
              <ExceptionCard
                key={exception.id}
                exception={exception}
                onResolve={handleResolveException}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
