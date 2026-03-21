'use client';

import { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DataSourceIcon } from '@/components/planning/DataSourceIcon';
import { MetricCard } from '@/components/planning/MetricCard';
import { AlertTriangle } from 'lucide-react';
import { useIngestionJobs, useCustomers, useInventorySignals } from '@/hooks/useSupabaseData';
import { DataSourceType, DataIngestionJob } from '@/lib/types';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export default function DataIntakePage() {
  const { data: rawJobs, loading: jobsLoading } = useIngestionJobs(20);
  const { data: customers, loading: customersLoading } = useCustomers(8);
  const { data: signals, loading: signalsLoading } = useInventorySignals(30);
  const [jobs, setJobs] = useState<typeof rawJobs>([]);
  const [sortColumn, setSortColumn] = useState<string>('receivedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const loading = jobsLoading || customersLoading || signalsLoading;

  useEffect(() => {
    if (rawJobs.length > 0) {
      setJobs(rawJobs);
    }
  }, [rawJobs]);

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      let aVal: any = a[sortColumn as keyof typeof a];
      let bVal: any = b[sortColumn as keyof typeof b];

      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [jobs, sortColumn, sortDir]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDir('desc');
    }
  };

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayJobs = jobs.filter(j => new Date(j.receivedAt) >= today);
    const successCount = jobs.filter(j => j.status === 'completed').length;
    const totalRecords = jobs.reduce((sum, j) => sum + j.recordsTotal, 0);
    const pendingReview = jobs.filter(j => j.status === 'needs_review').length;

    return {
      todayCount: todayJobs.length,
      successRate: Math.round((successCount / jobs.length) * 100),
      recordsProcessed: totalRecords,
      pendingReview,
    };
  }, [jobs]);

  const sourceDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    const sources = ['edi', 'email', 'spreadsheet', 'pdf', 'manual', 'api'] as const;

    sources.forEach(source => {
      dist[source] = jobs.filter(j => j.source === source).length;
    });

    return Object.entries(dist).map(([source, count]) => ({
      name: source.toUpperCase(),
      value: count,
    }));
  }, [jobs]);

  const processingTimeline = useMemo(() => {
    const last7Days: Record<string, Record<DataSourceType, number>> = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const sources: Record<DataSourceType, number> = {
        edi: 0,
        email: 0,
        spreadsheet: 0,
        pdf: 0,
        manual: 0,
        api: 0,
      };

      jobs.forEach(job => {
        const jobDate = new Date(job.receivedAt);
        jobDate.setHours(0, 0, 0, 0);

        if (jobDate.toDateString() === date.toDateString()) {
          sources[job.source]++;
        }
      });

      last7Days[dateStr] = sources;
    }

    return Object.entries(last7Days).map(([date, sources]) => ({
      date,
      ...sources,
    }));
  }, [jobs]);

  const qualityAlerts = useMemo(() => {
    return signals.filter(s => s.validationStatus === 'error' || s.validationStatus === 'warning').slice(0, 5);
  }, [signals]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading intake data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Data Intake Monitor</h1>
          <p className="text-slate-600">Monitor and manage incoming customer data submissions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Jobs Today"
            value={stats.todayCount}
            unit="jobs"
            trend={5.2}
            isGood
          />
          <MetricCard
            label="Success Rate"
            value={stats.successRate}
            unit="%"
            target={95}
            isGood={stats.successRate > 90}
            trend={2.1}
          />
          <MetricCard
            label="Records Processed"
            value={stats.recordsProcessed}
            unit="records"
            isGood
          />
          <MetricCard
            label="Pending Review"
            value={stats.pendingReview}
            unit="jobs"
            isGood={stats.pendingReview < 5}
            trend={-1.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Source Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Source Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sourceDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {sourceDistribution.map((entry, index) => (
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

          {/* Processing Timeline */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Processing Timeline (7 Days)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={processingTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
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
                <Area type="monotone" dataKey="edi" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                <Area type="monotone" dataKey="email" stackId="1" stroke="#ef4444" fill="#ef4444" />
                <Area type="monotone" dataKey="spreadsheet" stackId="1" stroke="#10b981" fill="#10b981" />
                <Area type="monotone" dataKey="pdf" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                <Area type="monotone" dataKey="manual" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                <Area type="monotone" dataKey="api" stackId="1" stroke="#ec4899" fill="#ec4899" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ingestion Job Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Ingestion Jobs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('source')}>
                    Source
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('customerName')}>
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('fileName')}>
                    File Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Records</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedJobs.slice(0, 10).map((job) => {
                  let statusColor = 'bg-blue-100 text-blue-700';
                  let statusLabel = 'Queued';

                  if (job.status === 'completed') {
                    statusColor = 'bg-emerald-100 text-emerald-700';
                    statusLabel = 'Completed';
                  } else if (job.status === 'processing') {
                    statusColor = 'bg-amber-100 text-amber-700';
                    statusLabel = 'Processing';
                  } else if (job.status === 'failed') {
                    statusColor = 'bg-red-100 text-red-700';
                    statusLabel = 'Failed';
                  } else if (job.status === 'needs_review') {
                    statusColor = 'bg-purple-100 text-purple-700';
                    statusLabel = 'Needs Review';
                  }

                  return (
                    <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <DataSourceIcon source={job.source} size={18} />
                          <span className="font-medium text-slate-800">{job.source.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{job.customerName}</td>
                      <td className="py-3 px-4 text-slate-700">{job.fileName}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="text-xs">
                          {job.recordsValid}/{job.recordsTotal}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-600">
                        {new Date(job.receivedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Quality Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Data Quality Alerts</h2>
          <div className="space-y-3">
            {qualityAlerts.length > 0 ? (
              qualityAlerts.map((alert) => (
                <div key={alert.id} className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        {alert.customerName} - {alert.validationStatus === 'error' ? 'Error' : 'Warning'}
                      </p>
                      <p className="text-xs text-amber-800 mt-1">
                        {alert.validationIssues.join(', ') || 'Data quality check failed'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-600 text-center py-4">No quality alerts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
