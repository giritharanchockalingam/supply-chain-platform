'use client';

import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCard } from '@/components/planning/MetricCard';
import { ForecastChart } from '@/components/planning/ForecastChart';
import { Save } from 'lucide-react';
import { useForecasts, useProducts } from '@/hooks/useSupabaseData';

export default function ForecastManagementPage() {
  const { data: skus, loading: skusLoading } = useProducts(15);
  const { data: rawForecasts, loading: forecastsLoading } = useForecasts(200);
  const [forecasts, setForecasts] = useState<typeof rawForecasts>([]);
  const loading = skusLoading || forecastsLoading;
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('market_intelligence');
  const [adjustmentValue, setAdjustmentValue] = useState('');

  useEffect(() => {
    if (rawForecasts.length > 0) {
      setForecasts(rawForecasts);
    }
  }, [rawForecasts]);

  useEffect(() => {
    if (skus.length > 0 && !selectedSkuId) {
      setSelectedSkuId(skus[0].id);
    }
  }, [skus, selectedSkuId]);

  const selectedSku = useMemo(() => skus.find(s => s.id === selectedSkuId), [selectedSkuId, skus]);

  const selectedForecasts = useMemo(() => {
    return forecasts.filter(f => f.skuId === selectedSkuId);
  }, [forecasts, selectedSkuId]);

  const chartData = useMemo(() => {
    return selectedForecasts
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(f => ({
        period: f.period,
        actual: f.actualQuantity,
        forecast: f.forecastQuantity,
        confidenceLow: f.confidenceLow,
        confidenceHigh: f.confidenceHigh,
        previous: Math.floor(f.forecastQuantity * 0.95),
      }))
      .slice(-12);
  }, [selectedForecasts]);

  const accuracyMetrics = useMemo(() => {
    const withActuals = selectedForecasts.filter(f => f.actualQuantity !== null);
    if (withActuals.length === 0) {
      return { mape: 0, mae: 0, bias: 0 };
    }

    const mape = withActuals.reduce((sum, f) => {
      if (f.actualQuantity === null) return sum;
      return sum + Math.abs((f.actualQuantity - f.forecastQuantity) / f.actualQuantity);
    }, 0) / withActuals.length * 100;

    const mae = withActuals.reduce((sum, f) => {
      if (f.actualQuantity === null) return sum;
      return sum + Math.abs(f.actualQuantity - f.forecastQuantity);
    }, 0) / withActuals.length;

    const bias = withActuals.reduce((sum, f) => {
      if (f.actualQuantity === null) return sum;
      return sum + (f.actualQuantity - f.forecastQuantity);
    }, 0) / withActuals.length;

    return {
      mape: Math.round(mape * 10) / 10,
      mae: Math.round(mae),
      bias: Math.round(bias * 10) / 10,
    };
  }, [selectedForecasts]);

  const handleAdjustment = () => {
    if (!adjustmentValue || !selectedForecasts[selectedForecasts.length - 1]) return;

    setForecasts(prev =>
      prev.map(f => {
        if (f.skuId === selectedSkuId && f.period === selectedForecasts[selectedForecasts.length - 1].period) {
          return {
            ...f,
            forecastQuantity: parseInt(adjustmentValue),
            adjustedBy: 'current-user',
            adjustmentReason: adjustmentReason as any,
            status: 'reviewed' as const,
          };
        }
        return f;
      })
    );

    setAdjustmentValue('');
  };

  const recentForecasts = useMemo(() => {
    return selectedForecasts
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, 12);
  }, [selectedForecasts]);

  if (loading || skus.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Forecast Management</h1>
          <p className="text-slate-600">Review, adjust, and approve demand forecasts</p>
        </div>

        {/* SKU Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Select SKU</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SKU</label>
              <select
                value={selectedSkuId}
                onChange={(e) => setSelectedSkuId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {skus.map(sku => (
                  <option key={sku.id} value={sku.id}>
                    {sku.sku} - {sku.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedSku && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={selectedSku.category}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lead Time</label>
                  <input
                    type="text"
                    value={`${selectedSku.leadTimeDays} days`}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Forecast Trend (Last 12 Months)</h2>
          <ForecastChart data={chartData} height={350} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Forecast Table */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Forecast Detail</h2>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Period</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Forecast</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Actual</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Error %</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Method</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentForecasts.map(f => (
                    <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-800">{f.period}</td>
                      <td className="py-2 px-3 text-right text-slate-700">{f.forecastQuantity.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-700">
                        {f.actualQuantity ? f.actualQuantity.toLocaleString() : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-700">
                        {f.mape !== null ? `${(f.mape * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 text-xs">
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {f.method.replace('_', '-').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          f.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700'
                            : f.status === 'approved'
                            ? 'bg-blue-100 text-blue-700'
                            : f.status === 'reviewed'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {f.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjustment Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Manual Adjustment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Override Forecast Value</label>
                <input
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder="Enter new forecast quantity"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Adjustment Reason</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="market_intelligence">Market Intelligence</option>
                  <option value="promotion_planned">Promotion Planned</option>
                  <option value="customer_feedback">Customer Feedback</option>
                  <option value="seasonal_adjustment">Seasonal Adjustment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                onClick={handleAdjustment}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Apply Adjustment
              </button>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <button className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-amber-700 transition">
                  Submit for Review
                </button>
                <button className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition">
                  Approve & Publish
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Accuracy Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Mean Absolute Percentage Error</p>
              <p className="text-2xl font-bold text-slate-900">{accuracyMetrics.mape}%</p>
              <p className="text-xs text-slate-500 mt-1">Good forecast accuracy</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Mean Absolute Error</p>
              <p className="text-2xl font-bold text-slate-900">{accuracyMetrics.mae}</p>
              <p className="text-xs text-slate-500 mt-1">units</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Forecast Bias</p>
              <p className={`text-2xl font-bold ${accuracyMetrics.bias > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {accuracyMetrics.bias > 0 ? '+' : ''}{accuracyMetrics.bias}
              </p>
              <p className="text-xs text-slate-500 mt-1">{accuracyMetrics.bias > 0 ? 'Over-forecast' : 'Under-forecast'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
