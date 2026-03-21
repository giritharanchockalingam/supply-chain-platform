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

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.startsWith(href.split('/').slice(0, 3).join('/'));
  };

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

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* AI Command Center - Available on all pages */}
      <AICommandCenter currentPage={pathname.replace(/^\//, '')} />
    </>
  );
}
