'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Download, Calendar } from 'lucide-react';
import { useCustomers } from '@/hooks/useSupabaseData';

const reports = [
  {
    id: 'accuracy',
    title: 'Forecast Accuracy Report',
    description: 'Detailed analysis of forecast performance by method and SKU',
    icon: FileText,
    metrics: ['MAPE', 'MAE', 'Bias', 'Tracking Signal'],
  },
  {
    id: 'service',
    title: 'Service Level Report',
    description: 'Fill rate, stockout analysis, and demand fulfillment metrics',
    icon: FileText,
    metrics: ['Service Level %', 'Fill Rate', 'Stockout Count', 'Demand Met'],
  },
  {
    id: 'inventory',
    title: 'Inventory Health Report',
    description: 'Inventory turnover, weeks of supply, and holding cost analysis',
    icon: FileText,
    metrics: ['Turnover', 'Weeks Supply', 'Holding Cost', 'Obsolescence'],
  },
  {
    id: 'scorecard',
    title: 'Customer Scorecard',
    description: 'Performance metrics and data quality by customer',
    icon: FileText,
    metrics: ['Data Quality', 'Forecast Accuracy', 'Service Level', 'Trend'],
  },
  {
    id: 'exceptions',
    title: 'Exception Analysis',
    description: 'Root cause analysis of planning exceptions',
    icon: FileText,
    metrics: ['Exception Types', 'Frequency', 'Resolution Time', 'Patterns'],
  },
  {
    id: 'quality',
    title: 'Data Quality Report',
    description: 'Signal validation results and data integrity metrics',
    icon: FileText,
    metrics: ['Valid %', 'Validation Issues', 'Duplicate Signals', 'Stale Data'],
  },
];

export default function PlanningReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30days');
  const { data: customers, loading } = useCustomers(8);
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');

  const regions = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast', 'Central'];

  const mockReportData = useMemo(() => {
    const mapeData = Array.from({ length: 12 }, (_, i) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: months[i],
        mape: Math.floor(Math.random() * 15) + 7,
        target: 12,
      };
    });

    const forecastVsActuals = ['SKU000001', 'SKU000002', 'SKU000003', 'SKU000004', 'SKU000005'].map(sku => ({
      sku,
      actual: Math.floor(Math.random() * 1000) + 200,
      forecast: Math.floor(Math.random() * 1000) + 200,
    }));

    return { mapeData, forecastVsActuals };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Planning Reports</h1>
          <p className="text-slate-600">Generate and download demand planning analytics and insights</p>
        </div>

        {!selectedReport ? (
          <>
            {/* Report Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {reports.map(report => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border border-slate-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="text-blue-600" size={28} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{report.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{report.description}</p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase">Includes:</p>
                    <div className="flex flex-wrap gap-1">
                      {report.metrics.map(metric => (
                        <span key={metric} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Report View */}
            <div className="mb-6">
              <button
                onClick={() => setSelectedReport(null)}
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm mb-4"
              >
                Back to Reports
              </button>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-6">
                  {reports.find(r => r.id === selectedReport)?.title}
                </h2>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="90days">Last 90 Days</option>
                      <option value="ytd">Year to Date</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                    <select
                      value={filterCustomer}
                      onChange={(e) => setFilterCustomer(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Customers</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Region</label>
                    <select
                      value={filterRegion}
                      onChange={(e) => setFilterRegion(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Regions</option>
                      {regions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition">
                      Generate Report
                    </button>
                  </div>
                </div>

                {/* Export Options */}
                <div className="flex gap-2 mb-6 pb-6 border-b border-slate-200">
                  <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition">
                    <Download size={16} />
                    Export CSV
                  </button>
                  <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition">
                    <Download size={16} />
                    Export PDF
                  </button>
                  <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">
                    <Calendar size={16} />
                    Schedule Report
                  </button>
                </div>

                {/* Report Preview */}
                {selectedReport === 'accuracy' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Forecast Accuracy Trend</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">Overall MAPE</p>
                        <p className="text-xl lg:text-2xl font-bold text-slate-900">11.3%</p>
                        <p className="text-xs text-emerald-600 mt-1">↓ 2.1% vs last month</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">Best Method</p>
                        <p className="text-xl lg:text-2xl font-bold text-slate-900">Holt-W</p>
                        <p className="text-xs text-slate-600 mt-1">8.7% MAPE</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">Worst Method</p>
                        <p className="text-xl lg:text-2xl font-bold text-slate-900">ARIMA</p>
                        <p className="text-xs text-slate-600 mt-1">14.2% MAPE</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">Forecast Count</p>
                        <p className="text-xl lg:text-2xl font-bold text-slate-900">847</p>
                        <p className="text-xs text-slate-600 mt-1">Active SKUs</p>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={mockReportData.mapeData}>
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
                          name="MAPE %"
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
                )}

                {selectedReport === 'service' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Service Level Performance</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <p className="text-xs text-emerald-600 mb-1">Service Level</p>
                        <p className="text-xl lg:text-2xl font-bold text-emerald-900">94.2%</p>
                        <p className="text-xs text-emerald-600 mt-1">↑ 2.3% vs target</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-xs text-blue-600 mb-1">Fill Rate</p>
                        <p className="text-xl lg:text-2xl font-bold text-blue-900">92.8%</p>
                        <p className="text-xs text-blue-600 mt-1">Orders fulfilled</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <p className="text-xs text-amber-600 mb-1">Stockout Events</p>
                        <p className="text-xl lg:text-2xl font-bold text-amber-900">14</p>
                        <p className="text-xs text-amber-600 mt-1">Last 30 days</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">Demand Met</p>
                        <p className="text-xl lg:text-2xl font-bold text-slate-900">98.1%</p>
                        <p className="text-xs text-slate-600 mt-1">Total demand</p>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={mockReportData.forecastVsActuals}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="sku" stroke="#64748b" style={{ fontSize: '11px' }} />
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
                        <Bar dataKey="actual" fill="#3b82f6" name="Demand" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="forecast" fill="#10b981" name="Supplied" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {!['accuracy', 'service'].includes(selectedReport) && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-600">Report preview will appear here</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Click "Generate Report" to populate data with your selected filters
                    </p>
                  </div>
                )}
              </div>

              {/* Data Table Sample */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Report Data</h3>
                <div className="overflow-x-auto mobile-table-wrapper">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Customer</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">MAPE</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Service Level</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Data Quality</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(customer => (
                        <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-800">{customer.name}</td>
                          <td className="py-3 px-4 text-right text-slate-700">{Math.floor(Math.random() * 15) + 7}%</td>
                          <td className="py-3 px-4 text-right text-slate-700">{Math.floor(Math.random() * 10) + 90}%</td>
                          <td className="py-3 px-4 text-right text-slate-700">{customer.dataQualityScore}%</td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-emerald-600 font-semibold">↑ {Math.floor(Math.random() * 5) + 1}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
