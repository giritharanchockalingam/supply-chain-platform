'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExceptionCard } from '@/components/planning/ExceptionCard';
import { MetricCard } from '@/components/planning/MetricCard';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { generatePlanningExceptions, generateCustomers, generateForecastRecords, generateReplenishmentRecommendations } from '@/lib/mock-data';

export default function PlannerWorkbenchPage() {
  const [exceptions, setExceptions] = useState(() => generatePlanningExceptions(12));
  const [customers] = useState(() => generateCustomers(8));
  const [forecasts] = useState(() => generateForecastRecords(60));
  const [replenishments] = useState(() => generateReplenishmentRecommendations(25));
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0].id);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [newNote, setNewNote] = useState('');
  const [actionItems, setActionItems] = useState([
    { id: '1', title: 'Approve Q2 forecasts for Top Customers', completed: false, dueDate: '2024-03-25', priority: 'high' },
    { id: '2', title: 'Review Walmart inventory exceptions', completed: false, dueDate: '2024-03-23', priority: 'critical' },
    { id: '3', title: 'Process pending replenishment approvals', completed: false, dueDate: '2024-03-24', priority: 'high' },
    { id: '4', title: 'Resolve duplicate signals - Amazon Fresh', completed: true, dueDate: '2024-03-20', priority: 'medium' },
    { id: '5', title: 'Analyze demand spike - Costco', completed: false, dueDate: '2024-03-26', priority: 'medium' },
  ]);

  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [selectedCustomerId, customers]);

  const myQueue = useMemo(() => {
    return exceptions.filter(e => e.resolvedAt === null).sort((a, b) => {
      const severityPriority = { critical: 0, warning: 1, info: 2 };
      return severityPriority[a.severity] - severityPriority[b.severity];
    });
  }, [exceptions]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = actionItems.filter(item => !item.completed && new Date(item.dueDate) < today).length;

    return {
      completed: completedTasks,
      pending: actionItems.filter(item => !item.completed).length,
      overdue,
    };
  }, [actionItems, completedTasks]);

  const customerMetrics = useMemo(() => {
    if (!selectedCustomer) return null;

    const customerForecasts = forecasts.filter(f => f.customerId === selectedCustomerId);

    const avgMape = customerForecasts.length
      ? customerForecasts.filter(f => f.mape !== null).reduce((sum, f) => sum + (f.mape || 0), 0) / customerForecasts.length
      : 0;

    return {
      dataQualityScore: selectedCustomer.dataQualityScore,
      avgMape,
      recentOrders: Math.floor(Math.random() * 50) + 20,
      exceptionCount: exceptions.filter(e => e.customerId === selectedCustomerId).length,
    };
  }, [selectedCustomer, forecasts, exceptions, selectedCustomerId]);

  const customerQualityTrend = useMemo(() => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      data.push({
        month: date.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        quality: Math.floor(Math.random() * 30) + 60,
        target: 85,
      });
    }
    return data;
  }, []);

  const handleResolveException = (id: string) => {
    setExceptions(prev =>
      prev.map(exc =>
        exc.id === id
          ? { ...exc, resolvedAt: new Date().toISOString() }
          : exc
      )
    );
  };

  const handleToggleTask = (id: string) => {
    setActionItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
    if (!actionItems.find(item => item.id === id)?.completed) {
      setCompletedTasks(prev => prev + 1);
    }
  };

  const handleAddNote = () => {
    if (newNote.trim() && selectedCustomer) {
      setNotes(prev => ({
        ...prev,
        [selectedCustomer.id]: (prev[selectedCustomer.id] || '') + (prev[selectedCustomer.id] ? '\n' : '') + `- ${new Date().toLocaleTimeString()}: ${newNote}`,
      }));
      setNewNote('');
    }
  };

  const upcomingDates = [
    { date: '2024-03-25', event: 'S&OP Meeting', type: 'meeting' },
    { date: '2024-03-27', event: 'Forecast Freeze', type: 'deadline' },
    { date: '2024-03-30', event: 'Month-End Close', type: 'deadline' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Planner Workbench</h1>
          <p className="text-slate-600">Your daily planning dashboard and exception queue</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MetricCard label="Tasks Completed Today" value={stats.completed} unit="tasks" trend={2} isGood />
          <MetricCard label="Pending Tasks" value={stats.pending} unit="tasks" isGood={stats.pending < 5} trend={-1} />
          <MetricCard label="Overdue Tasks" value={stats.overdue} unit="tasks" isGood={stats.overdue === 0} trend={-2} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* My Queue */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">My Exception Queue</h2>
            <div className="space-y-3">
              {myQueue.slice(0, 6).map(exception => (
                <ExceptionCard
                  key={exception.id}
                  exception={exception}
                  onResolve={handleResolveException}
                />
              ))}
            </div>
            {myQueue.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={32} />
                <p>No active exceptions in your queue</p>
              </div>
            )}
          </div>

          {/* Quick Info Cards */}
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-900">Queue Health</span>
                <CheckCircle2 className="text-emerald-600" size={20} />
              </div>
              <p className="text-2xl font-bold text-emerald-600">{myQueue.length}</p>
              <p className="text-xs text-emerald-700">Active exceptions</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Pending Approvals</span>
                <Clock className="text-blue-600" size={20} />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {replenishments.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-xs text-blue-700">replenishment items</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-900">Overdue Tasks</span>
                <AlertTriangle className="text-amber-600" size={20} />
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.overdue}</p>
              <p className="text-xs text-amber-700">need attention</p>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Action Items Checklist</h2>
          <div className="space-y-2">
            {actionItems.map(item => {
              let priorityColor = 'bg-slate-100 text-slate-700';
              if (item.priority === 'critical') {
                priorityColor = 'bg-red-100 text-red-700';
              } else if (item.priority === 'high') {
                priorityColor = 'bg-amber-100 text-amber-700';
              }

              const isOverdue = new Date(item.dueDate) < new Date() && !item.completed;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 border border-slate-200 rounded-lg ${
                    item.completed ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleTask(item.id)}
                    className="rounded"
                  />
                  <span className={`flex-1 ${item.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                    {item.title}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${priorityColor}`}>
                    {item.priority.toUpperCase()}
                  </span>
                  <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                    {item.dueDate}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Spotlight & Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Spotlight */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer Spotlight</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {customers.map(cust => (
                    <option key={cust.id} value={cust.id}>{cust.name}</option>
                  ))}
                </select>
              </div>

              {selectedCustomer && customerMetrics && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Data Quality</p>
                      <p className="text-2xl font-bold text-slate-900">{customerMetrics.dataQualityScore}%</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Forecast Accuracy (MAPE)</p>
                      <p className="text-2xl font-bold text-slate-900">{customerMetrics.avgMape.toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Recent Orders</p>
                      <p className="text-2xl font-bold text-slate-900">{customerMetrics.recentOrders}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Active Exceptions</p>
                      <p className="text-2xl font-bold text-slate-900">{customerMetrics.exceptionCount}</p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={customerQualityTrend}>
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
                        dataKey="quality"
                        stroke="#3b82f6"
                        name="Quality Score"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#10b981"
                        strokeDasharray="5 5"
                        name="Target"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            {/* Collaboration Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Collaboration Notes {selectedCustomer && `- ${selectedCustomer.name}`}
              </h2>
              <div className="space-y-3">
                <div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this customer..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                  >
                    Add Note
                  </button>
                </div>

                {selectedCustomer && notes[selectedCustomer.id] && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono text-xs">
                      {notes[selectedCustomer.id]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Key Dates</h2>
            <div className="space-y-3">
              {upcomingDates.map((item, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 ${
                    item.type === 'meeting'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.event}</p>
                      <p className="text-xs text-slate-600 mt-1">{item.date}</p>
                    </div>
                    {item.type === 'meeting' ? (
                      <Clock className="text-blue-600" size={16} />
                    ) : (
                      <AlertTriangle className="text-amber-600" size={16} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
