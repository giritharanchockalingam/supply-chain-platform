'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, ScanLine, GitCompare, Activity, CheckCircle, XCircle, Filter, Wifi, WifiOff } from 'lucide-react';

type IngestionSource = { id: string; source_name: string; source_type: string; schedule_cron: string | null; is_active: boolean; last_sync_at: string | null; last_sync_status: string | null; last_sync_records: number; total_records_ingested: number; error_count: number; created_at: string };
type ScanEvent = { id: string; scan_type: string; scan_value: string; entity_type: string; entity_id: string | null; scanned_by: string | null; device_type: string | null; location_zone: string | null; is_valid: boolean; created_at: string };
type ReconciliationLog = { id: string; source_a: string; source_b: string; entity_type: string; total_records_a: number; total_records_b: number; matched_count: number; mismatched_count: number; missing_in_a: number; missing_in_b: number; match_rate: number; status: string; run_at: string };

const typeColors: Record<string, string> = { api: 'bg-blue-100 text-blue-700', edi: 'bg-purple-100 text-purple-700', pos: 'bg-green-100 text-green-700', wms: 'bg-amber-100 text-amber-700', iot_sensor: 'bg-cyan-100 text-cyan-700', webhook: 'bg-orange-100 text-orange-700', sftp: 'bg-gray-100 text-gray-700', manual_upload: 'bg-slate-100 text-slate-700', erp: 'bg-indigo-100 text-indigo-700' };
const scanColors: Record<string, string> = { barcode: 'bg-blue-100 text-blue-700', rfid: 'bg-purple-100 text-purple-700', qr_code: 'bg-green-100 text-green-700', nfc: 'bg-cyan-100 text-cyan-700', manual: 'bg-gray-100 text-gray-700' };
const statusDots: Record<string, string> = { success: 'bg-emerald-500', partial: 'bg-amber-500', failed: 'bg-red-500', timeout: 'bg-gray-400' };

function formatNum(n: number): string { if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`; if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`; return String(n); }
function timeAgo(ts: string | null): string { if (!ts) return 'Never'; const diff = Date.now() - new Date(ts).getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return 'Just now'; if (mins < 60) return `${mins}m ago`; const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`; return `${Math.floor(hrs / 24)}d ago`; }

export default function DataCapturePage() {
  const [tab, setTab] = useState<'dashboard' | 'sources' | 'scans' | 'reconciliation'>('dashboard');
  const [sources, setSources] = useState<IngestionSource[]>([]);
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [recon, setRecon] = useState<ReconciliationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanFilter, setScanFilter] = useState('all');
  const [expandedRecon, setExpandedRecon] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, sc, r] = await Promise.all([
        supabase.from('ingestion_sources').select('*').order('source_name'),
        supabase.from('scan_events').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('reconciliation_log').select('*').order('run_at', { ascending: false }),
      ]);
      setSources((s.data || []) as IngestionSource[]);
      setScans((sc.data || []) as ScanEvent[]);
      setRecon((r.data || []) as ReconciliationLog[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) { return (<div className="p-8 flex items-center justify-center min-h-[400px]"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4" /><p className="text-gray-600">Loading pipeline data...</p></div></div>); }

  const activeSources = sources.filter(s => s.is_active).length;
  const failedSources = sources.filter(s => s.last_sync_status === 'failed').length;
  const totalIngested = sources.reduce((sum, s) => sum + (s.total_records_ingested || 0), 0);
  const lastSync = sources.reduce((latest, s) => { if (!s.last_sync_at) return latest; return !latest || new Date(s.last_sync_at) > new Date(latest) ? s.last_sync_at : latest; }, null as string | null);
  const avgMatchRate = recon.length > 0 ? (recon.reduce((sum, r) => sum + Number(r.match_rate), 0) / recon.length).toFixed(1) : '0';
  const validScans = scans.filter(s => s.is_valid).length;
  const filteredScans = scanFilter === 'all' ? scans : scans.filter(s => s.scan_type === scanFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([{ id: 'dashboard' as const, label: 'Pipeline Dashboard', icon: Activity }, { id: 'sources' as const, label: 'Ingestion Sources', icon: Database }, { id: 'scans' as const, label: 'Scan Capture', icon: ScanLine }, { id: 'reconciliation' as const, label: 'Reconciliation', icon: GitCompare }]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><t.icon size={16} />{t.label}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[{ label: 'Active Sources', value: activeSources, color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'Total Ingested', value: formatNum(totalIngested), color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'Last Sync', value: timeAgo(lastSync), color: 'text-cyan-600', bg: 'bg-cyan-50' }, { label: 'Failed Sources', value: failedSources, color: 'text-red-600', bg: 'bg-red-50' }, { label: 'Avg Match Rate', value: `${avgMatchRate}%`, color: 'text-violet-600', bg: 'bg-violet-50' }, { label: 'Scan Valid %', value: scans.length > 0 ? `${Math.round((validScans / scans.length) * 100)}%` : '0%', color: 'text-amber-600', bg: 'bg-amber-50' }].map((kpi, i) => (
              <div key={i} className={`${kpi.bg} rounded-xl p-4 border border-gray-100`}><div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div><div className="text-[11px] text-gray-500 font-medium mt-1">{kpi.label}</div></div>
            ))}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Source Health</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map(src => (
                <div key={src.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">{src.is_active ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-gray-400" />}<span className="font-semibold text-gray-900 text-sm">{src.source_name}</span></div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${typeColors[src.source_type] || 'bg-gray-100 text-gray-700'}`}>{src.source_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500"><span>Last sync: <strong>{timeAgo(src.last_sync_at)}</strong></span><div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${statusDots[src.last_sync_status || ''] || 'bg-gray-300'}`} /><span className="capitalize">{src.last_sync_status || 'unknown'}</span></div></div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-1.5"><span>Last batch: {formatNum(src.last_sync_records)}</span><span>Total: <strong className="text-gray-600">{formatNum(src.total_records_ingested)}</strong></span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'sources' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-4 py-3 text-left font-semibold text-gray-700">Source</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Schedule</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Last Sync</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Records</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Active</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {sources.map(src => (
                <tr key={src.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{src.source_name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-medium rounded ${typeColors[src.source_type] || 'bg-gray-100 text-gray-700'}`}>{src.source_type.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono">{src.schedule_cron || 'Manual'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{timeAgo(src.last_sync_at)}</td>
                  <td className="px-4 py-3 text-xs"><span className="font-semibold">{formatNum(src.total_records_ingested)}</span><span className="text-gray-400 ml-1">({formatNum(src.last_sync_records)} last)</span></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${statusDots[src.last_sync_status || ''] || 'bg-gray-300'}`} /><span className="text-xs capitalize">{src.last_sync_status || '-'}</span></div></td>
                  <td className="px-4 py-3"><div className={`w-8 h-4 rounded-full relative ${src.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}><div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${src.is_active ? 'left-4' : 'left-0.5'}`} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'scans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Filter size={16} className="text-gray-400" /><div className="flex gap-1.5">{['all', 'barcode', 'rfid', 'qr_code', 'manual'].map(t => (<button key={t} onClick={() => setScanFilter(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${scanFilter === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t === 'all' ? `All (${scans.length})` : `${t.replace('_', ' ')} (${scans.filter(s => s.scan_type === t).length})`}</button>))}</div></div>
            <div className="flex gap-4 text-xs text-gray-500"><span>Valid: <strong className="text-emerald-600">{validScans}</strong></span><span>Invalid: <strong className="text-red-600">{scans.length - validScans}</strong></span></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Value</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Entity</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Scanned By</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Device</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Zone</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Valid</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Time</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredScans.slice(0, 50).map(scan => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-medium rounded ${scanColors[scan.scan_type] || 'bg-gray-100 text-gray-700'}`}>{scan.scan_type.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{scan.scan_value}</td>
                    <td className="px-4 py-3 text-xs capitalize">{scan.entity_type}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{scan.scanned_by || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">{(scan.device_type || '-').replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{scan.location_zone || '-'}</td>
                    <td className="px-4 py-3">{scan.is_valid ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(scan.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-violet-50 rounded-xl p-4 border border-violet-100"><div className="text-2xl font-bold text-violet-600">{avgMatchRate}%</div><div className="text-[11px] text-gray-500 font-medium mt-1">Avg Match Rate</div></div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100"><div className="text-2xl font-bold text-blue-600">{formatNum(recon.reduce((sum, r) => sum + r.matched_count, 0))}</div><div className="text-[11px] text-gray-500 font-medium mt-1">Records Matched</div></div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100"><div className="text-2xl font-bold text-amber-600">{recon.length}</div><div className="text-[11px] text-gray-500 font-medium mt-1">Comparisons Run</div></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-4 py-3 text-left font-semibold text-gray-700">Source A</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Source B</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Entity</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Records A/B</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Matched</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Mismatched</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Match Rate</th><th className="px-4 py-3 text-left font-semibold text-gray-700">Run</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {recon.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedRecon(expandedRecon === r.id ? null : r.id)}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.source_a}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.source_b}</td>
                    <td className="px-4 py-3 text-xs capitalize">{r.entity_type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs">{formatNum(r.total_records_a)} / {formatNum(r.total_records_b)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-600">{formatNum(r.matched_count)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-red-600">{r.mismatched_count}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 text-xs font-bold rounded-full ${Number(r.match_rate) >= 95 ? 'bg-emerald-100 text-emerald-700' : Number(r.match_rate) >= 90 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{Number(r.match_rate).toFixed(1)}%</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.run_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
