'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Menu,
  X,
  Truck,
  Map,
  ClipboardCheck,
  LayoutGrid,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Database,
  LineChart,
  Package,
  Wrench,
  FileText,
  Bell,
  Search,
  Settings,
  Brain,
  Layers,
} from 'lucide-react';

const AICommandCenter = dynamic(() => import('@/components/ai/AICommandCenter'), { ssr: false });

const yardNavItems = [
  { label: 'Dashboard', href: '/yard/dashboard', icon: LayoutGrid },
  { label: 'Yard Map', href: '/yard/map', icon: Map },
  { label: 'Check-In', href: '/yard/check-in', icon: ClipboardCheck },
  { label: 'Dock Schedule', href: '/yard/docks', icon: Truck },
  { label: 'Exceptions', href: '/yard/exceptions', icon: AlertTriangle },
  { label: 'Reports', href: '/yard/reports', icon: BarChart3 },
];

const planningNavItems = [
  { label: 'Dashboard', href: '/planning/dashboard', icon: LayoutGrid },
  { label: 'Data Intake', href: '/planning/intake', icon: Database },
  { label: 'Forecasts', href: '/planning/forecasts', icon: LineChart },
  { label: 'Replenishment', href: '/planning/replenishment', icon: Package },
  { label: 'Planner Workbench', href: '/planning/workbench', icon: Wrench },
  { label: 'Reports', href: '/planning/reports', icon: FileText },
];

const pageBanners: Record<string, { title: string; subtitle: string; gradient: string }> = {
  '/yard/dashboard': { title: 'Yard Dashboard', subtitle: 'Real-time KPIs, priority queue, and dock status overview', gradient: 'from-blue-600 via-blue-700 to-indigo-700' },
  '/yard/map': { title: 'Interactive Yard Map', subtitle: 'Live truck positioning and dock utilization', gradient: 'from-blue-600 to-blue-700' },
  '/yard/check-in': { title: 'Gate Check-In', subtitle: 'Truck arrival processing and BOL verification', gradient: 'from-sky-600 to-blue-700' },
  '/yard/docks': { title: 'Dock Schedule', subtitle: 'Dock assignments, availability, and scheduling', gradient: 'from-indigo-600 to-blue-700' },
  '/yard/exceptions': { title: 'Exception Management', subtitle: 'Track and resolve yard operation exceptions', gradient: 'from-red-600 to-rose-700' },
  '/yard/reports': { title: 'Yard Reports', subtitle: 'Analytics, trends, and operational performance', gradient: 'from-violet-600 to-indigo-700' },
  '/planning/dashboard': { title: 'Demand Planning Dashboard', subtitle: 'Forecast accuracy, inventory signals, and replenishment', gradient: 'from-emerald-600 to-teal-700' },
  '/planning/intake': { title: 'Data Intake', subtitle: 'Ingestion jobs, data quality, and pipeline monitoring', gradient: 'from-teal-600 to-cyan-700' },
  '/planning/forecasts': { title: 'Forecast Engine', subtitle: 'ML-powered demand forecasts and accuracy tracking', gradient: 'from-cyan-600 to-blue-700' },
  '/planning/replenishment': { title: 'Replenishment', subtitle: 'Automated reorder recommendations and stock optimization', gradient: 'from-green-600 to-emerald-700' },
  '/planning/workbench': { title: 'Planner Workbench', subtitle: 'Collaborative planning tools and scenario analysis', gradient: 'from-lime-600 to-green-700' },
  '/planning/reports': { title: 'Planning Reports', subtitle: 'Forecast performance, inventory health, and KPIs', gradient: 'from-amber-600 to-orange-700' },
  '/ai': { title: 'AI Command Center', subtitle: 'Multi-LLM orchestration with MCP tools', gradient: 'from-purple-600 to-violet-700' },
};

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.startsWith(href.split('/').slice(0, 3).join('/'));
  };

  const banner = pageBanners[pathname];
  const isArchitecturePage = pathname.startsWith('/architecture');

  return (
    <>
      {/* Sidebar */}
      <div
        className={`bg-slate-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex-shrink-0 flex flex-col border-r border-slate-700`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-slate-700">
          {sidebarOpen && (
            <h1 className="text-lg font-bold truncate">Supply Chain</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto">
          {/* Yard Management */}
          <div>
            {sidebarOpen && (
              <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Yard Management
              </h2>
            )}
            <div className="space-y-2">
              {yardNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    title={item.label}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Demand Planning */}
          <div>
            {sidebarOpen && (
              <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Demand Planning
              </h2>
            )}
            <div className="space-y-2">
              {planningNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    title={item.label}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* AI Command Center */}
          <div>
            {sidebarOpen && (
              <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                AI Intelligence
              </h2>
            )}
            <div className="space-y-2">
              <Link
                href="/ai"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname.startsWith('/ai')
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="AI Command Center"
              >
                <Brain size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">AI Command Center</span>}
              </Link>
            </div>
          </div>

          {/* Architecture */}
          <div>
            {sidebarOpen && (
              <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Architecture
              </h2>
            )}
            <div className="space-y-2">
              <Link
                href="/architecture"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname.startsWith('/architecture')
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="TOGAF Architecture"
              >
                <Layers size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">TOGAF Enterprise</span>}
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <div className="relative">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={20} className="text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>

            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-blue-700">
              JD
            </div>
          </div>
        </header>

        {/* Page Banner */}
        {banner && !isArchitecturePage && (
          <div className={`bg-gradient-to-r ${banner.gradient} px-8 py-5`}>
            <h1 className="text-xl font-bold text-white">{banner.title}</h1>
            <p className="text-sm text-white/70 mt-0.5">{banner.subtitle}</p>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>

        {/* Copyright Footer */}
        <footer className="bg-slate-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-500">
          <span>&copy; {new Date().getFullYear()} Giritharan Chockalingam. All rights reserved.</span>
          <span className="text-gray-400">Supply Chain Command Center v1.0</span>
        </footer>
      </div>

      {/* AI Command Center - Available on all pages */}
      <AICommandCenter currentPage={pathname.replace(/^\//, '')} />
    </>
  );
}
