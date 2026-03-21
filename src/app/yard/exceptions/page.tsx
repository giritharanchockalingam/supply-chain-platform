'use client';

import { useState, useMemo, ReactNode } from 'react';
import { useTrucks, useYardExceptions } from '@/hooks/useSupabaseData';
import { YardException, Truck } from '@/lib/types';
import { AlertCircle, XCircle, AlertTriangle, Filter, ChevronDown } from 'lucide-react';

const typeLabels: Record<string, string> = {
  missing_bol: 'Missing BOL',
  mismatched_trailer: 'Trailer Mismatch',
  late_arrival: 'Late Arrival',
  temperature_breach: 'Temperature Breach',
  dock_congestion: 'Dock Congestion',
  hazmat_violation: 'Hazmat Violation',
  overdue_dwell: 'Overdue Dwell',
  damaged_load: 'Damaged Load',
};

export default function ExceptionsPage() {
  const { data: allExceptions, loading: exceptionsLoading } = useYardExceptions(50);
  const { data: trucks, loading: trucksLoading } = useTrucks(25);
  const loading = exceptionsLoading || trucksLoading;

  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('open');
  const [sortBy, setSortBy] = useState<'created' | 'severity'>('created');
  const [selectedException, setSelectedException] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exceptions...</p>
        </div>
      </div>
    );
  }

  const filteredExceptions = useMemo(() => {
    let result = [...allExceptions];

    if (filterSeverity !== 'all') {
      result = result.filter(e => e.severity === filterSeverity);
    }

    if (filterType !== 'all') {
      result = result.filter(e => e.type === filterType);
    }

    if (filterStatus === 'open') {
      result = result.filter(e => !e.resolvedAt);
    } else if (filterStatus === 'resolved') {
      result = result.filter(e => e.resolvedAt);
    }

    if (sortBy === 'severity') {
      const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
      result.sort((a: YardException, b: YardException) => severityOrder[a.severity] - severityOrder[b.severity]);
    } else {
      result.sort((a: YardException, b: YardException) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [filterSeverity, filterType, filterStatus, sortBy, allExceptions]);

  const severityColors: Record<string, string> = {
    critical: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const severityBadgeColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const exceptionIcons: Record<string, ReactNode> = {
    critical: <XCircle className="text-red-600" size={20} />,
    warning: <AlertTriangle className="text-amber-600" size={20} />,
    info: <AlertCircle className="text-blue-600" size={20} />,
  };

  const uniqueTypes = Array.from(new Set(allExceptions.map(e => e.type)));
  const stats = {
    total: allExceptions.length,
    open: allExceptions.filter(e => !e.resolvedAt).length,
    critical: allExceptions.filter(e => e.severity === 'critical' && !e.resolvedAt).length,
  };

  return (
    <div className="p-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exception Management</h1>
          <p className="text-gray-600 mt-2">Track and resolve yard operation exceptions</p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 font-medium">Total Exceptions</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-amber-500">
            <p className="text-sm text-gray-600 font-medium">Open</p>
            <p className="text-4xl font-bold text-amber-600 mt-2">{stats.open}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
            <p className="text-sm text-gray-600 font-medium">Critical</p>
            <p className="text-4xl font-bold text-red-600 mt-2">{stats.critical}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Filters & Sort</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map((type: string) => (
                  <option key={type} value={type}>{typeLabels[type]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="created">Most Recent</option>
                <option value="severity">By Severity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exception Queue */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Exception Queue ({filteredExceptions.length})</h2>

          {filteredExceptions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg">No exceptions match your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExceptions.map((exception: YardException) => {
                const truck = trucks.find((t: Truck) => t.id === exception.truckId);
                const isExpanded = expandedDetails === exception.id;

                return (
                  <div
                    key={exception.id}
                    className={`border rounded-lg ${severityColors[exception.severity]} transition-all`}
                  >
                    <div
                      className="p-4 cursor-pointer hover:opacity-75"
                      onClick={() => setExpandedDetails(isExpanded ? null : exception.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {exceptionIcons[exception.severity]}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900">{typeLabels[exception.type]}</h3>
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${severityBadgeColors[exception.severity]}`}>
                                {exception.severity.charAt(0).toUpperCase() + exception.severity.slice(1)}
                              </span>
                              {exception.resolvedAt && (
                                <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                                  Resolved
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{exception.description}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-600">
                              <span>Truck: <strong>{truck?.licensePlate || exception.truckId}</strong></span>
                              <span>Created: <strong>{new Date(exception.createdAt).toLocaleString()}</strong></span>
                              {exception.assignedTo && (
                                <span>Assigned: <strong>{exception.assignedTo}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronDown
                          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          size={20}
                        />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="bg-white bg-opacity-50 border-t p-4 space-y-4">
                        {/* Truck Details */}
                        {truck && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3">Truck Information</h4>
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">License Plate</p>
                                <p className="font-bold">{truck.licensePlate}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Carrier</p>
                                <p className="font-bold">{truck.carrierName}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Status</p>
                                <p className="font-bold capitalize">{truck.status.replace('_', ' ')}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Arrival</p>
                                <p className="font-bold">{new Date(truck.arrivalTime).toLocaleTimeString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Dwell Time</p>
                                <p className="font-bold">{truck.dwellTime} min</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Assigned Dock</p>
                                <p className="font-bold">{truck.assignedDock || 'Unassigned'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Created</span>
                              <span className="font-medium">{new Date(exception.createdAt).toLocaleString()}</span>
                            </div>
                            {exception.resolvedAt && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Resolved</span>
                                  <span className="font-medium">{new Date(exception.resolvedAt).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Resolution</span>
                                  <span className="font-medium text-emerald-600">{exception.resolution}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Resolution Actions */}
                        {!exception.resolvedAt && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3">Resolution Workflow</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                                  <option>Select User...</option>
                                  <option>User 1</option>
                                  <option>User 2</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Add Notes</label>
                                <textarea
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                  rows={3}
                                  placeholder="Enter resolution notes..."
                                ></textarea>
                              </div>
                              <div className="flex gap-2">
                                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                                  Mark Resolved
                                </button>
                                <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                                  Escalate
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
