'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import {
  Menu, X, Truck, Map, ClipboardCheck, LayoutGrid, AlertTriangle, BarChart3,
  TrendingUp, Database, LineChart, Package, Wrench, FileText, Bell, Search,
  Settings, Brain, Layers, Shield, ScanLine, LogOut, Sun, Moon,
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

const bottomNavItems = [
  { label: 'Yard', href: '/yard/dashboard', icon: Truck, matchPrefix: '/yard' },
  { label: 'Planning', href: '/planning/dashboard', icon: TrendingUp, matchPrefix: '/planning' },
  { label: 'AI', href: '/ai', icon: Brain, matchPrefix: '/ai' },
  { label: 'Security', href: '/security', icon: Shield, matchPrefix: '/security' },
  { label: 'More', href: '#more', icon: Menu, matchPrefix: '#more' },
];

const pageBanners: Record<string, { title: string; subtitle: string; gradient: string }> = {
  '/yard/dashboard': { title: 'Yard Dashboard', subtitle: 'Real-time KPIs, priority queue, and dock status', gradient: 'from-blue-600 via-blue-700 to-indigo-700' },
  '/yard/map': { title: 'Interactive Yard Map', subtitle: 'Live truck positioning and dock utilization', gradient: 'from-blue-600 to-blue-700' },
  '/yard/check-in': { title: 'Gate Check-In', subtitle: 'Truck arrival processing and BOL verification', gradient: 'from-sky-600 to-blue-700' },
  '/yard/docks': { title: 'Dock Schedule', subtitle: 'Dock assignments, availability, and scheduling', gradient: 'from-indigo-600 to-blue-700' },
  '/yard/exceptions': { title: 'Exception Management', subtitle: 'Track and resolve yard operation exceptions', gradient: 'from-red-600 to-rose-700' },
  '/yard/reports': { title: 'Yard Reports', subtitle: 'Analytics, trends, and operational performance', gradient: 'from-violet-600 to-indigo-700' },
  '/planning/dashboard': { title: 'Demand Planning', subtitle: 'Forecast accuracy, inventory signals, replenishment', gradient: 'from-emerald-600 to-teal-700' },
  '/planning/intake': { title: 'Data Intake', subtitle: 'Ingestion jobs, data quality, and pipeline monitoring', gradient: 'from-teal-600 to-cyan-700' },
  '/planning/forecasts': { title: 'Forecast Engine', subtitle: 'ML-powered demand forecasts and accuracy tracking', gradient: 'from-cyan-600 to-blue-700' },
  '/planning/replenishment': { title: 'Replenishment', subtitle: 'Automated reorder recommendations and stock optimization', gradient: 'from-green-600 to-emerald-700' },
  '/planning/workbench': { title: 'Planner Workbench', subtitle: 'Collaborative planning tools and scenario analysis', gradient: 'from-lime-600 to-green-700' },
  '/planning/reports': { title: 'Planning Reports', subtitle: 'Forecast performance, inventory health, and KPIs', gradient: 'from-amber-600 to-orange-700' },
  '/ai': { title: 'AI Command Center', subtitle: 'Multi-LLM orchestration with MCP tools', gradient: 'from-purple-600 to-violet-700' },
  '/security': { title: 'Trailer Security', subtitle: 'Seal verification, chain of custody, geofence monitoring', gradient: 'from-red-600 via-red-700 to-rose-800' },
  '/data-capture': { title: 'Data Pipeline', subtitle: 'Real-time ingestion, scan events, cross-system reconciliation', gradient: 'from-teal-600 via-cyan-700 to-blue-800' },
};

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => { setSidebarOpen(e.matches); if (e.matches) setMobileMenuOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false); }; document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler); }, []);

  const isActive = (href: string) => pathname.startsWith(href.split('/').slice(0, 3).join('/'));
  const banner = pageBanners[pathname];
  const isArchitecturePage = pathname.startsWith('/architecture');

  const navLink = (item: { label: string; href: string; icon: any }, activeColor = 'bg-blue-600') => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] ${active ? activeColor + ' text-white' : 'text-slate-300 hover:bg-slate-800 active:bg-slate-700'}`} title={item.label}>
        <Icon size={20} className="flex-shrink-0" />
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = () => (
    <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto overscroll-contain">
      <div>
        <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Yard Management</h2>
        <div className="space-y-1">{yardNavItems.map(i => navLink(i))}</div>
      </div>
      <div>
        <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Demand Planning</h2>
        <div className="space-y-1">{planningNavItems.map(i => navLink(i))}</div>
      </div>
      <div>
        <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Intelligence</h2>
        <div className="space-y-1">{navLink({ label: 'AI Command Center', href: '/ai', icon: Brain }, 'bg-purple-600')}</div>
      </div>
      <div>
        <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Security</h2>
        <div className="space-y-1">{navLink({ label: 'Trailer Security', href: '/security', icon: Shield }, 'bg-red-600')}</div>
      </div>
      <div>
        <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Data Capture</h2>
        <div className="space-y-1">{navLink({ label: 'Data Pipeline', href: '/data-capture', icon: ScanLine }, 'bg-cyan-600')}</div>
      </div>
      <div>
        <h2 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Architecture</h2>
        <div className="space-y-1">{navLink({ label: 'TOGAF Enterprise', href: '/architecture', icon: Layers }, 'bg-emerald-600')}</div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile overlay sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-[280px] bg-slate-900 text-white flex flex-col shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
              <h1 className="text-lg font-bold">Supply Chain</h1>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"><X size={20} /></button>
            </div>
            {sidebarContent()}
            <div className="px-3 py-4 border-t border-slate-700">
              <button onClick={() => signOut()} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 w-full min-h-[44px]">
                <LogOut size={20} className="flex-shrink-0" /><span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex bg-slate-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0 flex-col border-r border-slate-700`}>
        <div className="flex items-center justify-between h-20 px-4 border-b border-slate-700">
          {sidebarOpen && <h1 className="text-lg font-bold truncate">Supply Chain</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">{sidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {sidebarOpen ? sidebarContent() : (
          <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto">
            {[...yardNavItems, ...planningNavItems].map((item) => {
              const Icon = item.icon; const active = isActive(item.href);
              return (<Link key={item.href} href={item.href} className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`} title={item.label}><Icon size={20} /></Link>);
            })}
            <div className="border-t border-slate-700 my-2" />
            <Link href="/ai" className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${pathname.startsWith('/ai') ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`} title="AI"><Brain size={20} /></Link>
            <Link href="/security" className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${pathname.startsWith('/security') ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`} title="Security"><Shield size={20} /></Link>
            <Link href="/data-capture" className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${pathname.startsWith('/data-capture') ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`} title="Data Pipeline"><ScanLine size={20} /></Link>
            <Link href="/architecture" className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${pathname.startsWith('/architecture') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`} title="TOGAF"><Layers size={20} /></Link>
          </nav>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-gray-950 transition-colors min-w-0">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6 transition-colors sticky top-0 z-30">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Menu size={22} className="text-gray-700 dark:text-gray-300" />
            </button>
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">Supply Chain</span>
          </div>
          <div className="hidden lg:block flex-1 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors" />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 ml-auto">
            <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? <Moon size={20} className="text-gray-500" /> : <Sun size={20} className="text-amber-400" />}
            </button>
            <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Bell size={20} className="text-gray-700 dark:text-gray-300" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button onClick={() => signOut()} className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg min-h-[44px] min-w-[44px] items-center justify-center" title="Sign out">
              <LogOut size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs lg:text-sm cursor-pointer hover:bg-blue-700" title={user?.email || ''}>
              {user?.email?.substring(0, 2).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {banner && !isArchitecturePage && (
          <div className={`bg-gradient-to-r ${banner.gradient} px-4 lg:px-8 py-4 lg:py-5`}>
            <h1 className="text-lg lg:text-xl font-bold text-white">{banner.title}</h1>
            <p className="text-xs lg:text-sm text-white/70 mt-0.5">{banner.subtitle}</p>
          </div>
        )}

        <main className="flex-1 overflow-auto dark:text-gray-100 transition-colors pb-16 lg:pb-0">{children}</main>

        <footer className="hidden lg:flex bg-slate-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-3 items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>&copy; {new Date().getFullYear()} Giritharan Chockalingam. All rights reserved.</span>
          <span className="text-gray-400 dark:text-gray-500">Supply Chain Command Center v1.0</span>
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.href !== '#more' && pathname.startsWith(item.matchPrefix);
            if (item.href === '#more') return (
              <button key={item.label} onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 min-w-[44px]">
                <Icon size={20} /><span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
            return (
              <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                <Icon size={20} /><span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <AICommandCenter currentPage={pathname.replace(/^\//, '')} />
    </>
  );
}