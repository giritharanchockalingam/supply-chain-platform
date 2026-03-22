'use client';

import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCard } from '@/components/planning/MetricCard';
import { InventoryGauge } from '@/components/planning/InventoryGauge';
import { CheckCircle, X } from 'lucide-react';
import { useReplenishments } from '@/hooks/useSupabaseData';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

export default function ReplenishmentPage() {
  const { data: rawReplenishments, loading } = useReplenishments(25);
  const [replenishments, setReplenishments] = useState<typeof rawReplenishments>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (rawReplenishments.length > 0) {
      setReplenishments(rawReplenishments);
    }
  }, [rawReplenishments]);

  const filteredReplenishments = useMemo(() => {
    return replenishments.filter(r => {
      const urgencyMatch = filterUrgency === 'all' || r.urgency === filterUrgency;
      const statusMatch = filterStatus === 'all' || r.status === filterStatus;
      return urgencyMatch && statusMatch;
    });
  }, [replenishments, filterUrgency, filterStatus]);

  const stats = useMemo(() => {
    const total = replenishments.length;
    const critical = replenishments.filter(r => r.urgency === 'critical').length;
    const pending = replenishments.filter(r => r.status === 'pending').length;
    const totalUnits = replenishments.reduce((sum, r) => sum + r.recommendedQuantity, 0);
    const avgUnitCost = 35;
    const totalValue = totalUnits * avgUnitCost;

    return { total, critical, pending, totalUnits, totalValue };
  }, [replenishments]);

  const urgencyDistribution = useMemo(() => {
    const dist: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    replenishments.forEach(r => {
      dist[r.urgency]++;
    });

    return Object.entries(dist).map(([urgency, count]) => ({
      name: urgency.charAt(0).toUpperCase() + urgency.slice(1),
      value: count,
    }));
  }, [replenishments]);

  const handleToggleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredReplenishments.map(r => r.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkApprove = () => {
    setReplenishments(prev =>
      prev.map(r =>
        selectedItems.includes(r.id) ? { ...r, status: 'approved' as const } : r
      )
    );
    setSelectedItems([]);
  };

  const handleBulkReject = () => {
    setReplenishments(prev =>
      prev.filter(r => !selectedItems.includes(r.id))
    );
    setSelectedItems([]);
  };

  const handleApproveItem = (id: string) => {
    setReplenishments(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'approved' as const } : r)
    );
  };

  const handleRejectItem = (id: string) => {
    setReplenishments(prev =>
      prev.filter(r => r.id !== id)
    );
  };

  const selectedItemsValue = useMemo(() => {
    const avgUnitCost = 35;
    const totalQty = replenishments
      .filter(r => selectedItems.includes(r.id))
      .reduce((sum, r) => sum + r.recommendedQuantity, 0);
    return totalQty * avgUnitCost;
  }, [selectedItems, replenishments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading replenishment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Replenishment Recommendations</h1>
          <p className="text-slate-600">Review and approve purchase recommendations</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard label="Total Recommendations" value={stats.total} unit="items" trend={3.2} isGood />
          <MetricCard label="Critical Priority" value={stats.critical} unit="items" isGood={stats.critical < 5} trend={-1.5} />
          <MetricCard label="Pending Approval" value={stats.pending} unit="items" isGood={stats.pending < 10} />
          <MetricCard label="Total Units" value={stats.totalUnits} unit="units" isGood />
          <MetricCard label="Est. Order Value" value={`$${(stats.totalValue / 1000).toFixed(1)}k`} unit="USD" isGood />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Urgency Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Urgency Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={urgencyDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {urgencyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Inventory Position Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Top 5 SKUs - Inventory Position</h2>
            <div className="space-y-4">
              {filteredReplenishments.slice(0, 3).map(item => (
                <InventoryGauge
                  key={item.id}
                  current={item.currentInventory}
                  reorderPoint={item.reorderPoint}
                  safetyStock={item.safetyStock}
                  unit="units"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Urgency</label>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Urgencies</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="ordered">Ordered</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div className="flex items-end">
              <p className="text-sm text-slate-600">
                Showing {filteredReplenishments.length} of {replenishments.length} items
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Replenishment Recommendations</h2>
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">{selectedItems.length} selected</span>
                <button
                  onClick={handleBulkApprove}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition text-sm"
                >
                  Approve Selected
                </button>
                <button
                  onClick={handleBulkReject}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm"
                >
                  Reject Selected
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto mobile-table-wrapper">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredReplenishments.length && filteredReplenishments.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Urgency</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">SKU</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Customer</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Current Inv</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Recommended Qty</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReplenishments.map((item) => {
                  let urgencyColor = 'bg-slate-100 text-slate-700';
                  if (item.urgency === 'critical') {
                    urgencyColor = 'bg-red-100 text-red-700';
                  } else if (item.urgency === 'high') {
                    urgencyColor = 'bg-amber-100 text-amber-700';
                  } else if (item.urgency === 'medium') {
                    urgencyColor = 'bg-blue-100 text-blue-700';
                  }

                  let statusColor = 'bg-slate-100 text-slate-700';
                  if (item.status === 'approved') {
                    statusColor = 'bg-emerald-100 text-emerald-700';
                  } else if (item.status === 'pending') {
                    statusColor = 'bg-amber-100 text-amber-700';
                  }

                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${urgencyColor}`}>
                          {item.urgency.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{item.skuName}</td>
                      <td className="py-3 px-4 text-slate-700">{item.customerName}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{item.currentInventory}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {item.recommendedQuantity}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {item.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveItem(item.id)}
                                className="text-emerald-600 hover:text-emerald-800 font-semibold"
                                title="Approve"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleRejectItem(item.id)}
                                className="text-red-600 hover:text-red-800 font-semibold"
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary (when items selected) */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Order Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Items Selected</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">{selectedItems.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Units</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">
                  {replenishments
                    .filter(r => selectedItems.includes(r.id))
                    .reduce((sum, r) => sum + r.recommendedQuantity, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Est. Unit Cost</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">$35</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Est. Total Value</p>
                <p className="text-xl lg:text-2xl font-bold text-blue-600">${selectedItemsValue.toLocaleString()}</p>
              </div>
            </div>
            <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition">
              Generate Purchase Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
